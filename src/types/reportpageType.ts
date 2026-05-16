// src/types/reportpageType.ts

export type PlayerKey = "top" | "bottom";

export type HeatmapPoint = {
  x: number;       // 0~100 (% of court height, top→bottom)
  y: number;       // 0~100 (% of court width, left→right)
  value?: number;  // 0~1 intensity
  timeSec?: number;
};

export type PlayerData = {
  positionAnalysis: {
    heatmapData: HeatmapPoint[];
  };
  strokeTypes: {
    smash: number;
    clear: number;
    drop: number;
    drive: number;
    serve: number;
    net: number;
    others: number;
  };
  abilityMetrics: {
    aggression:  number;
    rally:       number;
    defense:     number;
    mobility:    number;
    consistency: number;
  };
  aiCoaching: {
    feedbackText: string;
  };
};

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
    // Per-player breakdown
    players: {
      top: PlayerData;
      bottom: PlayerData;
    };
  };
};

export type ApiErrorResponse = {
  status: "error";
  error_code: number;
  message: string;
};
