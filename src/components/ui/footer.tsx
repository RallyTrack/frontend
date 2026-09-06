export function Footer() {
  return (
    // 페이지를 닫는 자리라 헤더보다 가벼워야 한다. 예전에는 py-6 + 44px 로고로
    // 헤더(64px)보다 두꺼웠다.
    <footer className="mt-auto border-t border-slate-200/70 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/RallyTrack.svg"
            alt="RallyTrack"
            width={93}
            height={28}
            className="h-7 w-auto opacity-50"
          />
          <span className="hidden text-xs text-slate-400 sm:block">
            배드민턴 경기 AI 분석 서비스
          </span>
        </div>

        {/* 이용약관·개인정보처리방침·문의하기 링크는 걷어냈다 — 셋 다
            href="#"이라 아무 데도 가지 않고 페이지만 맨 위로 튕겼다.
            해당 페이지가 생기면 그때 실제 경로로 다시 넣을 것. */}
        <span className="text-xs text-slate-300">©&nbsp;2026 RallyTrack</span>
      </div>
    </footer>
  );
}
