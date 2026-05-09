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
        matchTime: "분석 완료",
      },
      players: {
        top: data.players?.top ?? buildEmptyPlayerData(),
        bottom: data.players?.bottom ?? buildEmptyPlayerData(),
      },
      // legacy flat fields
      positionAnalysis: { heatmapData: [] },
      strokeTypes: { smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, net: 0, others: 0 },
      abilityMetrics: { smash: 0, AvgRallyTime: 0, speed: 0, distance: 0, errorRate: 0 },
      aiCoaching: { feedbackText: "" },
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