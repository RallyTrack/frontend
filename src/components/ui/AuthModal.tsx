import { useEffect, useState } from "react";
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


export function AuthModal({ open, onClose, onLoginSuccess, initialView= "login" }: Props) {
  const [view, setView] = useState<View>(initialView || "login");

  // 모달 열릴 때마다 로그인 화면으로 초기화(원하면 제거 가능)
  useEffect(() => {
    if (open) setView(initialView || "login");
  }, [open, initialView]);

  // ESC / 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

const handleLogin = async (email: string, password: string) => {
  try {
    const res = await fetch("http://localhost:8080/api/v1/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "로그인 실패");
    }

    // 🔥 백엔드 구조 주의 (data 안에 있음)
    const { accessToken, refreshToken, user } = result.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    onLoginSuccess(); // App.tsx에서 dashboard 이동

  } catch (error: any) {
    alert(error.message);
  }
};


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-auto">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div className="p-6">
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
