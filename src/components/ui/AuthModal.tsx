import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { LoginForm } from "../LoginForm";
import { SignupForm } from "./signupForm";
import { ForgotPasswordForm} from "./forgotPW";

type View = "login" | "signup" | "forgot";

type Props = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  initialView?: View;
};

const VIEW_TITLE: Record<View, string> = {
  login: "로그인",
  signup: "회원가입",
  forgot: "비밀번호 찾기",
};

export function AuthModal({ open, onClose, onLoginSuccess, initialView= "login" }: Props) {
  const [view, setView] = useState<View>(initialView || "login");
  const dialogRef = useRef<HTMLDivElement>(null);

  // 모달 열릴 때마다 로그인 화면으로 초기화(원하면 제거 가능)
  useEffect(() => {
    if (open) setView(initialView || "login");
  }, [open, initialView]);

  // ESC / 스크롤 잠금 / 포커스 가두기
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Tab이 모달 밖(헤더·본문)으로 새어나가지 않게 첫↔마지막 요소를 잇는다.
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  /**
   * 닫힐 때 원래 있던 자리로 포커스를 돌려준다.
   * open에만 의존한다 — onClose는 부모가 렌더할 때마다 새 함수라, 같이 묶으면
   * 부모가 리렌더할 때마다 포커스를 빼앗는다.
   */
  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, [open]);

  /**
   * 화면이 바뀌면(로그인→회원가입 등) 포커스를 모달 자신에게 옮긴다.
   * 첫 입력칸에 바로 넣지 않는 건 모바일에서 키보드가 올라와 모달을 덮기 때문.
   */
  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();
  }, [open, view]);

  /**
   * 실패하면 throw 한다 — 메시지를 폼 안에 띄우는 건 LoginForm 쪽 일이다.
   * 예전에는 여기서 alert()를 띄웠는데, 모바일에서는 그 팝업이 유일한 단서라
   * 한 번 닫으면 왜 실패했는지 확인할 방법이 없었다.
   */
  const handleLogin = async (email: string, password: string) => {
    let res: Response;

    try {
      res = await fetch("/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // fetch 자체가 실패 = 서버에 닿지 못함(오프라인, 프록시 미동작 등)
      throw new Error(
        "서버에 연결하지 못했습니다. 네트워크 상태를 확인해주세요.",
      );
    }

    // 프록시가 잘못 물리면 JSON 대신 HTML(index.html)이 돌아온다.
    // 그때 res.json()이 터지면 원인을 알 수 없으므로 상태 코드를 같이 남긴다.
    let result: any;
    try {
      result = await res.json();
    } catch {
      throw new Error(
        `서버 응답을 읽지 못했습니다. (HTTP ${res.status}) 잠시 후 다시 시도해주세요.`,
      );
    }

    if (!res.ok) {
      throw new Error(result?.message || `로그인 실패 (HTTP ${res.status})`);
    }

    // 백엔드는 토큰을 data 안에 담아 보낸다.
    const { accessToken, refreshToken, user } = result?.data ?? {};

    if (!accessToken) {
      throw new Error("로그인 응답에 토큰이 없습니다. 관리자에게 문의해주세요.");
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (user) localStorage.setItem("user", JSON.stringify(user));

    onLoginSuccess(); // App.tsx에서 dashboard 이동
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 바깥 여백은 작은 화면에서 한 번만 준다. 카드 안쪽 여백과 합쳐져
          내용 폭이 두 번 깎이던 자리.
          env(safe-area-inset-*): 노치·홈 인디케이터가 있는 기기에서 가로로 돌렸을 때
          카드가 깎이지 않도록 최소 여백을 기기 값과 비교해 더 큰 쪽을 쓴다. */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={VIEW_TITLE[view]}
          tabIndex={-1}
          // dvh: 모바일 브라우저 주소창이 접혔다 펴져도 카드가 화면 밖으로 안 나간다.
          // overscroll-contain: 카드 안에서 끝까지 스크롤해도 뒤 페이지가 따라 움직이지 않는다.
          className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)]"
        >
          {/* 44px 터치 목표. 아이콘만 두면 손가락으로 누르기엔 36px밖에 안 됐다. */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 flex size-11 touch-manipulation items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:right-3 sm:top-3"
            aria-label="닫기"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="p-5 sm:p-8">
            {view === "login" && (
              <LoginForm
                onLogin={handleLogin}
                onGoSignup={() => setView("signup")}
                onGoForgot={() => setView("forgot")}
              />
            )}

            {view === "signup" && (
              <SignupForm
                onSignupSuccess={() => {
                  // 회원가입 성공하면 로그인 화면으로 보내거나, 바로 로그인 처리도 가능
                  setView("login");
                }}
                onGoLogin={() => setView("login")}
              />
            )}

            {view === "forgot" && (
              <ForgotPasswordForm
                onBack={() => setView("login")}
                onSent={() => setView("login")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
