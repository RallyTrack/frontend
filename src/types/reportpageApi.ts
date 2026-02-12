export type ReportResponse = {
  code: number;
  message: string;
  data: {
    videoId: number;
    summary: {
      myScore: number;
      opponentScore: number;
      matchOutcome: "WIN" | "LOSE" | "DRAW";
      totalStrokeCount: number;
      matchTime: string;
    };
    positionAnalysis: {
      heatmapData: HeatmapPoint[];
    };
    strokeTypes: {
      smash: number;
      clear: number;
      drop: number;
      drive: number;
    };
    abilityMetrics: {
      smash: number;
      defense: number;
      speed: number;
      stamina: number;
      accuracy: number;
    };
    aiCoaching: {
      feedbackText: string;
    };
  };
};

export type HeatmapPoint = {
  x: number;        // 0~100(%) 권장 또는 0~1 정규화
  y: number;        // 0~100(%) 권장 또는 0~1 정규화
  value?: number;   // 0~1 강도(없으면 프론트에서 임시 처리)
  timeSec?: number; // 영상 점프용(없으면 클릭해도 점프 안함)
};

/**
 * (선택) 백엔드 에러 템플릿이 이런 형태라면 사용
 */
export type ApiErrorResponse = {
  status: "error";
  error_code: number;
  message: string;
};

