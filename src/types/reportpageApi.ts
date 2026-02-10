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
      heatmapData: { x: number; y: number }[];
    };
    strokeTypes: {
      smash: number;
      clear: number;
      drop: number;
      drive: number;
      lob: number;
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
