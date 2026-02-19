import { LayoutDashboard, Play, FileText, LogOut, User } from 'lucide-react';

export type Page = 'dashboard' | 'video' | 'report' | 'account';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  hasSelectedVideo?: boolean;
}

export function Header({ currentPage, onNavigate, onLogout, hasSelectedVideo }: HeaderProps) {
  const tabs = [
    { id: 'dashboard' as Page, label: '대시보드', icon: LayoutDashboard },
    { id: 'video' as Page, label: '영상 보기', icon: Play, disabled: !hasSelectedVideo },
    { id: 'report' as Page, label: '분석 리포트', icon: FileText, disabled: !hasSelectedVideo },
    { id: 'account' as Page, label: '계정 관리', icon: User },
  ];

  return (
    <header className="h-16 flex items-center px-6 bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="container mx-auto px-6">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2 text-blue-600 font-bold italic tracking-tight">
        <span className="logo_img flex items-center translate-y-6">
          <img
            src="/RallyTrack.svg"
            alt="RallyTrack"
            className="h-24 w-auto"
          />
        </span>

          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPage === tab.id;
              const isDisabled = tab.disabled;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onNavigate(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="size-4" />
            <span className="text-sm">로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
}