import { useMemo, useState } from "react";
import {
  User,
  Settings,
  Bell,
  Shield,
  Mail,
  Camera,
  ChevronRight,
  Trophy,
  Activity,
  Award,
  Lock,
  Smartphone,
  Globe,
  LogOut,
  Link2,
  Download,
  Trash2,
  Moon,
  Languages,
  Zap,
  Gauge,
  History,
} from "lucide-react";
import { Header } from "./Header";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AccountPageProps {
  onLogout: () => void;
  onNavigate: (page: "dashboard" | "video" | "report" | "account") => void;
  hasSelectedVideo: boolean;
}

type Section = "profile" | "notification" | "security" | "service";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full flex items-center justify-between p-4 rounded-xl shadow-sm border transition-colors",
        active
          ? "bg-white border-blue-100 text-blue-600 font-semibold"
          : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
      )}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-5" />
        <span>{label}</span>
      </div>
      <ChevronRight className="size-4" />
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="font-semibold text-gray-900">{label}</div>
        {desc && <div className="text-xs text-gray-500">{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cx(
          "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
          value ? "bg-blue-600" : "bg-gray-200"
        )}
        aria-pressed={value}
      >
        <div
          className={cx(
            "absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-200",
            value ? "translate-x-6" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          {Icon && <Icon className="size-5 text-blue-600" />}
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export function AccountPage({ onLogout, onNavigate, hasSelectedVideo }: AccountPageProps) {
  // ✅ 탭 상태 추가
  const [activeSection, setActiveSection] = useState<Section>("profile");

  // ✅ 알림(기존 + 확장)
  const [notifications, setNotifications] = useState({
    analysisDone: true,
    analysisFailed: true,
    weeklyReport: false,
    monthlyReport: false,
    recordUpdate: true,
    marketing: true,
    clubNews: true,
    email: true,
    webPush: false,
    quietHours: true,
  });

  // ✅ 보안/연동(목업)
  const [security, setSecurity] = useState({
    twoFactor: false,
    googleLinked: false,
    naverLinked: false,
  });

  // ✅ 서비스 이용 설정(목업)
  const [service, setService] = useState({
    autoAnalyze: true,
    analyzeMode: "fast" as "fast" | "accurate",
    analyzeScope: "highlights" as "all" | "highlights",
    reportDefault: "tactical" as "technical" | "tactical" | "movement",
    dataRetention: "90d" as "30d" | "90d" | "keep",
    researchConsent: false,
    darkMode: false,
    language: "ko" as "ko" | "en",
  });

  const stats = useMemo(
    () => [
      {
        label: "참여 경기",
        value: "42",
        icon: Activity,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "승률",
        value: "64%",
        icon: Trophy,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      },
      {
        label: "획득 뱃지",
        value: "12",
        icon: Award,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="account" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo={hasSelectedVideo} />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">계정 관리</h1>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <div className="space-y-2">
              <SectionButton
                active={activeSection === "profile"}
                icon={User}
                label="프로필 설정"
                onClick={() => setActiveSection("profile")}
              />
              <SectionButton
                active={activeSection === "notification"}
                icon={Bell}
                label="알림 설정"
                onClick={() => setActiveSection("notification")}
              />
              <SectionButton
                active={activeSection === "security"}
                icon={Shield}
                label="보안 및 비밀번호"
                onClick={() => setActiveSection("security")}
              />
              <SectionButton
                active={activeSection === "service"}
                icon={Settings}
                label="서비스 이용 설정"
                onClick={() => setActiveSection("service")}
              />
            </div>

            {/* Content Area */}
            <div className="md:col-span-2 space-y-6">
              {/* ===================== PROFILE ===================== */}
              {activeSection === "profile" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-start gap-6 mb-8">
                      <div className="relative group">
                        <div className="size-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                          <ImageWithFallback
                            src="https://images.unsplash.com/photo-1733141732172-3abba91f4db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBwb3J0cmFpdCUyMHByb2ZpbGV8ZW58MXx8fHwxNzY4MDI3MjEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                            alt="Profile"
                            className="size-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                          title="프로필 사진 변경"
                        >
                          <Camera className="size-4" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">이기용</h2>
                        <p className="text-gray-500 mb-4">minsu.kim@example.com</p>

                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            Elite Player
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            Club Member
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-50">
                      {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                          <div className={cx("size-10", stat.bg, stat.color, "rounded-xl flex items-center justify-center mx-auto mb-2")}>
                            <stat.icon className="size-5" />
                          </div>
                          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Form Fields */}
                    <div className="mt-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">이름</label>
                          <input
                            type="text"
                            defaultValue="이기용"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">소속 클럽</label>
                          <input
                            type="text"
                            defaultValue="한국공학대 배드민턴 클럽"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">이메일</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                          <input
                            type="email"
                            defaultValue="giyong.leesin@example.com"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">자기소개</label>
                        <textarea
                          rows={3}
                          defaultValue="백핸드 드라이브가 주특기인 7년차 배드민턴 동호인입니다."
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                      >
                        변경사항 저장
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== NOTIFICATION ===================== */}
              {activeSection === "notification" && (
                <>
                  <Card title="알림 채널" icon={Bell}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="이메일 알림 수신"
                        desc="분석 완료/리포트 등 주요 알림을 이메일로 받아요."
                        value={notifications.email}
                        onChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
                      />
                      <ToggleRow
                        label="웹 알림(Push) 수신"
                        desc="브라우저 알림을 통해 실시간으로 받아요."
                        value={notifications.webPush}
                        onChange={(v) => setNotifications((p) => ({ ...p, webPush: v }))}
                      />
                      <ToggleRow
                        label="야간 알림 제한 (22:00 ~ 08:00)"
                        desc="야간에는 알림을 보내지 않아요."
                        value={notifications.quietHours}
                        onChange={(v) => setNotifications((p) => ({ ...p, quietHours: v }))}
                      />
                    </div>
                  </Card>

                  <Card title="경기/분석 알림" icon={Activity}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="영상 분석 완료 알림"
                        desc="업로드한 영상의 AI 분석이 완료되면 알려드립니다."
                        value={notifications.analysisDone}
                        onChange={(v) => setNotifications((p) => ({ ...p, analysisDone: v }))}
                      />
                      <ToggleRow
                        label="분석 실패 / 재시도 필요 알림"
                        desc="분석이 실패했거나 재업로드가 필요한 경우 알려드립니다."
                        value={notifications.analysisFailed}
                        onChange={(v) => setNotifications((p) => ({ ...p, analysisFailed: v }))}
                      />
                      <ToggleRow
                        label="개인 기록 갱신 알림"
                        desc="승률/랠리 등 기록이 갱신되면 알려드립니다."
                        value={notifications.recordUpdate}
                        onChange={(v) => setNotifications((p) => ({ ...p, recordUpdate: v }))}
                      />
                    </div>
                  </Card>

                  <Card title="리포트 & 소식" icon={Bell}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="주간 리포트 알림"
                        desc="한 주간의 경기 성적 요약 리포트를 보내드립니다."
                        value={notifications.weeklyReport}
                        onChange={(v) => setNotifications((p) => ({ ...p, weeklyReport: v }))}
                      />
                      <ToggleRow
                        label="월간 성과 리포트 알림"
                        desc="한 달 성과를 요약한 리포트를 보내드립니다."
                        value={notifications.monthlyReport}
                        onChange={(v) => setNotifications((p) => ({ ...p, monthlyReport: v }))}
                      />
                      <ToggleRow
                        label="이벤트 및 공지사항"
                        desc="새로운 기능 업데이트 및 이벤트 소식을 전해드립니다."
                        value={notifications.marketing}
                        onChange={(v) => setNotifications((p) => ({ ...p, marketing: v }))}
                      />
                      <ToggleRow
                        label="클럽 소식"
                        desc="클럽 경기 등록/공지 등 소식을 알려드립니다."
                        value={notifications.clubNews}
                        onChange={(v) => setNotifications((p) => ({ ...p, clubNews: v }))}
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                      >
                        변경사항 저장
                      </button>
                    </div>
                  </Card>
                </>
              )}

              {/* ===================== SECURITY ===================== */}
              {activeSection === "security" && (
                <>
                  <Card title="비밀번호 관리" icon={Lock}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">현재 비밀번호</label>
                          <input
                            type="password"
                            placeholder="현재 비밀번호"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">새 비밀번호</label>
                          <input
                            type="password"
                            placeholder="새 비밀번호"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          <div className="text-xs text-gray-500">Password strength: (UI만) 보통</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">최근 변경일: 2026-01-01</div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                          <Lock className="size-4" />
                          비밀번호 변경
                        </button>
                      </div>
                    </div>
                  </Card>

                  <Card title="소셜 로그인 연동 (OAuth)" icon={Link2}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Globe className="size-5 text-gray-600" />
                          <div>
                            <div className="font-semibold text-gray-900">Google</div>
                            <div className="text-xs text-gray-500">
                              {security.googleLinked ? "연결됨" : "미연결"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSecurity((p) => ({ ...p, googleLinked: !p.googleLinked }))}
                          className={cx(
                            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                            security.googleLinked ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          {security.googleLinked ? "연결 해제" : "연결하기"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Globe className="size-5 text-gray-600" />
                          <div>
                            <div className="font-semibold text-gray-900">Naver</div>
                            <div className="text-xs text-gray-500">
                              {security.naverLinked ? "연결됨" : "미연결"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSecurity((p) => ({ ...p, naverLinked: !p.naverLinked }))}
                          className={cx(
                            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                            security.naverLinked ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          {security.naverLinked ? "연결 해제" : "연결하기"}
                        </button>
                      </div>

                      <div className="text-xs text-gray-500">
                        * 실제 OAuth 연동은 백엔드 endpoint(/auth/google, /auth/naver) 연결 시 동작하도록 붙이면 됩니다.
                      </div>
                    </div>
                  </Card>

                  <Card title="로그인 보안" icon={Shield}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="2단계 인증(2FA)"
                        desc="새 기기 로그인 시 추가 인증을 요구합니다."
                        value={security.twoFactor}
                        onChange={(v) => setSecurity((p) => ({ ...p, twoFactor: v }))}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <History className="size-5 text-gray-700" />
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">최근 로그인 기록</div>
                            <div className="text-xs text-gray-500">기기/위치/시간 확인</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <Smartphone className="size-5 text-gray-700" />
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">기기/세션 관리</div>
                            <div className="text-xs text-gray-500">다른 기기 로그아웃</div>
                          </div>
                        </button>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                          title="모든 기기에서 로그아웃"
                        >
                          <LogOut className="size-4" />
                          모든 기기 로그아웃
                        </button>
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {/* ===================== SERVICE ===================== */}
              {activeSection === "service" && (
                <>
                  <Card title="영상 분석 기본 설정" icon={Zap}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="업로드 후 자동 분석 시작"
                        desc="영상 업로드가 끝나면 자동으로 분석을 시작합니다."
                        value={service.autoAnalyze}
                        onChange={(v) => setService((p) => ({ ...p, autoAnalyze: v }))}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">분석 모드 (Mode)</label>
                          <div className="relative">
                            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <select
                              value={service.analyzeMode}
                              onChange={(e) =>
                                setService((p) => ({ ...p, analyzeMode: e.target.value as any }))
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            >
                              <option value="fast">빠른 분석 (Fast)</option>
                              <option value="accurate">고정밀 분석 (Accurate)</option>
                            </select>
                          </div>
                          <div className="text-xs text-gray-500">
                            Fast는 속도 우선, Accurate는 정밀도 우선입니다.
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">분석 구간 (Scope)</label>
                          <select
                            value={service.analyzeScope}
                            onChange={(e) => setService((p) => ({ ...p, analyzeScope: e.target.value as any }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                          >
                            <option value="highlights">하이라이트만</option>
                            <option value="all">전체 분석</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="리포트 표시 옵션" icon={Trophy}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">기본 리포트 유형</label>
                        <select
                          value={service.reportDefault}
                          onChange={(e) => setService((p) => ({ ...p, reportDefault: e.target.value as any }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="technical">기술 분석 (Technical)</option>
                          <option value="tactical">전술 분석 (Tactical)</option>
                          <option value="movement">움직임/체력 (Movement)</option>
                        </select>
                      </div>
                    </div>
                  </Card>

                  <Card title="데이터 & 개인정보" icon={Shield}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <Download className="size-5 text-gray-700" />
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">내 데이터 다운로드</div>
                            <div className="text-xs text-gray-500">리포트/기록 내보내기</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <Trash2 className="size-5 text-gray-700" />
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">내 영상/데이터 삭제</div>
                            <div className="text-xs text-gray-500">선택 삭제 또는 전체 삭제</div>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">영상 자동 삭제 주기</label>
                        <select
                          value={service.dataRetention}
                          onChange={(e) => setService((p) => ({ ...p, dataRetention: e.target.value as any }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="30d">30일 후 삭제</option>
                          <option value="90d">90일 후 삭제</option>
                          <option value="keep">보관</option>
                        </select>
                        <div className="text-xs text-gray-500">
                          저장 공간 정책에 따라 상용 환경에서 제한이 있을 수 있어요.
                        </div>
                      </div>

                      <ToggleRow
                        label="분석 데이터 연구용 활용 동의"
                        desc="서비스 품질 향상을 위한 익명 통계에 활용될 수 있어요."
                        value={service.researchConsent}
                        onChange={(v) => setService((p) => ({ ...p, researchConsent: v }))}
                      />
                    </div>
                  </Card>

                  <Card title="UI & 접근성" icon={Settings}>
                    <div className="space-y-4">
                      <ToggleRow
                        label="다크 모드 (Dark Mode)"
                        desc="시스템 설정과 별개로 앱에서 다크 모드를 사용합니다."
                        value={service.darkMode}
                        onChange={(v) => setService((p) => ({ ...p, darkMode: v }))}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">언어 (Language)</label>
                          <div className="relative">
                            <Languages className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <select
                              value={service.language}
                              onChange={(e) => setService((p) => ({ ...p, language: e.target.value as any }))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            >
                              <option value="ko">한국어</option>
                              <option value="en">English</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <Moon className="size-5 text-gray-700" />
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">테마 설정</div>
                            <div className="text-xs text-gray-500">강조 색상/폰트</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                      >
                        변경사항 저장
                      </button>
                    </div>
                  </Card>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="size-4" />
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
