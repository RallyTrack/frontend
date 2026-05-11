import {ReportResponse} from "../types/reportpageType"
import { apiClient } from './apiClient';
// import { mockReport } from "../types/reportMock";

// reportpageApi.ts에 변환 레이어 추가
export async function fetchReport(videoId: string | number): Promise<ReportResponse> {
  const res = await apiClient(`/api/v1/analysis/${videoId}`);
  
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as any).message ?? `리포트 조회 실패: ${res.status}`);
  }
  
  const raw = await res.json();
  const data = raw.data;
  
  // 백엔드 응답을 프론트 타입으로 변환
  return {
    code: raw.code,
    message: raw.message,
    data: {
      videoId: data.videoId,
      summary: {
        matchOutcome: data.matchOutcome ?? "DRAW",
        myScore: data.bottomPlayerScore ?? 0,
        opponentScore: data.topPlayerScore ?? 0,
        totalStrokeCount: data.totalHits ?? 0,
        matchTime: data.summary?.matchTime ?? "분석 완료",
      },
      players: {
        top: data.players?.top
          ? { ...data.players.top, abilityMetrics: parseAbilityMetrics(data.players.top.abilityMetrics) }
          : buildEmptyPlayerData(),
        bottom: data.players?.bottom
          ? { ...data.players.bottom, abilityMetrics: parseAbilityMetrics(data.players.bottom.abilityMetrics) }
          : buildEmptyPlayerData(),
      },
    },
  };
}

function buildEmptyPlayerData() {
  return {
    positionAnalysis: { heatmapData: [] },
    strokeTypes: { smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, net: 0, others: 0 },
    abilityMetrics: { smash: 0, AvgRallyTime: 0, speed: 0, distance: 0, errorRate: 0 },
    aiCoaching: { feedbackText: "" },
  };
}

// ── abilityMetrics 안전 파싱 ──────────────────────────────────────────────
// 백엔드가 null/undefined를 내려보내거나 숫자가 아닌 값이 섞여도 0~100 정수로 보정
function clampScore(v: unknown): number {
  const n = Number(v);
  if (!isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function parseAbilityMetrics(raw: Record<string, unknown> | undefined) {
  if (!raw) return { smash: 0, AvgRallyTime: 0, speed: 0, distance: 0, errorRate: 0 };
  return {
    smash:        clampScore(raw.smash),
    AvgRallyTime: clampScore(raw.AvgRallyTime),  // 백엔드 @JsonProperty("AvgRallyTime")와 동일 키
    speed:        clampScore(raw.speed),
    distance:     clampScore(raw.distance),
    errorRate:    clampScore(raw.errorRate),
  };
}