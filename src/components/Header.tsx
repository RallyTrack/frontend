import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, LogOut, Settings, ChevronDown } from "lucide-react";

export type Page = "dashboard" | "video" | "report" | "account";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  hasSelectedVideo?: boolean;
  user?: UserInfo;
}

/** 아바타 — 이미지가 깨지면 이니셜로 되돌아간다 */
function Avatar({
  user,
  size,
}: {
  user?: UserInfo;
  size: "sm" | "md";
}) {
  const [broken, setBroken] = useState(false);
  const px = size === "sm" ? "size-8" : "size-9";
  const text = size === "sm" ? "text-[11px]" : "text-sm";
  const initials = user?.nickname
    ? user.nickname.slice(0, 2).toUpperCase()
    : "?";

  if (user?.avatarUrl && !broken) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        width={size === "sm" ? 32 : 36}
        height={size === "sm" ? 32 : 36}
        onError={() => setBroken(true)}
        className={`${px} shrink-0 rounded-full object-cover ring-1 ring-slate-200`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${px} ${text} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: "linear-gradient(135deg, #1a2b4c, #2a4070)" }}
    >
      {initials}
    </div>
  );
}

export function Header({
  currentPage,
  onNavigate,
  onLogout,
  user,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const onDashboard = currentPage === "dashboard";

  return (
    <>
      <style>{`
        @keyframes headerDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .header-dropdown-menu { animation: headerDropIn 0.18s cubic-bezier(0.16,1,0.3,1); }
        @media (prefers-reduced-motion: reduce) {
          .header-dropdown-menu { animation: none; }
        }
      `}</style>

      <header className="sticky top-0 z-50 h-16 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center gap-1 px-6">
          {/* ── 로고 ── */}
          <button
            onClick={() => onNavigate("dashboard")}
            aria-label="RallyTrack 홈"
            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
          >
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              width={133}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </button>

          {/* 로고와 내비를 가르는 헤어라인 — 사이트 곳곳의 구분선과 같은 톤 */}
          <span
            aria-hidden="true"
            className="mx-4 hidden h-6 w-px bg-slate-200 sm:block"
          />

          {/* ── 내비 ── */}
          <nav className="hidden sm:flex items-center">
            <button
              onClick={() => !onDashboard && onNavigate("dashboard")}
              aria-current={onDashboard ? "page" : undefined}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${
                onDashboard
                  ? "bg-[#1a2b4c]/[0.06] text-[#1a2b4c] ring-1 ring-inset ring-[#1a2b4c]/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              대시보드
              {/* 사이드바가 활성 항목에 세로 라임 바를 두는 것과 같은 신호를
                  가로 내비에 맞춰 아래쪽으로 눕힌 것 */}
              {onDashboard && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[9px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#8ce600]"
                />
              )}
            </button>
          </nav>

          {/* ── 우측 계정 ── */}
          <div className="relative ml-auto" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="계정 메뉴"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              className={`flex items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40 ${
                dropdownOpen
                  ? "border-slate-200 bg-slate-50"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Avatar user={user} size="sm" />
              {user?.nickname && (
                <span className="hidden max-w-[110px] truncate text-sm font-semibold text-slate-700 sm:block">
                  {user.nickname}
                </span>
              )}
              <ChevronDown
                aria-hidden="true"
                className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* ── 드롭다운 ── */}
            {dropdownOpen && (
              <div
                role="menu"
                className="header-dropdown-menu absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user?.nickname ?? "사용자"}
                    </p>
                    {user?.email && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-1.5">
                  {/* 계정 화면으로 가는 길은 하나면 된다 — 예전에는 "계정 설정"과
                      "프로필 보기"가 같은 곳으로 갔다 */}
                  <button
                    role="menuitem"
                    onClick={() => {
                      onNavigate("account");
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-100"
                  >
                    <Settings
                      className="size-4 shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                    계정 설정
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:bg-red-50 focus-visible:text-red-600 [&:hover_svg]:text-red-500"
                  >
                    <LogOut
                      className="size-4 shrink-0 text-slate-400 transition-colors"
                      aria-hidden="true"
                    />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
