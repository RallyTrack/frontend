import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Bot,
  ChevronDown,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Play,
  Target,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import ReactMarkdown from "react-markdown";

import { Header, type Page } from "./Header";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ReportResponse,
  PlayerKey,
  HeatmapPoint,
} from "../types/reportpageType";
import { Footer } from "./ui/footer";
import { fetchReport } from "../api/reportpageApi";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "models/gemini-2.5-flash"];

// ─────────────────────────────────────────────────────────────────────────────
// Types / Props
// ─────────────────────────────────────────────────────────────────────────────

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface AnalysisReportPageProps {
  videoId: string;
  onBack?: () => void;
  onJumpToVideo: (time: number) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserInfo;
}

type UiHeatmapZone = {
  x: number;
  y: number;
  intensity: number;
  time?: number;
};

type ExpandedPanel = "heatmap" | "stroke" | "ability" | "briefing" | null;

// 사이드바 섹션 ID
type SidebarSectionId =
  | "summary"
  | "heatmap"
  | "stroke"
  | "ability"
  | "briefing";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (children) {
    return (
      <div
        className={`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="p-6">
        <div className="space-y-3">
          <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  );
}

function SkeletonSummary() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="flex items-center justify-center gap-6 mb-6 py-4 rounded-xl bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-gray-50 border border-gray-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-2 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonHeatmap() {
  return (
    <SkeletonCard>
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="p-6">
        <div className="flex gap-6">
          <div className="w-44 h-96 bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-4">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-24 mb-1" />
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

function SkeletonChart({ tall = false }: { tall?: boolean }) {
  return (
    <SkeletonCard>
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="p-6">
        <div
          className={`bg-gray-100 rounded-xl animate-pulse ${tall ? "h-64" : "h-48"}`}
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player Toggle
// ─────────────────────────────────────────────────────────────────────────────

const PLAYERS: { key: PlayerKey; label: string }[] = [
  { key: "bottom", label: "Bottom Player" },
  { key: "top", label: "Top Player" },
];

function PlayerToggle({
  active,
  onChange,
}: {
  active: PlayerKey;
  onChange: (k: PlayerKey) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {PLAYERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
            ${
              active === key
                ? key === "bottom"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-gray-500 hover:text-gray-800"
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible card
// ─────────────────────────────────────────────────────────────────────────────

function CollapsibleCard({
  title,
  icon,
  onExpand,
  defaultOpen = true,
  children,
  sectionId,
}: {
  title: string;
  icon: React.ReactNode;
  onExpand: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
  sectionId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      id={sectionId}
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden scroll-mt-6"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left flex-1 group"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {icon}
            {title}
          </span>
          <ChevronDown
            className={`size-4 text-gray-400 ml-1 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors shrink-0 ml-3"
        >
          <Maximize2 className="size-3" />
          확대
        </button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          open
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="닫기"
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badminton Heatmap Court
// ─────────────────────────────────────────────────────────────────────────────

const VW = 500;
const VH = 1100;
const OL = 50,
  OR = 450,
  OT = 40,
  OB = 1060;
const OW = OR - OL,
  OH = OB - OT;
const SI = Math.round(OW * 0.0754);
const SL = OL + SI,
  SR = OR - SI;
const BI = Math.round(OH * 0.0567);
const BT = OT + BI,
  BB = OB - BI;
const NY = OT + OH / 2;
const SSO = Math.round(OH * 0.1478);
const SST = NY - SSO,
  SSB = NY + SSO;
const CX = (OL + OR) / 2;

function BadmintonHeatmapCourt({
  zones,
  selectedHeatmapPoint,
  setSelectedHeatmapPoint,
  onJumpToVideo,
  playerKey,
  large = false,
}: {
  zones: UiHeatmapZone[];
  selectedHeatmapPoint: number | null;
  setSelectedHeatmapPoint: (i: number | null) => void;
  onJumpToVideo: (t: number) => void;
  playerKey: PlayerKey;
  large?: boolean;
}) {
  const LW = 2.5;
  const NW = 5;
  const isBottom = playerKey === "bottom";
  const accentColor = isBottom ? "#3b82f6" : "#6366f1";

  // ── 각 히트 포인트의 픽셀 좌표 계산 ──
  const zonePixels = zones.map((zone) => ({
    px: OL + (zone.x / 100) * OW,
    py: OT + (zone.y / 100) * OH,
    intensity: zone.intensity,
    time: zone.time,
  }));

  // ── 고유 ID (플레이어별로 분리) ──
  const uid = playerKey; // "top" | "bottom"

  const courtSvg = (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* 코트 그라디언트 */}
        <linearGradient id={`cg-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#52954000" />
          <stop offset="100%" stopColor="#3d7230ff" />
        </linearGradient>
        <filter id={`cs-${uid}`}>
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.20" />
        </filter>
        <linearGradient id={`hl-top-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`hl-bot-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.08" />
        </linearGradient>

        {/* ── 히트맵 블러 필터 (물웅덩이 효과) ── */}
        {/* stdDeviation 높을수록 더 넓게 퍼짐. feComponentTransfer 제거 → 엣지 샤프닝 없애 자연스러운 번짐 유지 */}
        <filter
          id={`heatblur-${uid}`}
          x="-100%"
          y="-100%"
          width="330%"
          height="330%"
        >
          <feGaussianBlur stdDeviation="26" result="blur" />
        </filter>
        {/* 외곽 헤일로(넓은 구름) 전용 필터: 훨씬 강하게 번져 수채화 효과 */}
        <filter
          id={`heatblur-halo-${uid}`}
          x="-120%"
          y="-120%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="50" result="blur" />
        </filter>

        {/* ── 히트맵 색상 ──────────────────────────────────────────────────────────
            선수별 단일 색상 계열, 강도(t)에 따라 색과 투명도 모두 변화
            Bottom: 파랑 계열  연하늘(195,220,255) → 딥블루(15,45,210)
            Top:    인디고 계열 연보라(200,185,255) → 딥인디고(50,20,200)

            ★ opacity 커브: t² 사용 → 저빈도는 거의 안 보이고, 고빈도만 강하게
               t=0.1 → opacity 0.01 (거의 투명)
               t=0.5 → opacity 0.25 (연하게)
               t=0.8 → opacity 0.64 (뚜렷하게)
               t=1.0 → opacity 0.99 (완전히 진하게)
        ────────────────────────────────────────────────────────────────────── */}
        {zones.map((_, i) => {
          const t  = zones[i].intensity;
          const t2 = t * t; // 제곱 커브: 저강도 억제, 고강도 강조

          // 선수별 색상: 저강도(연한 파스텔) → 고강도(딥 컬러)
          let r: number, g: number, b: number;
          if (isBottom) {
            // 파랑: 연하늘(195,220,255) → 딥블루(15,45,210)
            r = Math.round(195 - t * 180);  // 195 → 15
            g = Math.round(220 - t * 175);  // 220 → 45
            b = Math.round(255 - t * 45);   // 255 → 210
          } else {
            // 인디고: 연보라(200,185,255) → 딥인디고(50,20,200)
            r = Math.round(200 - t * 150);  // 200 → 50
            g = Math.round(185 - t * 165);  // 185 → 20
            b = Math.round(255 - t * 55);   // 255 → 200
          }

          return (
            <radialGradient key={i} id={`hg-${uid}-${i}`} cx="50%" cy="50%" r="50%">
              {/* 중심: t² 커브 → 저빈도 거의 투명, 고빈도 완전 불투명 */}
              <stop offset="0%"   stopColor={`rgb(${r},${g},${b})`} stopOpacity={Math.min(t2 * 0.97 + 0.02, 0.99)} />
              <stop offset="35%"  stopColor={`rgb(${r},${g},${b})`} stopOpacity={t2 * 0.88} />
              <stop offset="65%"  stopColor={`rgb(${r},${g},${b})`} stopOpacity={t2 * 0.62} />
              <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0" />
            </radialGradient>
          );
        })}

        {/* 외곽 헤일로 전용 radialGradient — 동일 색상, t² 커브 */}
        {zones.map((_, i) => {
          const t  = zones[i].intensity;
          const t2 = t * t;

          let r2: number, g2: number, b2: number;
          if (isBottom) {
            r2 = Math.round(195 - t * 180);
            g2 = Math.round(220 - t * 175);
            b2 = Math.round(255 - t * 45);
          } else {
            r2 = Math.round(200 - t * 150);
            g2 = Math.round(185 - t * 165);
            b2 = Math.round(255 - t * 55);
          }

          return (
            <radialGradient key={`halo-grad-${i}`} id={`hg-halo-${uid}-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={`rgb(${r2},${g2},${b2})`} stopOpacity={t2 * 0.55} />
              <stop offset="50%"  stopColor={`rgb(${r2},${g2},${b2})`} stopOpacity={t2 * 0.30} />
              <stop offset="100%" stopColor={`rgb(${r2},${g2},${b2})`} stopOpacity="0" />
            </radialGradient>
          );
        })}

        {/* 클립 패스: 코트 영역 안으로 히트맵 제한 */}
        <clipPath id={`court-clip-${uid}`}>
          <rect x={OL} y={OT} width={OW} height={OH} />
        </clipPath>
      </defs>

      {/* ── 코트 배경 ── */}
      <rect width={VW} height={VH} fill="#eef4f0" />
      <rect
        x={OL}
        y={OT}
        width={OW}
        height={OH}
        fill="#4a8c39"
        filter={`url(#cs-${uid})`}
        rx="2"
      />
      <rect
        x={OL}
        y={OT}
        width={OW}
        height={OH}
        fill={`url(#cg-${uid})`}
        rx="2"
        opacity="0.35"
      />
      {isBottom ? (
        <rect
          x={OL}
          y={NY}
          width={OW}
          height={OH / 2}
          fill={`url(#hl-bot-${uid})`}
        />
      ) : (
        <rect
          x={OL}
          y={OT}
          width={OW}
          height={OH / 2}
          fill={`url(#hl-top-${uid})`}
        />
      )}

      {/* ── 히트맵 레이어: 헤일로(외곽 구름) + 코어(중심 색상) 이중 레이어 ── */}
      <g clipPath={`url(#court-clip-${uid})`}>
        {/* 1차: 넓은 헤일로 레이어 — 멀리 퍼지는 구름 효과 */}
        {zonePixels.map((zp, index) => {
          const haloR = 130 + zp.intensity * 70;
          return (
            <ellipse
              key={`halo-${index}`}
              cx={zp.px}
              cy={zp.py}
              rx={haloR * 1.2}
              ry={haloR}
              fill={`url(#hg-halo-${uid}-${index})`}
              filter={`url(#heatblur-halo-${uid})`}
              style={{ pointerEvents: "none" }}
            />
          );
        })}
        {/* 2차: 코어 레이어 — 중심부 색상 블롭, 클릭 가능 */}
        {zonePixels.map((zp, index) => {
          // 강도에 비례하되 충분히 크게 — 가우시안 블러가 대부분의 번짐을 담당
          const baseR = 90 + zp.intensity * 45;
          return (
            <ellipse
              key={`core-${index}`}
              cx={zp.px}
              cy={zp.py}
              rx={baseR * 1.15}
              ry={baseR}
              fill={`url(#hg-${uid}-${index})`}
              filter={`url(#heatblur-${uid})`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedHeatmapPoint(index);
                if (typeof zp.time === "number") onJumpToVideo(zp.time);
              }}
            />
          );
        })}
      </g>

      {/* ── 선택 포인트 마커 ── */}
      {selectedHeatmapPoint !== null && zonePixels[selectedHeatmapPoint] && (
        <g clipPath={`url(#court-clip-${uid})`}>
          <circle
            cx={zonePixels[selectedHeatmapPoint].px}
            cy={zonePixels[selectedHeatmapPoint].py}
            r="10"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
          <circle
            cx={zonePixels[selectedHeatmapPoint].px}
            cy={zonePixels[selectedHeatmapPoint].py}
            r="3"
            fill={accentColor}
            opacity="0.8"
          />
        </g>
      )}

      {/* ── 코트 라인 (히트맵 위에 겹쳐서 선명하게) ── */}
      <rect
        x={OL}
        y={OT}
        width={OW}
        height={OH}
        fill="none"
        stroke="#fff"
        strokeWidth={LW}
        rx="2"
      />
      <line x1={SL} y1={OT} x2={SL} y2={OB} stroke="#fff" strokeWidth={LW} />
      <line x1={SR} y1={OT} x2={SR} y2={OB} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={BT} x2={OR} y2={BT} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={BB} x2={OR} y2={BB} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={NY} x2={OR} y2={NY} stroke="#fff" strokeWidth={NW} />
      <circle cx={OL} cy={NY} r="5" fill="#fff" />
      <circle cx={OR} cy={NY} r="5" fill="#fff" />
      <line x1={SL} y1={SST} x2={SR} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={SL} y1={SSB} x2={SR} y2={SSB} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={BT} x2={CX} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={SSB} x2={CX} y2={BB} stroke="#fff" strokeWidth={LW} />

      <text
        x={CX}
        y={OT - 14}
        textAnchor="middle"
        fontSize="15"
        fill="#94a3b8"
        fontWeight="600"
        letterSpacing="3"
      >
        TOP
      </text>
      <text
        x={CX}
        y={OB + 24}
        textAnchor="middle"
        fontSize="15"
        fill="#64748b"
        fontWeight="700"
        letterSpacing="3"
      >
        BOTTOM
      </text>
      {isBottom ? (
        <text
          x={CX}
          y={OB + 44}
          textAnchor="middle"
          fontSize="12"
          fill={accentColor}
          fontWeight="700"
        >
          ▲ 선택됨
        </text>
      ) : (
        <text
          x={CX}
          y={OT - 28}
          textAnchor="middle"
          fontSize="12"
          fill={accentColor}
          fontWeight="700"
        >
          선택됨 ▼
        </text>
      )}
    </svg>
  );

  const infoPanel = (
    <div className="flex flex-col justify-between py-1 min-w-0">
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
          포지션 분포
        </p>
        <div className="space-y-2.5">
          {[
            { label: "네트 앞", pct: 28, color: "#ef4444" },
            { label: "미드 코트", pct: 45, color: "#f97316" },
            { label: "백 바운더리", pct: 27, color: "#3b82f6" },
          ].map(({ label, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-500">
                  {label}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color }}
                >
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="mt-4 rounded-xl p-3"
        style={{
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        <p
          className="text-[11px] font-semibold mb-1"
          style={{ color: accentColor }}
        >
          📍 히트 포인트
        </p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: accentColor }}
        >
          {zones.length > 0
            ? `총 ${zones.length}개 위치 기록됨. 점 클릭 시 영상 해당 구간으로 이동합니다.`
            : "히트맵 데이터가 없습니다."}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {/* 그라디언트 바: 선수 색상으로 낮음→높음 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] text-gray-400 font-medium shrink-0">낮음</span>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              background: isBottom
                ? "linear-gradient(to right, rgba(195,220,255,0.25), rgba(15,45,210,0.92))"
                : "linear-gradient(to right, rgba(200,185,255,0.25), rgba(50,20,200,0.92))",
            }}
          />
          <span className="text-[10px] text-gray-400 font-medium shrink-0">높음</span>
        </div>
        <span className="text-[10px] text-gray-400">샷 밀집도</span>
      </div>
    </div>
  );

  if (large) {
    return (
      <div className="flex justify-center">
        <div
          className="relative overflow-visible rounded-xl shadow-xl"
          style={{ width: "min(300px, 100%)", aspectRatio: `${VW} / ${VH}` }}
        >
          {courtSvg}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-stretch">
      <div
        className="relative shrink-0 overflow-visible"
        style={{ width: "min(175px, 36%)", aspectRatio: `${VW} / ${VH}` }}
      >
        {courtSvg}
      </div>
      <div className="flex-1">{infoPanel}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap zone factory
// ─────────────────────────────────────────────────────────────────────────────

function buildZones(points: HeatmapPoint[]): UiHeatmapZone[] {
  return points.map((p) => ({
    x: p.x,
    y: p.y,
    intensity: p.value ?? 0.5,
    time: p.timeSec,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown briefing
// ─────────────────────────────────────────────────────────────────────────────

function MarkdownBriefing({ content }: { content: string }) {
  if (!content)
    return (
      <p className="text-sm text-gray-400">AI 브리핑 데이터가 없습니다.</p>
    );
  return (
    <div
      className="prose prose-sm max-w-none text-gray-800 leading-relaxed
      [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-1
      [&_h2]:text-sm  [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
      [&_h3]:text-sm  [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-0.5
      [&_p]:mb-2 [&_p]:text-gray-700
      [&_ul]:mb-2 [&_ul]:pl-4
      [&_li]:list-disc [&_li]:mb-0.5 [&_li]:text-gray-700
      [&_strong]:font-semibold [&_strong]:text-blue-700"
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade system
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_THRESHOLDS: Array<{
  min: number;
  grade: string;
  color: string;
  bg: string;
}> = [
  { min: 85, grade: "S", color: "#0ea5e9", bg: "#e0f2fe" },
  { min: 70, grade: "A", color: "#22c55e", bg: "#dcfce7" },
  { min: 50, grade: "B", color: "#f59e0b", bg: "#fef3c7" },
  { min: 30, grade: "C", color: "#8b5cf6", bg: "#ede9fe" },
  { min: 0, grade: "D", color: "#ef4444", bg: "#fee2e2" },
];

function scoreToGrade(value: number): {
  grade: string;
  color: string;
  bg: string;
} {
  for (const t of GRADE_THRESHOLDS) {
    if (value >= t.min) return { grade: t.grade, color: t.color, bg: t.bg };
  }
  return { grade: "D", color: "#ef4444", bg: "#fee2e2" };
}

const ABILITY_DESCRIPTIONS: Record<string, string> = {
  공격성: "상대를 압박하고 주도권을 가져가는 성향",
  안정성: "실수 없이 경기를 안정적으로 풀어가는 능력",
  랠리력: "랠리를 길게 유지하며 버티는 지속력",
  기동력: "홈포지션으로의 빠른 리커버리 능력",
  수비력: "빠른 샷을 정확하게 받아내는 대처 능력",
};

function AbilityGradeRow({ label, value }: { label: string; value: number }) {
  const { grade, color, bg } = scoreToGrade(value);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      <span
        className="shrink-0 w-8 text-center text-xs font-black py-0.5 rounded-md"
        style={{ color, background: bg }}
      >
        {grade}
      </span>
      <span className="shrink-0 w-14 text-xs font-semibold text-gray-600">
        {label}
      </span>
      <span className="flex-1 text-xs text-gray-600 leading-snug">
        {ABILITY_DESCRIPTIONS[label] ?? ""}
      </span>
    </div>
  );
}

function AbilityGradeCard({ label, value }: { label: string; value: number }) {
  const { grade, color, bg } = scoreToGrade(value);
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span
          className="text-xs font-black px-2 py-0.5 rounded-md min-w-[32px] text-center"
          style={{ color, background: bg }}
        >
          {grade}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-snug">
        {ABILITY_DESCRIPTIONS[label] ?? ""}
      </p>
    </div>
  );
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: { name } } = payload[0];
  const { grade, color, bg } = scoreToGrade(value);
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-gray-600 mb-1">{name}</p>
      <span
        className="text-xs font-black px-2 py-0.5 rounded-md"
        style={{ color, background: bg }}
      >
        {grade}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function AnalysisReportPage({
  videoId,
  onJumpToVideo,
  onNavigate,
  onLogout,
  user,
}: AnalysisReportPageProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<
    number | null
  >(null);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [activePlayer, setActivePlayer] = useState<PlayerKey>("bottom");

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportNotReady, setReportNotReady] = useState(false); // 404 → 분석 준비 중

  const [briefings, setBriefings] = useState<Record<PlayerKey, string>>({
    top: "",
    bottom: "",
  });
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  // 사이드바
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 섹션 refs (스크롤용)
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<
    SidebarSectionId,
    React.RefObject<HTMLDivElement | null>
  > = {
    summary: useRef<HTMLDivElement>(null),
    heatmap: useRef<HTMLDivElement>(null),
    stroke: useRef<HTMLDivElement>(null),
    ability: useRef<HTMLDivElement>(null),
    briefing: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (id: SidebarSectionId) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ── Fetch report ──────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const data = await fetchReport(videoId);
        if (!alive) return;
        setReport(data);
      } catch (e: any) {
        if (!alive) return;
        // 404: 분석 완료 전 상태 — 일반 오류가 아닌 "준비 중" UI 표시
        const status = (e as any)?.status ?? 0;
        const msg = (e?.message ?? "") as string;
        if (status === 404 || msg.includes("404")) {
          setReportNotReady(true);
        } else {
          setErrorMsg(e?.message ?? "리포트를 불러오지 못했습니다.");
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [videoId]);

  // ── Generate AI briefing ──────────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    if (briefings[activePlayer]) return;

    let alive = true;
    (async () => {
      try {
        setBriefingLoading(true);
        setBriefingError(null);

        if (!API_KEY) throw new Error("Gemini API Key가 없습니다.");

        const playerData = report.data.players[activePlayer];
        const ability = playerData.abilityMetrics;
        const stroke = playerData.strokeTypes;
        const summary = report.data.summary;
        const coaching = playerData.aiCoaching;
        const playerLabel =
          activePlayer === "bottom" ? "Bottom Player" : "Top Player";
        const abilityGrades = {
          aggression: scoreToGrade(ability.aggression).grade,
          rally: scoreToGrade(ability.rally).grade,
          defense: scoreToGrade(ability.defense).grade,
          mobility: scoreToGrade(ability.mobility).grade,
          consistency: scoreToGrade(ability.consistency).grade,
        };
        // 현재 대부분의 타격은 others로 집계됨 (AI stroke 분류 미완성)
        const playerStrokeTotal =
          (stroke.smash ?? 0) +
          (stroke.clear ?? 0) +
          (stroke.drop ?? 0) +
          (stroke.drive ?? 0) +
          (stroke.serve ?? 0) +
          (stroke.net ?? 0) +
          (stroke.others ?? 0);

        const prompt = `
당신은 전문 배드민턴 코치입니다.
아래 데이터는 경기 영상에서 분석한 [${playerLabel}] 개인의 데이터입니다.

[경기 전체 개요 — 참고용, 개인 수치 아님]
- 경기 결과(Bottom 기준): ${summary.matchOutcome} (Bottom ${summary.myScore} : Top ${summary.opponentScore})
- 총 경기 시간: ${summary.matchTime}
- 양측 합산 총 스트로크: ${summary.totalStrokeCount}회

[${playerLabel} 개인 스트로크]
- 개인 스트로크 합계: ${playerStrokeTotal}회
- Smash: ${stroke.smash}회, Clear: ${stroke.clear}회, Drop: ${stroke.drop}회, Drive: ${stroke.drive}회, Serve: ${stroke.serve}회, Net: ${stroke.net}회, Others(미분류): ${stroke.others}회

[${playerLabel} 능력치 등급 (S > A > B > C > D)]
- 공격성 ${abilityGrades.aggression}등급: 전체 타격 중 스매시 비율
- 랠리력 ${abilityGrades.rally}등급: 랠리 지속력 및 지구력
- 수비력 ${abilityGrades.defense}등급: 빠른 반응 속도
- 기동력 ${abilityGrades.mobility}등급: 코트 커버리지
- 안정성 ${abilityGrades.consistency}등급: 실책 없이 안정적으로 플레이하는 능력

[기존 코치 피드백]
${coaching?.feedbackText ?? "(없음)"}

[출력 형식]
- 간결하게 (모바일 친화적)
- 섹션: ① 한 줄 총평 ② 핵심 지표 요약(불릿 3~5개) ③ 강점 TOP2 ④ 보완점 TOP2 ⑤ 추천 훈련 3가지
- 마크다운 사용 가능
        `.trim();

        const genAI = new GoogleGenerativeAI(API_KEY);
        let text = "";
        let lastErr: any = null;

        for (const modelName of GEMINI_MODEL_CANDIDATES) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            text = result.response.text();
            lastErr = null;
            break;
          } catch (err: any) {
            lastErr = err;
          }
        }

        if (lastErr) throw lastErr;
        if (!alive) return;
        setBriefings((prev) => ({ ...prev, [activePlayer]: text || "" }));
      } catch (e: any) {
        if (!alive) return;
        setBriefingError(
          e?.message ?? "AI 브리핑 생성 중 오류가 발생했습니다.",
        );
      } finally {
        if (!alive) return;
        setBriefingLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, activePlayer]);

  // ── Derived UI data ───────────────────────────────────────────────────────
  const ui = useMemo(() => {
    if (!report) return null;
    const summary = report.data.summary;
    const playerData = report.data.players[activePlayer];
    const heatmapZones = buildZones(playerData.positionAnalysis.heatmapData);
    const strokeData = [
      { name: "스매시", count: playerData.strokeTypes.smash, color: "#ef4444" },
      { name: "클리어", count: playerData.strokeTypes.clear, color: "#3b82f6" },
      { name: "드롭", count: playerData.strokeTypes.drop, color: "#10b981" },
      {
        name: "드라이브",
        count: playerData.strokeTypes.drive,
        color: "#f59e0b",
      },
      { name: "서브", count: playerData.strokeTypes.serve, color: "#8b5cf6" },
      { name: "네트", count: playerData.strokeTypes.net, color: "#06b6d4" },
      { name: "기타", count: playerData.strokeTypes.others, color: "#94a3b8" },
    ];
    const am = playerData.abilityMetrics;
    const clamp = (v: unknown) =>
      Math.min(100, Math.max(0, Math.round(Number(v) || 0)));
    const abilityData = [
      { name: "공격성", value: clamp(am.aggression) },
      { name: "안정성", value: clamp(am.consistency) },
      { name: "랠리력", value: clamp(am.rally) },
      { name: "기동력", value: clamp(am.mobility) },
      { name: "수비력", value: clamp(am.defense) },
    ];
    const accentColor = activePlayer === "bottom" ? "#3b82f6" : "#6366f1";
    return { summary, heatmapZones, strokeData, abilityData, accentColor };
  }, [report, activePlayer]);

  useEffect(() => {
    setSelectedHeatmapPoint(null);
  }, [activePlayer]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo
          user={user}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* 사이드바 스켈레톤 */}
          <aside className="relative flex flex-col bg-white border-r border-gray-200 w-60 shrink-0">
            <div className="px-3 pt-5 pb-3 border-b border-gray-100">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="space-y-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-9 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="px-3 pt-4 pb-3 flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="space-y-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 스켈레톤 */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-10">
              <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse mb-6" />

              <div className="space-y-6">
                {/* 경기 결과 요약 스켈레톤 */}
                <SkeletonSummary />

                {/* 플레이어 인디케이터 */}
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />

                {/* 히트맵 */}
                <SkeletonHeatmap />

                {/* 스트로크 + 능력치 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <SkeletonChart />
                  <SkeletonChart tall />
                </div>

                {/* AI 브리핑 */}
                <SkeletonCard className="min-h-[300px]" />
              </div>
            </div>
          </main>
        </div>

        <Footer />
      </div>
    );
  }
  // ── 분석 리포트 준비 중 (404) ────────────────────────────────────
  if (reportNotReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo
          user={user}
        />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <FileText className="size-9 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              분석 리포트 준비 중
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              AI가 경기 영상을 분석하고 있습니다.
              <br />
              분석이 완료되면 리포트가 자동으로 생성됩니다.
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-8">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigate("dashboard")}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                대시보드로
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                새로고침
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo
          user={user}
        />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-xl border border-red-100 bg-red-50 p-8">
            <p className="text-sm font-bold text-red-700">
              리포트를 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
            >
              새로고침
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!report || !ui) return null;

  const { summary, heatmapZones, strokeData, abilityData, accentColor } = ui;
  const aiBriefing = briefings[activePlayer];
  const isBottom = activePlayer === "bottom";

  // 사이드바 섹션 목록
  const sidebarSections: {
    id: SidebarSectionId;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "summary",
      label: "경기 결과",
      icon: <Users className="size-4 shrink-0" />,
    },
    {
      id: "heatmap",
      label: "히트맵",
      icon: (
        <Target className="size-4 shrink-0" style={{ color: accentColor }} />
      ),
    },
    {
      id: "stroke",
      label: "스트로크 분포",
      icon: <Zap className="size-4 shrink-0 text-purple-500" />,
    },
    {
      id: "ability",
      label: "능력치 분석",
      icon: <Award className="size-4 shrink-0 text-orange-500" />,
    },
    {
      id: "briefing",
      label: "AI 브리핑",
      icon: <Bot className="size-4 shrink-0 text-blue-600" />,
    },
  ];

  // 사이드바 nav 목록
  const navItems = [
    {
      id: "dashboard" as Page,
      label: "대시보드",
      icon: <LayoutDashboard className="size-4 shrink-0" />,
      action: () => onNavigate("dashboard"),
      isCurrent: false,
    },
    {
      id: "video" as Page,
      label: "영상 보기",
      icon: <Play className="size-4 shrink-0" />,
      action: () => onNavigate("video"),
      isCurrent: false,
    },
    {
      id: "report" as Page,
      label: "분석 페이지",
      icon: <FileText className="size-4 shrink-0" />,
      action: () => {},
      isCurrent: true,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentPage="report"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo
        user={user}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ══════════════════════════════════════════════════════
            사이드바 (fixed — 스크롤과 무관하게 고정)
           ══════════════════════════════════════════════════════ */}

        {/* spacer: fixed aside가 flow에서 빠지므로 동일 너비로 main을 밀어냄 */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-60" : "w-14"}`}
          aria-hidden="true"
        />

        <aside
          className={`
            fixed left-0 top-16 z-30
            flex flex-col bg-white
            border-r border-gray-100
            shadow-[2px_0_20px_rgba(0,0,0,0.08)]
            transition-all duration-300 ease-in-out
            h-[calc(100vh-64px)] overflow-hidden
            ${sidebarOpen ? "w-60" : "w-14"}
          `}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* ── 토글 + 네비게이션 ── */}
            <div
              className={`px-3 pt-2 pb-3 border-b border-gray-100 ${sidebarOpen ? "" : "px-2"}`}
            >
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                  title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeftOpen className="size-4" />
                  )}
                </button>
              </div>
              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.isCurrent ? undefined : item.action}
                    disabled={item.isCurrent}
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left ${
                      item.isCurrent
                        ? `bg-blue-50 text-blue-600 cursor-default ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`
                        : `text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 섹션 이동 */}
            <div
              className={`px-3 pt-4 pb-3 flex-1 overflow-y-auto ${sidebarOpen ? "" : "px-2"}`}
            >
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  분석 섹션
                </p>
              )}
              <div className="space-y-0.5">
                {sidebarSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      if (!sidebarOpen) setSidebarOpen(true);
                      scrollToSection(sec.id);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                    title={!sidebarOpen ? sec.label : undefined}
                  >
                    {sec.icon}
                    {sidebarOpen && (
                      <span className="text-sm font-medium truncate">
                        {sec.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 플레이어 선택 (사이드바 열렸을 때만) */}
              {sidebarOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    플레이어
                  </p>
                  <PlayerToggle
                    active={activePlayer}
                    onChange={(k) => setActivePlayer(k)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 계정 관리 */}
          <div
            className={`shrink-0 border-t border-gray-100 p-3 ${sidebarOpen ? "" : "px-2"}`}
          >
            <button
              onClick={() => onNavigate("account")}
              className={`w-full flex items-center gap-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
              title={!sidebarOpen ? "계정 관리" : undefined}
            >
              <User className="size-4 shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium">계정 관리</span>
              )}
            </button>
          </div>

          {/* 로그아웃 */}
          <div
            className={`shrink-0 border-t border-gray-100 p-3 ${sidebarOpen ? "" : "px-2"}`}
          >
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
              title={!sidebarOpen ? "로그아웃" : undefined}
            >
              <LogOut className="size-4 shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium">로그아웃</span>
              )}
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════
            메인 콘텐츠
           ══════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto" ref={mainScrollRef}>
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="space-y-6">
              {/* ── 1. Match Summary ── */}
              <section
                id="section-summary"
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm scroll-mt-6"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Users className="size-4 text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    경기 결과 요약
                  </h2>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6 py-4 rounded-xl bg-gray-50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                      Bottom
                    </span>
                    <span className="text-5xl font-black text-gray-900 tabular-nums">
                      {summary.myScore}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-light text-gray-300 mt-1">
                      VS
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                      Top
                    </span>
                    <span className="text-5xl font-black text-gray-900 tabular-nums">
                      {summary.opponentScore}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <Zap className="size-4 text-purple-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        양측 합산 스트로크
                      </p>
                      <p className="text-lg font-black text-purple-600">
                        {summary.totalStrokeCount}회
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <Clock className="size-4 text-orange-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        경기 시간
                      </p>
                      <p className="text-lg font-black text-orange-600">
                        {summary.matchTime}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 2. Player indicator ── */}
              <div
                className="flex items-center justify-end"
                style={{
                  background: `${accentColor}10`,
                  borderRadius: "12px",
                  padding: "8px 16px",
                  border: `1px solid ${accentColor}30`,
                }}
              >
                <div
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: accentColor }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: accentColor }}
                  />
                  {isBottom ? "Bottom Player 분석 중" : "Top Player 분석 중"}
                </div>
              </div>

              {/* ── 3. Heatmap ── */}
              <div id="section-heatmap" className="scroll-mt-6">
                <CollapsibleCard
                  title="히트맵"
                  icon={
                    <Target className="size-4" style={{ color: accentColor }} />
                  }
                  onExpand={() => setExpandedPanel("heatmap")}
                >
                  <BadmintonHeatmapCourt
                    zones={heatmapZones}
                    selectedHeatmapPoint={selectedHeatmapPoint}
                    setSelectedHeatmapPoint={setSelectedHeatmapPoint}
                    onJumpToVideo={onJumpToVideo}
                    playerKey={activePlayer}
                  />
                </CollapsibleCard>
              </div>

              {/* ── 4. Stroke + Ability ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div id="section-stroke" className="scroll-mt-6">
                  <CollapsibleCard
                    title="스트로크 분포"
                    icon={<Zap className="size-4 text-purple-500" />}
                    onExpand={() => setExpandedPanel("stroke")}
                  >
                    <div className="mb-3 h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={strokeData}
                          margin={{ top: 0, right: 16, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              fontSize: 12,
                            }}
                            cursor={{ fill: "rgba(0,0,0,0.03)" }}
                          />
                          <Bar
                            dataKey="count"
                            radius={[8, 8, 0, 0]}
                            barSize={36}
                          >
                            {strokeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {strokeData.map((stroke) => (
                        <div
                          key={stroke.name}
                          className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 border border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: stroke.color }}
                            />
                            <span className="text-xs font-semibold text-gray-600">
                              {stroke.name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-500">
                            {stroke.count}회
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleCard>
                </div>

                <div id="section-ability" className="scroll-mt-6">
                  <CollapsibleCard
                    title="능력치 분석"
                    icon={<Award className="size-4 text-orange-500" />}
                    onExpand={() => setExpandedPanel("ability")}
                  >
                    <div className="mb-3 h-[200px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={abilityData}>
                          <PolarGrid stroke="#f1f5f9" />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <Radar
                            name="능력치"
                            dataKey="value"
                            stroke={accentColor}
                            fill={accentColor}
                            fillOpacity={0.35}
                          />
                          <Tooltip content={<RadarTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-50">
                      {abilityData.map((a) => (
                        <AbilityGradeRow
                          key={a.name}
                          label={a.name}
                          value={a.value}
                        />
                      ))}
                    </div>
                  </CollapsibleCard>
                </div>
              </div>

              {/* ── 5. AI Briefing ── */}
              <section
                id="section-briefing"
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden scroll-mt-6"
              >
                <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Bot className="size-4 text-blue-600" />
                    AI 브리핑
                    <span
                      className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: `${accentColor}15`,
                        color: accentColor,
                      }}
                    >
                      {isBottom ? "Bottom Player" : "Top Player"}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExpandedPanel("briefing")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Maximize2 className="size-3" />
                    확대
                  </button>
                </div>
                <div className="p-6">
                  {briefingLoading && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 rounded-full animate-bounce"
                            style={{
                              backgroundColor: accentColor,
                              animationDelay: `${delay}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: accentColor }}
                      >
                        AI가 리포트를 요약 중입니다...
                      </span>
                    </div>
                  )}
                  {briefingError && (
                    <p className="text-sm text-red-600">
                      브리핑 생성 실패: {briefingError}
                    </p>
                  )}
                  {!briefingLoading && !briefingError && (
                    <MarkdownBriefing content={aiBriefing} />
                  )}
                  <p className="mt-4 text-[11px] text-gray-400">
                    * 이 브리핑은 경기 분석 데이터를 기반으로 자동 생성됩니다.
                  </p>
                </div>
              </section>
            </div>
          </div>
          <Footer />
        </main>
      </div>

      {/* ── Modals ── */}
      <Modal
        open={expandedPanel === "heatmap"}
        title="히트맵 상세 보기"
        onClose={() => setExpandedPanel(null)}
      >
        <p className="mb-5 text-sm text-gray-500">
          {isBottom ? "Bottom Player" : "Top Player"}의 코트 포지션
          히트맵입니다.
        </p>
        <BadmintonHeatmapCourt
          zones={heatmapZones}
          selectedHeatmapPoint={selectedHeatmapPoint}
          setSelectedHeatmapPoint={setSelectedHeatmapPoint}
          onJumpToVideo={onJumpToVideo}
          playerKey={activePlayer}
          large
        />
      </Modal>

      <Modal
        open={expandedPanel === "stroke"}
        title="스트로크 분포 상세"
        onClose={() => setExpandedPanel(null)}
      >
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={strokeData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid vertical={false} stroke="#e5edf5" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                {strokeData.map((entry, index) => (
                  <Cell key={`exp-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>

      <Modal
        open={expandedPanel === "ability"}
        title="능력치 분석 상세"
        onClose={() => setExpandedPanel(null)}
      >
        <div className="h-[320px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={abilityData}>
              <PolarGrid stroke="#e5edf5" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: "#64748b" }}
              />
              <Radar
                name="능력치"
                dataKey="value"
                stroke={accentColor}
                fill={accentColor}
                fillOpacity={0.4}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {abilityData.map((a) => (
            <AbilityGradeCard key={a.name} label={a.name} value={a.value} />
          ))}
        </div>
      </Modal>

      <Modal
        open={expandedPanel === "briefing"}
        title="AI 브리핑 상세"
        onClose={() => setExpandedPanel(null)}
      >
        {briefingLoading && (
          <p className="text-sm animate-pulse" style={{ color: accentColor }}>
            AI가 리포트를 요약 중입니다...
          </p>
        )}
        {briefingError && (
          <p className="text-sm text-red-600">
            브리핑 생성 실패: {briefingError}
          </p>
        )}
        {!briefingLoading && !briefingError && (
          <MarkdownBriefing content={aiBriefing} />
        )}
      </Modal>
    </div>
  );
}
