import { useId, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import {
  FOOT_NOTE,
  INPUT_BASE,
  LABEL_BASE,
  LINK_BUTTON,
  PRIMARY_BUTTON,
  SUBTITLE_BASE,
  TITLE_BASE,
} from "./authFormStyles";

type Props = {
  onSignupSuccess: () => void;
  onGoLogin: () => void;
};

export function SignupForm({ onSignupSuccess, onGoLogin }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 라벨↔입력 연결용. 모달이 다시 열려 새로 마운트돼도 id가 겹치지 않는다.
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const password2Id = useId();
  const passwordHintId = useId();

  const validateForm = (): boolean => {
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("유효한 이메일 형식을 입력해주세요.");
      return false;
    }

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return false;
    }

    if (name.trim().length < 2) {
      setError("이름은 2글자 이상이어야 합니다.");
      return false;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }

    if (password.length < 8 || password.length > 20) {
      setError("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
      return false;
    }

    if (!password2) {
      setError("비밀번호 확인을 입력해주세요.");
      return false;
    }

    if (password !== password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          nickname: name.trim(),
          password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "회원가입 실패");
      }

      setSuccess("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
      setTimeout(() => {
        onSignupSuccess();
      }, 1500);

    } catch (error: any) {
      setError(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 카드 껍데기(배경·그림자·여백)는 AuthModal이 갖는다.
    <div className="w-full">
      <h2 className={TITLE_BASE}>회원가입</h2>
      <p className={SUBTITLE_BASE}>새 계정을 만들어보세요</p>

      {/* 안내 문구는 폭이 좁아지면 아이콘 옆에서 줄바꿈된다 — items-start라야
          여러 줄일 때 아이콘이 첫 줄에 맞춰 붙는다. */}
      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-relaxed break-keep text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm leading-relaxed break-keep text-green-700"
        >
          <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor={nameId} className={LABEL_BASE}>이름</label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            className={INPUT_BASE}
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor={emailId} className={LABEL_BASE}>이메일</label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            className={INPUT_BASE}
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor={passwordId} className={LABEL_BASE}>비밀번호</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby={passwordHintId}
            className={INPUT_BASE}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            maxLength={20} // 클라이언트측 입력 제한
            required
          />
          <p id={passwordHintId} className="mt-1.5 text-xs text-gray-500">
            8글자 이상 20글자 이하
          </p>
        </div>

        <div>
          <label htmlFor={password2Id} className={LABEL_BASE}>비밀번호 확인</label>
          <input
            id={password2Id}
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            className={INPUT_BASE}
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className={PRIMARY_BUTTON}>
          {isLoading ? "처리 중..." : "회원가입"}
        </button>

        <p className={FOOT_NOTE}>
          이미 계정이 있나요?{" "}
          <button
            type="button"
            onClick={onGoLogin}
            disabled={isLoading}
            className={LINK_BUTTON}
          >
            로그인
          </button>
        </p>
      </form>
    </div>
  );
}
