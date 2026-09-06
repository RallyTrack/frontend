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
  /**
   * 업로드 유형(mode)에 따라 백엔드가 분류하는 종류 수가 다르다.
   *   아마추어 4종 — serve · smash · clear · drive
   *   프로     6종 — serve · lob · smash · drop · drive · clear
   * 화면에 무엇을 그릴지는 STROKE_TAXONOMY(AnalysisReportPage)가 결정한다.
   * net/others는 구버전 응답 호환용으로 남겨둔다.
   */
  strokeTypes: {
    smash: number;
    clear: number;
    drop: number;
    drive: number;
    serve: number;
    lob: number;
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
    /**
     * 업로드 유형 판별용 신호. 조회 API가 mode를 명시적으로 내려주지 않아서,
     * 응답에서 건질 수 있는 단서를 모아 그대로 전달한다.
     * (판별 로직은 AnalysisReportPage의 resolveStrokeMode)
     */
    modeHints: {
      /** 응답에 mode/playerType 필드가 실제로 있었다면 그 값 */
      declared?: "amateur" | "pro";
      /** hitsData의 strokeType 문자열 집합 (소문자) */
      hitStrokeTypes: string[];
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