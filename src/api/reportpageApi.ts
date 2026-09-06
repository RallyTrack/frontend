import { ReportResponse, PlayerData } from "../types/reportpageType";
import { apiClient } from './apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// 백엔드 raw 타입
// ─────────────────────────────────────────────────────────────────────────────

interface RawHitDto {
  hitNumber?: number;
  frame?: number;
  timeSec?: number | null;
  player?: string | null;       // "top" | "bottom"
  strokeType?: string | null;
  // AI 서버 Step 7.9에서 주입되는 히트맵 좌표 (0~100, 선수 위치 기반)
  minimap_x?: number | null;
  minimap_y?: number | null;
  // 선수 중심 좌표 (0~1 프레임 정규화) — minimap_x/y 없을 때 폴백용
  player_x?: number | null;
  player_y?: number | null;
  // 구버전 호환 필드
  x?: number | null;
  y?: number | null;
}

interface RawPositionAnalysis {
  heatmapData?: Array<{
    x?: number;
    y?: number;
    value?: number;
    intensity?: number;
    timeSec?: number | null;
  }>;
}

interface RawPlayerReport {
  positionAnalysis?: RawPositionAnalysis;
  strokeTypes?: {
    smash?: number; clear?: number; drop?: number;
    drive?: number; serve?: number; lob?: number;
    net?: number; others?: number;
  };
  abilityMetrics?: {
    aggression?:  number | null;
    rally?:       number | null;
    defense?:     number | null;
    mobility?:    number | null;
    consistency?: number | null;
  };
  aiCoaching?: { feedbackText?: string };
}

interface RawAnalysisResponse {
  code: number;
  message: string;
  data: {
    videoId?: string | number;
    summary?: {
      matchOutcome?: string;
      myScore?: number;
      opponentScore?: number;
      totalStrokeCount?: number;
      matchTime?: string;
      unknownRallies?: number;
      totalRallies?: number;
    };
    matchOutcome?: string;
    bottomPlayerScore?: number;
    topPlayerScore?: number;
    totalHits?: number;
    unknownRallies?: number;
    totalRallies?: number;
    players?: {
      top?: RawPlayerReport;
      bottom?: RawPlayerReport;
    };
    positionAnalysis?: RawPositionAnalysis;
    strokeTypes?: RawPlayerReport["strokeTypes"];
    abilityMetrics?: RawPlayerReport["abilityMetrics"];
    aiCoaching?: RawPlayerReport["aiCoaching"];
    hitsData?: RawHitDto[];
    videoFps?: number;
    // 업로드 유형. 백엔드가 어떤 이름으로 내려줄지 확정되지 않아 둘 다 받는다.
    mode?: string | null;
    playerType?: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: heatmapData 정규화 (백엔드가 직접 내려주는 경우)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeHeatmapData(
  raw?: RawPositionAnalysis["heatmapData"]
): Array<{ x: number; y: number; value: number; timeSec?: number }> {
  if (!raw || raw.length === 0) return [];
  return raw
    .filter((p) => p.x != null && p.y != null)
    .map((p) => ({
      x: p.x!,
      y: p.y!,
      value: p.value ?? p.intensity ?? 0.5,
      timeSec: p.timeSec ?? undefined,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 핵심: hitsData → 히트맵 좌표
//
// AI 서버가 각 hit에 minimap_x / minimap_y (0~100, 히트맵 SVG 좌표계와 동일)를
// 주입하므로 그대로 사용한다.
//
// minimap_x/y가 없는 구버전 데이터는 strokeType 기반 강도만 설정하고
// 좌표는 플레이어 코트 절반 중앙에 배치한다 (데이터 없음 표시용).
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_INTENSITY: Record<string, number> = {
  Smash: 0.95, smash: 0.95,
  Clear: 0.65, clear: 0.65,
  Drop:  0.55, drop:  0.55,
  Drive: 0.70, drive: 0.70,
  Lob:   0.60, lob:   0.60,
  Serve: 0.45, serve: 0.45,
  Net:   0.40, net:   0.40,
};

/**
 * 개별 타격의 strokeType 문자열 → 프론트 분류 키.
 * 백엔드 표기가 대소문자·한글로 섞여 와서 소문자 부분일치로 잡는다.
 * lob을 clear보다 먼저 보는 게 중요하다 — "롱하이클리어" 같은 표기가
 * 아니라 실제 Lob이 clear로 흡수되면 프로 분류가 통째로 사라진다.
 */
function strokeKeyOf(rawType: string | null | undefined): keyof PlayerData["strokeTypes"] | null {
  const t = (rawType ?? "").toLowerCase().trim();
  if (!t) return null;
  if (t.includes("smash") || t.includes("스매시")) return "smash";
  if (t.includes("lob") || t.includes("로브")) return "lob";
  if (t.includes("drop") || t.includes("드롭") || t.includes("커트")) return "drop";
  if (t.includes("drive") || t.includes("드라이브")) return "drive";
  if (t.includes("serve") || t.includes("service") || t.includes("서브")) return "serve";
  if (t.includes("clear") || t.includes("클리어")) return "clear";
  if (t.includes("net") || t.includes("네트") || t.includes("헤어핀")) return "net";
  return "others";
}

function isPlayerHit(h: RawHitDto, playerSide: "top" | "bottom") {
  const p = (h.player ?? "").toLowerCase();
  return playerSide === "top"
    ? p === "top" || p === "pink_top"
    : p === "bottom" || p === "green_bottom";
}

/**
 * 개별 타격에서 스트로크 분류를 직접 집계한다.
 *
 * 백엔드의 strokeTypes 집계를 그대로 쓰지 않는 이유: 타임라인에는 Lob이
 * 잡히는데 집계에서는 lob=0, clear에 합산돼 오는 경우가 확인됐다. hitsData의
 * strokeType에는 원래 분류가 남아 있으므로 여기서 다시 센다.
 */
function deriveStrokeTypesFromHits(
  hitsData: RawHitDto[] | undefined,
  playerSide: "top" | "bottom",
): PlayerData["strokeTypes"] | null {
  if (!hitsData || hitsData.length === 0) return null;
  const counts = { smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, lob: 0, net: 0, others: 0 };
  let matched = 0;
  for (const h of hitsData) {
    if (!isPlayerHit(h, playerSide)) continue;
    const key = strokeKeyOf(h.strokeType);
    if (!key) continue;
    counts[key] += 1;
    matched += 1;
  }
  return matched > 0 ? counts : null;
}

function deriveHeatmapFromHits(
  hitsData: RawHitDto[] | undefined,
  playerSide: "top" | "bottom"
): Array<{ x: number; y: number; value: number; timeSec?: number }> {
  if (!hitsData || hitsData.length === 0) return [];

  const playerHits = hitsData.filter((h) => {
    const p = (h.player ?? "").toLowerCase();
    return playerSide === "top"
      ? p === "top" || p === "pink_top"
      : p === "bottom" || p === "green_bottom";
  });

  if (playerHits.length === 0) return [];

  return playerHits.map((h) => {
    const value = STROKE_INTENSITY[h.strokeType ?? ""] ?? 0.5;

    // ── minimap_x/y가 있으면 그대로 사용 (미니맵과 동일한 좌표) ──
    if (h.minimap_x != null && h.minimap_y != null) {
      return {
        x: h.minimap_x,
        y: h.minimap_y,
        value,
        timeSec: h.timeSec ?? undefined,
      };
    }

    // ── 구버전 x/y 좌표가 있으면 사용 ──
    if (h.x != null && h.y != null) {
      return {
        x: h.x,
        y: h.y,
        value,
        timeSec: h.timeSec ?? undefined,
      };
    }

    // ── player_x/y 폴백: 0~1 프레임 정규화 → 0~100 변환 ──
    // player_x/y는 프레임 전체 기준이므로 단순 ×100은 코트 기준이 아님.
    // top 선수: 프레임 상단(y < 0.5), bottom 선수: 프레임 하단(y > 0.5)
    // 히트맵은 top=0~50, bottom=50~100이므로 선수별로 리매핑.
    if (h.player_x != null && h.player_y != null) {
      const hx = Math.round(h.player_x * 100);
      // 선수 절반 코트 내로 리매핑
      const hy = playerSide === "top"
        ? Math.round(h.player_y * 100 * 0.5)          // 0~50 구간
        : Math.round(50 + (1 - h.player_y) * 100 * 0.5); // 50~100 구간
      return {
        x: Math.max(2, Math.min(98, hx)),
        y: Math.max(playerSide === "top" ? 2 : 52, Math.min(playerSide === "top" ? 48 : 98, hy)),
        value,
        timeSec: h.timeSec ?? undefined,
      };
    }

    // ── 좌표 없음: 플레이어 코트 중앙 고정 ──
    return {
      x: 50,
      y: playerSide === "top" ? 25 : 75,
      value,
      timeSec: h.timeSec ?? undefined,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: 빈 플레이어 데이터
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyPlayerData() {
  return {
    positionAnalysis: { heatmapData: [] },
    strokeTypes: { smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, lob: 0, net: 0, others: 0 },
    abilityMetrics: { aggression: 0, rally: 0, defense: 0, mobility: 0, consistency: 0 },
    aiCoaching: { feedbackText: "" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: RawPlayerReport → 프론트 플레이어 데이터
// ─────────────────────────────────────────────────────────────────────────────

function normalizePlayerData(
  raw: RawPlayerReport | undefined,
  hitsDataFallback: RawHitDto[] | undefined,
  playerSide: "top" | "bottom"
) {
  if (!raw) return buildEmptyPlayerData();

  // positionAnalysis.heatmapData 우선, 없으면 hitsData에서 minimap_x/y 사용
  const rawHeatmap = normalizeHeatmapData(raw.positionAnalysis?.heatmapData);
  const heatmapData =
    rawHeatmap.length > 0
      ? rawHeatmap
      : deriveHeatmapFromHits(hitsDataFallback, playerSide);

  const am = raw.abilityMetrics ?? {};

  // 개별 타격에서 직접 센 값을 우선한다(백엔드 집계가 Lob을 Clear로 흡수함).
  // hitsData가 없는 응답에서만 백엔드 집계로 폴백한다.
  const strokeTypes = deriveStrokeTypesFromHits(hitsDataFallback, playerSide) ?? {
    smash:  raw.strokeTypes?.smash  ?? 0,
    clear:  raw.strokeTypes?.clear  ?? 0,
    drop:   raw.strokeTypes?.drop   ?? 0,
    drive:  raw.strokeTypes?.drive  ?? 0,
    serve:  raw.strokeTypes?.serve  ?? 0,
    lob:    raw.strokeTypes?.lob    ?? 0,
    net:    raw.strokeTypes?.net    ?? 0,
    others: raw.strokeTypes?.others ?? 0,
  };

  return {
    positionAnalysis: { heatmapData },
    strokeTypes,
    abilityMetrics: {
      aggression:  am.aggression  ?? 0,
      rally:       am.rally       ?? 0,
      defense:     am.defense     ?? 0,
      mobility:    am.mobility    ?? 0,
      consistency: am.consistency ?? 0,
    },
    aiCoaching: { feedbackText: raw.aiCoaching?.feedbackText ?? "" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 API 함수
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchReport(videoId: string | number): Promise<ReportResponse> {
  const res = await apiClient(`/api/v1/analysis/${videoId}`);

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error((json as any).message ?? `리포트 조회 실패: ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }

  const raw: RawAnalysisResponse = await res.json();
  const data = raw.data;

  const summary = {
    matchOutcome:     data.summary?.matchOutcome     ?? data.matchOutcome     ?? "DRAW",
    myScore:          data.summary?.myScore          ?? data.bottomPlayerScore ?? 0,
    opponentScore:    data.summary?.opponentScore    ?? data.topPlayerScore    ?? 0,
    totalStrokeCount: data.summary?.totalStrokeCount ?? data.totalHits         ?? 0,
    matchTime:        data.summary?.matchTime        ?? "분석 완료",
    // 백엔드가 summary 밖(top-level)에 실어주는 경우도 있어 폴백을 둔다.
    unknownRallies:   data.summary?.unknownRallies   ?? data.unknownRallies ?? 0,
    totalRallies:     data.summary?.totalRallies     ?? data.totalRallies   ?? 0,
  };

  const hitsData = data.hitsData;

  // ── 업로드 유형 판별 신호 수집 ──────────────────────────────────────────
  // 조회 API가 mode를 확실히 내려주지 않아서, 응답에서 건질 수 있는 단서를
  // 전부 모아 화면 쪽으로 넘긴다. 매퍼가 필드를 통째로 재조립하기 때문에
  // 여기서 챙기지 않으면 뒤에서는 볼 방법이 없다.
  const declaredRaw = String(data.mode ?? data.playerType ?? "").toLowerCase();
  const declared =
    declaredRaw === "pro" || declaredRaw === "amateur" ? declaredRaw : undefined;

  // 집계가 lob을 clear로 뭉개도, 개별 타격의 strokeType 문자열에는
  // 원래 분류가 남아 있을 수 있다.
  const hitStrokeTypes = Array.from(
    new Set(
      (data.hitsData ?? [])
        .map((h) => String(h.strokeType ?? "").toLowerCase().trim())
        .filter(Boolean),
    ),
  );

  const topPlayerData    = normalizePlayerData(data.players?.top,    hitsData, "top");
  const bottomPlayerData = normalizePlayerData(data.players?.bottom, hitsData, "bottom");

  return {
    code: raw.code,
    message: raw.message,
    data: {
      videoId: Number(data.videoId ?? videoId),
      summary: summary as any,
      players: {
        top:    topPlayerData,
        bottom: bottomPlayerData,
      },
      modeHints: { declared, hitStrokeTypes },
    },
  };
}