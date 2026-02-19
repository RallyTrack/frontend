import { useState } from "react";

type Props = {
  onLogin: (email: string, password: string) => void;
  onGoSignup: () => void;
  onGoForgot: () => void;
};

export function LoginForm({ onLogin, onGoSignup, onGoForgot }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);


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
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            로그인 상태 유지
          </label>

          <button
            type="button"
            onClick={onGoForgot}
            className="text-blue-600 hover:underline"
          >
            비밀번호 찾기
          </button>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          로그인
        </button>

        <div className="pt-4 text-center text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={onGoSignup}
            className="text-blue-600 hover:underline"
          >
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
