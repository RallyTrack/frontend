import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Play,
  Video,
  BarChart3,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {useNavigate} from "react-router-dom";


interface OnboardingPageProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export function OnboardingPage({ onGetStarted, onOpenLogin, onOpenSignup }: OnboardingPageProps) {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };


  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a2b4c] overflow-x-hidden">
      {/* ✅ Navigation: 1번 파일처럼 로고 SVG로 교체 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="logo_img flex items-center translate-y-6">
            <img
              src="/RallyTrack.svg"
              alt="RallyTrack"
              className="h-24 w-auto"
            />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-bold text-slate-500 hover:text-[#1a2b4c] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-bold text-slate-500 hover:text-[#1a2b4c] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-bold text-slate-500 hover:text-[#1a2b4c] transition-colors"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenLogin}
              className="text-sm font-bold text-[#1a2b4c] px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
             로그인
            </button>
            <button
              onClick={onOpenSignup}
              className="bg-[#1a2b4c] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-blue-900/10 hover:bg-[#0b1120] transition-all hover:scale-105 whitespace-nowrap"
            >
              시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* Mascot Section */}
      <section className="relative pt-40 pb-20 bg-[#f8f9fa] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative z-10"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl font-black leading-[1.1] mb-6 text-[#1a2b4c]"
            >
              랠리트랙으로 <br />
              배드민턴 실력을 <br />
              <span className="text-[#8ce600] inline-block">레벨업</span>하세요!
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="mb-10 text-lg md:text-xl text-slate-500 max-w-lg"
            >
              <p>내 스매시 속도는 어느 정도?</p>
              <p>AI가 실시간으로 분석해드립니다!</p>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="bg-[#8ce600] text-[#1a2b4c] px-7 py-4 rounded-2xl text-lg font-bold shadow-[0_10px_30px_rgba(140,230,0,0.35)] flex items-center gap-3 group whitespace-nowrap"
            >
              무료로 분석 시작하기
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-[560px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-green-100/40 blur-3xl rounded-full" />

              <img
                src="/RallyTrack_Mascot.svg"
                alt="Badminton Visualization"
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              />

              {/* Float Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-0 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50 z-20"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Sparkles className="text-yellow-600 size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SMASH SPEED
                  </p>
                  <p className="text-lg font-black">214 km/h</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 3,
                  delay: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-20 left-0 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50 z-20"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-600 size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SITE ACTIVITY
                  </p>
                  <p className="text-lg font-black">+15%</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section id="features" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-black mb-4">RallyTrack 소개</h2>
          <p className="text-slate-500 text-lg">
            당신의 플레이를 분석하는 핵심 기술
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -8 }}
            className="bg-[#f8fafc] p-10 rounded-[32px] border border-slate-100 shadow-sm"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
              <Target className="text-blue-600 size-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">셔틀콕 추적 및 맵 시각화</h3>
            <p className="text-slate-500 leading-relaxed text-lg">
              AI 비전 기술로 셔틀콕의 움직임을 정밀하게 분석하고, 경기 흐름을
              맵 형태로 시각화합니다.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="bg-[#f8fafc] p-10 rounded-[32px] border border-slate-100 shadow-sm"
          >
            <div className="w-16 h-16 bg-[#f7fcc2] rounded-2xl flex items-center justify-center mb-8">
              <Play className="text-[#8AB800] size-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4">자동 하이라이트 생성</h3>
            <p className="text-slate-500 leading-relaxed text-lg">
              핵심 이벤트를 자동으로 타임라인화하여, 클릭 한 번으로 원하는 장면을
              즉시 확인합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl font-black mb-4">RallyTrack 사용 방법</h2>
          <p className="text-slate-500 text-lg">
            복잡한 과정 없이 단계별로 끝나는 분석
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="relative mb-24">
            <div className="absolute left-[50%] top-8 bottom-8 w-1 bg-slate-100 hidden md:block -translate-x-1/2" />

            <div className="space-y-20">
              <StepItem
                num={1}
                title="영상 넣기"
                desc="분석하고 싶은 배드민턴 경기 영상을 업로드하세요."
                icon={<Video className="text-blue-600" />}
                color="bg-blue-50"
                align="right"
              />
              <StepItem
                num={2}
                title="분석 후 영상 확인하기"
                desc="AI가 셔틀콕과 선수를 감지하여 분석된 오버레이 영상을 제공합니다."
                icon={<Sparkles className="text-indigo-600" />}
                color="bg-indigo-50"
                align="left"
              />
              <StepItem
                num={3}
                title="리포트 & 하이라이트 확인"
                desc="스매시 속도, 활동량, 승률 등 종합 데이터를 확인하세요."
                icon={<BarChart3 className="text-purple-600" />}
                color="bg-purple-50"
                align="right"
              />
            </div>
          </div>

          {/* Step 4 */}
          <div className="mt-24">
            <div className="flex justify-center mb-6">
              <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-sm font-bold text-slate-500 shadow-sm">
                Step 4
              </span>
            </div>
            <h3 className="text-3xl font-black text-center mb-10">
              심층 데이터 시각화
            </h3>

            <div className="bg-[#f8fafc] rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-inner grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-red-600 size-6" />
                  </div>
                  <h4 className="text-xl font-bold">히트맵 (Heatmap)</h4>
                </div>
                <div className="aspect-video bg-gradient-to-br from-red-50 to-white rounded-2xl mb-6 relative overflow-hidden border border-slate-100 flex items-center justify-center">
                  <div className="w-32 h-32 bg-red-400/20 rounded-full blur-3xl animate-pulse" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  코트 내 주요 활동 영역을 히트맵으로 시각화합니다.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Target className="text-blue-600 size-6" />
                  </div>
                  <h4 className="text-xl font-bold">위치 산점도 (Scatter)</h4>
                </div>

                {/* ✅ 여기 버그 수정: [.Array(15)] -> Array.from */}
                <div className="aspect-video bg-slate-50 rounded-2xl mb-6 relative p-4 border border-slate-100">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      style={{
                        position: "absolute",
                        left: `${((i * 7) % 80) + 10}%`,
                        top: `${((i * 13) % 80) + 10}%`,
                      }}
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-500 leading-relaxed">
                  득점/실점 지점을 점으로 표시해 패턴을 분석합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mt-16">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-[#f2fde0] border-2 border-[#8ce600]/20 p-8 md:p-12 rounded-[40px] shadow-2xl shadow-green-900/5 flex flex-col md:flex-row items-center gap-10"
            >
              <div className="shrink-0">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <Sparkles className="text-[#1a2b4c] size-10" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black mb-4">5. AI 코칭</h3>
                <p className="text-lg text-[#1a2b4c]/80 leading-relaxed">
                  AI 코치가 장단점을 분석하여 즉시 적용 가능한 훈련법을 제안합니다.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="pricing"
        className="bg-white border-t border-slate-100 pt-16 pb-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
            <div>
              <div className="text-2xl font-black mb-2">RallyTrack</div>
              <p className="text-slate-500 text-sm">
                AI-Powered Badminton Analytics Platform
              </p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-sm text-slate-500 hover:text-[#1a2b4c]">
                Privacy
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-[#1a2b4c]">
                Terms
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-[#1a2b4c]">
                Contact
              </a>
            </div>
          </div>
          <div className="text-center md:text-left text-slate-400 text-xs">
            © 2026 RallyTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepItem({
  num,
  title,
  desc,
  icon,
  color,
  align,
}: {
  num: number;
  title: string;
  desc: string;
  icon: ReactNode;
  color: string;
  align: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div
      className={`relative flex items-center justify-between ${
        isRight ? "md:flex-row" : "md:flex-row-reverse"
      } flex-col gap-8`}
    >
      <div
        className={`flex-1 ${
          isRight ? "md:text-left" : "md:text-right"
        } text-center w-full z-10`}
      >
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-[#f8fafc] rounded-full shadow-lg z-20 p-2">
          <div
            className={`${color} w-full h-full rounded-full flex items-center justify-center text-xl font-bold`}
          >
            {icon}
          </div>
        </div>

        <div className="inline-block w-full max-w-[440px] p-2">
          <h4 className="text-2xl font-black mb-2">
            {num}. {title}
          </h4>
          <p className="text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="flex-1 hidden md:block" />
    </div>
  );
}
