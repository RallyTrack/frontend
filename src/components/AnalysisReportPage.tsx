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
  Pencil,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  Dumbbell,
  Activity,
  RefreshCw,
  MapPin,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import ReactMarkdown from "react-markdown";

import { Header, type Page } from "./Header";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ReportResponse,
  PlayerData,
  PlayerKey,
  HeatmapPoint,
} from "../types/reportpageType";
import { Footer } from "./ui/footer";
import { fetchReport } from "../api/reportpageApi";
import {
  updateMatchScore,
  fetchVideoDetail,
  type MatchSummary,
} from "../api/videoApi";
import {
  PLAYER_COLOR,
  PLAYER_COLOR_STRONG,
  PLAYER_TINT,
  SEMANTIC_TINT,
  NEUTRAL_MARK,
  heatRgb,
  heatOpacity,
  strokeSliceColor,
} from "../theme/colors";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// AI 브리핑 캐시 (localStorage) — videoId + player 별로 1회만 생성, 이후 재사용해 토큰 절약
const BRIEFING_CACHE_VERSION = "v1";
const briefingCacheKey = (videoId: string | number, player: PlayerKey) =>
  `rt:brief:${BRIEFING_CACHE_VERSION}:${videoId}:${player}`;
function readBriefingCache(
  videoId: string | number,
  player: PlayerKey,
): string | null {
  try {
    return localStorage.getItem(briefingCacheKey(videoId, player));
  } catch {
    return null;
  }
}
function writeBriefingCache(
  videoId: string | number,
  player: PlayerKey,
  text: string,
) {
  try {
    localStorage.setItem(briefingCacheKey(videoId, player), text);
  } catch {
    /* 저장 실패는 무시 (용량 초과 등) */
  }
}
// const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "models/gemini-2.5-flash"];
const GEMINI_MODEL_CANDIDATES = ["gemini-3.6-flash", "models/gemini-3.6-flash"];

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
        className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="p-6">
        <div className="space-y-3">
          <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  );
}

function SkeletonSummary() {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
      </div>

      <div className="flex items-center justify-center gap-6 mb-6 py-4 rounded-xl bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-slate-50 border border-slate-200/70 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-2 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
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
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-16 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="p-6">
        <div className="flex gap-6">
          <div className="w-44 h-96 bg-slate-100 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-4">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-2 bg-slate-100 rounded animate-pulse w-24 mb-1" />
                  <div className="h-2 bg-slate-100 rounded-full animate-pulse w-full" />
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
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-16 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="p-6">
        <div
          className={`bg-slate-100 rounded-xl animate-pulse ${tall ? "h-64" : "h-48"}`}
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-slate-100 rounded-lg animate-pulse"
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

const PLAYERS: { key: PlayerKey; label: string; full: string }[] = [
  { key: "bottom", label: "Bottom", full: "Bottom Player" },
  { key: "top", label: "Top", full: "Top Player" },
];

function PlayerToggle({
  active,
  onChange,
  variant = "default",
}: {
  active: PlayerKey;
  onChange: (k: PlayerKey) => void;
  /**
   * "compact" — 사이드바처럼 좁은 자리. 컨테이너를 꽉 채우고 라벨을 줄인다.
   *   (w-60 사이드바에서 두 칸을 같은 폭으로 두면 "Bottom Player"가 잘린다)
   * "default" — 페이지 헤더처럼 여유 있는 자리. 전체 라벨을 쓴다.
   */
  variant?: "compact" | "default";
}) {
  const compact = variant === "compact";
  return (
    // grid-cols-2: 두 칸이 항상 같은 폭. flex로 두면 글자 길이만큼
    // 칸 넓이가 달라져 한쪽이 넓어 보인다.
    <div
      className={`${compact ? "grid w-full" : "inline-grid"} grid-cols-2 items-center gap-1 bg-slate-100 rounded-xl p-1`}
    >
      {PLAYERS.map(({ key, label, full }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            aria-pressed={isActive}
            aria-label={full}
            className={`
              flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-[color,background-color,box-shadow] duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40
              ${isActive ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-800"}
            `}
            // 흰 알약만으로는 회색 트랙(slate-100) 위에서 거의 안 보인다.
            // 선수색 헤어라인 링으로 경계를 세운다 — 색 면적은 거의 0이면서
            // "선택됨"과 "어느 선수인지"를 한 번에 전달한다.
            // (사이트의 활성 내비도 ring-1 ring-inset을 쓰는 같은 문법)
            style={
              isActive
                ? {
                    boxShadow: `inset 0 0 0 1.5px ${PLAYER_COLOR[key]}, 0 2px 6px rgba(15,23,42,0.12)`,
                  }
                : undefined
            }
          >
            <span
              className="size-1.5 rounded-full shrink-0 transition-colors"
              style={{
                backgroundColor: isActive ? PLAYER_COLOR[key] : "transparent",
                boxShadow: isActive ? "none" : "inset 0 0 0 1.5px #cbd5e1",
              }}
              aria-hidden="true"
            />
            <span className="truncate">{compact ? label : full}</span>
          </button>
        );
      })}
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
      // h-full + flex: 나란히 놓인 카드끼리 높이를 맞춘다.
      // 내용이 적은 카드는 본문이 늘어나고, 하단 요약은 mt-auto로 바닥에 붙는다.
      className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white overflow-hidden scroll-mt-6"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-left flex-1 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 [&_svg]:size-3.5">
            {icon}
          </span>
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[#1a2b4c] transition-colors">
            {title}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-slate-400 ml-1 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors shrink-0 ml-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
        >
          <Maximize2 className="size-3" aria-hidden="true" />
          확대
        </button>
      </div>
      <div
        className={`flex flex-col transition-[max-height,opacity] duration-300 ease-in-out ${
          open
            ? "max-h-[2000px] flex-1 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-1 flex-col p-4">{children}</div>
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="닫기"
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="text-lg font-bold text-slate-900 text-pretty">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
          >
            <X className="size-4" aria-hidden="true" />
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

/** "0:18" · "1:02:03" · "18" → 초. 숫자 형식이 아니면(예: "분석 완료") null */
function parseTimeToSeconds(raw?: string): number | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!/^\d+(:\d{1,2})*$/.test(t)) return null;
  const parts = t.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** 초 → "12초" · "1분 5초" */
function formatDurationKo(total: number): string {
  const s = Math.max(0, Math.round(total));
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}분` : `${m}분 ${r}초`;
}

/**
 * 스트로크 분류 — 업로드 유형(mode)에 따라 종류 수가 다르다.
 * 차트·표·확대 모달의 단일 출처이며, 화면은 이 배열의 length만 보고 동작한다.
 *
 *   아마추어 4종 — 서브 · 스매시 · 클리어 · 드라이브
 *   프로     6종 — 서브 · 로브 · 스매시 · 드롭 · 드라이브 · 클리어
 *
 * net/others는 어느 쪽에도 없다(구버전 응답 호환 필드). 카드의 "총 N회"는
 * 여기 나열된 항목의 합이며, 경기 전체 타수는 summary.totalStrokeCount를 쓴다.
 */
type StrokeMode = "amateur" | "pro";

const STROKE_TAXONOMY: Record<
  StrokeMode,
  { key: keyof PlayerData["strokeTypes"]; label: string }[]
> = {
  amateur: [
    { key: "serve", label: "서브" },
    { key: "smash", label: "스매시" },
    { key: "clear", label: "클리어" },
    { key: "drive", label: "드라이브" },
  ],
  pro: [
    { key: "serve", label: "서브" },
    { key: "lob", label: "로브" },
    { key: "smash", label: "스매시" },
    { key: "drop", label: "드롭" },
    { key: "drive", label: "드라이브" },
    { key: "clear", label: "클리어" },
  ],
};

/** 프로 분류에만 등장하는 종류 — 유형 판별의 근거가 된다. */
const PRO_ONLY_STROKES = ["lob", "drop"] as const;

/**
 * 업로드 유형 판별.
 *
 * 업로드할 때 mode("amateur" | "pro")를 보내지만 조회 API가 그 값을 다시
 * 내려주는지 확정되지 않았다. 그래서 응답에서 건질 수 있는 단서를 순서대로 본다.
 *
 *   1) 응답에 mode/playerType이 실려 있으면 그대로 신뢰
 *   2) 개별 타격(hitsData)의 strokeType에 lob/drop이 있으면 프로
 *   3) 전부 아니면 아마추어
 *
 * ※ 예전에는 "strokeTypes에 lob/drop 키가 있으면 프로"도 봤는데,
 *   백엔드가 mode와 무관하게 8개 키를 항상 내려줘서 모든 영상이 프로로
 *   판정됐다. 키 존재는 신호가 아니다.
 *
 * 백엔드가 mode를 확정해서 내려주기 시작하면 1)만 남기고 나머지는 지워도 된다.
 */
function resolveStrokeMode(
  hints: ReportResponse["data"]["modeHints"] | undefined,
  strokes: PlayerData["strokeTypes"][],
): StrokeMode {
  if (hints?.declared) return hints.declared;

  const hitTypes = hints?.hitStrokeTypes ?? [];
  if (hitTypes.some((t) => PRO_ONLY_STROKES.some((p) => t.includes(p)))) {
    return "pro";
  }

  // hitsData가 없는 응답을 대비한 폴백. 집계는 이제 개별 타격에서 다시 세므로
  // 여기 값도 실제 lob/drop 횟수다.
  const proOnlyCount = strokes.reduce(
    (sum, st) => sum + (Number(st.lob) || 0) + (Number(st.drop) || 0),
    0,
  );
  return proOnlyCount > 0 ? "pro" : "amateur";
}

/** 타격 마커 색의 하한(0~1). 저빈도 지점도 코트 위에서 보이게 한다. */
const MARKER_FLOOR = 0.45;

/**
 * 배드민턴 코트 실측 규격 (BWF Laws of Badminton, Appendix 1 · 단위 m).
 * 아래 SVG 좌표는 전부 이 값에서 계산한다 — 비율을 따로 하드코딩하지 말 것.
 *
 *   복식 코트          13.40 × 6.10
 *   단식 코트          13.40 × 5.18  (사이드라인이 복식보다 0.46 안쪽)
 *   숏 서비스 라인      네트에서 1.98
 *   복식 롱 서비스 라인  뒤 경계선에서 0.76
 */
const COURT_M = {
  length: 13.4,
  width: 6.1,
  singlesInset: 0.46,
  shortService: 1.98,
  doublesLongService: 0.76,
} as const;

const PAD_X = 50; // 좌우 여백
const PAD_TOP = 56; // TOP 라벨 + "선택됨 ▼" 자리
const PAD_BOTTOM = 64; // BOTTOM 라벨 + "▲ 선택됨" 자리

const OW = 400;
const PX_PER_M = OW / COURT_M.width;
// 세로는 반드시 실측 비율에서 뽑는다. 예전에는 OH를 임의로 1020으로 잡아
// 세로:가로가 2.55(공식 2.20)가 되어 코트가 16% 길쭉하게 그려졌다.
const OH = Math.round(COURT_M.length * PX_PER_M);

const OL = PAD_X,
  OR = OL + OW,
  OT = PAD_TOP,
  OB = OT + OH;
const VW = OW + PAD_X * 2;
const VH = OH + PAD_TOP + PAD_BOTTOM;

const SI = Math.round(COURT_M.singlesInset * PX_PER_M);
const SL = OL + SI,
  SR = OR - SI;
const BI = Math.round(COURT_M.doublesLongService * PX_PER_M);
const BT = OT + BI,
  BB = OB - BI;
const NY = OT + OH / 2;
const SSO = Math.round(COURT_M.shortService * PX_PER_M);
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
  const accentColor = isBottom ? PLAYER_COLOR.bottom : PLAYER_COLOR.top;
  const accentText = isBottom
    ? PLAYER_COLOR_STRONG.bottom
    : PLAYER_COLOR_STRONG.top;

  // ── 각 히트 포인트의 픽셀 좌표 계산 ──
  // reportpageApi.ts 에서 0~100 범위로 정규화된 좌표를 반환한다.
  // SVG 픽셀 좌표로 변환 시 /100 필요.
  const zonePixels = zones.map((zone) => ({
    px: OL + (zone.x / 100) * OW,
    py: OT + (zone.y / 100) * OH,
    intensity: zone.intensity,
    time: zone.time,
  }));

  // ── 고유 ID (플레이어별로 분리) ──
  const uid = playerKey; // "top" | "bottom"

  // 표본이 적을수록 구름을 좁혀 개별 타점이 묻히지 않게 한다 (12개 이상이면 원래 크기).
  const cloudScale = Math.max(0.32, Math.min(1, zones.length / 12));

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
        {/* 타격 마커용 드롭섀도: 흰 디스크가 밝은 코트 라인 위에서도 떠 보이게 */}
        <filter
          id={`hitshadow-${uid}`}
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.6"
            floodColor="#0f172a"
            floodOpacity="0.45"
          />
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
            두 선수 공통 단일 색상 램프(HEAT_RAMP, 네이비 계열 hue 220°).
            강도(t)에 따라 색과 투명도가 함께 변한다 — 연한 블루 → 딥 네이비.
            선수 구분은 색이 아니라 코트 상/하 위치와 카드 헤더가 담당한다.

            ★ opacity 커브는 heatOpacity()(theme/colors.ts)가 담당한다.
               하한이 있어서 고립된 지점도 옅은 구름은 남는다.
               t=0.25 → 0.22 · t=0.5 → 0.42 · t=0.75 → 0.67 · t=1 → 0.95
        ────────────────────────────────────────────────────────────────────── */}
        {zones.map((_, i) => {
          const t = zones[i].intensity;
          const a = heatOpacity(t);

          // 밀집도에 따라 연한 파스텔 → 딥 플럼
          const heatColor = heatRgb(t);

          return (
            <radialGradient
              key={i}
              id={`hg-${uid}-${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={heatColor} stopOpacity={a} />
              <stop
                offset="35%"
                stopColor={heatColor}
                stopOpacity={a * 0.85}
              />
              <stop
                offset="65%"
                stopColor={heatColor}
                stopOpacity={a * 0.6}
              />
              <stop
                offset="100%"
                stopColor={heatColor}
                stopOpacity="0"
              />
            </radialGradient>
          );
        })}

        {/* 외곽 헤일로 전용 radialGradient — 동일 색상, t² 커브 */}
        {zones.map((_, i) => {
          const t = zones[i].intensity;
          const a = heatOpacity(t);

          const haloColor = heatRgb(t);

          return (
            <radialGradient
              key={`halo-grad-${i}`}
              id={`hg-halo-${uid}-${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                stopColor={haloColor}
                stopOpacity={a * 0.5}
              />
              <stop
                offset="50%"
                stopColor={haloColor}
                stopOpacity={a * 0.28}
              />
              <stop
                offset="100%"
                stopColor={haloColor}
                stopOpacity="0"
              />
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

      {/* ── 밀도 구름 ──
          표본이 적으면(<12) 구름이 코트를 뒤덮어 실제 타점을 가린다.
          따라서 표본 수에 따라 반지름을 줄이고, 타점은 아래 마커로 정확히 표시한다. */}
      <g clipPath={`url(#court-clip-${uid})`} style={{ pointerEvents: "none" }}>
        {zonePixels.map((zp, index) => {
          const haloR = (130 + zp.intensity * 70) * cloudScale;
          return (
            <ellipse
              key={`halo-${index}`}
              cx={zp.px}
              cy={zp.py}
              rx={haloR * 1.2}
              ry={haloR}
              fill={`url(#hg-halo-${uid}-${index})`}
              filter={`url(#heatblur-halo-${uid})`}
            />
          );
        })}
        {zonePixels.map((zp, index) => {
          const baseR = (90 + zp.intensity * 45) * cloudScale;
          return (
            <ellipse
              key={`core-${index}`}
              cx={zp.px}
              cy={zp.py}
              rx={baseR * 1.15}
              ry={baseR}
              fill={`url(#hg-${uid}-${index})`}
              filter={`url(#heatblur-${uid})`}
            />
          );
        })}
      </g>

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
      {/* 숏 서비스 라인 — 복식 사이드라인까지 꽉 채운다.
          복식 서비스 코트의 경계라 단식 사이드라인에서 끊기면 안 된다. */}
      <line x1={OL} y1={SST} x2={OR} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={SSB} x2={OR} y2={SSB} stroke="#fff" strokeWidth={LW} />
      {/* 센터 라인 — 숏 서비스 라인에서 "뒤 경계선"까지.
          복식 롱 서비스 라인에서 끊으면 뒤쪽 0.76m 구간이 빈다
          (단식 서비스 코트의 뒤 경계가 back boundary line이므로 끝까지 가야 한다). */}
      <line x1={CX} y1={OT} x2={CX} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={SSB} x2={CX} y2={OB} stroke="#fff" strokeWidth={LW} />

      {/* ── 정확한 타격 지점 마커 (클릭 대상) ──
          초록 코트 + 흰 라인 + 뒤에 깔린 블러 구름 위에 얹히므로,
          "흰 디스크 → 얇은 잉크 링 → 색 코어" 3겹으로 어느 배경에서도 분리되게 한다.
          코어 색은 heatRgb를 그대로 쓰지 않고 하한을 둔다(아래 MARKER_FLOOR 참고). */}
      <g clipPath={`url(#court-clip-${uid})`}>
        {zonePixels.map((zp, index) => {
          const selected = selectedHeatmapPoint === index;
          const jumpable = typeof zp.time === "number";
          // 저빈도 지점도 보이도록 색 하한을 둔다. 구름(블러)은 원래 강도 그대로라
          // 밀집도 정보는 그쪽이 담당하고, 마커는 "여기 쳤다"를 확실히 보여준다.
          const core = heatRgb(MARKER_FLOOR + (1 - MARKER_FLOOR) * zp.intensity);
          const rDisc = selected ? 12 : 9;
          const rCore = selected ? 7.5 : 5.5;
          return (
            <g
              key={`hit-${index}`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedHeatmapPoint(index);
                if (jumpable) onJumpToVideo(zp.time as number);
              }}
            >
              {/* 넉넉한 히트 영역 (보이지 않음) */}
              <circle cx={zp.px} cy={zp.py} r="26" fill="transparent" />
              <circle
                cx={zp.px}
                cy={zp.py}
                r={rDisc}
                fill="#fff"
                stroke="#0f172a"
                strokeOpacity={selected ? 0.45 : 0.28}
                strokeWidth="1"
                filter={`url(#hitshadow-${uid})`}
              />
              <circle cx={zp.px} cy={zp.py} r={rCore} fill={core} />
            </g>
          );
        })}
      </g>

      {/* ── 선택 포인트 강조 링 ── */}
      {selectedHeatmapPoint !== null && zonePixels[selectedHeatmapPoint] && (
        <g clipPath={`url(#court-clip-${uid})`} style={{ pointerEvents: "none" }}>
          <circle
            cx={zonePixels[selectedHeatmapPoint].px}
            cy={zonePixels[selectedHeatmapPoint].py}
            r="18"
            fill="none"
            stroke="#0f172a"
            strokeOpacity="0.35"
            strokeWidth="4"
          />
          <circle
            cx={zonePixels[selectedHeatmapPoint].px}
            cy={zonePixels[selectedHeatmapPoint].py}
            r="18"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
        </g>
      )}


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
          fill={accentText}
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
          fill={accentText}
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
        <p className="text-[11px] font-semibold text-slate-400 mb-3">
          포지션 분포
        </p>
        <div className="space-y-2.5">
          {(() => {
            // ── 구역 경계: SVG 상수에서 직접 파생 (하드코딩 금지) ──
            // BT  = OT + round(OH * 0.0567)  → y%  ≈  5.67  (백 바운더리 라인)
            // SST = NY  - round(OH * 0.1478) → y%  ≈ 35.22  (숏 서비스 라인 top)
            // NY  = OT  + OH / 2             → y%  = 50      (네트)
            // SSB = NY  + round(OH * 0.1478) → y%  ≈ 64.78  (숏 서비스 라인 bottom)
            // BB  = OB  - round(OH * 0.0567) → y%  ≈ 94.33  (백 바운더리 라인)
            const BT_PCT = (BI / OH) * 100; //  ≈  5.67
            const SST_PCT = ((OH / 2 - SSO) / OH) * 100; // ≈ 35.22
            const SSB_PCT = ((OH / 2 + SSO) / OH) * 100; // ≈ 64.78
            const BB_PCT = ((OH - BI) / OH) * 100; //  ≈ 94.33

            let net = 0,
              mid = 0,
              back = 0;
            zones.forEach((z) => {
              const y = z.y;
              if (isBottom) {
                // y: 50(네트) → 100(백)
                if (y <= SSB_PCT)
                  net++; // 50 ~ 64.78
                else if (y <= BB_PCT)
                  mid++; // 64.78 ~ 94.33
                else back++; // 94.33 ~ 100
              } else {
                // y: 0(백) → 50(네트)
                if (y >= SST_PCT)
                  net++; // 35.22 ~ 50
                else if (y >= BT_PCT)
                  mid++; // 5.67 ~ 35.22
                else back++; // 0 ~ 5.67
              }
            });

            const total = zones.length || 1;
            const netPct = Math.round((net / total) * 100);
            const midPct = Math.round((mid / total) * 100);
            const backPct = Math.max(0, 100 - netPct - midPct);

            // 전→후 순차 단일 색상 (밝음→어두움)
            const rows = [
              { label: "네트 앞", pct: netPct, color: "#94a3b8" },
              { label: "미드 코트", pct: midPct, color: "#475569" },
              { label: "백 바운더리", pct: backPct, color: "#1e293b" },
            ];

            return rows.map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-500">
                    {label}
                  </span>
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color }}
                  >
                    {zones.length === 0 ? "—" : `${pct}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <MapPin
            className="size-3"
            style={{ color: accentText }}
            aria-hidden="true"
          />
          히트 포인트
          {zones.length > 0 && (
            <span className="ml-auto tabular-nums text-slate-400">
              {zones.length}개
            </span>
          )}
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {zones.length === 0
            ? "히트맵 데이터가 없습니다."
            : zones.some((z) => typeof z.time === "number")
              ? "코트 위 점을 클릭하면 영상의 해당 구간으로 이동합니다."
              : "이 영상에는 타격별 시간 정보가 없어 위치만 표시됩니다."}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {/* 그라디언트 바: 밀집도 낮음→높음. 밝은 끝이 흰 배경에 묻히지 않게 링 처리 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            낮음
          </span>
          <div
            className="flex-1 h-2 rounded-full ring-1 ring-inset ring-slate-900/10"
            style={{
              background: `linear-gradient(to right, ${heatRgb(0)}, ${heatRgb(1)})`,
            }}
          />
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            높음
          </span>
        </div>
        <span className="text-[10px] text-slate-400">샷 밀집도</span>
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
        style={{ width: "min(152px, 32%)", aspectRatio: `${VW} / ${VH}` }}
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

/**
 * 밀집도 계산 반경 (m). 이 반경 안의 타격을 "같은 자리"로 본다.
 */
const DENSITY_RADIUS_M = 1.2;

/**
 * 타격 지점 → 히트맵 존.
 *
 * intensity는 "그 지점 주변에 샷이 얼마나 몰렸는가"(국소 밀집도)다.
 * API가 주는 p.value는 스트로크 종류별 고정 가중치(스매시 0.95 / 네트 0.40 …)라
 * 밀집도가 아니다. 그대로 쓰면 혼자 있는 스매시가 진하게, 다섯 개 몰린 네트가
 * 연하게 나와서 범례("샷 밀집도")와 어긋난다. 그래서 여기서 좌표로 다시 센다.
 *
 * 반경 안의 이웃을 거리에 따라 감쇠시켜 합산한다(삼각 커널). 자기 자신이 1.0이라
 * 고립된 점은 1, 뭉친 점은 이웃 수만큼 커진다.
 */
function buildZones(points: HeatmapPoint[]): UiHeatmapZone[] {
  const density = points.map((p) => {
    let acc = 0;
    for (const q of points) {
      // x·y 모두 0~100이지만 코트는 정사각형이 아니다(6.10 × 13.40).
      // 정규화값 그대로 거리를 재면 세로가 2.2배 눌린 타원이 된다 → m로 환산.
      const dx = ((q.x - p.x) / 100) * COURT_M.width;
      const dy = ((q.y - p.y) / 100) * COURT_M.length;
      const d = Math.hypot(dx, dy);
      if (d < DENSITY_RADIUS_M) acc += 1 - d / DENSITY_RADIUS_M;
    }
    return acc;
  });

  // 정규화 기준에 하한 2를 둔다. 모든 샷이 흩어진 경기에서 peak가 1이 되면
  // 전부 최대 농도로 칠해져 "어디에도 안 몰렸다"는 정보가 사라진다.
  const peak = Math.max(2, ...density);

  return points.map((p, i) => ({
    x: p.x,
    y: p.y,
    intensity: Math.min(1, density[i] / peak),
    time: p.timeSec,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown briefing
// ─────────────────────────────────────────────────────────────────────────────

// 마크다운 헤딩(#~####) 기준으로 코칭 섹션 분리
function parseBriefingSections(md: string): { title: string; body: string }[] {
  const out: { title: string; body: string }[] = [];
  let cur: { title: string; body: string } | null = null;
  for (const raw of md.split("\n")) {
    const h = raw.match(/^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/);
    if (h) {
      if (cur) out.push(cur);
      const title = h[1]
        .replace(/^[0-9]+[.)]\s*/, "")
        .replace(/^[①-⑳]\s*/, "")
        .replace(/\*\*/g, "")
        .trim();
      cur = { title, body: "" };
    } else {
      if (!cur) cur = { title: "", body: "" };
      cur.body += raw + "\n";
    }
  }
  if (cur) out.push(cur);
  return out.filter((s) => s.title || s.body.trim());
}

// 섹션 제목 → 아이콘 + 시맨틱 색 (키워드 매칭)
function briefingSectionMeta(title: string): {
  icon: React.ReactNode;
  tint: string;
} {
  const t = title.toLowerCase();
  const I = (C: typeof Bot) => <C className="size-3.5" aria-hidden="true" />;
  if (/총평|한 줄|overview/.test(t))
    return { icon: I(Sparkles), tint: SEMANTIC_TINT.overview };
  if (/지표|요약|metric|summary/.test(t))
    return { icon: I(Activity), tint: SEMANTIC_TINT.metric };
  if (/강점|잘한|strength/.test(t))
    return { icon: I(TrendingUp), tint: SEMANTIC_TINT.strength };
  if (/보완|약점|개선|weak|improve/.test(t))
    return { icon: I(Target), tint: SEMANTIC_TINT.weakness };
  if (/훈련|추천|연습|drill|training/.test(t))
    return { icon: I(Dumbbell), tint: SEMANTIC_TINT.training };
  return { icon: I(Bot), tint: SEMANTIC_TINT.metric };
}

const BRIEFING_PROSE =
  "prose prose-sm max-w-none text-[13px] text-slate-700 leading-relaxed " +
  "[&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:my-0 [&_ul]:pl-4 [&_li]:list-disc [&_li]:mb-1 [&_li:last-child]:mb-0 [&_li]:text-slate-700 " +
  "[&_strong]:font-semibold [&_strong]:text-[#1a2b4c] [&_h1]:hidden [&_h2]:hidden [&_h3]:hidden";

function BriefingSections({
  content,
  accent,
}: {
  content: string;
  accent: string;
}) {
  if (!content)
    return (
      <p className="text-sm text-slate-400">AI 브리핑 데이터가 없습니다.</p>
    );

  const sections = parseBriefingSections(content);

  // 헤딩이 없으면 기존 프로즈 렌더로 폴백
  if (sections.length <= 1) {
    return (
      <div className={BRIEFING_PROSE}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sections.map((s, i) => {
        const meta = s.title
          ? briefingSectionMeta(s.title)
          : { icon: null, tint: accent };
        // "총평"은 폭 전체로
        const isOverview = /총평|한 줄|overview/.test(s.title.toLowerCase());
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-xl border border-slate-200/70 bg-white ${
              isOverview ? "sm:col-span-2" : ""
            }`}
            style={{ borderLeft: `3px solid ${meta.tint}` }}
          >
            {s.title && (
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${meta.tint}14`,
                    color: meta.tint,
                  }}
                >
                  {meta.icon}
                </span>
                <h4 className="text-xs font-semibold text-slate-900">
                  {s.title}
                </h4>
              </div>
            )}
            <div className={`px-4 py-3 ${BRIEFING_PROSE}`}>
              <ReactMarkdown>{s.body.trim()}</ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade system
// ─────────────────────────────────────────────────────────────────────────────

// 등급 색: 무지개 대신 3단계 시맨틱 (우수/보통/미흡)
const GRADE_THRESHOLDS: Array<{
  min: number;
  grade: string;
  color: string;
  bg: string;
}> = [
  { min: 85, grade: "S", color: "#047857", bg: "#ecfdf5" },
  { min: 70, grade: "A", color: "#047857", bg: "#ecfdf5" },
  { min: 50, grade: "B", color: "#b45309", bg: "#fffbeb" },
  { min: 30, grade: "C", color: "#be123c", bg: "#fff1f2" },
  { min: 0, grade: "D", color: "#be123c", bg: "#fff1f2" },
];

/**
 * 레이더 격자 링을 놓을 지점 — 등급 경계와 일치시킨다.
 * GRADE_THRESHOLDS의 min값(85·70·50·30)에 바깥 테두리 100을 더한 것.
 */
const GRADE_RING_TICKS = [30, 50, 70, 85, 100];

function scoreToGrade(value: number): {
  grade: string;
  color: string;
  bg: string;
} {
  for (const t of GRADE_THRESHOLDS) {
    if (value >= t.min) return { grade: t.grade, color: t.color, bg: t.bg };
  }
  return { grade: "D", color: "#be123c", bg: "#fff1f2" };
}

const ABILITY_DESCRIPTIONS: Record<string, string> = {
  공격성: "상대를 압박하고 주도권을 가져가는 성향",
  안정성: "실수 없이 경기를 안정적으로 풀어가는 능력",
  랠리력: "랠리를 길게 유지하며 버티는 지속력",
  기동력: "홈포지션으로의 빠른 리커버리 능력",
  수비력: "빠른 샷을 정확하게 받아내는 대처 능력",
};

/**
 * 스트로크 분포 — 도넛 + 범례.
 *
 * 막대가 아니라 도넛인 이유: 이 카드가 답하는 질문이 "전체 타수 중 무엇을
 * 얼마나 썼나"라는 구성비이기 때문이다. 막대로 그리면 한 번도 안 쓴 분류가
 * 빈 칸 + "0%"로 남아 오히려 눈에 띄는데, 도넛은 조각이 아예 생기지 않고
 * 범례에만 흐리게 남아 존재는 알리되 강조하지 않는다.
 *
 * 색은 선수색 한 계열의 명도 램프(strokeSliceColor)만 쓴다. 팔레트를 늘리지
 * 않으면서 조각을 구분하기 위해서다. 단계는 분류 순서에 고정 — 값 크기에 따라
 * 색이 바뀌면 선수를 바꿀 때마다 같은 스트로크가 다른 색이 된다.
 */
function StrokeDonut({
  rows,
  total,
  player,
  size = "sm",
}: {
  rows: { name: string; count: number }[];
  total: number;
  player: PlayerKey;
  size?: "sm" | "lg";
}) {
  const lg = size === "lg";
  // 카드용(sm)도 넉넉히 잡는다. 옆 능력치 카드와 높이를 맞추면 세로 여유가
  // 생기는데, 도넛이 작으면 그 공간이 그대로 빈자리로 남는다.
  const box = lg ? 200 : 164;
  const c = box / 2;
  const R = lg ? 82 : 68;
  const r = lg ? 52 : 43;

  // 조각 색: 분류 순서대로 진함 → 연함
  const colorOf = (i: number) => strokeSliceColor(player, i, rows.length);

  const drawn = rows
    .map((row, i) => ({ ...row, i }))
    .filter((row) => row.count > 0);
  const onlyOne = drawn.length === 1;

  let a0 = -Math.PI / 2;
  const slices = drawn.map((row) => {
    const ang = (row.count / total) * Math.PI * 2;
    const a1 = a0 + ang;
    const large = ang > Math.PI ? 1 : 0;
    const d = [
      `M ${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${large} 1 ${c + R * Math.cos(a1)} ${c + R * Math.sin(a1)}`,
      `L ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`,
      `A ${r} ${r} 0 ${large} 0 ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)}`,
      "Z",
    ].join(" ");
    a0 = a1;
    return { key: row.name, d, color: colorOf(row.i) };
  });

  return (
    <div className={`flex items-center ${lg ? "gap-8" : "gap-4"}`}>
      {/* 값은 옆 범례가 글자로 전부 전달하므로 그림은 보조 표현이다 */}
      <svg
        viewBox={`0 0 ${box} ${box}`}
        style={{ width: box }}
        className="shrink-0"
        aria-hidden="true"
      >
        {total === 0 ? (
          <circle
            cx={c}
            cy={c}
            r={(R + r) / 2}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={R - r}
          />
        ) : onlyOne ? (
          // 100% 한 조각은 호(arc)로 그리면 시작·끝이 같아 사라진다 → 링으로
          <circle
            cx={c}
            cy={c}
            r={(R + r) / 2}
            fill="none"
            stroke={colorOf(0)}
            strokeWidth={R - r}
          />
        ) : (
          slices.map((sl) => (
            <path
              key={sl.key}
              d={sl.d}
              fill={sl.color}
              stroke="#fff"
              strokeWidth="2"
            />
          ))
        )}
        <text
          x={c}
          y={c - (lg ? 2 : 1)}
          textAnchor="middle"
          className="fill-slate-900"
          fontSize={lg ? 30 : 25}
          fontWeight={700}
        >
          {total}
        </text>
        <text
          x={c}
          y={c + (lg ? 20 : 15)}
          textAnchor="middle"
          className="fill-slate-400"
          fontSize={lg ? 13 : 11}
        >
          총 타수
        </text>
      </svg>

      <ul className={`min-w-0 flex-1 ${lg ? "space-y-2.5" : "space-y-2"}`}>
        {rows.map((row, i) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
          const zero = row.count === 0;
          return (
            <li
              key={row.name}
              className={`grid grid-cols-[0.5rem_1fr_auto] items-center gap-2.5 ${
                lg ? "text-sm" : "text-xs"
              }`}
            >
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: zero ? "#e2e8f0" : colorOf(i) }}
                aria-hidden="true"
              />
              <span
                className={`truncate font-medium ${
                  zero ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {row.name}
              </span>
              <span
                className={`tabular-nums ${
                  zero
                    ? "font-medium text-slate-300"
                    : "font-bold text-slate-900"
                }`}
              >
                {row.count}회{" "}
                <span
                  className={`${lg ? "text-xs" : "text-[10px]"} font-medium ${
                    zero ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {pct}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * 능력치 요약 칩 + 설명 슬롯.
 *
 * 원점수(0~100)를 노출하지 않는 이유: 산출식이 정밀하지 않은데 두 자리 숫자를
 * 내걸면 실제보다 정확한 척이 된다. 등급(S~D)은 같은 정보를 과장 없이 전한다.
 *
 * 항목 설명은 예전엔 확대해야만 보였다. 칩마다 말풍선을 띄우는 대신 아래에
 * 고정 슬롯을 두고 hover·focus한 항목의 설명을 채운다. 좁은 카드에서 말풍선이
 * 넘치지 않고, 키보드로도 읽히며, 아무것도 안 건드렸을 때는 가장 낮은 등급
 * 항목을 기본으로 보여줘서 hover 없이도 쓸모가 있다.
 */
function AbilityChips({ items }: { items: { name: string; value: number }[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const weakest = items.reduce(
    (lo, a) => (a.value < lo.value ? a : lo),
    items[0],
  );
  const shown = hovered ?? weakest?.name ?? "";

  return (
    <div className="mt-auto">
      <div className="grid grid-cols-5 gap-1.5">
        {items.map((a) => {
          const { grade, color, bg } = scoreToGrade(a.value);
          const active = shown === a.name;
          return (
            <button
              key={a.name}
              type="button"
              onMouseEnter={() => setHovered(a.name)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(a.name)}
              onBlur={() => setHovered(null)}
              aria-label={`${a.name} ${grade}등급. ${
                ABILITY_DESCRIPTIONS[a.name] ?? ""
              }`}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40 ${
                active ? "bg-slate-100" : "bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <span className="text-[10px] font-medium text-slate-400">
                {a.name}
              </span>
              <span
                className="flex size-6 items-center justify-center rounded-lg text-xs font-bold"
                style={{ color, background: bg }}
              >
                {grade}
              </span>
            </button>
          );
        })}
      </div>
      {/* 높이를 고정해 hover할 때 카드가 흔들리지 않게 한다 */}
      <p className="mt-3 min-h-[3rem] text-xs leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-800">{shown}</span>
        {shown ? " · " : ""}
        {ABILITY_DESCRIPTIONS[shown] ?? ""}
      </p>
    </div>
  );
}

function AbilityGradeCard({ label, value }: { label: string; value: number }) {
  const { grade, color, bg } = scoreToGrade(value);
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md min-w-[32px] text-center"
          style={{ color, background: bg }}
        >
          {grade}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-snug">
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
  const {
    value,
    payload: { name },
  } = payload[0];
  const { grade, color, bg } = scoreToGrade(value);
  return (
    <div className="max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
        {name}
        <span
          className="rounded-md px-2 py-0.5 text-xs font-bold"
          style={{ color, background: bg }}
        >
          {grade}
        </span>
      </p>
      <p className="text-[11px] leading-relaxed text-slate-500">
        {ABILITY_DESCRIPTIONS[name] ?? ""}
      </p>
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

  const [briefings, setBriefings] = useState<Record<PlayerKey, string>>(() => ({
    top: readBriefingCache(videoId, "top") ?? "",
    bottom: readBriefingCache(videoId, "bottom") ?? "",
  }));
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  // /videos/{id} 의 matchSummary — 랠리 집계 폴백용
  const [videoMatchSummary, setVideoMatchSummary] =
    useState<MatchSummary | null>(null);

  // 캐시 무시하고 브리핑 재생성 (수동)
  const handleRegenerateBriefing = () => {
    try {
      localStorage.removeItem(briefingCacheKey(videoId, activePlayer));
    } catch {
      /* noop */
    }
    setBriefings((prev) => ({ ...prev, [activePlayer]: "" }));
  };

  // 점수 수정
  const [rallyDetailOpen, setRallyDetailOpen] = useState(false);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editMyScore, setEditMyScore] = useState(0);
  const [editOpponentScore, setEditOpponentScore] = useState(0);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaveError, setScoreSaveError] = useState<string | null>(null);

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

  const handleScoreEditOpen = () => {
    if (!report) return;
    setEditMyScore(report.data.summary.myScore ?? 0);
    setEditOpponentScore(report.data.summary.opponentScore ?? 0);
    setScoreSaveError(null);
    setIsEditingScore(true);
  };

  const handleScoreCancel = () => {
    setIsEditingScore(false);
    setScoreSaveError(null);
  };

  const handleScoreSave = async () => {
    if (!report) return;
    setIsSavingScore(true);
    setScoreSaveError(null);
    try {
      await updateMatchScore(videoId, editOpponentScore, editMyScore);
      const newOutcome =
        editOpponentScore > editMyScore
          ? "TOP_WIN"
          : editMyScore > editOpponentScore
            ? "BOTTOM_WIN"
            : "DRAW";
      setReport((prev) =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                summary: {
                  ...prev.data.summary,
                  myScore: editMyScore,
                  opponentScore: editOpponentScore,
                  matchOutcome: newOutcome,
                  unknownRallies: 0,
                },
              },
            }
          : prev,
      );
      setIsEditingScore(false);
    } catch {
      setScoreSaveError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSavingScore(false);
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

  // ── 영상 상세: 제목 + 랠리 집계 폴백 ────────────────────────
  // 분석 API(/analysis)는 랠리 수를 안 내려주는 경우가 있어, 영상 페이지가 쓰는
  // /videos/{id} 의 matchSummary 를 폴백 소스로 사용한다.
  useEffect(() => {
    let alive = true;
    fetchVideoDetail(String(videoId))
      .then((d) => {
        if (!alive) return;
        setVideoTitle(d.videoInfo?.title ?? null);
        setVideoMatchSummary(d.matchSummary ?? null);
      })
      .catch(() => {
        /* 없으면 분석 API 값만 사용 */
      });
    return () => {
      alive = false;
    };
  }, [videoId]);

  // ── Generate AI briefing (localStorage 캐시: videoId+player 별 1회만 호출) ──
  useEffect(() => {
    if (!report) return;

    // 1) 메모리에 이미 있으면 → 호출 안 함
    if (briefings[activePlayer]) return;

    // 2) localStorage 캐시 확인 → 있으면 Gemini 호출 없이 그대로 사용 (토큰 절약)
    const cached = readBriefingCache(videoId, activePlayer);
    if (cached) {
      setBriefings((prev) => ({ ...prev, [activePlayer]: cached }));
      return;
    }

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
        // 화면에 그리는 분류와 같은 기준으로 집계한다.
        // (업로드 유형에 따라 아마추어 4종 / 프로 6종)
        const promptMode = resolveStrokeMode(report.data.modeHints, [
          report.data.players.bottom.strokeTypes,
          report.data.players.top.strokeTypes,
        ]);
        const promptStrokes = STROKE_TAXONOMY[promptMode].map(
          ({ key, label }) => ({
            label,
            count: Number(stroke[key]) || 0,
          }),
        );
        const playerStrokeTotal = promptStrokes.reduce(
          (a, x) => a + x.count,
          0,
        );

        const prompt = `
당신은 전문 배드민턴 코치입니다.
아래 데이터는 경기 영상에서 분석한 [${playerLabel}] 개인의 데이터입니다.

[경기 전체 개요 — 참고용, 개인 수치 아님]
- 경기 결과(Bottom 기준): ${summary.matchOutcome} (Bottom ${summary.myScore} : Top ${summary.opponentScore})
- 총 경기 시간: ${summary.matchTime}
- 양측 합산 총 스트로크: ${summary.totalStrokeCount}회

[${playerLabel} 개인 스트로크]
- 개인 스트로크 합계: ${playerStrokeTotal}회
- 분류 체계: ${promptMode === "pro" ? "프로 6종" : "아마추어 4종"}
- ${promptStrokes.map((x) => `${x.label}: ${x.count}회`).join(", ")}

[${playerLabel} 능력치 등급 (S > A > B > C > D)]
- 공격성 ${abilityGrades.aggression}등급: 전체 타격 중 스매시 비율
- 랠리력 ${abilityGrades.rally}등급: 랠리 지속력 및 지구력
- 수비력 ${abilityGrades.defense}등급: 빠른 반응 속도
- 기동력 ${abilityGrades.mobility}등급: 코트 커버리지
- 안정성 ${abilityGrades.consistency}등급: 실책 없이 안정적으로 플레이하는 능력

[기존 코치 피드백]
${coaching?.feedbackText ?? "(없음)"}

[출력 형식 — 반드시 지킬 것]
- 아래 5개 섹션을 정확히 이 순서로, 각 섹션 제목은 마크다운 H2(\`## \`)로 시작한다. 제목 텍스트는 예시 그대로 사용한다.
  ## 총평
  ## 핵심 지표
  ## 강점
  ## 보완점
  ## 추천 훈련
- "총평"은 2~3문장. "핵심 지표"는 불릿 3~5개. "강점"·"보완점"은 각각 불릿 2개. "추천 훈련"은 불릿 3개.
- 각 섹션 본문은 짧고 모바일 친화적으로. 섹션 제목 외에는 H1/H2/H3를 쓰지 않는다.
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
        const finalText = text || "";
        setBriefings((prev) => ({ ...prev, [activePlayer]: finalText }));
        if (finalText) writeBriefingCache(videoId, activePlayer, finalText);
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
  }, [report, activePlayer, videoId, briefings]);

  // ── Derived UI data ───────────────────────────────────────────────────────
  const ui = useMemo(() => {
    if (!report) return null;
    const summary = report.data.summary;
    const playerData = report.data.players[activePlayer];
    const heatmapZones = buildZones(playerData.positionAnalysis.heatmapData);
    // 스트로크 분류 — 업로드 유형(아마추어 4종 / 프로 6종)에 따라 달라진다.
    // 양쪽 선수는 같은 영상이므로 mode도 하나다.
    const strokeMode = resolveStrokeMode(report.data.modeHints, [
      report.data.players.bottom.strokeTypes,
      report.data.players.top.strokeTypes,
    ]);
    const strokeData = STROKE_TAXONOMY[strokeMode].map(({ key, label }) => ({
      name: label,
      count: Number(playerData.strokeTypes[key]) || 0,
    }));
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
    const accentColor = PLAYER_COLOR[activePlayer];        // 막대·점 등 색면
    const accentText = PLAYER_COLOR_STRONG[activePlayer];  // 글자·아이콘 (AA)

    // ── 양 선수 스트로크 합계 (경기 요약 카드: 점유율 비교용) ──
    // 카드에 그리는 분류와 같은 기준으로 세야 "총 N회"가 서로 어긋나지 않는다.
    const sumStrokes = (p: (typeof report.data.players)["top"]) =>
      STROKE_TAXONOMY[strokeMode].reduce(
        (sum, { key }) => sum + (Number(p.strokeTypes[key]) || 0),
        0,
      );
    const bottomStrokes = sumStrokes(report.data.players.bottom);
    const topStrokes = sumStrokes(report.data.players.top);
    const strokeTotalBoth = bottomStrokes + topStrokes;
    const bottomSharePct =
      strokeTotalBoth > 0
        ? Math.round((bottomStrokes / strokeTotalBoth) * 100)
        : 50;

    // ── 랠리 지표 ──
    // 랠리 스코어링(매 랠리마다 1점)이므로 총 랠리 = 양측 점수 합.
    // 점수가 아직 0:0이면 API/영상 상세 값으로 폴백.
    const scoreRallies = (summary.myScore ?? 0) + (summary.opponentScore ?? 0);
    const totalRallies =
      scoreRallies > 0
        ? scoreRallies
        : summary.totalRallies || videoMatchSummary?.totalRallies || 0;
    const unknownRallies =
      summary.unknownRallies || videoMatchSummary?.unknownRallies || 0;

    // 랠리당 평균 시간 = 총 경기 시간 / 총 랠리
    const matchSeconds = parseTimeToSeconds(summary.matchTime);
    const secondsPerRally =
      matchSeconds != null && totalRallies > 0
        ? matchSeconds / totalRallies
        : null;

    // 랠리당 평균 타수 = 총 스트로크 / 총 랠리
    const strokesPerRally =
      totalRallies > 0
        ? Math.round(((summary.totalStrokeCount ?? 0) / totalRallies) * 10) / 10
        : null;

    // ── 선택 선수의 주 스트로크 (기타 제외) ──
    // 건수 축: 소수 눈금 없이, 총량에 따라 단위가 자동으로 커진다.
    // 카드/확대 모달 양쪽이 같은 눈금을 써야 하므로 여기서 한 번만 계산한다.

    const namedStrokes = strokeData.filter((s) => s.name !== "기타");
    const playerStrokeTotal = strokeData.reduce((a, s) => a + s.count, 0);
    const topStroke = namedStrokes.reduce(
      (best, s) => (s.count > best.count ? s : best),
      namedStrokes[0] ?? { name: "-", count: 0 },
    );

    return {
      summary,
      heatmapZones,
      strokeMode,
      strokeData,
      abilityData,
      accentColor,
      accentText,
      bottomStrokes,
      topStrokes,
      bottomSharePct,
      totalRallies,
      unknownRallies,
      secondsPerRally,
      strokesPerRally,
      topStroke,
      playerStrokeTotal,
    };
  }, [report, activePlayer, videoMatchSummary]);

  useEffect(() => {
    setSelectedHeatmapPoint(null);
  }, [activePlayer]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo
          user={user}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* 사이드바 스켈레톤 */}
          <aside className="relative flex flex-col bg-white border-r border-slate-200 w-60 shrink-0">
            <div className="px-3 pt-5 pb-3 border-b border-slate-200/70">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="space-y-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-9 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="px-3 pt-4 pb-3 flex-1">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="space-y-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 스켈레톤 */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-10">
              <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse mb-6" />

              <div className="space-y-6">
                {/* 경기 결과 요약 스켈레톤 */}
                <SkeletonSummary />

                {/* 플레이어 인디케이터 */}
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />

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
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              분석 리포트 준비 중
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
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
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
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

  const {
    summary,
    heatmapZones,
    strokeMode,
    strokeData,
    abilityData,
    accentColor,
    accentText,
    bottomStrokes,
    topStrokes,
    bottomSharePct,
    totalRallies,
    unknownRallies,
    secondsPerRally,
    strokesPerRally,
    topStroke,
    playerStrokeTotal,
  } = ui;
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
        <Target className="size-4 shrink-0" style={{ color: accentText }} />
      ),
    },
    {
      id: "stroke",
      label: "스트로크 분포",
      icon: <Zap className="size-4 shrink-0 text-slate-400" />,
    },
    {
      id: "ability",
      label: "능력치 분석",
      icon: <Award className="size-4 shrink-0 text-slate-400" />,
    },
    {
      id: "briefing",
      label: "AI 브리핑",
      icon: <Bot className="size-4 shrink-0 text-[#1a2b4c]" />,
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          className={`shrink-0 transition-[width] duration-300 ease-in-out ${sidebarOpen ? "w-60" : "w-14"}`}
          aria-hidden="true"
        />

        <aside
          className={`
            fixed left-0 top-16 z-30
            flex flex-col bg-white
            border-r border-slate-200/70
            shadow-[2px_0_24px_rgba(15,23,42,0.05)]
            transition-[width] duration-300 ease-in-out
            h-[calc(100vh-64px)] overflow-hidden
            ${sidebarOpen ? "w-60" : "w-14"}
          `}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* ── '분석 리포트' 라벨 + 접기 토글 (같은 행) ── */}
            <div
              className={`flex items-center pt-2 ${sidebarOpen ? "justify-between px-3" : "justify-end px-2"}`}
            >
              {sidebarOpen && (
                <p className="pl-1 text-[11px] font-medium text-slate-400">
                  분석 리포트
                </p>
              )}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                aria-expanded={sidebarOpen}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="size-4" aria-hidden="true" />
                ) : (
                  <PanelLeftOpen className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* ── 영상 제목 (제목 자리) ── */}
            {sidebarOpen && (
              <div className="px-4 pt-1 pb-3 border-b border-slate-200/70">
                {videoTitle ? (
                  <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-3">
                    {videoTitle}
                  </h1>
                ) : (
                  <div className="h-5 w-4/5 rounded bg-slate-100 animate-pulse" />
                )}
              </div>
            )}

            {/* ── 네비게이션 ── */}
            <div
              className={`px-3 pt-2 pb-3 border-b border-slate-200/70 ${sidebarOpen ? "" : "px-2"}`}
            >
              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.isCurrent ? undefined : item.action}
                    disabled={item.isCurrent}
                    className={`relative w-full flex items-center gap-2.5 rounded-lg transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${
                      item.isCurrent
                        ? `bg-[#1a2b4c]/[0.09] text-[#1a2b4c] font-semibold ring-1 ring-inset ring-[#1a2b4c]/10 cursor-default ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`
                        : `text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    {item.isCurrent && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#8ce600]" />
                    )}
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
                <p className="text-[11px] font-semibold text-slate-400 mb-2 px-1">
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
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
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
                <div className="mt-4 pt-4 border-t border-slate-200/70">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2 px-1">
                    플레이어
                  </p>
                  <PlayerToggle
                    active={activePlayer}
                    onChange={(k) => setActivePlayer(k)}
                    variant="compact"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 계정 관리 */}
          <div
            className={`shrink-0 border-t border-slate-200/70 p-3 ${sidebarOpen ? "" : "px-2"}`}
          >
            <button
              onClick={() => onNavigate("account")}
              className={`w-full flex items-center gap-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
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
            className={`shrink-0 border-t border-slate-200/70 p-3 ${sidebarOpen ? "" : "px-2"}`}
          >
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
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
          <div className="max-w-6xl mx-auto px-6 py-8 lg:py-10">
            <div className="space-y-5">
              {/* ── 페이지 헤더 ── */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    분석 리포트
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    {videoTitle ?? "경기 분석"}
                  </h1>
                </div>
                <PlayerToggle
                  active={activePlayer}
                  onChange={(k) => setActivePlayer(k)}
                />
              </div>

              {/* ── 경기 요약 + 히트맵: 가로 2단 ── */}
              <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
              <section
                id="section-summary"
                className="flex flex-col rounded-2xl border border-slate-200/70 bg-white scroll-mt-6 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Users className="size-3.5" aria-hidden="true" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      경기 요약
                    </h2>
                  </div>
                  {!isEditingScore && (
                    <button
                      onClick={handleScoreEditOpen}
                      className="flex items-center gap-1 text-xs text-slate-400
                                 border border-slate-200/70 rounded-lg px-2.5 py-1.5
                                 hover:bg-slate-50 hover:text-slate-600 transition-colors
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                    >
                      <Pencil className="size-3" aria-hidden="true" />
                      점수 수정
                    </button>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-5 py-4">
                  {isEditingScore ? (
                    /* ── 수정 모드 ── */
                    <div className="flex flex-col items-center gap-5">
                      <div className="flex items-center justify-center gap-5">
                        {(
                          [
                            {
                              label: "Bottom",
                              val: editMyScore,
                              setVal: setEditMyScore,
                              color: PLAYER_COLOR.bottom,
                            },
                            {
                              label: "Top",
                              val: editOpponentScore,
                              setVal: setEditOpponentScore,
                              color: PLAYER_COLOR.top,
                            },
                          ] as const
                        ).map(({ label, val, setVal, color }) => (
                          <div
                            key={label}
                            className="flex flex-col items-center gap-2"
                          >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <span
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              />
                              {label}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setVal((v: number) => Math.max(0, v - 1))
                                }
                                aria-label={`${label} 점수 1 감소`}
                                className="w-6 h-6 rounded-lg border border-slate-200 text-slate-500
                                           hover:bg-slate-100 flex items-center justify-center
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={30}
                                value={val}
                                inputMode="numeric"
                                aria-label={`${label} 점수`}
                                onChange={(e) =>
                                  setVal(
                                    Math.max(
                                      0,
                                      Math.min(30, Number(e.target.value)),
                                    ),
                                  )
                                }
                                className="w-16 text-center text-4xl font-bold tabular-nums
                                           border-b-2 border-[#1a2b4c] bg-transparent outline-none
                                           focus-visible:border-[#8ce600]
                                           [appearance:textfield]
                                           [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() =>
                                  setVal((v: number) => Math.min(30, v + 1))
                                }
                                aria-label={`${label} 점수 1 증가`}
                                className="w-6 h-6 rounded-lg border border-slate-200 text-slate-500
                                           hover:bg-slate-100 flex items-center justify-center
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {scoreSaveError && (
                        <p role="alert" className="text-xs text-red-500">
                          {scoreSaveError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleScoreCancel}
                          className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500
                                     border border-slate-200 rounded-lg hover:bg-slate-50
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                          취소
                        </button>
                        <button
                          onClick={handleScoreSave}
                          disabled={isSavingScore}
                          className="flex items-center gap-1 px-4 py-2 text-sm text-white
                                     bg-[#1a2b4c] rounded-lg hover:bg-[#243a63] disabled:opacity-50
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/50 focus-visible:ring-offset-1"
                        >
                          {isSavingScore ? (
                            <Loader2
                              className="size-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="size-3.5" aria-hidden="true" />
                          )}
                          {isSavingScore ? "저장 중…" : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 표시 모드: 결과 배너 → 점유율 → 경기 지표 ── */
                    <>
                      {/* 결과 배너 (스코어는 작게) */}
                      {(() => {
                        const topWon =
                          summary.matchOutcome === "TOP_WIN" ||
                          summary.matchOutcome === "LOSE";
                        const bottomWon =
                          summary.matchOutcome === "BOTTOM_WIN" ||
                          summary.matchOutcome === "WIN";
                        const winColor = topWon
                          ? PLAYER_COLOR.top
                          : bottomWon
                            ? PLAYER_COLOR.bottom
                            : NEUTRAL_MARK;
                        const winTint = topWon
                          ? PLAYER_TINT.top
                          : bottomWon
                            ? PLAYER_TINT.bottom
                            : "#f1f5f9";
                        return (
                          <div
                            className="flex items-center justify-between rounded-xl px-3.5 py-3"
                            style={{
                              backgroundColor: winTint,
                              boxShadow: `inset 3px 0 0 ${winColor}`,
                            }}
                          >
                            <span className="text-sm font-bold text-slate-900">
                              {topWon
                                ? "Top 승"
                                : bottomWon
                                  ? "Bottom 승"
                                  : "무승부"}
                            </span>
                            <span className="flex items-baseline gap-1.5 text-sm font-bold tabular-nums">
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: PLAYER_COLOR_STRONG.bottom }}
                              >
                                B
                              </span>
                              <span className="text-slate-900">
                                {summary.myScore}
                              </span>
                              <span className="text-slate-300">:</span>
                              <span className="text-slate-900">
                                {summary.opponentScore}
                              </span>
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: PLAYER_COLOR_STRONG.top }}
                              >
                                T
                              </span>
                            </span>
                          </div>
                        );
                      })()}

                      {/* 스트로크 점유율 — 양 선수 비교 (다른 카드와 중복 없음) */}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Zap className="size-3" aria-hidden="true" />
                            스트로크 점유율
                          </p>
                          <p className="text-[11px] font-semibold tabular-nums text-slate-400">
                            총 {summary.totalStrokeCount}회
                          </p>
                        </div>
                        <div
                          className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
                          role="img"
                          aria-label={`스트로크 점유율: Bottom ${bottomStrokes}회, Top ${topStrokes}회`}
                        >
                          <span
                            className="rounded-full transition-[width] duration-500"
                            style={{
                              width: `${bottomSharePct}%`,
                              backgroundColor: PLAYER_COLOR.bottom,
                            }}
                          />
                          <span
                            className="flex-1 rounded-full"
                            style={{ backgroundColor: PLAYER_COLOR.top }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: PLAYER_COLOR.bottom }}
                            />
                            <span className="font-medium text-slate-500">
                              Bottom
                            </span>
                            <span className="font-bold tabular-nums text-slate-700">
                              {bottomStrokes}회
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold tabular-nums text-slate-700">
                              {topStrokes}회
                            </span>
                            <span className="font-medium text-slate-500">
                              Top
                            </span>
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: PLAYER_COLOR.top }}
                            />
                          </span>
                        </div>
                      </div>

                      {/* 경기 지표 */}
                      <dl className="mt-4 border-t border-slate-100 divide-y divide-slate-100">
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Clock className="size-3" aria-hidden="true" />
                            경기 시간
                          </dt>
                          <dd className="text-sm font-bold tabular-nums text-slate-900">
                            {summary.matchTime}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Activity className="size-3" aria-hidden="true" />총
                            랠리
                          </dt>
                          <dd className="text-sm font-bold tabular-nums text-slate-900">
                            {totalRallies}회
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2.5">
                          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <TrendingUp className="size-3" aria-hidden="true" />
                            랠리당 평균 시간
                          </dt>
                          <dd className="text-sm font-bold tabular-nums text-slate-900">
                            {secondsPerRally != null
                              ? formatDurationKo(secondsPerRally)
                              : "—"}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between py-2.5 last:pb-0">
                          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                            <Zap className="size-3" aria-hidden="true" />
                            랠리당 평균 타수
                          </dt>
                          <dd className="text-sm font-bold tabular-nums text-slate-900">
                            {strokesPerRally != null ? `${strokesPerRally}타` : "—"}
                          </dd>
                        </div>
                      </dl>

                      {/* 미확정 뱃지 + 랠리결과 토글 */}
                      {unknownRallies > 0 && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                          <div className="relative group">
                            <span
                              className="text-[11px] font-semibold text-amber-700
                                             bg-amber-50 border border-amber-200
                                             rounded-full px-2.5 py-0.5 tabular-nums cursor-default"
                            >
                              +{unknownRallies}개 미확정
                            </span>
                            <div
                              className="absolute bottom-7 left-1/2 -translate-x-1/2 w-56
                                            bg-slate-900 text-white text-[11px] leading-relaxed
                                            rounded-xl px-3 py-2.5 shadow-lg z-20
                                            opacity-0 group-hover:opacity-100 transition-opacity
                                            pointer-events-none"
                            >
                              인/아웃 판정이 불확실해 점수에 반영되지 않은
                              랠리입니다.
                              <span className="block mt-1 text-slate-400 tabular-nums">
                                전체 {totalRallies}개 중{" "}
                                {unknownRallies}개 미확정
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setRallyDetailOpen((v) => !v)}
                            className="flex items-center gap-1 text-[11px] text-slate-500
                                       hover:text-slate-700 px-2 py-0.5 rounded-md
                                       hover:bg-slate-100 transition-colors"
                          >
                            랠리 결과
                            <ChevronDown
                              className={`size-3 transition-transform duration-200
                                ${rallyDetailOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 인라인 랠리 결과 아코디언 */}
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out
                    ${rallyDetailOpen ? "max-h-48" : "max-h-0"}`}
                >
                  <div className="border-t border-slate-200/70 px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold text-slate-400">
                        랠리별 판정 결과
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        총 {totalRallies}랠리
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between py-2 px-3
                                    bg-slate-50 rounded-xl text-[11px] text-slate-500"
                    >
                      <span>
                        확인됨{" "}
                        <span className="font-bold text-slate-700 tabular-nums">
                          {totalRallies - unknownRallies}
                        </span>
                        개
                      </span>
                      <span className="w-px h-3 bg-slate-200" />
                      <span>
                        미확정{" "}
                        <span className="font-bold text-amber-700 tabular-nums">
                          {unknownRallies}
                        </span>
                        개
                      </span>
                      <span className="w-px h-3 bg-slate-200" />
                      <span className="text-slate-400">
                        개별 판정 상세는 추후 지원 예정
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 3. Heatmap ── */}
              <div id="section-heatmap" className="scroll-mt-6">
                <CollapsibleCard
                  title="히트맵"
                  icon={<Target aria-hidden="true" />}
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
              </div>
              {/* ── 경기 요약 + 히트맵 끝 ── */}

              {/* ── 4. Stroke + Ability ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div id="section-stroke" className="h-full scroll-mt-6">
                  <CollapsibleCard
                    title="스트로크 분포"
                    icon={<Zap aria-hidden="true" />}
                    onExpand={() => setExpandedPanel("stroke")}
                  >
                    {/* 분류 종류 수는 업로드 유형에 따라 4종/6종으로 달라진다 */}
                    <div className="flex flex-1 items-center justify-center min-h-[160px]">
                    <StrokeDonut
                      rows={strokeData}
                      total={playerStrokeTotal}
                      player={activePlayer}
                    />
                    </div>

                    {/* 인사이트 요약 */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        주 스트로크
                      </span>
                      <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-900 ring-1 ring-slate-200">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                          aria-hidden="true"
                        />
                        {topStroke.name}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-slate-700">
                        {topStroke.count}회
                      </span>
                      {/* 총 타수는 도넛 가운데에 있으므로 여기서는 빼고,
                          분류 체계만 밝힌다. */}
                      <span className="ml-auto text-[11px] font-semibold text-slate-400">
                        {strokeMode === "pro" ? "프로 6종" : "아마추어 4종"}
                      </span>
                    </div>
                  </CollapsibleCard>
                </div>

                <div id="section-ability" className="h-full scroll-mt-6">
                  <CollapsibleCard
                    title="능력치 분석"
                    icon={<Award aria-hidden="true" />}
                    onExpand={() => setExpandedPanel("ability")}
                  >
                    <div
                      className="mb-3 flex min-h-[220px] flex-1 items-center justify-center"
                      role="img"
                      aria-label={`능력치 등급 레이더 차트. ${abilityData
                        .map((a) => `${a.name} ${scoreToGrade(a.value).grade}등급`)
                        .join(", ")}`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={abilityData} outerRadius="68%">
                          {/* 격자가 너무 옅으면 오각형이 허공에 뜬 것처럼 보인다 */}
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                          />
                          {/* 축을 0~100으로 고정하고, 링을 등급 경계(30·50·70·85)에
                              놓는다. 이러면 격자가 단순 눈금이 아니라 "어느 등급
                              구간에 있나"를 읽는 기준선이 된다.
                              (없으면 recharts가 그 선수의 최댓값에 맞춰 자동
                              스케일해서 전 항목 40점대인 선수도 꽉 차 보인다) */}
                          <PolarRadiusAxis
                            domain={[0, 100]}
                            ticks={GRADE_RING_TICKS}
                            tick={false}
                            axisLine={false}
                          />
                          <Radar
                            name="능력치"
                            dataKey="value"
                            stroke={accentColor}
                            strokeWidth={2}
                            fill={accentColor}
                            fillOpacity={0.32}
                            dot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
                          />
                          <Tooltip content={<RadarTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <AbilityChips items={abilityData} />
                  </CollapsibleCard>
                </div>
              </div>

              {/* ── 5. AI Briefing ── */}
              <section
                id="section-briefing"
                className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden scroll-mt-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#1a2b4c]/[0.08] text-[#1a2b4c]">
                      <Bot className="size-3.5" aria-hidden="true" />
                    </span>
                    AI 브리핑
                    <span className="ml-1 flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900 ring-1 ring-slate-200">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: PLAYER_COLOR[activePlayer] }}
                        aria-hidden="true"
                      />
                      {isBottom ? "Bottom Player" : "Top Player"}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {aiBriefing && !briefingLoading && (
                      <button
                        type="button"
                        onClick={handleRegenerateBriefing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                        title="AI 브리핑 다시 생성 (토큰 사용)"
                      >
                        <RefreshCw className="size-3" aria-hidden="true" />
                        다시 생성
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedPanel("briefing")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                    >
                      <Maximize2 className="size-3" aria-hidden="true" />
                      확대
                    </button>
                  </div>
                </div>
                <div className="p-5">
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
                        style={{ color: accentText }}
                      >
                        AI가 리포트를 요약 중입니다…
                      </span>
                    </div>
                  )}
                  {briefingError && (
                    <p className="text-sm text-red-600">
                      브리핑 생성 실패: {briefingError}
                    </p>
                  )}
                  {!briefingLoading && !briefingError && (
                    <BriefingSections
                      content={aiBriefing}
                      accent={accentText}
                    />
                  )}
                  <p className="mt-4 text-[11px] text-slate-400">
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
        <p className="mb-5 text-sm text-slate-500">
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
        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">
            {strokeMode === "pro"
              ? "프로 분류 6종 (서브 · 로브 · 스매시 · 드롭 · 드라이브 · 클리어)"
              : "아마추어 분류 4종 (서브 · 스매시 · 클리어 · 드라이브)"}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            주 스트로크 {topStroke.name} {topStroke.count}회
          </span>
        </div>
        <StrokeDonut
          rows={strokeData}
          total={playerStrokeTotal}
          player={activePlayer}
          size="lg"
        />
      </Modal>

      <Modal
        open={expandedPanel === "ability"}
        title="능력치 분석 상세"
        onClose={() => setExpandedPanel(null)}
      >
        <div className="h-[320px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={abilityData} outerRadius="72%">
              <PolarGrid stroke="#dbe4f0" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: "#475569" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                ticks={GRADE_RING_TICKS}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="능력치"
                dataKey="value"
                stroke={accentColor}
                strokeWidth={2}
                fill={accentColor}
                fillOpacity={0.32}
                dot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
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
          <p className="text-sm animate-pulse" style={{ color: accentText }}>
            AI가 리포트를 요약 중입니다…
          </p>
        )}
        {briefingError && (
          <p className="text-sm text-red-600">
            브리핑 생성 실패: {briefingError}
          </p>
        )}
        {!briefingLoading && !briefingError && (
          <BriefingSections content={aiBriefing} accent={accentText} />
        )}
      </Modal>
    </div>
  );
}
