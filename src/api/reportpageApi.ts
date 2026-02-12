import type { ReportResponse } from "../types/reportpageApi";

const USE_MOCK = true; // ✅ 지금은 true로 두고, 백엔드 붙이면 false

function createMockReport(videoId: string | number): ReportResponse {
  return {
    code: 200,
    message: "Mock: 분석 리포트 조회 성공",
    data: {
      videoId: Number(videoId),

      summary: {
        myScore: 21,
        opponentScore: 18,
        matchOutcome: "WIN",
        totalStrokeCount: 45,
        matchTime: "45:23",
      },

      positionAnalysis: {
        heatmapData: Array.from({ length: 250 }, () => ({
          x: Math.random() * 150,
          y: Math.random() * 200,
          value: Math.random(), // 선택 필드면 있어도 되고 없어도 됨
        })),
      },

      strokeTypes: {
        smash: 4,
        clear: 8,
        drop: 12,
        drive: 8,
      },

      abilityMetrics: {
        smash: 85,
        defense: 72,
        speed: 78,
        stamina: 85,
        accuracy: 82,
      },

      aiCoaching: {
        feedbackText:
          "스매시와 정확도가 강점입니다. 수비 전환 시 코트 중앙 복귀를 조금 더 빠르게 가져가면 안정성이 올라갑니다.",
      },
    },
  };
}

export async function fetchReport(videoId: string | number): Promise<ReportResponse> {
  if (USE_MOCK) {
    // 네트워크 흉내(로딩 테스트용)
    await new Promise((r) => setTimeout(r, 400));
    return createMockReport(videoId);
  }

  const res = await fetch(`/api/v1/analysis/${videoId}`, {
    method : "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`리포트 조회 실패: ${res.status}`);
  }

  return (await res.json()) as ReportResponse;
}
