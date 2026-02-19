import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

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
      const res = await fetch("http://localhost:8080/api/v1/signup", {
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
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
      <p className="mt-1 text-sm text-gray-500">새 계정을 만들어보세요</p>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="size-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="size-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">이름</label>
          <input
            type="text"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            maxLength={20} // 클라이언트측 입력 제한
            required
          />
          <p className="mt-1 text-xs text-gray-500">8글자 이상 20글자 이하</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "처리 중..." : "회원가입"}
        </button>

        <div className="pt-4 text-center text-sm text-gray-600">
          이미 계정이 있나요?{" "}
          <button
            type="button"
            onClick={onGoLogin}
            disabled={isLoading}
            className="text-blue-600 hover:underline disabled:cursor-not-allowed"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}
