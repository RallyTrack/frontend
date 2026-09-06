import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  Crosshair,
  Activity,
  Database,
  Scan,
  TerminalSquare,
  Upload,
  Cpu,
  BarChart3,
  Zap,
  Flame,
  Target,
  Bot,
} from "lucide-react";
import { OnboardingNav } from "../components/ui/onboardingNav";

/**
 * 분석 결과 미리보기 한 칸.
 *
 * 실제 화면을 캡처한 이미지를 싣는다. 예전에는 CSS 그라디언트와 손으로 그린
 * SVG로 히트맵·스켈레톤·미니맵을 흉내 냈는데, 코트 방향(실제로는 세로가 2.2배
 * 길다)도 색도 실제와 달라서 제품을 잘못 알리고 있었다.
 *
 * 파일이 아직 없으면 무엇을 넣어야 하는지 적힌 빈 자리를 보여준다.
 * 깨진 이미지 아이콘이 뜨는 것보다 낫다.
 */
function PreviewShot({
  title,
  desc,
  src,
  width,
  height,
}: {
  title: string;
  desc: string;
  src: string;
  /** 캡처 원본 크기. 칸을 이 비율로 잘라 여백이 남지 않게 한다. */
  width: number;
  height: number;
}) {
  const [missing, setMissing] = useState(false);

  return (
    // 세 화면은 비율이 제각각이다. 히트맵과 미니맵은 코트를 통째로 담아 세로로
    // 길고(코트 자체가 세로 2.2배), 3D 뷰만 가로다. 칸을 일괄 16:9로 두고
    // contain으로 넣었더니 세로 둘만 좌우가 휑하게 남았다. 높이만 맞추고
    // 폭은 각자 비율대로 가져가면 레터박스가 사라진다.
    <figure
      className="m-0 flex min-w-0 flex-col"
      style={{ flexBasis: `calc(var(--shot-h) * ${width / height})` }}
    >
      <div
        className="relative h-[var(--shot-h)] overflow-hidden border border-slate-200 bg-slate-900 shadow-sm"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {missing ? (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <p className="font-mono text-[11px] leading-relaxed text-white/40">
              {src}
              <br />
              캡처 이미지를 넣어주세요
            </p>
          </div>
        ) : (
          <img
            src={src}
            alt={`${title} 화면`}
            width={width}
            height={height}
            onError={() => setMissing(true)}
            loading="lazy"
            // 칸과 이미지의 비율이 같으므로 cover여도 잘려 나가는 곳이 없다
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {/* 라벨을 이미지 위에서 걷어내 캡션으로 내렸다. 사진 위에 태그를 얹는
          것은 흔한 겉멋이고, 좁은 칸에서는 화면 일부를 가리기까지 한다.
          라임 좌측 바는 아래 "주요 기능" 항목과 같은 문법이다. */}
      <figcaption className="mt-4 border-l-2 border-[#8ce600] pl-3.5">
        <p className="text-sm font-bold text-[#1a2b4c]">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          {desc}
        </p>
      </figcaption>
    </figure>
  );
}

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
  // 이 화면은 끊임없이 도는 애니메이션이 여럿이라, 모션을 줄여달라는
  // 설정을 지키지 않으면 어지럼증을 유발할 수 있다.
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-[#1a2b4c] selection:bg-[#8ce600] selection:text-[#1a2b4c] overflow-x-hidden relative">
      {/* Light Scanline Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.03)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] bg-[length:100%_4px,3px_100%] opacity-50" />

      {/* ── 온보딩 전용 네비게이션 (로고 애니메이션 포함) ── */}
      <OnboardingNav onOpenLogin={onOpenLogin} onOpenSignup={onOpenSignup} isModalOpen={isModalOpen} />

      {/* Hero Section */}
      {/* 네 모서리에 두던 HUD 브래킷은 걷어냈다. 아무것도 감싸지 않으면서
          연한 회색이라 보이지도 않는 장식이었다. 이 화면의 컨셉은 스캔라인,
          eyebrow, 영상 위 데이터 패널이 이미 충분히 지고 있다.
          100dvh는 모바일 주소창이 접힐 때 높이가 튀지 않게 한다. */}
      <section className="relative pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-[100dvh] flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Text Content */}
          <div className="lg:col-span-5 z-10 relative">
            {/* 라임(#8ce600)은 흰 배경에서 대비가 2:1대로 떨어진다. 작은 글씨는
                더 진한 톤을 써야 읽힌다. */}
            <div className="font-mono text-[#3d7000] font-bold text-sm mb-4 tracking-widest bg-[#f2fde0] inline-block px-2 py-1 border border-[#8ce600]/30">
              &gt; TARGET_ACQUIRED: BADMINTON_PLAYER
            </div>
            {/* uppercase는 한글에 걸리지 않고 영문은 이미 대문자다.
                그라디언트도 걷어냈다. 화면에서는 거의 단색으로 보이면서
                대비만 깎아먹었다. */}
            <h1 className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-[#1a2b4c]">
              랠리 트랙, <br />
              <span className="text-[#4f9100]">RALLY TRACK</span>
            </h1>
            {/* 한글은 mono에서 자간이 벌어져 읽기 나쁘다. br로 줄을 고정하면
                폭이 바뀔 때 어색하게 끊긴다.
                break-keep은 한국어 단어를 통째로 넘긴다. 없으면 "분류합니 / 다"
                처럼 낱말 한가운데가 잘린다. */}
            <p className="mb-10 max-w-md break-keep text-lg leading-relaxed text-slate-500">
              코트 위 선수와 셔틀콕을 인식하고 스트로크를 분류합니다. 당신의
              모든 움직임이 데이터가 됩니다.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="group relative bg-white border-2 border-[#1a2b4c] text-[#1a2b4c] px-8 py-4 font-mono font-bold tracking-widest uppercase overflow-hidden shadow-[4px_4px_0_#1a2b4c] hover:shadow-[2px_2px_0_#1a2b4c] hover:translate-x-[2px] hover:translate-y-[2px] transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40 focus-visible:ring-offset-2"
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
              {/* 카메라 스펙(FOV·FPS)은 우리가 알 수 없는 값이라 뺐다.
                  대신 실제로 추적하는 대상을 적는다. */}
              <span>SOURCE [UPLOADED_MATCH]</span>
              <span>TRACKING: PLAYER + SHUTTLE</span>
            </div>

            <img
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80"
              alt=""
              width={900}
              height={600}
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-700 filter contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-blue-50/10 mix-blend-multiply pointer-events-none" />

            {/* 박스는 사진 속 선수를 감싸야 한다. 예전 좌표(left-40% w-32)는
                선수 왼쪽 빈 코트를 잡고 있었고, ±20px씩 떠다녀 더 어긋났다.
                추적을 내세운 화면에서 박스가 헛것을 잡으면 역효과다.
                진폭도 줄여 "붙어서 따라가는" 미세한 떨림으로 바꿨다. */}
            <motion.div
              animate={
                reduceMotion ? undefined : { x: [0, 5, -4, 0], y: [0, -4, 3, 0] }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[16%] left-[50%] h-[54%] w-[25%] border-2 border-[#8ce600] bg-[#8ce600]/10 z-20 shadow-[0_0_15px_rgba(140,230,0,0.5)]"
            >
              {/* 신뢰도 98%는 근거 없는 수치라 뺐다 */}
              <div className="absolute -top-6 left-[-2px] bg-[#8ce600] text-[#1a2b4c] font-mono text-[10px] px-1.5 py-0.5 font-bold tracking-wider">
                ID : P1
              </div>
              <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8ce600]" />
            </motion.div>

            {/* 실제 리포트가 뽑는 값만 적는다. 예전에는 속도(312.4 KM/H)를
                내걸었는데 측정하지도, 보여주지도 않는 지표였다. */}
            <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-600 z-20 space-y-1 bg-white/90 p-3 border border-slate-200 shadow-lg backdrop-blur-sm font-bold">
              <div>&gt; PLAYER : <span className="text-[#1a2b4c]">BOTTOM</span></div>
              {/* 사진은 점프해서 머리 위로 내려치는 자세다. 드라이브는 허리
                  높이로 뻗는 샷이라 화면과 맞지 않았다. */}
              <div>&gt; STROKE_TYPE : <span className="text-[#1a2b4c]">SMASH</span></div>
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

        {/* 카드를 걷어내고 세로 구분선만 남긴 흐름. 예전에는 똑같이 생긴
            둥근 카드 셋이 나란히 있었고, 파란 아이콘 상자와 "STEP 01" 라벨이
            페이지의 네이비·라임 팔레트와 따로 놀았다. */}
        <ol className="grid md:grid-cols-3 border-y border-slate-200 md:divide-x divide-slate-200">
          {[
            { icon: Upload, num: "01", title: "경기 영상 업로드", desc: "스마트폰으로 찍은 경기 영상을 그대로 올립니다. 별도 장비는 필요 없습니다." },
            { icon: Cpu, num: "02", title: "엔진 비전 분석", desc: "선수와 셔틀콕의 움직임을 프레임 단위로 훑어 타격 시점과 종류를 잡아냅니다." },
            { icon: BarChart3, num: "03", title: "분석 리포트 확인", desc: "히트맵, 스트로크 분포, 능력치 등급, AI 코칭까지 한 화면에서 봅니다." },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.num}
                className="group relative px-6 py-10 border-b border-slate-200 last:border-b-0 md:border-b-0"
              >
                <div className="flex items-baseline gap-3">
                  {/* 번호는 라벨이 아니라 눈금이다. 크고 옅게 깔아둔다. */}
                  <span className="font-mono text-5xl font-black leading-none text-slate-200 transition-colors group-hover:text-[#8ce600]/40">
                    {step.num}
                  </span>
                  <Icon className="size-5 shrink-0 text-[#6bba00]" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#1a2b4c]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Multi-Camera Feeds Section */}
      <section id="feeds" className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200">
        {/* 예전에는 "다각도 분석 화면"이라며 CAM-02·03·04를 늘어놓았는데,
            카메라는 하나고 영상도 한 편만 올린다. 실제로 리포트가 만들어내는
            세 가지 화면으로 바꿨다. */}
        <div className="flex items-center gap-4 mb-10">
          <Database className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            분석 결과 미리보기
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        {/* 격자 대신 가로 배치. 칸마다 폭이 다르므로 grid의 균등 열은 맞지 않다.
            --shot-h 하나로 세 칸의 높이를 함께 조절한다. */}
        <div className="flex flex-wrap items-start justify-center gap-6 [--shot-h:260px] sm:[--shot-h:380px] lg:[--shot-h:520px]">
          {/* 가로로 넓은 3D 뷰를 앞에 세우고 세로로 긴 둘을 뒤에 붙인다.
              예전에는 세로 둘이 양 끝으로 갈라져 가운데만 커 보였다.
              분석이 흘러가는 순서(자세 추적 다음에 위치 집계)와도 맞다. */}
          <PreviewShot
            title="3D 재구성"
            desc="두 선수의 자세와 셔틀콕 궤적을 입체로 되살립니다"
            src="/preview-skeleton.png"
            width={473}
            height={387}
          />
          <PreviewShot
            title="코트 점유율"
            desc="어디서 많이 쳤는지 밀집도로 보여줍니다"
            src="/preview-heatmap.png"
            width={302}
            height={603}
          />
          <PreviewShot
            title="코트 미니맵"
            desc="위치와 이동 경로를 위에서 봅니다"
            src="/preview-minimap.png"
            width={221}
            height={395}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 max-w-[1400px] mx-auto border-t border-slate-200">
        <div className="flex items-center gap-4 mb-12">
          <TerminalSquare className="text-[#1a2b4c]" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-[#1a2b4c]">
            주요 기능
          </h2>
          <div className="h-[1px] flex-1 bg-slate-200 ml-4" />
        </div>

        {/* 이모지(🎯✨🗺️🤖)를 앱이 쓰는 lucide 아이콘으로 바꿨다. 같은 기능을
            앱 안에서도 같은 아이콘이 가리키므로 로그인 전후가 이어진다.
            윗 섹션이 3열 흐름이라 여기는 2열로 두어 리듬을 바꾼다. */}
        <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
          {[
            { icon: Zap, title: "자세 및 타구 분석", desc: "관절 위치와 자세를 프레임 단위로 읽어 스트로크 종류를 가려냅니다." },
            { icon: Flame, title: "하이라이트 추출", desc: "주요 장면을 자동으로 잡아 타임라인 클립으로 뽑아냅니다." },
            { icon: Target, title: "코트 분석", desc: "코트 점유율을 히트맵으로, 타격 지점을 좌표로 남깁니다." },
            { icon: Bot, title: "AI 코칭", desc: "분석 결과를 근거로 강점과 보완점, 추천 훈련을 정리해 줍니다." },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex gap-4 border-l-2 border-[#8ce600] pl-5"
              >
                <Icon
                  className="mt-0.5 size-5 shrink-0 text-[#1a2b4c]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1a2b4c]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-slate-500">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      {/* ENCRYPTION_POLICY·USER_TERMS 링크는 걷어냈다 — 둘 다 href="#"이라
          아무 데도 가지 않고 페이지만 맨 위로 튕겼다. 버전 표기(v2.0.26)도
          실제 릴리스와 무관한 숫자였다. */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-20">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 font-mono text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity size={14} className="text-[#6bba00]" aria-hidden="true" />
            <span>RALLYTRACK_SYSTEM</span>
          </div>
          <span>©&nbsp;2026 RALLYTRACK</span>
        </div>
      </footer>
    </div>
  );
}
