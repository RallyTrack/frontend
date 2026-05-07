import { useState, useEffect } from "react";

interface OnboardingNavProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  /** App에서 내려주는 모달 open 상태 — false로 바뀌면 로고를 원위치로 복귀 */
  isModalOpen?: boolean;
}

/**
 * 온보딩 전용 네비게이션 바.
 *
 * 초기 상태:
 *   - 좌측: "● REC / SYS_STATUS: ONLINE / 타임코드"
 *   - 중앙: RallyTrack 로고
 *   - 우측: [로그인] / 시작하기
 *
 * 버튼 클릭 시 (transitioning = true):
 *   - 좌측 텍스트가 fade + slide-left 으로 사라짐
 *   - 로고가 중앙 → 좌측으로 부드럽게 이동
 *   - 모달 닫힘 감지 시 → 로고 원위치 복귀 + 좌측 텍스트 다시 표시
 */
export function OnboardingNav({ onOpenLogin, onOpenSignup, isModalOpen }: OnboardingNavProps) {
  const [time, setTime] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      setTime(
        `${now.toISOString().split("T")[0]} ` +
        `${now.toTimeString().split(" ")[0]}:` +
        `${now.getMilliseconds().toString().padStart(3, "0")}`
      );
    }, 47);
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

  return (
    <>
      {/* ── 인라인 스타일: CSS 애니메이션 정의 ── */}
      <style>{`
        .onboarding-nav-left {
          transition: opacity 0.22s ease-out, transform 0.22s ease-out, max-width 0.28s ease-out;
        }
        .onboarding-nav-left.hide {
          opacity: 0;
          transform: translateX(-18px);
          max-width: 0 !important;
          overflow: hidden;
          pointer-events: none;
        }

        /* 로고 컨테이너: 중앙 절대위치 → 좌측으로 이동 */
        .onboarding-logo-wrap {
          position: absolute;
          top: 50%;
          /* 기본: 중앙 */
          left: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.32s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .onboarding-logo-wrap.moved {
          left: 32px;        /* 좌측 패딩 (px-8) */
          transform: translate(0, -50%);
        }
      `}</style>

      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300
          ${scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
            : "bg-white/80 backdrop-blur-md border-b border-slate-200"
          }
        `}
      >
        <div className="relative h-full px-8">

          {/* ── 좌측: 상태 텍스트 ── */}
          <div
            className={`onboarding-nav-left absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-4 font-mono text-xs uppercase tracking-widest overflow-hidden ${
              transitioning ? "hide" : ""
            }`}
            style={{ maxWidth: "340px" }}
          >
            <span className="text-[#6bba00] animate-pulse font-bold whitespace-nowrap">● REC</span>
            <span className="text-slate-400 hidden sm:inline-block whitespace-nowrap">SYS_STATUS: ONLINE</span>
            <span className="text-slate-500 font-bold hidden md:inline-block whitespace-nowrap tabular-nums">
              {time}
            </span>
          </div>

          {/* ── 로고: 중앙 → 왼쪽 이동 ── */}
          <div className={`onboarding-logo-wrap ${transitioning ? "moved" : ""}`}>
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              className="h-12 w-auto object-contain select-none"
              draggable={false}
            />
          </div>

          {/* ── 우측: 버튼 ── */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
            <button
              onClick={() => withTransition(onOpenLogin)}
              className="text-slate-500 font-bold hover:text-[#1a2b4c] transition-colors whitespace-nowrap"
            >
              [ 로그인 ]
            </button>
            <button
              onClick={() => withTransition(onOpenSignup)}
              className="bg-[#f2fde0] text-[#6bba00] font-bold border border-[#8ce600] px-4 py-1.5 hover:bg-[#8ce600] hover:text-[#1a2b4c] transition-all whitespace-nowrap"
            >
              시작하기
            </button>
          </div>

        </div>
      </nav>
    </>
  );
}