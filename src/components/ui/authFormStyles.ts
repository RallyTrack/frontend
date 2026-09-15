/**
 * 로그인 / 회원가입 / 비밀번호 찾기 폼이 함께 쓰는 스타일.
 *
 * 세 폼이 각자 클래스 문자열을 들고 있어서 입력 높이·글자 크기가 조금씩
 * 달랐다. 모달은 좁은 화면에서 가장 먼저 깨지는 화면이라 치수를 한곳에
 * 모아두고 반응형 규칙도 여기서만 손본다.
 *
 * 폭 계산(360px 기준): 화면 360 - 모달 바깥 여백 32 - 카드 안쪽 여백 40 = 288px.
 * 예전에는 카드가 모달(p-6)과 폼(p-8) 양쪽에서 여백을 받아 216px까지 좁아졌다.
 */

/** 키보드 포커스 표시. 링크형 버튼과 제출 버튼이 같은 링을 쓴다. */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/**
 * 입력 필드. 클릭 포커스에서도 테두리가 보여야 해서 focus-visible이 아닌 focus를 쓴다.
 * text-base(16px)는 유지 — iOS 사파리는 16px 미만 입력에 포커스가 가면 화면을 확대한다.
 */
export const INPUT_BASE =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base " +
  "outline-none transition-colors placeholder:text-gray-400 " +
  "focus:border-blue-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 " +
  "disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4";

/** 입력 라벨 */
export const LABEL_BASE = "block text-sm font-medium break-keep text-gray-700";

/**
 * 폼 제목 — 좁은 화면에서 한 단계 작게.
 * pr-10은 오른쪽 위 닫기 버튼(44px) 아래로 글자가 파고들지 않게 비워두는 폭이다.
 */
export const TITLE_BASE =
  "pr-10 text-xl font-bold tracking-tight break-keep text-gray-900 sm:text-2xl";

/**
 * 제목 아래 설명 문구.
 * break-keep(word-break: keep-all)이 없으면 좁은 화면에서 한글이 어절 중간에서
 * 잘린다 — "보내드릴게 / 요." 처럼.
 */
export const SUBTITLE_BASE =
  "mt-1 text-sm leading-relaxed break-keep text-gray-500";

/** 제출 버튼. min-h-12는 터치 목표(최소 44px) 확보용. */
export const PRIMARY_BUTTON =
  "mt-1 flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl bg-blue-600 " +
  "px-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 " +
  "disabled:cursor-not-allowed disabled:bg-gray-400 " +
  FOCUS_RING;

/** 보조 버튼(되돌아가기 등) */
export const SECONDARY_BUTTON =
  "flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-gray-200 " +
  "px-4 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 " +
  FOCUS_RING;

/**
 * 문장 안에 섞이는 링크형 버튼(회원가입 / 비밀번호 찾기).
 * align-baseline이 없으면 inline-flex 때문에 앞 문장보다 살짝 내려앉는다.
 */
export const LINK_BUTTON =
  "rounded align-baseline touch-manipulation font-medium text-blue-600 underline-offset-2 hover:underline " +
  "disabled:cursor-not-allowed disabled:text-gray-400 " +
  FOCUS_RING;

/** 폼 하단 "계정이 없으신가요?" 줄 */
export const FOOT_NOTE = "pt-2 text-center text-sm break-keep text-gray-600";
