import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Trophy,
  Target,
  Clock,
  Loader2,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Video,
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  Map,
  Flame,
  Star,
  Timer,
  ArrowUp,
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Minus,
  Circle,
  MoreHorizontal,
  Pencil,
  Info,
  Check,
  X,
  Maximize,
  Minimize,
} from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchVideoDetail,
  updateMatchScore,
  type VideoInfo,
  type MatchSummary,
  type ApiTimelineEvent,
} from "../api/videoApi";
import { Footer } from "./ui/footer";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface VideoPlayerPageProps {
  videoId: string;
  /** 히트맵/타임라인에서 넘어올 때 재생을 시작할 지점(초). URL의 ?t= 값 */
  startTime?: number | null;
  onBack?: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserInfo;
}

interface Highlight {
  id: string;
  type: "score" | "rally" | "smash";
  time: number;
  label: string;
  description: string;
}

/** 타격 하이라이트가 켜져 있는 시간(초). 이 안에 다음 타격이 오면 그쪽으로 넘어간다. */
const HIGHLIGHT_HOLD_SEC = 2;

/** 목록을 직접 스크롤한 뒤 자동 따라가기를 쉬는 시간(ms). */
const AUTO_SCROLL_PAUSE_MS = 5000;

// ── 스트로크 필터 카테고리 ──────────────────────────────────
type StrokeFilter =
  | "all"
  | "smash"
  | "clear"
  | "lob"
  | "drop"
  | "drive"
  | "serve"
  | "net"
  | "other";

// TOP 3 하이라이트 클립 타입 (7초 클립 정보 포함)
interface HighlightClip {
  id: string;
  rank: 1 | 2 | 3;
  type: "smash" | "score" | "rally";
  time: number;
  clipStart: number;
  clipEnd: number;
  label: string;
  description: string;
}

type VideoMode = "original" | "analyzed";

// ─────────────────────────────────────────────────────────────
// pickTop3 — smash > score > rally 우선순위, 3초 중복 제거
// ─────────────────────────────────────────────────────────────
function pickTop3(highlights: Highlight[]): HighlightClip[] {
  const PRIORITY: Record<string, number> = { smash: 0, score: 1, rally: 2 };
  const DEDUP_WINDOW = 3;
  const CLIP_HALF = 3.5;

  const sorted = [...highlights].sort((a, b) => {
    const pa = PRIORITY[a.type] ?? 99;
    const pb = PRIORITY[b.type] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.time - b.time;
  });

  const picked: Highlight[] = [];
  for (const h of sorted) {
    if (picked.length >= 3) break;
    const tooClose = picked.some((p) => Math.abs(p.time - h.time) < DEDUP_WINDOW);
    if (!tooClose) picked.push(h);
  }

  return picked.map((h, i) => ({
    id: h.id,
    rank: (i + 1) as 1 | 2 | 3,
    type: h.type,
    time: h.time,
    clipStart: Math.max(0, h.time - CLIP_HALF),
    clipEnd: h.time + CLIP_HALF,
    label: h.label,
    description: h.description,
  }));
}

// ─────────────────────────────────────────────────────────────
// HighlightClipCard
// ─────────────────────────────────────────────────────────────
function HighlightClipCard({
  clip,
  videoSrc,
  onJumpTo,
  formatTime,
}: {
  clip: HighlightClip;
  videoSrc: string | null;
  onJumpTo: (time: number) => void;
  formatTime: (s: number) => string;
}) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || !videoSrc) return;
    if (isHovering) {
      el.currentTime = clip.clipStart;
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = clip.clipStart;
    }
  }, [isHovering, clip.clipStart, videoSrc]);

  const rankColors: Record<number, { bg: string; text: string; border: string; badge: string }> = {
    1: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-400" },
    2: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", badge: "bg-slate-400" },
    3: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-400" },
  };

  const typeIcon = {
    smash: <Flame className="size-3" />,
    score: <Star className="size-3" />,
    rally: <Timer className="size-3" />,
  }[clip.type];

  const typeLabel = { smash: "스매시", score: "득점", rally: "랠리" }[clip.type];

  const rc = rankColors[clip.rank];

  return (
    <button
      onClick={() => onJumpTo(clip.time)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative w-full text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${rc.bg} ${rc.border}`}
    >
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {videoSrc ? (
          <video
            ref={previewRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="size-8 text-white/30" />
          </div>
        )}
        <div
          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200 ${
            isHovering ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-white/90 rounded-full p-2.5 shadow-lg">
            <Play className="size-4 text-slate-900 translate-x-px" />
          </div>
        </div>
        <div className={`absolute top-2 left-2 w-7 h-7 rounded-full ${rc.badge} flex items-center justify-center shadow-md`}>
          <span className="text-white text-xs font-bold">#{clip.rank}</span>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-sm">
          {formatTime(clip.time)}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${rc.text}`}>
            {typeIcon}
            {typeLabel}
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-800 truncate">{clip.label}</p>
        {clip.description && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{clip.description}</p>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 미니맵 컴포넌트
// ─────────────────────────────────────────────────────────────
function MiniCourtMap({
  minimapVideoUrl,
  currentTime,
  isPlaying,
}: {
  minimapVideoUrl: string | null;
  currentTime: number;
  isPlaying: boolean;
}) {
  const miniRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = miniRef.current;
    if (!el || !minimapVideoUrl) return;
    if (Math.abs(el.currentTime - currentTime) > 0.5) {
      el.currentTime = currentTime;
    }
  }, [currentTime, minimapVideoUrl]);

  useEffect(() => {
    const el = miniRef.current;
    if (!el || !minimapVideoUrl) return;
    if (isPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying, minimapVideoUrl]);

  return (
    <div className="pt-1 pb-2">
      <p className="text-[11px] font-semibold text-slate-400 mb-1.5 px-0.5">
        미니맵
      </p>
      <div
        className="relative w-full rounded-lg overflow-hidden border border-slate-200 bg-[#111]"
        style={{ aspectRatio: "1/1.8" }}
      >
        {minimapVideoUrl ? (
          <video
            ref={miniRef}
            src={minimapVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-50">
            <Map className="size-5 text-slate-300" />
            <span className="text-[9px] text-slate-300 font-medium text-center leading-tight px-2">
              분석 완료 후<br />표시됩니다
            </span>
          </div>
        )}
      </div>
      <p className="text-[9px] text-slate-400 text-center mt-1">코트 추적 영상</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 스트로크 유틸리티
// ─────────────────────────────────────────────────────────────

/**
 * 문자열(타입/제목 등)에서 스트로크 카테고리를 키워드로 추론 (대소문자·부분일치 허용).
 *
 * 판정 순서는 reportpageApi의 strokeKeyOf와 맞춰야 한다 — 같은 영상을 두
 * 화면이 다르게 세면 안 된다. 특히 lob은 clear보다 먼저 본다. 예전에는
 * lob이 clear 패턴에 섞여 있어서 로브가 전부 클리어로 흡수됐다.
 */
function getStrokeCategory(raw?: string): Exclude<StrokeFilter, "all"> {
  const s = (raw ?? "").toLowerCase();
  if (/스매시|smash/.test(s)) return "smash";
  if (/로브|lob/.test(s)) return "lob";
  if (/드롭|커트|drop|cut/.test(s)) return "drop";
  if (/드라이브|drive/.test(s)) return "drive";
  if (/서브|서비스|serve|service/.test(s)) return "serve";
  if (/클리어|하이클리어|롱하이|clear/.test(s)) return "clear";
  if (/네트|헤어핀|푸시|net|hairpin|push/.test(s)) return "net";
  return "other";
}

/** 이벤트에서 카테고리 판정: type 우선, 안 잡히면 title 로 폴백 */
function categoryOfEvent(e: { type?: string; title?: string }): Exclude<StrokeFilter, "all"> {
  const byType = getStrokeCategory(e.type);
  return byType !== "other" ? byType : getStrokeCategory(e.title);
}

const STROKE_FILTER_LIST: { key: StrokeFilter; label: string }[] = [
  { key: "all",   label: "전체"   },
  { key: "smash", label: "스매시" },
  { key: "clear", label: "클리어" },
  { key: "lob",   label: "로브"   },
  { key: "drop",  label: "드롭"   },
  { key: "drive", label: "드라이브" },
  { key: "serve", label: "서브"   },
  { key: "net",   label: "네트"   },
  { key: "other", label: "기타"   },
];

function getStrokeIcon(cat: Exclude<StrokeFilter, "all">) {
  switch (cat) {
    case "smash":  return <Zap       className="size-3.5" />;
    case "clear":  return <ArrowUp   className="size-3.5" />;
    case "lob":    return <ArrowUpRight className="size-3.5" />;
    case "drop":   return <ArrowDown className="size-3.5" />;
    case "drive":  return <ArrowRight className="size-3.5" />;
    case "serve":  return <Circle    className="size-3.5" />;
    case "net":    return <Minus     className="size-3.5" />;
    default:       return <MoreHorizontal className="size-3.5" />;
  }
}

function getStrokeStyle(cat: Exclude<StrokeFilter, "all">) {
  switch (cat) {
    case "smash":  return { badge: "bg-rose-50 text-rose-700 border-rose-200",     icon: "text-rose-500"    };
    case "clear":  return { badge: "bg-sky-50 text-sky-700 border-sky-200",        icon: "text-sky-500"     };
    case "lob":    return { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "text-indigo-500" };
    case "drop":   return { badge: "bg-violet-50 text-violet-700 border-violet-200", icon: "text-violet-500" };
    case "drive":  return { badge: "bg-amber-50 text-amber-700 border-amber-200",  icon: "text-amber-500"   };
    case "serve":  return { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-500" };
    case "net":    return { badge: "bg-orange-50 text-orange-700 border-orange-200", icon: "text-orange-500" };
    default:       return { badge: "bg-slate-50 text-slate-600 border-slate-200",     icon: "text-slate-400"    };
  }
}

function getStrokeMarkerColor(cat: Exclude<StrokeFilter, "all">) {
  switch (cat) {
    case "smash":  return "bg-rose-400";
    case "clear":  return "bg-sky-400";
    case "lob":    return "bg-indigo-400";
    case "drop":   return "bg-violet-400";
    case "drive":  return "bg-amber-400";
    case "serve":  return "bg-emerald-400";
    case "net":    return "bg-orange-400";
    default:       return "bg-slate-400";
  }
}

// ─────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────

export function VideoPlayerPage({
  videoId,
  startTime,
  onNavigate,
  onLogout,
  user,
}: VideoPlayerPageProps) {
  // ── 재생 상태 ────────────────────────────────────────────────

  // displayTime("2.58s", "1:02.58" 등)을 초 단위 숫자로 파싱
  const parseDisplayTimeSec = (s: string): number | null => {
    const simple = s.match(/^(\d+(?:\.\d+))s?$/);
    if (simple) return parseFloat(simple[1]);
    const colon = s.match(/^(\d+):(\d+(?:\.\d+)?)s?$/);
    if (colon) return parseInt(colon[1]) * 60 + parseFloat(colon[2]);
    return null;
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StrokeFilter>("all");

  // 활성 줄을 목록 안에서 따라가기 위한 참조
  const eventListRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);
  /** 이 시각(ms)까지는 목록을 자동으로 움직이지 않는다 — 사용자가 직접 스크롤한 직후 */
  const autoScrollPausedUntil = useRef(0);

  // ── 전체화면 ────────────────────────────────────────────────
  const videoStageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── 사이드바 ────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoSectionOpen, setVideoSectionOpen] = useState(true);

  // ── Dual Video ───────────────────────────────────────────────
  const [videoMode, setVideoMode] = useState<VideoMode>("original");
  const [analyzedReady, setAnalyzedReady] = useState(false);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const analyzedVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = videoMode === "original" ? originalVideoRef : analyzedVideoRef;

  const [originalDuration, setOriginalDuration] = useState(0);
  const [rawAnalyzedDuration, setRawAnalyzedDuration] = useState(0);

  const analyzedDuration =
    originalDuration > 0 && rawAnalyzedDuration > originalDuration
      ? originalDuration
      : rawAnalyzedDuration;

  const activeDuration = videoMode === "original" ? originalDuration : analyzedDuration;

  // ── 꾹 누르기 (2배속) ────────────────────────────────────────
  const [isSpeedUp, setIsSpeedUp] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const preventClick = useRef(false);

  // ── 배속 메뉴 ────────────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ── 프로그레스 바 ─────────────────────────────────────────────
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // ── API 데이터 ───────────────────────────────────────────────
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [timelineEventsState, setTimelineEventsState] = useState<ApiTimelineEvent[]>([]);

  // ── 점수 수정 ─────────────────────────────────────────────────
  const [isEditingScore,  setIsEditingScore]  = useState(false);
  const [editTopScore,    setEditTopScore]    = useState(0);
  const [editBottomScore, setEditBottomScore] = useState(0);
  const [isSavingScore,   setIsSavingScore]   = useState(false);
  const [scoreSaveError,  setScoreSaveError]  = useState<string | null>(null);

  const analyzedVideoUrl = videoInfo?.skeletonVideoUrl ?? null;
  const originalVideoUrl = videoInfo?.videoUrl ?? null;
  const isAnalysisAvailable = !!analyzedVideoUrl;
  const minimapVideoUrl = (videoInfo as any)?.minimapVideoUrl ?? null;

  // ─────────────────────────────────────────────────────────────
  // API 로드
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    fetchVideoDetail(videoId)
      .then((data) => {
        if (!mounted) return;
        setVideoInfo(data.videoInfo);
        setMatchSummary(data.matchSummary);
        setTimelineEventsState(
          (data.timelineEvents || []).map((event) => {
            const raw = event as any;
            // timeSec: 백엔드가 내려주는 정밀 시간값 우선
            if (raw.timeSec != null && typeof raw.timeSec === "number" && !Number.isInteger(raw.timeSec)) {
              return { ...event, timestamp: raw.timeSec };
            }
            // displayTime 파싱으로 정수 timestamp 보정
            if (event.displayTime && Number.isInteger(event.timestamp)) {
              const precise = parseDisplayTimeSec(event.displayTime);
              if (precise !== null) return { ...event, timestamp: precise };
            }
            return event;
          }),
        );
        if (data.videoInfo?.duration) setOriginalDuration(data.videoInfo.duration);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [videoId]);

  // ─────────────────────────────────────────────────────────────
  // 심리스 토글
  // ─────────────────────────────────────────────────────────────

  const switchVideoMode = useCallback(
    (nextMode: VideoMode) => {
      const fromRef = videoMode === "original" ? originalVideoRef : analyzedVideoRef;
      const toRef = nextMode === "original" ? originalVideoRef : analyzedVideoRef;
      if (!fromRef.current || !toRef.current) return;

      const snapshotTime = fromRef.current.currentTime;
      const snapshotRate = fromRef.current.playbackRate;
      const wasActuallyPlaying = !fromRef.current.paused;
      fromRef.current.pause();

      const targetDur = toRef.current.duration || 0;
      const clamped = targetDur > 0 ? Math.min(snapshotTime, targetDur) : snapshotTime;
      toRef.current.currentTime = clamped;
      toRef.current.playbackRate = snapshotRate;
      setCurrentTime(clamped);

      if (wasActuallyPlaying) {
        if (nextMode === "original") {
          toRef.current.play().catch(() => {});
        } else if (analyzedReady) {
          toRef.current.play().catch(() => {});
        }
      }
      setVideoMode(nextMode);
    },
    [videoMode, analyzedReady],
  );

  const handleToggle = () => {
    if (!isAnalysisAvailable) return;
    switchVideoMode(videoMode === "original" ? "analyzed" : "original");
  };

  // ─────────────────────────────────────────────────────────────
  // 재생 컨트롤
  // ─────────────────────────────────────────────────────────────

  const syncBothVideos = useCallback((action: (el: HTMLVideoElement) => void) => {
    [originalVideoRef, analyzedVideoRef].forEach((ref) => {
      if (ref.current) action(ref.current);
    });
  }, []);

  const togglePlay = () => {
    if (preventClick.current) return;
    const active = activeVideoRef.current;
    if (!active) return;
    if (isPlaying) {
      syncBothVideos((el) => el.pause());
    } else {
      active.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoPointerDown = () => {
    preventClick.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      preventClick.current = true;
      setIsSpeedUp(true);
      syncBothVideos((el) => { el.playbackRate = 2.0; });
      if (!isPlaying && activeVideoRef.current) {
        activeVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 300);
  };

  const handleVideoPointerUpOrLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isLongPressing.current) {
      isLongPressing.current = false;
      setIsSpeedUp(false);
      syncBothVideos((el) => { el.playbackRate = playbackRate; });
      setTimeout(() => { preventClick.current = false; }, 50);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    syncBothVideos((el) => { el.playbackRate = rate; });
    setShowSpeedMenu(false);
  };

  const handleSkip = (amount: number) => {
    const active = activeVideoRef.current;
    if (!active) return;
    const eff = activeDuration || active.duration;
    const newTime = Math.max(0, Math.min(active.currentTime + amount, eff));
    syncBothVideos((el) => { el.currentTime = newTime; });
    setCurrentTime(newTime);
  };

  const handleJumpTo = (time: number) => {
    const clamped = activeDuration > 0 ? Math.min(time, activeDuration) : time;
    setCurrentTime(clamped);
    syncBothVideos((el) => { el.currentTime = clamped; });
    if (activeVideoRef.current) {
      activeVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // ── ?t= 로 넘어온 시작 지점으로 1회 이동 (히트맵/타임라인 → 영상) ──
  const appliedStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof startTime !== "number" || startTime <= 0) return;
    // 메타데이터(길이) 로드 전에는 seek 해도 되돌아가므로 대기
    if (originalDuration <= 0) return;
    if (appliedStartTimeRef.current === startTime) return;

    appliedStartTimeRef.current = startTime;
    const target = Math.min(startTime, originalDuration);
    setCurrentTime(target);
    syncBothVideos((el) => {
      el.currentTime = target;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, originalDuration]);

  // ── 프로그레스 바 드래그 ─────────────────────────────────────

  const calculateTimeFromMouse = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || !activeDuration) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      return Math.max(0, Math.min((clientX - rect.left) / rect.width, 1)) * activeDuration;
    },
    [activeDuration],
  );

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !activeDuration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    setHoverPosition(pct * 100);
    setHoverTime(pct * activeDuration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setWasPlaying(isPlaying);
    syncBothVideos((el) => el.pause());
    setIsPlaying(false);
    const newTime = calculateTimeFromMouse(e.clientX);
    setCurrentTime(newTime);
    syncBothVideos((el) => { el.currentTime = newTime; });
    if (progressBarRef.current && activeDuration) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
      setHoverPosition(pct * 100);
      setHoverTime(pct * activeDuration);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newTime = calculateTimeFromMouse(e.clientX);
      setCurrentTime(newTime);
      syncBothVideos((el) => { el.currentTime = newTime; });
      if (progressBarRef.current && activeDuration) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
        setHoverPosition(pct * 100);
        setHoverTime(pct * activeDuration);
      }
    },
    [isDragging, calculateTimeFromMouse, activeDuration, syncBothVideos],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (wasPlaying && activeVideoRef.current) {
      activeVideoRef.current.play();
      setIsPlaying(true);
    }
  }, [isDragging, wasPlaying, activeVideoRef]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft": handleSkip(-10); break;
        case "ArrowRight": handleSkip(10); break;
        case " ": e.preventDefault(); togglePlay(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 유틸리티
  // ─────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const total = Math.floor(s);
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // TOP 3 하이라이트용 레거시 카테고리 (스매시/득점/랠리 우선순위)
  const getLegacyHighlightType = (type: string): "score" | "rally" | "smash" | null => {
    const cat = getStrokeCategory(type);
    if (cat === "smash") return "smash";
    if (type === "득점") return "score";
    if (type === "랠리") return "rally";
    return null;
  };

  const derivedHighlights = useMemo(() => {
    return timelineEventsState
      .map((e) => {
        const legacyType = getLegacyHighlightType(e.type);
        if (!legacyType) return null;
        return {
          id: String(e.eventId ?? e.timestamp),
          type: legacyType,
          time: e.timestamp,
          label: e.title || e.type,
          description: e.description || "",
        } as Highlight;
      })
      .filter(Boolean) as Highlight[];
  }, [timelineEventsState]);

  const top3Clips = useMemo(() => pickTop3(derivedHighlights), [derivedHighlights]);

  // ── 스트로크 필터링 ─────────────────────────────────────────
  const filteredTimelineEvents = timelineEventsState.filter((e) => {
    if (activeFilter === "all") return true;
    return categoryOfEvent(e) === activeFilter;
  });

  // ── 프로그레스 마커: 필터 반영 ─────────────────────────────
  const markerEvents = timelineEventsState; // 항상 전체 표시

  // ── 타임라인 활성 이벤트 ────────────────────────────────────
  // 이미 지나간 타격 중 가장 최근 것을 켠다.
  //
  // 예전에는 Math.abs로 거리를 재서 타격 "2초 전"부터 불이 들어왔다.
  // 그래서 화면의 타격보다 하이라이트가 먼저 움직였다. 앞을 보지 않고
  // 지나간 쪽만 보면 타격 순간에 켜진다.
  const activeEventId = useMemo(() => {
    if (activeDuration <= 0) return null;
    let best: { id: string | number; elapsed: number } | null = null;
    for (const e of filteredTimelineEvents) {
      const elapsed = currentTime - e.timestamp;
      if (
        elapsed >= 0 &&
        elapsed < HIGHLIGHT_HOLD_SEC &&
        (!best || elapsed < best.elapsed)
      ) {
        best = { id: e.eventId ?? e.timestamp, elapsed };
      }
    }
    return best ? best.id : null;
  }, [currentTime, filteredTimelineEvents, activeDuration]);

  // 손으로 목록을 움직이면 잠시 따라가기를 멈춘다 — 앞뒤를 살펴보는 중인데
  // 다음 타격마다 화면이 도로 끌려오면 읽을 수가 없다.
  // (자동 스크롤도 scroll 이벤트를 내므로 wheel·touch 같은 실제 입력만 본다)
  const pauseAutoScroll = useCallback(() => {
    autoScrollPausedUntil.current = Date.now() + AUTO_SCROLL_PAUSE_MS;
  }, []);

  // 활성 줄이 목록 밖으로 나가면 그 줄만큼만 스크롤해 따라간다.
  // 랠리가 길어지면 다음 타격이 화면 아래로 밀려 보이지 않기 때문이다.
  useEffect(() => {
    if (Date.now() < autoScrollPausedUntil.current) return;

    const row = activeRowRef.current;
    const box = eventListRef.current;
    if (!row || !box) return;

    const r = row.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top >= b.top && r.bottom <= b.bottom) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    box.scrollTo({
      // 목록 한가운데로 오게 — 위아래 흐름이 같이 보인다
      top: box.scrollTop + (r.top - b.top) - (b.height - r.height) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeEventId]);

  const scoreLeft      = matchSummary?.matchScore?.split(":")[0] ?? "-";
  const scoreRight     = matchSummary?.matchScore?.split(":")[1] ?? "-";
  const unknownRallies = matchSummary?.unknownRallies ?? 0;
  const totalRallies   = matchSummary?.totalRallies   ?? 0;

  const progressPct =
    activeDuration > 0 ? Math.min((currentTime / activeDuration) * 100, 100) : 0;

  // ── 필터별 이벤트 카운트 ────────────────────────────────────
  const filterCounts = useMemo(() => {
    const counts: Record<StrokeFilter, number> = {
      all: timelineEventsState.length,
      smash: 0, clear: 0, lob: 0, drop: 0, drive: 0, serve: 0, net: 0, other: 0,
    };
    timelineEventsState.forEach((e) => {
      counts[categoryOfEvent(e)]++;
    });
    return counts;
  }, [timelineEventsState]);

  // ── 이 영상에 실제로 있는 스트로크만 탭으로 노출 ──────────────
  // 분류 체계는 영상마다 다르다(아마추어 4종 / 프로 6종). 8종을 고정으로
  // 깔면 늘 절반이 0인 채로 남아 고를 것과 못 고를 것이 섞인다.
  // 활성 필터는 0이 되어도 남긴다 — 선택한 탭이 눈앞에서 사라지지 않게.
  const visibleFilters = useMemo(
    () =>
      STROKE_FILTER_LIST.filter(
        ({ key }) =>
          key === "all" || filterCounts[key] > 0 || key === activeFilter,
      ),
    [filterCounts, activeFilter],
  );

  // ── 타임라인 이벤트 한 줄 렌더러 ──────────────────────────
  const renderEventRow = (event: ApiTimelineEvent) => {
    const cat = categoryOfEvent(event);
    const style = getStrokeStyle(cat);
    const eventKey = event.eventId ?? event.timestamp;
    const isActive = eventKey === activeEventId;

    return (
      <button
        key={eventKey}
        ref={isActive ? activeRowRef : undefined}
        onClick={(e) => {
          e.stopPropagation();
          // 직접 고른 지점이니 따라가기를 다시 켠다
          autoScrollPausedUntil.current = 0;
          handleJumpTo(event.timestamp);
        }}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${
          isActive
            ? "bg-[#1a2b4c]/[0.08] border-transparent ring-1 ring-inset ring-[#1a2b4c]/20 shadow-sm"
            : "hover:bg-slate-50 border-transparent"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#8ce600]" />
        )}
        <span
          className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border ${style.badge} ${style.icon}`}
        >
          {getStrokeIcon(cat)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800 truncate">
              {event.title || event.type}
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 tabular-nums">
              {event.displayTime || formatTime(event.timestamp)}
            </span>
          </div>
          {event.description && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{event.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 rounded-full bg-slate-900/10 flex items-center justify-center">
            <Play className="size-2.5 text-slate-500 translate-x-px" />
          </div>
        </div>
      </button>
    );
  };

  // ── 전체화면 토글 ───────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = videoStageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── 점수 수정 핸들러 ─────────────────────────────────────────
  const handleScoreEditOpen = () => {
    setEditTopScore(Number(scoreLeft) || 0);
    setEditBottomScore(Number(scoreRight) || 0);
    setScoreSaveError(null);
    setIsEditingScore(true);
  };

  const handleScoreCancel = () => {
    setIsEditingScore(false);
    setScoreSaveError(null);
  };

  const handleScoreSave = async () => {
    setIsSavingScore(true);
    setScoreSaveError(null);
    try {
      await updateMatchScore(videoId, editTopScore, editBottomScore);
      setMatchSummary((prev) => ({
        ...prev,
        matchScore: `${editTopScore}:${editBottomScore}`,
        unknownRallies: 0,
      }));
      setIsEditingScore(false);
    } catch {
      setScoreSaveError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSavingScore(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        currentPage="video"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={true}
        user={user}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* spacer */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-56" : "w-14"}`}
          aria-hidden="true"
        />

        <aside
          className={`
            fixed left-0 top-16 z-30
            flex flex-col bg-white
            border-r border-slate-200/70
            shadow-[2px_0_24px_rgba(15,23,42,0.05)]
            transition-all duration-300 ease-in-out
            h-[calc(100vh-64px)] overflow-hidden
            ${sidebarOpen ? "w-56" : "w-14"}
          `}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* ── '영상 분석' 라벨 + 접기 토글 (같은 행) ── */}
            <div className={`flex items-center pt-2 ${sidebarOpen ? "justify-between px-3" : "justify-end px-2"}`}>
              {sidebarOpen && (
                <p className="pl-1 text-[11px] font-medium text-slate-400">영상 분석</p>
              )}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                aria-expanded={sidebarOpen}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" aria-hidden="true" /> : <PanelLeftOpen className="size-4" aria-hidden="true" />}
              </button>
            </div>

            {/* ── 영상 제목 ── */}
            {sidebarOpen && (
              <div className="px-4 pt-1 pb-3 border-b border-slate-100">
                {videoInfo?.title ? (
                  <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-3">
                    {videoInfo.title}
                  </h1>
                ) : (
                  <div className="h-5 w-4/5 rounded bg-slate-100 animate-pulse" />
                )}
              </div>
            )}

            {/* ── 네비게이션 ── */}
            <div className={`pt-2 pb-2 ${sidebarOpen ? "px-3" : "px-2"}`}>
              <div className="space-y-0.5">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "대시보드" : undefined}
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">대시보드</span>}
                </button>
                <button
                  disabled
                  className={`relative w-full flex items-center gap-2.5 rounded-lg bg-[#1a2b4c]/[0.09] text-[#1a2b4c] font-semibold cursor-default ring-1 ring-inset ring-[#1a2b4c]/10 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "영상 보기 (현재 페이지)" : undefined}
                >
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#8ce600]" />
                  <Play className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">영상 보기</span>}
                </button>
                <button
                  onClick={() => onNavigate("report")}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "분석 페이지" : undefined}
                >
                  <FileText className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">분석 페이지</span>}
                </button>
              </div>
            </div>

            {/* ── 영상 페이지 ── */}
            <div className={`px-3 pt-1 pb-2 border-t border-slate-100 ${!sidebarOpen && "px-2"}`}>
              {sidebarOpen && (
                <button
                  onClick={() => setVideoSectionOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-1 py-2 text-left group"
                >
                  <p className="text-[11px] font-semibold text-slate-400">영상 페이지</p>
                  <ChevronRight className={`size-3 text-slate-300 transition-transform duration-200 ${videoSectionOpen ? "rotate-90" : ""}`} />
                </button>
              )}

              {sidebarOpen && videoSectionOpen && (
                <div className="space-y-0.5 pl-1.5">
                  <div className="px-1 pt-1">
                    <MiniCourtMap minimapVideoUrl={minimapVideoUrl} currentTime={currentTime} isPlaying={isPlaying} />
                  </div>
                  <button
                    onClick={() => videoMode !== "original" && switchVideoMode("original")}
                    aria-pressed={videoMode === "original"}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${
                      videoMode === "original" ? "bg-[#f2fde0] text-[#3f6b00]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${videoMode === "original" ? "bg-[#8ce600]" : "bg-slate-300"}`} />
                    <span className="flex-1">원본 영상</span>
                    {videoMode === "original" && (
                      <span className="text-[9px] font-bold text-[#3f6b00] bg-[#e4f9c4] px-1.5 py-0.5 rounded">ON</span>
                    )}
                  </button>
                  <button
                    onClick={() => { if (!isAnalysisAvailable || videoMode === "analyzed") return; switchVideoMode("analyzed"); }}
                    disabled={!isAnalysisAvailable}
                    aria-pressed={videoMode === "analyzed"}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${
                      !isAnalysisAvailable ? "text-slate-300 cursor-not-allowed" : videoMode === "analyzed" ? "bg-[#f2fde0] text-[#3f6b00]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isAnalysisAvailable ? "bg-slate-200" : videoMode === "analyzed" ? "bg-[#8ce600]" : "bg-slate-300"}`} />
                    <span className="flex-1">스켈레톤 영상</span>
                    {!isAnalysisAvailable && <Loader2 className="size-3 animate-spin text-slate-300" />}
                    {isAnalysisAvailable && videoMode === "analyzed" && (
                      <span className="text-[9px] font-bold text-[#3f6b00] bg-[#e4f9c4] px-1.5 py-0.5 rounded">ON</span>
                    )}
                  </button>
                </div>
              )}

              {!sidebarOpen && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => videoMode !== "original" && switchVideoMode("original")}
                    aria-label="원본 영상"
                    aria-pressed={videoMode === "original"}
                    className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40 ${videoMode === "original" ? "bg-[#f2fde0] text-[#3f6b00]" : "text-slate-400 hover:bg-slate-100"}`}
                    title="원본 영상"
                  >
                    <Video className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => isAnalysisAvailable && videoMode !== "analyzed" && switchVideoMode("analyzed")}
                    disabled={!isAnalysisAvailable}
                    aria-label="스켈레톤 영상"
                    aria-pressed={videoMode === "analyzed"}
                    className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40 ${!isAnalysisAvailable ? "text-slate-200 cursor-not-allowed" : videoMode === "analyzed" ? "bg-[#f2fde0] text-[#3f6b00]" : "text-slate-400 hover:bg-slate-100"}`}
                    title="스켈레톤 영상"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    aria-label="미니맵 (사이드바 펼치기)"
                    className="w-full flex justify-center px-2 py-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                    title="미니맵"
                  >
                    <Map className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* ── 계정 관리 ── */}
            <div className={`px-3 pt-1 pb-2 border-t border-slate-100 ${!sidebarOpen && "px-2"}`}>
              <button
                onClick={() => onNavigate("account")}
                className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a2b4c]/40 ${sidebarOpen ? "px-3 py-2 mt-1" : "px-2 py-2 justify-center mt-1"}`}
                title={!sidebarOpen ? "계정 관리" : undefined}
              >
                <User className="size-4 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">계정 관리</span>}
              </button>
            </div>
          </div>

          {/* ── 로그아웃 ── */}
          <div className={`shrink-0 border-t border-slate-100 p-3 ${!sidebarOpen && "px-2"}`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
              title={!sidebarOpen ? "로그아웃" : undefined}
            >
              <LogOut className="size-4 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">로그아웃</span>}
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════
            메인 콘텐츠
           ══════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 flex gap-6 items-start">
            {/* ── 좌 컬럼 ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* 영상 스테이지: 영상+컨트롤이 한 화면에 들어오도록 (제목은 왼쪽 사이드바로 이동) */}
              <div className="flex flex-col gap-3">
              {/* 영상 모드 레이블 + AI 토글 */}
              <div className="shrink-0 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8ce600] shadow-sm" />
                  <span className="text-sm font-semibold text-slate-600">
                    {videoMode === "analyzed" ? "AI 분석 영상" : "원본 영상"}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleToggle}
                    disabled={!isAnalysisAvailable}
                    className={`flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full text-xs font-semibold border transition-[color,background-color,border-color,box-shadow] duration-200 select-none ${
                      !isAnalysisAvailable
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : videoMode === "analyzed"
                          ? "bg-[#8ce600] border-[#7acc00] text-[#1a2b4c] shadow-md shadow-[#8ce600]/40 hover:bg-[#9bf016]"
                          : "bg-white border-slate-200 text-slate-600 shadow-sm hover:border-slate-300 hover:shadow"
                    }`}
                  >
                    <span className={`relative inline-flex w-8 h-4 rounded-full transition-colors duration-300 flex-shrink-0 ${!isAnalysisAvailable ? "bg-slate-200" : videoMode === "analyzed" ? "bg-[#1a2b4c]/45" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${videoMode === "analyzed" ? "translate-x-4" : "translate-x-0"}`} />
                    </span>
                    {!isAnalysisAvailable ? (
                      <><Loader2 className="size-3 animate-spin" /><span>분석 중</span></>
                    ) : videoMode === "analyzed" ? (
                      <><Sparkles className="size-3" /><span>AI Analysis</span></>
                    ) : (
                      <><Video className="size-3" /><span>Original</span></>
                    )}
                  </button>
                  {!isAnalysisAvailable && (
                    <div className="absolute right-0 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="size-3 animate-spin text-[#8ce600]" />
                          AI 분석 진행 중입니다. 잠시 후 이용 가능합니다.
                        </div>
                        <div className="absolute right-5 -top-1 w-2 h-2 bg-slate-900 rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 영상 컨테이너 */}
              <div
                ref={videoStageRef}
                className="group/stage relative aspect-video max-h-[calc(100vh-11rem)] mx-auto w-full rounded-2xl overflow-hidden shadow-lg bg-[#111]"
              >
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                    <span className="text-white/50 text-xs">불러오는 중…</span>
                  </div>
                ) : error ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={originalVideoRef}
                      src={originalVideoUrl ?? undefined}
                      className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-opacity duration-200 ${videoMode === "original" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                      onTimeUpdate={(e) => { if (videoMode === "original" && !isDragging) setCurrentTime(e.currentTarget.currentTime); }}
                      onLoadedMetadata={(e) => { setOriginalDuration(e.currentTarget.duration); }}
                      onPlay={() => { if (videoMode === "original") setIsPlaying(true); }}
                      onPause={() => { if (videoMode === "original") setIsPlaying(false); }}
                      onClick={togglePlay}
                      onPointerDown={handleVideoPointerDown}
                      onPointerUp={handleVideoPointerUpOrLeave}
                      onPointerLeave={handleVideoPointerUpOrLeave}
                    />
                    <video
                      ref={analyzedVideoRef}
                      src={analyzedVideoUrl ?? undefined}
                      className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-opacity duration-200 ${videoMode === "analyzed" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                      onTimeUpdate={(e) => { if (videoMode === "analyzed" && !isDragging) setCurrentTime(e.currentTarget.currentTime); }}
                      onLoadedMetadata={(e) => { setRawAnalyzedDuration(e.currentTarget.duration); }}
                      onCanPlay={() => {
                        setAnalyzedReady(true);
                        if (videoMode === "analyzed" && isPlaying) analyzedVideoRef.current?.play().catch(() => {});
                      }}
                      onPlay={() => { if (videoMode === "analyzed") setIsPlaying(true); }}
                      onPause={() => { if (videoMode === "analyzed") setIsPlaying(false); }}
                      onClick={togglePlay}
                      onPointerDown={handleVideoPointerDown}
                      onPointerUp={handleVideoPointerUpOrLeave}
                      onPointerLeave={handleVideoPointerUpOrLeave}
                    />
                    {isSpeedUp && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 pointer-events-none z-50">
                        <SkipForward className="size-3.5" />
                        <span className="text-xs font-bold tracking-wide">2× 재생</span>
                      </div>
                    )}
                    {videoMode === "analyzed" && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#8ce600]/90 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none z-20">
                        <Sparkles className="size-3 text-[#1a2b4c]" aria-hidden="true" />
                        <span className="text-xs font-bold text-[#1a2b4c]">AI Analysis</span>
                      </div>
                    )}
                  </>
                )}
                {/* ── 오버레이 컨트롤 (영상 위에 표시) ── */}
                <div
                  className={`absolute inset-x-0 bottom-0 z-30 px-4 pt-10 pb-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-200 ${
                    isPlaying
                      ? "opacity-0 group-hover/stage:opacity-100 focus-within:opacity-100"
                      : "opacity-100"
                  }`}
                >
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-medium text-white/85 tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-xs font-mono text-white/55 tabular-nums">{formatTime(activeDuration)}</span>
                  </div>
                  <div
                    ref={progressBarRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="재생 위치"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(activeDuration) || 0}
                    aria-valuenow={Math.round(currentTime)}
                    aria-valuetext={`${formatTime(currentTime)} / ${formatTime(activeDuration)}`}
                    className="relative h-1.5 rounded-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    style={{ backgroundColor: "rgba(255,255,255,0.25)", touchAction: "none" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleProgressMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onKeyDown={(e) => {
                      if (activeDuration <= 0) return;
                      let t = currentTime;
                      if (e.key === "ArrowRight") t = Math.min(activeDuration, currentTime + 5);
                      else if (e.key === "ArrowLeft") t = Math.max(0, currentTime - 5);
                      else if (e.key === "Home") t = 0;
                      else if (e.key === "End") t = activeDuration;
                      else return;
                      e.preventDefault();
                      handleJumpTo(t);
                    }}
                  >
                    {isHovering && activeDuration > 0 && (
                      <div
                        className="absolute -top-8 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-10 font-mono shadow-lg"
                        style={{ left: `${hoverPosition}%` }}
                      >
                        {formatTime(hoverTime)}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-white/25" />
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-none"
                      style={{
                        width: `${progressPct}%`,
                        // 타임라인은 모드와 무관하게 항상 브랜드 라임.
                        // (모드 구분은 옆의 텍스트 레이블과 영상 위 뱃지가 담당한다)
                        background: "linear-gradient(90deg, #8ce600, #a3e635)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: `${progressPct}%`, borderColor: "#8ce600" }}
                    />
                    {/* 프로그레스 마커: 스트로크 타입별 색상 */}
                    {markerEvents.map((h, idx) => {
                      const cat = categoryOfEvent(h);
                      return (
                        <div
                          key={h.eventId ?? idx}
                          className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full pointer-events-none ${getStrokeMarkerColor(cat)}`}
                          style={{ left: `${activeDuration > 0 ? (h.timestamp / activeDuration) * 100 : 0}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-28 flex items-center">
                    <button
                      onClick={toggleFullscreen}
                      aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
                      className="flex items-center justify-center w-9 h-9 rounded-xl text-white/75 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      title={isFullscreen ? "전체화면 종료" : "전체화면"}
                    >
                      {isFullscreen ? <Minimize className="size-4" aria-hidden="true" /> : <Maximize className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSkip(-10)} aria-label="10초 뒤로" className="flex items-center justify-center w-9 h-9 rounded-xl text-white/75 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" title="-10초">
                      <SkipBack className="size-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={togglePlay}
                      aria-label={isPlaying ? "일시정지" : "재생"}
                      className="flex items-center justify-center w-12 h-12 rounded-2xl text-white transition-transform active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                      style={{
                        background: "linear-gradient(135deg, #1a2b4c, #243a63)",
                        boxShadow: "0 10px 24px -8px rgba(26,43,76,0.45)",
                      }}
                    >
                      {isPlaying ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5 translate-x-0.5" aria-hidden="true" />}
                    </button>
                    <button onClick={() => handleSkip(10)} aria-label="10초 앞으로" className="flex items-center justify-center w-9 h-9 rounded-xl text-white/75 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" title="+10초">
                      <SkipForward className="size-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="relative w-28 flex justify-end">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      aria-label="재생 속도"
                      aria-haspopup="menu"
                      aria-expanded={showSpeedMenu}
                      className="text-xs font-bold text-white/75 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      {isSpeedUp ? "2.0×" : `${playbackRate === 1 ? "1.0" : playbackRate}×`}
                    </button>
                    {showSpeedMenu && (
                      <>
                        <button
                          type="button"
                          aria-label="속도 메뉴 닫기"
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setShowSpeedMenu(false)}
                        />
                        <div
                          role="menu"
                          onKeyDown={(e) => { if (e.key === "Escape") setShowSpeedMenu(false); }}
                          className="absolute bottom-full right-0 mb-2 w-24 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                        >
                          <div className="py-1">
                            {[2.0, 1.5, 1.25, 1.0, 0.75, 0.5].map((rate) => (
                              <button
                                key={rate}
                                role="menuitemradio"
                                aria-checked={playbackRate === rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={`w-full px-3 py-2 text-xs text-left font-semibold transition-colors tabular-nums focus-visible:outline-none focus-visible:bg-slate-100 ${
                                  playbackRate === rate ? "bg-[#1a2b4c]/[0.06] text-[#1a2b4c] font-bold" : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {rate === 1.0 ? "보통 (1×)" : `${rate}×`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                </div>
                {/* 오버레이 컨트롤 끝 */}
              </div>
              </div>
              {/* 영상 스테이지 끝 */}

              {/* TOP 3 하이라이트 */}
              {top3Clips.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/70 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="size-4 text-rose-500" />
                    <h2 className="text-sm font-bold text-slate-900">TOP 3 하이라이트</h2>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">클릭 또는 hover 시 미리보기</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {top3Clips.map((clip) => (
                      <HighlightClipCard
                        key={clip.id}
                        clip={clip}
                        videoSrc={originalVideoUrl}
                        onJumpTo={handleJumpTo}
                        formatTime={formatTime}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 우 컬럼: 매치 스코어 + 타임라인 ── */}
            <div className="w-[340px] shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200/70 flex flex-col overflow-hidden sticky top-20 h-[calc(100vh-96px)]">

                {/* ── 매치 스코어 ── */}
                <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-slate-500">
                      매치 스코어
                    </p>
                    {!isEditingScore && (
                      <button
                        onClick={handleScoreEditOpen}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600
                                   border border-slate-100 rounded-md px-2 py-1 transition-colors hover:bg-slate-50
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                      >
                        <Pencil className="size-3" aria-hidden="true" />
                        수정
                      </button>
                    )}
                  </div>

                  {isEditingScore ? (
                    <div>
                      <div className="flex items-center justify-center gap-4">
                        {(["bottom", "top"] as const).map((side) => {
                          const val    = side === "top" ? editTopScore : editBottomScore;
                          const setVal = side === "top" ? setEditTopScore : setEditBottomScore;
                          const label  = side === "top" ? "Top Player" : "Bottom Player";
                          return (
                            <div key={side} className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setVal((v) => Math.max(0, v - 1))}
                                  aria-label={`${label} 점수 1 감소`}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400
                                             hover:text-slate-700 hover:bg-slate-100 text-sm transition-colors
                                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                                >−</button>
                                <input
                                  type="number" min={0} max={30} value={val}
                                  inputMode="numeric"
                                  aria-label={`${label} 점수`}
                                  onChange={(e) => setVal(Math.max(0, Math.min(30, Number(e.target.value))))}
                                  className="w-14 text-center text-3xl font-bold text-slate-900 tabular-nums
                                             border-b-2 border-[#1a2b4c] bg-transparent outline-none
                                             focus-visible:border-[#8ce600]
                                             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => setVal((v) => Math.min(30, v + 1))}
                                  aria-label={`${label} 점수 1 증가`}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400
                                             hover:text-slate-700 hover:bg-slate-100 text-sm transition-colors
                                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                                >+</button>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-4 mb-[-4px]">
                        <span className="text-xl font-light text-slate-200">:</span>
                      </div>
                      {scoreSaveError && (
                        <p role="alert" className="text-center text-[11px] text-red-500 mt-2">{scoreSaveError}</p>
                      )}
                      <div className="flex gap-2 mt-3 justify-center">
                        <button
                          onClick={handleScoreCancel}
                          disabled={isSavingScore}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500
                                     border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40"
                        >
                          <X className="size-3" aria-hidden="true" /> 취소
                        </button>
                        <button
                          onClick={handleScoreSave}
                          disabled={isSavingScore}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-white
                                     bg-[#1a2b4c] rounded-lg hover:bg-[#243a63] disabled:opacity-50 transition-colors
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/50 focus-visible:ring-offset-1"
                        >
                          {isSavingScore ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Check className="size-3" aria-hidden="true" />}
                          {isSavingScore ? "저장 중…" : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-4xl font-bold text-slate-900 tabular-nums leading-none">{scoreRight}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Bottom Player</span>
                        </div>
                        <span className="text-xl font-light text-slate-200 pb-4">:</span>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-4xl font-bold text-slate-900 tabular-nums leading-none">{scoreLeft}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Top Player</span>
                        </div>
                      </div>

                      {unknownRallies > 0 ? (
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50
                                           border border-amber-200 rounded-full px-2.5 py-0.5 tabular-nums">
                            +{unknownRallies}개 미확정
                          </span>
                          <div className="relative group">
                            <Info className="size-3.5 text-slate-400 cursor-help" />
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-52
                                            bg-slate-900 text-white text-[11px] leading-relaxed
                                            rounded-xl px-3 py-2.5 shadow-lg z-20
                                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              인/아웃 판정이 불확실해 점수에 미반영된 랠리입니다.
                              <span className="block mt-1 text-slate-400 tabular-nums">
                                전체 {totalRallies}개 중 {unknownRallies}개 미확정
                              </span>
                              <span className="block mt-1 text-[#8ce600]">'수정'으로 직접 조정 가능합니다.</span>
                            </div>
                          </div>
                        </div>
                      ) : totalRallies > 0 ? (
                        <p className="text-center text-[10px] text-slate-400 mt-2 tabular-nums">
                          전체 {totalRallies}개 랠리 확인 완료
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* ── 타임라인 ── */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-slate-900">타임라인</h3>
                    {/* 총 이벤트 수 */}
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {filteredTimelineEvents.length}개 이벤트
                    </span>
                  </div>

                  {/* ── 스트로크 필터 탭 (스크롤 가능) ── */}
                  <div className="px-4 pb-3 flex-shrink-0">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {visibleFilters.map(({ key, label }) => {
                        const count = filterCounts[key];
                        const isActive = activeFilter === key;
                        const cat = key !== "all" ? key as Exclude<StrokeFilter, "all"> : null;
                        const style = cat ? getStrokeStyle(cat) : null;

                        return (
                          <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            aria-pressed={isActive}
                            className={`
                              flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
                              whitespace-nowrap shrink-0 border transition-colors duration-150
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2b4c]/40
                              ${isActive
                                ? cat
                                  ? `${style!.badge} shadow-sm`
                                  : "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                              }
                            `}
                          >
                            {cat && isActive && (
                              <span className={style!.icon}>
                                {getStrokeIcon(cat)}
                              </span>
                            )}
                            {label}
                            {count > 0 && (
                              <span
                                className={`
                                  ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full tabular-nums
                                  ${isActive
                                    ? cat ? "bg-white/60" : "bg-white/20"
                                    : "bg-slate-100 text-slate-400"
                                  }
                                `}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── 이벤트 리스트 (항상 시간 순서, 필터만 적용) ── */}
                  <div
                    ref={eventListRef}
                    onWheel={pauseAutoScroll}
                    onTouchMove={pauseAutoScroll}
                    className="flex-1 overflow-y-auto px-3 pb-4"
                  >
                    {filteredTimelineEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                          <Clock className="size-4 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">이벤트가 없습니다</p>
                        <p className="text-xs text-slate-300 mt-1">
                          {activeFilter !== "all" && "다른 스트로크 유형을 선택해보세요"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredTimelineEvents.map(renderEventRow)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
