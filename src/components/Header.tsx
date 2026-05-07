import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";

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

export function Header({
  currentPage,
  onNavigate,
  onLogout,
  hasSelectedVideo,
  user,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  void hasSelectedVideo;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.nickname ? user.nickname.slice(0, 2).toUpperCase() : "?";

  return (
    <>
      <style>{`
        @keyframes headerDropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .header-dropdown-menu { animation: headerDropIn 0.18s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-100 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
        <div className="relative h-full px-8 flex items-center justify-between">

          {/* ── 로고 ── */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 focus:outline-none shrink-0"
            aria-label="홈으로"
          >
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              className="h-12 w-auto object-contain"
            />
          </button>

          {/* ── 중앙 네비 ── */}
          <nav className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => onNavigate("dashboard")}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                ${currentPage === "dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }
              `}
            >
              <LayoutDashboard className="size-4" />
              대시보드
            </button>
          </nav>

          {/* ── 우측 프로필 ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              {/* 아바타 */}
              <div className="relative shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.nickname ?? "프로필"}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
                  >
                    {initials}
                  </div>
                )}
                {/* 온라인 인디케이터 */}
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-1.5 ring-white" />
              </div>

              {/* 닉네임 */}
              {user?.nickname && (
                <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[90px] truncate">
                  {user.nickname}
                </span>
              )}

              <ChevronDown
                className={`size-4 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* ── 드롭다운 ── */}
            {dropdownOpen && (
              <div className="header-dropdown-menu absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden">
                {/* 유저 정보 */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {user?.nickname ?? "사용자"}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {user?.email ?? ""}
                    </p>
                  </div>
                </div>

                {/* 메뉴 항목 */}
                <div className="py-1.5">
                  <button
                    onClick={() => { onNavigate("account"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Settings className="size-3.5 text-slate-500" />
                    </div>
                    계정 설정
                  </button>

                  <button
                    onClick={() => { onNavigate("account"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="size-3.5 text-slate-500" />
                    </div>
                    프로필 보기
                  </button>
                </div>

                {/* 로그아웃 */}
                <div className="border-t border-slate-50 py-1.5">
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left font-semibold"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <LogOut className="size-3.5 text-red-400" />
                    </div>
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