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
  ArrowDown,
  ArrowRight,
  Minus,
  Circle,
  MoreHorizontal,
} from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchVideoDetail,
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

// ── 스트로크 필터 카테고리 ──────────────────────────────────
type StrokeFilter =
  | "all"
  | "smash"
  | "clear"
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
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
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
            <Play className="size-4 text-gray-900 translate-x-px" />
          </div>
        </div>
        <div className={`absolute top-2 left-2 w-7 h-7 rounded-full ${rc.badge} flex items-center justify-center shadow-md`}>
          <span className="text-white text-xs font-black">#{clip.rank}</span>
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
        <p className="text-xs font-semibold text-gray-800 truncate">{clip.label}</p>
        {clip.description && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{clip.description}</p>
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
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-0.5">
        미니맵
      </p>
      <div
        className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-[#111]"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gray-50">
            <Map className="size-5 text-gray-300" />
            <span className="text-[9px] text-gray-300 font-medium text-center leading-tight px-2">
              분석 완료 후<br />표시됩니다
            </span>
          </div>
        )}
      </div>
      <p className="text-[9px] text-gray-400 text-center mt-1">코트 추적 영상</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 스트로크 유틸리티
// ─────────────────────────────────────────────────────────────

/** API 이벤트의 type 문자열 → StrokeFilter 카테고리 */
function getStrokeCategory(type: string): Exclude<StrokeFilter, "all"> {
  switch (type) {
    case "스매시":
    case "Smash":
    case "smash":
      return "smash";
    case "클리어":
    case "Clear":
    case "clear":
      return "clear";
    case "드롭":
    case "Drop":
    case "drop":
      return "drop";
    case "드라이브":
    case "Drive":
    case "drive":
      return "drive";
    case "서브":
    case "Serve":
    case "serve":
      return "serve";
    case "네트":
    case "Net":
    case "net":
      return "net";
    // 레거시 매핑
    case "득점": return "other";
    case "랠리": return "other";
    default:     return "other";
  }
}

const STROKE_FILTER_LIST: { key: StrokeFilter; label: string }[] = [
  { key: "all",   label: "전체"   },
  { key: "smash", label: "스매시" },
  { key: "clear", label: "클리어" },
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
    case "drop":   return { badge: "bg-violet-50 text-violet-700 border-violet-200", icon: "text-violet-500" };
    case "drive":  return { badge: "bg-amber-50 text-amber-700 border-amber-200",  icon: "text-amber-500"   };
    case "serve":  return { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-500" };
    case "net":    return { badge: "bg-orange-50 text-orange-700 border-orange-200", icon: "text-orange-500" };
    default:       return { badge: "bg-gray-50 text-gray-600 border-gray-200",     icon: "text-gray-400"    };
  }
}

function getStrokeMarkerColor(cat: Exclude<StrokeFilter, "all">) {
  switch (cat) {
    case "smash":  return "bg-rose-400";
    case "clear":  return "bg-sky-400";
    case "drop":   return "bg-violet-400";
    case "drive":  return "bg-amber-400";
    case "serve":  return "bg-emerald-400";
    case "net":    return "bg-orange-400";
    default:       return "bg-gray-400";
  }
}

// ─────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────

export function VideoPlayerPage({
  videoId,
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
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null);

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
    return getStrokeCategory(e.type) === activeFilter;
  });

  // ── 프로그레스 마커: 필터 반영 ─────────────────────────────
  const markerEvents = timelineEventsState; // 항상 전체 표시

  // ── 타임라인 활성 이벤트 ────────────────────────────────────
  const activeEventId = useMemo(() => {
    if (activeDuration <= 0) return null;
    let best: { id: string | number; dist: number } | null = null;
    for (const e of filteredTimelineEvents) {
      const dist = Math.abs(currentTime - e.timestamp);
      if (dist < 2 && (!best || dist < best.dist)) {
        best = { id: e.eventId ?? e.timestamp, dist };
      }
    }
    return best ? best.id : null;
  }, [currentTime, filteredTimelineEvents, activeDuration]);

  const scoreLeft  = matchSummary?.matchScore?.split(":")[0] ?? "-";
  const scoreRight = matchSummary?.matchScore?.split(":")[1] ?? "-";

  const progressPct =
    activeDuration > 0 ? Math.min((currentTime / activeDuration) * 100, 100) : 0;

  // ── 필터별 이벤트 카운트 ────────────────────────────────────
  const filterCounts = useMemo(() => {
    const counts: Record<StrokeFilter, number> = {
      all: timelineEventsState.length,
      smash: 0, clear: 0, drop: 0, drive: 0, serve: 0, net: 0, other: 0,
    };
    timelineEventsState.forEach((e) => {
      counts[getStrokeCategory(e.type)]++;
    });
    return counts;
  }, [timelineEventsState]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            border-r border-gray-100
            shadow-[2px_0_20px_rgba(0,0,0,0.08)]
            transition-all duration-300 ease-in-out
            h-[calc(100vh-64px)] overflow-hidden
            ${sidebarOpen ? "w-56" : "w-14"}
          `}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* ── 토글 + 네비게이션 ── */}
            <div className={`px-3 pt-2 pb-2 ${!sidebarOpen && "px-2"}`}>
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                  title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                >
                  {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                </button>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "대시보드" : undefined}
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">대시보드</span>}
                </button>
                <button
                  disabled
                  className={`w-full flex items-center gap-2.5 rounded-lg bg-blue-50 text-blue-600 cursor-default ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "영상 보기 (현재 페이지)" : undefined}
                >
                  <Play className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">영상 보기</span>}
                </button>
                <button
                  onClick={() => onNavigate("report")}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                  title={!sidebarOpen ? "분석 페이지" : undefined}
                >
                  <FileText className="size-4 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">분석 페이지</span>}
                </button>
              </div>
            </div>

            {/* ── 영상 페이지 ── */}
            <div className={`px-3 pt-1 pb-2 border-t border-gray-100 ${!sidebarOpen && "px-2"}`}>
              {sidebarOpen && (
                <button
                  onClick={() => setVideoSectionOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-1 py-2 text-left group"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">영상 페이지</p>
                  <ChevronRight className={`size-3 text-gray-300 transition-transform duration-200 ${videoSectionOpen ? "rotate-90" : ""}`} />
                </button>
              )}

              {sidebarOpen && videoSectionOpen && (
                <div className="space-y-0.5 pl-1.5">
                  <div className="px-1 pt-1">
                    <MiniCourtMap minimapVideoUrl={minimapVideoUrl} currentTime={currentTime} isPlaying={isPlaying} />
                  </div>
                  <button
                    onClick={() => videoMode !== "original" && switchVideoMode("original")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${
                      videoMode === "original" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${videoMode === "original" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    <span className="flex-1">원본 영상</span>
                    {videoMode === "original" && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">ON</span>
                    )}
                  </button>
                  <button
                    onClick={() => { if (!isAnalysisAvailable || videoMode === "analyzed") return; switchVideoMode("analyzed"); }}
                    disabled={!isAnalysisAvailable}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${
                      !isAnalysisAvailable ? "text-gray-300 cursor-not-allowed" : videoMode === "analyzed" ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isAnalysisAvailable ? "bg-gray-200" : videoMode === "analyzed" ? "bg-amber-500" : "bg-gray-300"}`} />
                    <span className="flex-1">스켈레톤 영상</span>
                    {!isAnalysisAvailable && <Loader2 className="size-3 animate-spin text-gray-300" />}
                    {isAnalysisAvailable && videoMode === "analyzed" && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">ON</span>
                    )}
                  </button>
                </div>
              )}

              {!sidebarOpen && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => videoMode !== "original" && switchVideoMode("original")}
                    className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors ${videoMode === "original" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-gray-100"}`}
                    title="원본 영상"
                  >
                    <Video className="size-4" />
                  </button>
                  <button
                    onClick={() => isAnalysisAvailable && videoMode !== "analyzed" && switchVideoMode("analyzed")}
                    disabled={!isAnalysisAvailable}
                    className={`w-full flex justify-center px-2 py-2 rounded-lg transition-colors ${!isAnalysisAvailable ? "text-gray-200 cursor-not-allowed" : videoMode === "analyzed" ? "bg-amber-50 text-amber-600" : "text-gray-400 hover:bg-gray-100"}`}
                    title="스켈레톤 영상"
                  >
                    <Sparkles className="size-4" />
                  </button>
                  <button
                    className="w-full flex justify-center px-2 py-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    title="미니맵"
                  >
                    <Map className="size-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── 계정 관리 ── */}
            <div className={`px-3 pt-1 pb-2 border-t border-gray-100 ${!sidebarOpen && "px-2"}`}>
              <button
                onClick={() => onNavigate("account")}
                className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2 mt-1" : "px-2 py-2 justify-center mt-1"}`}
                title={!sidebarOpen ? "계정 관리" : undefined}
              >
                <User className="size-4 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">계정 관리</span>}
              </button>
            </div>
          </div>

          {/* ── 로그아웃 ── */}
          <div className={`shrink-0 border-t border-gray-100 p-3 ${!sidebarOpen && "px-2"}`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
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
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* 페이지 헤더 */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                  RallyTrack / 영상 분석
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {videoInfo?.title ?? "영상 불러오는 중..."}
                </h1>
              </div>

              {/* 영상 모드 레이블 + AI 토글 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${videoMode === "analyzed" ? "bg-amber-400" : "bg-emerald-400"} shadow-sm`} />
                  <span className="text-sm font-semibold text-gray-600">
                    {videoMode === "analyzed" ? "AI 분석 영상" : "원본 영상"}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleToggle}
                    disabled={!isAnalysisAvailable}
                    className={`flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none ${
                      !isAnalysisAvailable
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : videoMode === "analyzed"
                          ? "bg-amber-400 border-amber-300 text-amber-900 shadow-md shadow-amber-200/50 hover:bg-amber-300"
                          : "bg-white border-gray-200 text-gray-600 shadow-sm hover:border-gray-300 hover:shadow"
                    }`}
                  >
                    <span className={`relative inline-flex w-8 h-4 rounded-full transition-all duration-300 flex-shrink-0 ${!isAnalysisAvailable ? "bg-gray-200" : videoMode === "analyzed" ? "bg-amber-700/60" : "bg-gray-200"}`}>
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
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="size-3 animate-spin text-amber-400" />
                          AI 분석 진행 중입니다. 잠시 후 이용 가능합니다.
                        </div>
                        <div className="absolute right-5 -top-1 w-2 h-2 bg-gray-900 rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 영상 컨테이너 */}
              <div className="rounded-2xl overflow-hidden aspect-video shadow-lg relative bg-[#111]">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                    <span className="text-white/50 text-xs">불러오는 중...</span>
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
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-amber-400/90 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none z-20">
                        <Sparkles className="size-3 text-amber-900" />
                        <span className="text-xs font-bold text-amber-900">AI Analysis</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 컨트롤 패널 */}
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-medium text-gray-500 tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-xs font-mono text-gray-300 tabular-nums">{formatTime(activeDuration)}</span>
                  </div>
                  <div
                    ref={progressBarRef}
                    className="relative h-1.5 rounded-full cursor-pointer group"
                    style={{ backgroundColor: "#E5E7EB" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleProgressMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    {isHovering && activeDuration > 0 && (
                      <div
                        className="absolute -top-8 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-10 font-mono shadow-lg"
                        style={{ left: `${hoverPosition}%` }}
                      >
                        {formatTime(hoverTime)}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-gray-200" />
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-none"
                      style={{
                        width: `${progressPct}%`,
                        background: videoMode === "analyzed"
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: `${progressPct}%`, borderColor: videoMode === "analyzed" ? "#f59e0b" : "#3b82f6" }}
                    />
                    {/* 프로그레스 마커: 스트로크 타입별 색상 */}
                    {markerEvents.map((h, idx) => {
                      const cat = getStrokeCategory(h.type);
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
                  <div className="w-28" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSkip(-10)} className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all" title="-10초">
                      <SkipBack className="size-5" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="flex items-center justify-center w-12 h-12 rounded-2xl text-white transition-all active:scale-95 shadow-md"
                      style={{
                        background: videoMode === "analyzed" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        boxShadow: videoMode === "analyzed" ? "0 4px 14px rgba(245,158,11,0.35)" : "0 4px 14px rgba(59,130,246,0.35)",
                      }}
                    >
                      {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 translate-x-0.5" />}
                    </button>
                    <button onClick={() => handleSkip(10)} className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all" title="+10초">
                      <SkipForward className="size-5" />
                    </button>
                  </div>
                  <div className="relative w-28 flex justify-end">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all tabular-nums"
                    >
                      {isSpeedUp ? "2.0×" : `${playbackRate === 1 ? "1.0" : playbackRate}×`}
                    </button>
                    {showSpeedMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
                        <div className="absolute bottom-full right-0 mb-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                          <div className="py-1">
                            {[2.0, 1.5, 1.25, 1.0, 0.75, 0.5].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={`w-full px-3 py-2 text-xs text-left font-semibold transition-colors tabular-nums ${
                                  playbackRate === rate ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
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

              {/* TOP 3 하이라이트 */}
              {top3Clips.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="size-4 text-rose-500" />
                    <h2 className="text-sm font-bold text-gray-900">TOP 3 하이라이트</h2>
                    <span className="ml-auto text-[10px] text-gray-400 font-mono">클릭 또는 hover 시 미리보기</span>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden sticky top-20 h-[calc(100vh-96px)]">

                {/* ── 매치 스코어 ── */}
                <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-4">매치 스코어</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-4xl font-black text-gray-900 tabular-nums leading-none">{scoreLeft}</span>
                      {/* ↓ Player A → Top Player */}
                      <span className="text-[10px] text-gray-400 font-medium">Top Player</span>
                    </div>
                    <span className="text-xl font-light text-gray-200 pb-4">:</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-4xl font-black text-gray-900 tabular-nums leading-none">{scoreRight}</span>
                      {/* ↓ Player B → Bottom Player */}
                      <span className="text-[10px] text-gray-400 font-medium">Bottom Player</span>
                    </div>
                  </div>
                </div>

                {/* ── 타임라인 ── */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.1em]">타임라인</h3>
                    {/* 총 이벤트 수 */}
                    <span className="text-[10px] text-gray-400 font-mono tabular-nums">
                      {filteredTimelineEvents.length}개 이벤트
                    </span>
                  </div>

                  {/* ── 스트로크 필터 탭 (스크롤 가능) ── */}
                  <div className="px-4 pb-3 flex-shrink-0">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {STROKE_FILTER_LIST.map(({ key, label }) => {
                        const count = filterCounts[key];
                        const isActive = activeFilter === key;
                        const cat = key !== "all" ? key as Exclude<StrokeFilter, "all"> : null;
                        const style = cat ? getStrokeStyle(cat) : null;

                        return (
                          <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`
                              flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
                              whitespace-nowrap shrink-0 border transition-all duration-150
                              ${isActive
                                ? cat
                                  ? `${style!.badge} shadow-sm`
                                  : "bg-gray-900 text-white border-gray-900 shadow-sm"
                                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600"
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
                                    : "bg-gray-100 text-gray-400"
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

                  {/* ── 이벤트 리스트 ── */}
                  <div className="flex-1 overflow-y-auto px-3 pb-4">
                    {filteredTimelineEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Clock className="size-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">이벤트가 없습니다</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {activeFilter !== "all" && "다른 스트로크 유형을 선택해보세요"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredTimelineEvents.map((event, idx) => {
                          const cat = getStrokeCategory(event.type);
                          const style = getStrokeStyle(cat);
                          const eventKey = event.eventId ?? event.timestamp;
                          // lastClickedIdx: 클릭한 이벤트가 currentTime 2s 이내이면 우선 적용
                          // → 같은 정수 초에 여러 이벤트가 있어도 클릭한 항목만 활성화
                          const isActive = lastClickedIdx === idx
                            ? Math.abs(currentTime - event.timestamp) < 2
                            : (lastClickedIdx === null && eventKey === activeEventId);

                          return (
                            <button
                              key={event.eventId ?? idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLastClickedIdx(idx);
                                handleJumpTo(event.timestamp);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                                isActive
                                  ? "bg-blue-50 border border-blue-100"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border ${style.badge} ${style.icon}`}>
                                {getStrokeIcon(cat)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-gray-800 truncate">
                                    {event.title || event.type}
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 tabular-nums">
                                    {event.displayTime || formatTime(event.timestamp)}
                                  </span>
                                </div>
                                {event.description && (
                                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{event.description}</p>
                                )}
                              </div>
                              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-5 h-5 rounded-full bg-gray-900/8 flex items-center justify-center">
                                  <Play className="size-2.5 text-gray-500 translate-x-px" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
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
