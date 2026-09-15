import { useId, useState } from "react";

type Props = {
  onLogin: (email: string, password: string) => void;
  onGoSignup: () => void;
  onGoForgot: () => void;
};

/** 키보드 포커스 표시. 링크형 버튼과 제출 버튼 모두 같은 스타일을 쓴다. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/** 입력 필드는 클릭 포커스에서도 테두리가 보여야 하므로 focus: 를 쓴다. */
const INPUT_BASE =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none " +
  "transition-colors focus:border-blue-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500";

export function LoginForm({ onLogin, onGoSignup, onGoForgot }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  // 라벨↔입력 연결용. 이 폼이 모달 안에서 여러 번 마운트돼도 id가 겹치지 않는다.
  const emailId = useId();
  const passwordId = useId();


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) { // 입력 안할 시
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    onLogin(email, password); // email, password 전달
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
      <p className="mt-1 text-sm text-gray-500">계정에 로그인하세요</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor={emailId} className="block text-sm font-medium text-gray-700">
            이메일
          </label>
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
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            className={INPUT_BASE}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              name="keepSignedIn"
              className={`h-4 w-4 rounded border-gray-300 ${FOCUS_RING}`}
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            로그인 상태 유지
          </label>

          <button
            type="button"
            onClick={onGoForgot}
            className={`rounded text-blue-600 hover:underline ${FOCUS_RING}`}
          >
            비밀번호 찾기
          </button>
        </div>

        <button
          type="submit"
          className={`mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 ${FOCUS_RING}`}
        >
          로그인
        </button>

        <div className="pt-4 text-center text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={onGoSignup}
            className={`rounded text-blue-600 hover:underline ${FOCUS_RING}`}
          >
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
