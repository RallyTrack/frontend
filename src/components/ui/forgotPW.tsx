import { useId, useState } from "react";
import {
  INPUT_BASE,
  LABEL_BASE,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SUBTITLE_BASE,
  TITLE_BASE,
} from "./authFormStyles";

type Props = {
  onBack: () => void;
  onSent: () => void;
};

export function ForgotPasswordForm({ onBack, onSent }: Props) {
  const [email, setEmail] = useState("");
  const emailId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: 비밀번호 재설정 메일 발송 API 호출
    alert("재설정 링크를 이메일로 보냈다고 가정합니다.");
    onSent();
  };

  return (
    // 카드 껍데기(배경·그림자·여백)는 AuthModal이 갖는다.
    <div className="w-full">
      <h2 className={TITLE_BASE}>비밀번호 찾기</h2>
      <p className={SUBTITLE_BASE}>
        가입한 이메일로 재설정 링크를 보내드릴게요.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="mb-1">
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
          />
        </div>

        <button type="submit" className={PRIMARY_BUTTON}>
          재설정 링크 보내기
        </button>

        <button type="button" onClick={onBack} className={SECONDARY_BUTTON}>
          로그인으로 돌아가기
        </button>
      </form>
    </div>
  );
}
