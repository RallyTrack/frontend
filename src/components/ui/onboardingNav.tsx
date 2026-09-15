import { useState, useEffect, useRef } from "react";

interface OnboardingNavProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  /** App에서 내려주는 모달 open 상태 — false로 바뀌면 로고를 원위치로 복귀 */
  isModalOpen?: boolean;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** HUD용 타임코드: YYYY-MM-DD HH:MM:SS:mmm (전부 로컬 시각) */
function formatTimecode(now: Date) {
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}:` +
    `${pad(now.getMilliseconds(), 3)}`
  );
}

/**
 * 온보딩 전용 네비게이션 바.
 *
 * 레이아웃
 *   - < 768px : 로고 좌측 고정 / 우측 버튼. (로고를 중앙에 두면 버튼과 겹침)
 *               좌측 HUD 상태 텍스트는 숨김. < 375px 에서는 [로그인]도 숨김
 *               (시작하기 모달 안에서 로그인으로 전환 가능하므로 진입로는 유지).
 *   - ≥ 768px : 좌측 HUD / 중앙 로고 / 우측 버튼.
 *               버튼 클릭 시 로고가 중앙 → 좌측으로 이동하고 HUD는 페이드 아웃.
 *               모달이 닫히면 원위치로 복귀.
 *
 * 세 영역 모두 absolute라 부모 padding이 먹지 않으므로,
 * 좌우 여백은 --nav-gutter 변수 하나로 통일해 쓴다.
 */
export function OnboardingNav({ onOpenLogin, onOpenSignup, isModalOpen }: OnboardingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timeRef = useRef<HTMLSpanElement>(null);

  // 타임코드는 47ms마다 갱신된다. state로 두면 그때마다 nav 전체가 리렌더되므로
  // DOM 텍스트만 직접 갱신한다. 탭이 백그라운드면 건너뛴다.
  useEffect(() => {
    const paint = () => {
      const el = timeRef.current;
      if (!el || document.hidden) return;
      el.textContent = formatTimecode(new Date());
    };
    paint();
    const iv = setInterval(paint, 47);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 모달이 닫히면(isModalOpen: true→false) 로고 원위치 복귀
  useEffect(() => {
    if (isModalOpen === false && transitioning) {
      // 약간의 딜레이 후 복귀 (모달 닫힘 애니메이션과 겹치지 않도록)
      const t = setTimeout(() => setTransitioning(false), 180);
      return () => clearTimeout(t);
    }
  }, [isModalOpen]);

  /** 버튼 클릭 → 애니메이션 → 모달 오픈 */
  const withTransition = (cb: () => void) => {
    if (transitioning) return;
    setTransitioning(true);
    // 로고 이동 애니메이션(220ms) 후 모달 열기
    setTimeout(() => cb(), 220);
  };

  // 흰 헤더 위라 네이비. 브랜드 초록(#6bba00)은 흰 배경 대비 2.4:1 로
  // 포커스 표시 최소 대비(3:1)에 못 미친다.
  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2b4c]";

  return (
    <>
      {/* ── 인라인 스타일: 여백 토큰 + 애니메이션 정의 ── */}
      <style>{`
        .onboarding-nav-inner {
          /* 좌우 여백. 자식들이 absolute라 padding이 안 먹으므로
             변수로 빼서 패딩과 위치 지정에 같은 값을 쓴다 */
          --nav-gutter: 1rem;
          padding-inline: var(--nav-gutter);
          /* 로고 중앙 정렬 계산(50cqw)의 기준 컨테이너 */
          container-type: inline-size;
        }

        .onboarding-nav-left,
        .onboarding-logo-wrap { left: var(--nav-gutter); }
        .onboarding-nav-right { right: var(--nav-gutter); }

        .onboarding-nav-left {
          transition: opacity 0.22s ease-out, transform 0.22s ease-out;
        }
        .onboarding-nav-left.hide {
          opacity: 0;
          transform: translateX(-18px);
          pointer-events: none;
        }

        /* 로고: 위치는 항상 좌측 고정, 중앙 배치는 transform으로만 처리한다.
           (left 를 애니메이션하면 프레임마다 레이아웃이 다시 계산됨) */
        .onboarding-logo-wrap {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 768px) {
          .onboarding-nav-inner {
            --nav-gutter: 2rem;
          }
          /* 컨테이너 중앙 = 자기 폭의 절반만큼 왼쪽으로 당긴 50cqw 지점 */
          .onboarding-logo-wrap {
            transform: translate(calc(50cqw - 50%), -50%);
          }
          .onboarding-logo-wrap.moved {
            transform: translate(0, -50%);
          }
        }

        /* 감속 모션 설정에서는 "이동"만 끈다.
           로고 슬라이드·HUD 슬라이드는 실제 위치 이동이라 정지시키지만,
           ● REC 점멸은 투명도만 변하는 제자리 애니메이션이라 그대로 둔다.
           (감속 모션이 기본값으로 켜져 있는 환경이 적지 않아, 여기까지 끄면
            해당 사용자에게만 화면이 죽어 보인다) */
        @media (prefers-reduced-motion: reduce) {
          .onboarding-nav-left,
          .onboarding-logo-wrap {
            transition: none;
          }
          /* theme.css의 전역 규칙이 모든 애니메이션을 0.01ms로 눌러버리므로
             이 점멸만 되살린다. !important 는 그 전역 규칙을 넘기 위한 것.
             (값은 Tailwind animate-pulse 기본값) */
          .onboarding-rec-dot {
            animation-duration: 2s !important;
            animation-iteration-count: infinite !important;
          }
        }
      `}</style>

      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 h-16
          transition-[background-color,border-color,box-shadow] duration-300
          ${scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
            : "bg-white/80 backdrop-blur-md border-b border-slate-200"
          }
        `}
      >
        <div className="onboarding-nav-inner relative h-full">

          {/* ── 좌측: HUD 상태 텍스트 ──
              장식용이므로 보조기기에서는 통째로 제외한다. */}
          <div
            aria-hidden="true"
            className={`onboarding-nav-left absolute top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 font-mono text-xs uppercase tracking-widest overflow-hidden ${
              transitioning ? "hide" : ""
            }`}
            style={{ maxWidth: "340px" }}
          >
            <span className="text-[#6bba00] font-bold whitespace-nowrap">
              <span className="onboarding-rec-dot inline-block animate-pulse">●</span> REC
            </span>
            <span className="text-slate-400 whitespace-nowrap">SYS_STATUS: ONLINE</span>
            <span
              ref={timeRef}
              className="text-slate-500 font-bold hidden lg:inline-block whitespace-nowrap tabular-nums"
            />
          </div>

          {/* ── 로고: (md 이상) 중앙 → 왼쪽 이동 ── */}
          <div className={`onboarding-logo-wrap ${transitioning ? "moved" : ""}`}>
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              width={1167}
              height={323}
              translate="no"
              className="h-9 md:h-12 w-auto object-contain select-none"
              draggable={false}
            />
          </div>

          {/* ── 우측: 버튼 ── */}
          <div className="onboarding-nav-right absolute top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-4 font-mono text-xs uppercase tracking-normal md:tracking-widest">
            {/* < 375px 에서는 로고와 겹치므로 숨김.
                회원가입 모달 안에서 로그인으로 전환 가능하므로 진입로는 유지된다. */}
            {/* py-3 — 글자만 있는 버튼이라 높이가 24px밖에 안 나온다.
                배경이 없어 겉보기는 그대로지만 탭 영역이 48px로 넓어진다. */}
            <button
              type="button"
              onClick={() => withTransition(onOpenLogin)}
              className={`hidden min-[375px]:inline-block text-slate-500 font-bold whitespace-nowrap py-3
                transition-colors hover:text-[#1a2b4c] [touch-action:manipulation] ${focusRing}`}
            >
              [ 로그인 ]
            </button>
            <button
              type="button"
              onClick={() => withTransition(onOpenSignup)}
              className={`bg-[#f2fde0] text-[#6bba00] font-bold border border-[#8ce600] px-3 md:px-4 py-2.5 md:py-1.5 whitespace-nowrap
                transition-colors hover:bg-[#8ce600] hover:text-[#1a2b4c] [touch-action:manipulation] ${focusRing}`}
            >
              시작하기
            </button>
          </div>

        </div>
      </nav>
    </>
  );
}
