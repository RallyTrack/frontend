import type { PlayerKey } from "../types/reportpageType";

/**
 * 데이터 시각화 색 토큰 — 단일 출처.
 *
 * 차트가 recharts/인라인 SVG라 JS 문자열이 필요해서 CSS 변수 대신 이 모듈을 쓴다.
 * 색을 바꿀 때는 여기만 고치면 전 페이지에 반영된다.
 *
 * 기준: 브랜드 네이비 #1a2b4c(hue 220°, 채도 49%) + 라임 #8ce600.
 * 기존 차트 색은 tailwind 기본값(blue-600 #2563eb, emerald-600 #059669)이라
 * 브랜드보다 채도가 30~45pt 높아 UI 위에서 혼자 튀었다. 아래 값들은 같은 색상환
 * 위치를 유지하되 채도를 브랜드 수준으로 낮추고 명도를 맞춘 것이다.
 */

/** 브랜드 코어 색 */
export const BRAND = {
  navy: "#1a2b4c",
  navyHover: "#243a63",
  /** 라임 스케일 — 강조(활성 상태) 전용. text는 반드시 limeText를 쓸 것. */
  lime: "#8ce600",
  limeText: "#3f6b00", // #8ce600/#6bba00은 흰 배경 대비 2.4:1로 텍스트 불가 → 6.3:1
  limeTint: "#f2fde0",
} as const;

/**
 * 선수 식별 색 — Top=블루, Bottom=앰버.
 *
 * ★ 이 쌍은 분석 영상/미니맵 오버레이(백엔드 렌더링)의 색과 맞춘 것이다.
 *   오버레이가 bottom에 오렌지를 쓰는 이유는 코트 배경이 초록이라 초록 계열
 *   스켈레톤이 안 보이기 때문. UI가 그쪽에 맞춰야 두 화면에서 같은 선수가
 *   같은 색으로 읽힌다. 바꿀 일이 생기면 오버레이 쪽과 함께 바꿀 것.
 *
 * ★ 마크용(PLAYER_COLOR)과 텍스트용(PLAYER_COLOR_STRONG)을 분리한 이유:
 *   밝은 오렌지는 흰 배경 대비가 3.4:1이라 12px 텍스트(4.5:1 필요)에 못 쓴다.
 *   그렇다고 텍스트 기준에 맞춰 어둡게 잡으면 막대가 갈색처럼 칙칙해진다.
 *   → 큰 색면(막대·점·게이지)은 밝게, 글자와 솔리드 버튼은 진하게 나눈다.
 *
 * ★ 두 색을 "함께" 톤다운한 소프트 페어다. 한쪽만 밝히면 무게가 벌어져
 *   밝은 쪽이 앞으로 튀어나온다.
 *
 * 영상페이지는 잉크(네이비)와 흰 표면이 주도하고 라임은 점처럼만 쓰인다.
 * 분석페이지가 채도 높은 색을 큰 면적으로 깔면 페이지를 넘어올 때 튄다.
 * 그래서 (1) 채도를 낮추고 (2) 색이 덮는 면적 자체를 줄였다 —
 * 토글·뱃지는 채운 알약이 아니라 흰 표면 + 색 점 + 잉크 글자다.
 * 새 UI를 붙일 때도 이 원칙을 지킬 것: 색은 식별 신호, 면은 흰색/잉크.
 *
 * ★ Bottom은 흰 배경 대비 2.25:1로 비텍스트 3:1 기준 아래다. 대신 이 색을
 *   쓰는 차트에는 값 표나 값 라벨이 항상 함께 있어 색만으로 정보를 전달하지
 *   않는다. 글자에는 절대 쓰지 말고 PLAYER_COLOR_STRONG을 쓸 것.
 */
export const PLAYER_COLOR: Record<PlayerKey, string> = {
  top: "#5c7ebc",
  bottom: "#e49e58",
};

/**
 * 텍스트·흰 글자를 얹는 솔리드 배경용. 흰색 기준 4.5:1 이상(AA).
 * 데이터 마크에는 쓰지 말 것 — 그 자리는 PLAYER_COLOR.
 */
export const PLAYER_COLOR_STRONG: Record<PlayerKey, string> = {
  top: "#3c62aa",
  bottom: "#a35a06",
};

/** 보조 계열 — 같은 색의 밝은 단계. 넓은 면적 채우기·2차 시리즈용. */
export const PLAYER_COLOR_SOFT: Record<PlayerKey, string> = {
  top: "#a5b8da",
  bottom: "#f0caa3",
};

/** 배경 틴트 — 배너·뱃지 바탕용(본문 텍스트는 slate 계열 유지). */
export const PLAYER_TINT: Record<PlayerKey, string> = {
  top: "#f2f5fa",
  bottom: "#fdf7f2",
};

/**
 * 시맨틱 섹션 색 — AI 브리핑 섹션 아이콘/제목 틴트.
 *
 * 선수 색(파랑/오렌지)과 일부러 겹치지 않게 골랐다. 같은 카드 안에
 * "Bottom Player" 뱃지가 오렌지로 떠 있는데 "보완할 점"도 오렌지면
 * 둘이 연관돼 보인다.
 *
 * strength↔weakness는 적록색약 ΔE 6.1(6~8 밴드)이라 색만으로 구분하면
 * 안 되지만, 각 섹션이 제목 텍스트와 서로 다른 아이콘을 함께 달고 있어
 * 색은 보조 신호로만 쓰인다.
 */
export const SEMANTIC_TINT = {
  overview: "#1a2b4c",
  metric: "#475569",
  strength: "#15734f",
  weakness: "#be123c",
  training: "#6d28d9",
} as const;

/**
 * 히트맵 밀집도 램프 — 샷 밀집도(크기)를 나타내는 순차 색상.
 * 선수 색(PLAYER_COLOR)을 쓰지 않는 이유: 두 선수를 같은 램프로 그려야
 * 밀집도를 서로 비교할 수 있기 때문. 선수 구분은 코트 상/하 위치와
 * 카드 헤더가 이미 담당한다.
 *
 * 색은 플럼(마젠타) 계열 단일 색상에서 밝음 → 어두움 한 방향으로만 간다.
 * 초록 코트의 보색 영역이라 대비가 가장 강해 밀집도 차이가 잘 읽히고,
 * 선수색(파랑·오렌지)이나 브랜드 라임 어디와도 겹치지 않아
 * "이 색은 밀집도"라는 의미가 독립적으로 유지된다.
 * 빨강 계열을 피한 이유: bottom 선수색(오렌지)과 계열이 붙고,
 * 사이트에서 빨강은 이미 오류/위험 의미를 갖는다.
 */
export const HEAT_RAMP: {
  from: [number, number, number];
  to: [number, number, number];
} = {
  from: [250, 214, 232],
  to: [126, 20, 79],
};

/**
 * 밀집도 t(0~1) → 구름 불투명도.
 *
 * 예전에는 t²를 썼는데, 밀집도 기반으로 바뀌면서 고립된 타격 지점이
 * t=0.25까지 내려가고 t²=0.0625 → opacity 0.08이 되어 구름이 아예
 * 안 보였다. 하한을 두어 최저 밀집도에도 옅은 구름은 남기고,
 * 지수를 완만하게(1.4) 해서 뭉친 곳과의 차이는 유지한다.
 *
 * t=0.25 → 0.22 · t=0.5 → 0.42 · t=0.75 → 0.67 · t=1 → 0.95
 */
export function heatOpacity(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 0.1 + 0.85 * Math.pow(c, 1.4);
}

/** 밀집도 t(0~1) → rgb 문자열 */
export function heatRgb(t: number): string {
  const { from, to } = HEAT_RAMP;
  const ch = (i: 0 | 1 | 2) => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

/** 중립(무승부·미확정 등) */
export const NEUTRAL_MARK = "#64748b";
