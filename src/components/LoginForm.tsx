import { useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  FOCUS_RING,
  FOOT_NOTE,
  INPUT_BASE,
  LABEL_BASE,
  LINK_BUTTON,
  PRIMARY_BUTTON,
  SUBTITLE_BASE,
  TITLE_BASE,
} from "./ui/authFormStyles";

type Props = {
  onLogin: (email: string, password: string) => void | Promise<void>;
  onGoSignup: () => void;
  onGoForgot: () => void;
};

export function LoginForm({ onLogin, onGoSignup, onGoForgot }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // 라벨↔입력 연결용. 이 폼이 모달 안에서 여러 번 마운트돼도 id가 겹치지 않는다.
  const emailId = useId();
  const passwordId = useId();
  const keepSignedInId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) { // 입력 안할 시
      setError("이메일과 비밀번호를 입력해주세요.");
      // 비어 있는 첫 칸으로 커서를 보내 바로 이어 칠 수 있게 한다.
      (email ? passwordRef : emailRef).current?.focus();
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await onLogin(email, password); // email, password 전달
    } catch (err: any) {
      setError(err?.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 카드 껍데기(배경·그림자·여백)는 AuthModal이 갖는다. 폼이 자기 여백을
    // 또 두면 좁은 화면에서 안쪽 폭이 두 번 깎인다.
    <div className="w-full">
      <h2 className={TITLE_BASE}>로그인</h2>
      <p className={SUBTITLE_BASE}>계정에 로그인하세요</p>

      {/* 실패 사유는 폼 안에 남는다. alert()는 한 번 닫으면 사라져서
          특히 모바일에서 원인을 다시 볼 방법이 없었다. */}
      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-relaxed break-keep text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor={emailId} className={LABEL_BASE}>
            이메일
          </label>
          <input
            id={emailId}
            ref={emailRef}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            className={INPUT_BASE}
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={passwordId} className={LABEL_BASE}>
            비밀번호
          </label>
          <input
            id={passwordId}
            ref={passwordRef}
            name="password"
            type="password"
            autoComplete="current-password"
            className={INPUT_BASE}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 좁은 화면에서 두 항목이 맞닿던 자리.
            flex-wrap + gap으로 폭이 모자라면 줄을 바꾸고, 붙어도 최소 간격은 남긴다. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
          <label
            htmlFor={keepSignedInId}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-gray-600"
          >
            <input
              id={keepSignedInId}
              type="checkbox"
              name="keepSignedIn"
              disabled={isLoading}
              className={`size-[18px] shrink-0 rounded border-gray-300 accent-blue-600 ${FOCUS_RING}`}
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            로그인 상태 유지
          </label>

          <button
            type="button"
            onClick={onGoForgot}
            disabled={isLoading}
            className={`flex min-h-11 items-center ${LINK_BUTTON}`}
          >
            비밀번호 찾기
          </button>
        </div>

        <button type="submit" disabled={isLoading} className={PRIMARY_BUTTON}>
          {isLoading ? "로그인 중…" : "로그인"}
        </button>

        <p className={FOOT_NOTE}>
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={onGoSignup}
            disabled={isLoading}
            className={LINK_BUTTON}
          >
            회원가입
          </button>
        </p>
      </form>
    </div>
  );
}
