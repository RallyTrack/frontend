import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Crosshair,
  Activity,
  Maximize,
  Video,
  Database,
  Scan,
  TerminalSquare,
  Upload,
  Cpu,
  BarChart3,
} from "lucide-react";
import { OnboardingNav } from "../components/ui/onboardingNav";

interface OnboardingPageProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  isModalOpen?: boolean;
}

export function OnboardingPage({
  onGetStarted,
  onOpenLogin,
  onOpenSignup,
  isModalOpen,
}: OnboardingPageProps) {
  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-[#1a2b4c] selection:bg-[#8ce600] selection:text-[#1a2b4c] overflow-x-hidden relative">
      {/* Light Scanline Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.03)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] bg-[length:100%_4px,3px_100%] opacity-50" />

      {/* ── 온보딩 전용 네비게이션 (로고 애니메이션 포함) ── */}
      <OnboardingNav onOpenLogin={onOpenLogin} onOpenSignup={onOpenSignup} isModalOpen={isModalOpen} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-screen flex flex-col justify-center">
        {/* HUD Elements */}
        <div className="absolute top-24 left-6 w-8 h-8 border-t-2 border-l-2 border-slate-300" />
        <div className="absolute top-24 right-6 w-8 h-8 border-t-2 border-r-2 border-slate-300" />
        <div className="absolute bottom-12 left-6 w-8 h-8 border-b-2 border-l-2 border-slate-300" />
        <div className="absolute bottom-12 right-6 w-8 h-8 border-b-2 border-r-2 border-slate-300" />

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Text Content */}
          <div className="lg:col-span-5 z-10 relative">
            <div className="font-mono text-[#6bba00] font-bold text-sm mb-4 tracking-widest bg-[#f2fde0] inline-block px-2 py-1 border border-[#8ce600]/30">
              &gt; TARGET_ACQUIRED: BADMINTON_PLAYER
            </div>
            <h1 className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-[#1a2b4c] uppercase">
              랠리 트랙, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6bba00] to-[#8ce600]">
                RALLY TRACK
              </span>
            </h1>
            <p className="text-slate-500 text-lg mb-10 font-mono leading-relaxed max-w-md font-medium">
              코트 내의 선수, 셔틀콕 인식, 스트로크 분류, <br />
              당신의 모든 움직임이 데이터가 됩니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="group relative bg-white border-2 border-[#1a2b4c] text-[#1a2b4c] px-8 py-4 font-mono font-bold tracking-widest uppercase overflow-hidden shadow-[4px_4px_0_#1a2b4c] hover:shadow-[2px_2px_0_#1a2b4c] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="absolute inset-0 bg-[#1a2b4c] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
              <span className="relative z-10 group-hover:text-white flex items-center gap-3">
                <Scan size={20} />
                영상 분석 시작하기
              </span>
            </motion.button>
          </div>

          {/* Main Camera UI */}
          <div className="lg:col-span-7 relative h-[600px] w-full border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-8 bg-white/90 backdrop-blur border-b border-slate-200 flex justify-between items-center px-4 font-mono text-[10px] text-slate-500 z-20 font-bold">
              <span>CAM-01 [MAIN_COURT]</span>
              <span>FOV: 120° | 60FPS</span>
            </div>

            <img
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80"
              alt="Main Feed"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-700 filter contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-blue-50/10 mix-blend-multiply pointer-events-none" />

            <motion.div
              animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute top-[30%] left-[40%] w-32 h-48 border-2 border-[#8ce600] bg-[#8ce600]/10 z-20 shadow-[0_0_15px_rgba(140,230,0,0.5)]"
            >
              <div className="absolute -top-6 left-[-2px] bg-[#8ce600] text-[#1a2b4c] font-mono text-[10px] px-1.5 py-0.5 font-bold tracking-wider">
                ID:P1 [98%]
              </div>
              <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8ce600]" />
            </motion.div>

            <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-600 z-20 space-y-1 bg-white/90 p-3 border border-slate-200 shadow-lg backdrop-blur-sm font-bold">
              <div>&gt; VELOCITY : <span className="text-[#1a2b4c]">312.4 KM/H</span></div>
              <div>&gt; STROKE_TYPE : <span className="text-[#1a2b4c]">CALCULATING...</span></div>
              <div>&gt; COURT_POS : <span className="text-[#1a2b4c]">X:42 Y:88</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200 relative">
        <div className="flex items-center gap-4 mb-16">
          <Activity className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            RALLY TRACK 사용 방법
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Upload, num: "01", title: "경기 영상 업로드", desc: "스마트폰이나 카메라로 촬영한 배드민턴 경기 영상을 시스템에 바로 업로드합니다." },
            { icon: Cpu, num: "02", title: "엔진 비전 분석", desc: "랠리 트랙 코어 엔진이 선수와 셔틀콕의 움직임을 프레임 단위로 정밀하게 스캔합니다." },
            { icon: BarChart3, num: "03", title: "분석 리포트 확인", desc: "자동 생성된 하이라이트 영상과 히트맵, 산점도 등 심층 데이터 리포트를 확인하세요." },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="group bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <Icon className="text-blue-600" size={24} />
                </div>
                <div className="text-xs font-bold text-blue-500 tracking-widest mb-2">STEP {step.num}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Multi-Camera Feeds Section */}
      <section id="feeds" className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200">
        <div className="flex items-center gap-4 mb-10">
          <Database className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            다각도 분석 화면
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="relative aspect-video border border-slate-200 bg-slate-900 overflow-hidden group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-02: HEATMAP
            </div>
            {/* 코트 배경 그리드 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
            {/* 히트맵 레이어 — 순수 CSS radial-gradient 조합 */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_62%_52%,rgba(255,30,0,0.72)_0%,rgba(255,80,0,0.45)_30%,transparent_65%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_28%_at_38%_40%,rgba(255,140,0,0.55)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_20%_18%_at_75%_70%,rgba(255,200,0,0.45)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_16%_14%_at_30%_65%,rgba(0,180,255,0.35)_0%,transparent_60%)]" />
            </div>
            {/* 히트맵 스케일 범례 */}
            <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 z-10">
              <div className="w-3 h-16 rounded-full bg-gradient-to-b from-red-500 via-yellow-400 to-blue-400 opacity-80" />
              <span className="text-[8px] text-white/60 font-mono">HIGH</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Maximize className="text-white drop-shadow-md w-10 h-10" />
            </div>
          </div>

          <div className="relative aspect-video border border-slate-200 bg-white overflow-hidden flex items-center justify-center group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-03: 3D_TRACKING
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <img
              src="/RallyTrack_Mascot.svg"
              alt="Mascot"
              className="h-3/4 w-auto relative z-10 drop-shadow-xl animate-[pulse_4s_ease-in-out_infinite]"
            />
          </div>

          <div className="relative aspect-video border border-slate-200 bg-[#0d1f0d] overflow-hidden group shadow-sm">
            <div className="absolute top-2 left-2 z-10 bg-white/90 text-[#1a2b4c] font-mono font-bold text-[10px] px-2 py-0.5 border border-slate-200 shadow-sm">
              CAM-04: SHUTTLE_POS
            </div>
            {/* 배드민턴 코트 SVG */}
            <svg
              viewBox="0 0 200 120"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* 코트 바닥 */}
              <rect x="0" y="0" width="200" height="120" fill="#1a3a1a" />
              {/* 코트 외곽선 */}
              <rect x="20" y="10" width="160" height="100" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
              {/* 네트 (가운데 가로선) */}
              <line x1="20" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
              {/* 서비스 라인 (위쪽) */}
              <line x1="20" y1="30" x2="180" y2="30" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              {/* 서비스 라인 (아래쪽) */}
              <line x1="20" y1="90" x2="180" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              {/* 센터 세로선 (위 절반) */}
              <line x1="100" y1="10" x2="100" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              {/* 센터 세로선 (아래 절반) */}
              <line x1="100" y1="60" x2="100" y2="110" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              {/* 셔틀콕 위치 점들 */}
              <circle cx="68" cy="38" r="3.5" fill="#3b82f6" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.1s" repeatCount="indefinite" />
              </circle>
              <circle cx="138" cy="78" r="3.5" fill="#3b82f6" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.7s" repeatCount="indefinite" />
              </circle>
              <circle cx="105" cy="52" r="3" fill="#ef4444" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.4s" repeatCount="indefinite" />
              </circle>
              {/* glow 효과 */}
              <circle cx="68" cy="38" r="7" fill="#3b82f6" opacity="0.15" />
              <circle cx="138" cy="78" r="7" fill="#3b82f6" opacity="0.15" />
              <circle cx="105" cy="52" r="6" fill="#ef4444" opacity="0.15" />
            </svg>
            <div className="absolute bottom-2 right-2 text-white bg-[#1a2b4c] px-2 py-0.5 font-mono text-[10px] font-bold shadow-sm z-10">
              P_COUNT: 03
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <TerminalSquare className="text-blue-500 w-5 h-5" />
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-widest">Core Features</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "🎯", title: "자세 및 타구 분석", desc: "프레임 단위로 선수의 관절 위치와 자세를 인식하여 스트로크 종류를 분석." },
              { emoji: "✨", title: "하이라이트 생성", desc: "주요 득점/실점 시퀀스 자동 감지 및 타임라인 클립 추출." },
              { emoji: "🗺️", title: "코트 분석", desc: "코트 점유율 히트맵 및 스매시 타격 지점 산점도 매핑." },
              { emoji: "🤖", title: "AI 코칭", desc: "수집된 빅데이터 기반 약점 분석 및 맞춤형 전술 피드백 생성." },
            ].map((feature, i) => (
              <div key={i} className="group p-5 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <div className="text-2xl mb-3">{feature.emoji}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed group-hover:text-slate-600 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center font-mono text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 mb-4 md:mb-0 text-slate-500">
            <Activity size={14} className="text-[#6bba00]" />
            <span>RALLYTRACK_SYSTEM v2.0.26</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#1a2b4c] transition-colors">ENCRYPTION_POLICY</a>
            <a href="#" className="hover:text-[#1a2b4c] transition-colors">USER_TERMS</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}