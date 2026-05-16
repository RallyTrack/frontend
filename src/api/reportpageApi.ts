import { ReportResponse } from "../types/reportpageType";
import { apiClient } from './apiClient';
// import { mockReport } from "../types/reportMock";

// ─────────────────────────────────────────────────────────────────────────────
// 백엔드 raw 타입 (AnalysisService.java → AnalysisReportResponse 기준)
// ─────────────────────────────────────────────────────────────────────────────

interface RawHitDto {
  hitNumber?: number;
  frame?: number;
  timeSec?: number | null;
  player?: string | null;         // "pink_top" | "green_bottom" | "top" | "bottom"
  strokeType?: string | null;
  // AI 서버가 포지션 데이터를 포함할 경우 추가될 수 있는 필드
  x?: number | null;
  y?: number | null;
}

interface RawPositionAnalysis {
  heatmapData?: Array<{
    x?: number;
    y?: number;
    value?: number;       // AI 서버 필드명
    intensity?: number;   // 대안 필드명
    timeSec?: number | null;
  }>;
}

interface RawPlayerReport {
  positionAnalysis?: RawPositionAnalysis;
  strokeTypes?: {
    smash?: number; clear?: number; drop?: number;
    drive?: number; serve?: number; net?: number; others?: number;
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
    // summary 필드 (SummaryDto)
    summary?: {
      matchOutcome?: string;
      myScore?: number;
      opponentScore?: number;
      totalStrokeCount?: number;
      matchTime?: string;
    };
    // flat legacy 필드 (AnalysisReportResponse 최상위)
    matchOutcome?: string;
    bottomPlayerScore?: number;
    topPlayerScore?: number;
    totalHits?: number;
    // players (PlayersDto)
    players?: {
      top?: RawPlayerReport;
      bottom?: RawPlayerReport;
    };
    // legacy flat player 필드 (이전 호환)
    positionAnalysis?: RawPositionAnalysis;
    strokeTypes?: RawPlayerReport["strokeTypes"];
    abilityMetrics?: RawPlayerReport["abilityMetrics"];
    aiCoaching?: RawPlayerReport["aiCoaching"];
    // hits_data — 포지션 분석 폴백용
    hitsData?: RawHitDto[];
    videoFps?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: heatmapData 정규화
// AI 서버가 value 또는 intensity 필드명을 사용할 수 있으므로 모두 처리
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
      value: p.value ?? p.intensity ?? 0.5,   // value 우선, 없으면 intensity
      timeSec: p.timeSec ?? undefined,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: hitsData → 히트맵 폴백
// 백엔드가 현재 heatmapData: List.of() (빈 배열) 을 반환하므로,
// hitsData(타격 목록)에서 코트 좌표를 추정해 히트맵을 생성한다.
//
// 배드민턴 코트 좌표 규칙 (프론트 SVG 기준):
//   x: 0(왼쪽) ~ 100(오른쪽), y: 0(top) ~ 100(bottom)
//   top 플레이어 → y 0~50 구간, bottom 플레이어 → y 50~100 구간
//
// AI 서버 타격 순서(hitNumber)와 플레이어 정보만 있으므로
// 단순 격자 배치 → 시각적 참고용. 실제 XY 좌표는 AI 서버 업데이트 후 제공됨.
// ─────────────────────────────────────────────────────────────────────────────

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

  // 이미 x/y 좌표가 있으면 그대로 사용
  const withCoords = playerHits.filter((h) => h.x != null && h.y != null);
  if (withCoords.length > 0) {
    return withCoords.map((h) => ({
      x: h.x!,
      y: h.y!,
      value: 0.5,
      timeSec: h.timeSec ?? undefined,
    }));
  }

  // 좌표 없음: 격자 배치로 폴백 (실제 포지션 데이터 아님 — 시각 참고용)
  // 플레이어 절반 코트 내에 균등 분포
  const yBase = playerSide === "top" ? 5 : 55;
  const yRange = 40;
  const xBase = 15;
  const xRange = 70;
  const count = playerHits.length;

  // 스트로크 유형별 강도
  const intensityMap: Record<string, number> = {
    Smash: 0.95, smash: 0.95,
    Clear: 0.65, clear: 0.65,
    Drop: 0.55, drop: 0.55,
    Drive: 0.70, drive: 0.70,
    Serve: 0.45, serve: 0.45,
    Net: 0.40, net: 0.40,
  };

  return playerHits.map((h, idx) => {
    // 타격 순서 기반 격자 분산 (행 4개 기준)
    const cols = Math.max(4, Math.ceil(Math.sqrt(count)));
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rows = Math.ceil(count / cols);

    const x = xBase + (col / Math.max(cols - 1, 1)) * xRange + (Math.random() * 6 - 3);
    const y = yBase + (row / Math.max(rows - 1, 1)) * yRange + (Math.random() * 6 - 3);

    const strokeKey = h.strokeType ?? "";
    const value = intensityMap[strokeKey] ?? 0.5;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(playerSide === "top" ? 2 : 52, Math.min(playerSide === "top" ? 48 : 98, y)),
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
    strokeTypes: { smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, net: 0, others: 0 },
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

  // heatmapData 정규화: positionAnalysis.heatmapData 우선, 없으면 hitsData 폴백
  const rawHeatmap = normalizeHeatmapData(raw.positionAnalysis?.heatmapData);
  const heatmapData =
    rawHeatmap.length > 0
      ? rawHeatmap
      : deriveHeatmapFromHits(hitsDataFallback, playerSide);

  const am = raw.abilityMetrics ?? {};

  return {
    positionAnalysis: { heatmapData },
    strokeTypes: {
      smash:  raw.strokeTypes?.smash  ?? 0,
      clear:  raw.strokeTypes?.clear  ?? 0,
      drop:   raw.strokeTypes?.drop   ?? 0,
      drive:  raw.strokeTypes?.drive  ?? 0,
      serve:  raw.strokeTypes?.serve  ?? 0,
      net:    raw.strokeTypes?.net    ?? 0,
      others: raw.strokeTypes?.others ?? 0,
    },
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
    // status 코드를 에러 객체에 포함해 AnalysisReportPage.tsx의 404 감지에 활용
    const err = new Error((json as any).message ?? `리포트 조회 실패: ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }

  const raw: RawAnalysisResponse = await res.json();
  const data = raw.data;

  // ── summary 필드: SummaryDto(중첩) 또는 flat legacy 필드 모두 처리 ──
  const summary = {
    matchOutcome: data.summary?.matchOutcome
      ?? data.matchOutcome
      ?? "DRAW",
    myScore:           data.summary?.myScore
      ?? data.bottomPlayerScore
      ?? 0,
    opponentScore:     data.summary?.opponentScore
      ?? data.topPlayerScore
      ?? 0,
    totalStrokeCount:  data.summary?.totalStrokeCount
      ?? data.totalHits
      ?? 0,
    matchTime:         data.summary?.matchTime ?? "분석 완료",
  };

  // ── players: PlayersDto(중첩) 또는 legacy flat 필드로 폴백 ──
  const hitsData = data.hitsData;

  const topPlayerData = normalizePlayerData(
    data.players?.top,
    hitsData,
    "top"
  );
  const bottomPlayerData = normalizePlayerData(
    data.players?.bottom,
    hitsData,
    "bottom"
  );

  return {
    code: raw.code,
    message: raw.message,
    data: {
      videoId: Number(data.videoId ?? videoId),
      summary : summary as any,
      players: {
        top: topPlayerData,
        bottom: bottomPlayerData,
      },
    },
  };
}
