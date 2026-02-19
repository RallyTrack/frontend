import { useState } from "react";

type Props = {
  onBack: () => void;
  onSent: () => void;
};

export function ForgotPasswordForm({ onBack, onSent }: Props) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: 비밀번호 재설정 메일 발송 API 호출
    alert("재설정 링크를 이메일로 보냈다고 가정합니다.");
    onSent();
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h2>
      <p className="mt-1 text-sm text-gray-500">
        가입한 이메일로 재설정 링크를 보내드릴게요.
      </p>

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

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          재설정 링크 보내기
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          로그인으로 돌아가기
        </button>
      </form>
    </div>
  );
}
