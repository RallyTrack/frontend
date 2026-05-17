// src/types/reportpageType.ts

export type PlayerKey = "top" | "bottom";

export type HeatmapPoint = {
  x: number;        // 0~100
  y: number;        // 0~100
  value?: number;   // 0~1 intensity
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
      matchOutcome: "WIN" | "LOSE" | "DRAW" | "BOTTOM_WIN" | "TOP_WIN";
      totalStrokeCount: number;
      matchTime: string;
      unknownRallies?: number;
      totalRallies?: number;
    };
    players: {
      top: PlayerData;
      bottom: PlayerData;
    };
  };
};

export type RallyResult = {
  rallyNumber:  number;
  resultType:   "WINNER" | "CONFIRMED_ERROR" | "UNKNOWN";
  marginCm:     number | null;
  confidence:   "HIGH" | "LOW" | null;
};

export type ApiErrorResponse = {
  status: "error";
  error_code: number;
  message: string;
};