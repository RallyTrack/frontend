import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Upload,
  Plus,
  X,
  Film,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Activity,
  RotateCcw,
  CheckCircle2,
  Check,
  Minus,
  Maximize2,
  UserRound,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { Header, type Page } from "./Header";
import {
  fetchDashboard,
  deleteVideo,
  fetchActivityStats,
  fetchPerformanceTrend,
  DashboardResponse,
  ActivityDataPoint,
} from "../api/dashboardApi";
import { VideoItem } from "../components/VideoItem";
import { Footer } from "./ui/footer";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface VideoRecord {
  id: string;
  name: string;
  date: string;
  duration: string;
  score?: string;
  thumbnail?: string;
  serverThumbnail?: string;
  status?: "uploading" | "processing" | "completed" | "error";
}

interface DashboardPageProps {
  onLogout: () => void;
  onViewVideo: (id: string) => void;
  onViewReport: (id: string) => void;
  onNavigate: (page: Page) => void;
  hasSelectedVideo: boolean;
  user?: UserInfo;
}

interface Point {
  x: number;
  y: number;
}

interface UploadApiResponse {
  code?: number;
  message?: string;
  data?: {
    videoId?: number | string;
    title?: string;
    uploadDate?: string;
    status?: string;
    thumbnailUrl?: string;
  };
}

// ── 퍼포먼스 트렌드 데이터 타입 ──────────────────────────────────
interface TrendData {
  smash: number[];
  defense: number[];
  accuracy: number[];
}

const POINT_GUIDES = [
  {
    label: "코트 왼쪽 위 모서리",
    stepLabel: "왼쪽 위",
    shortLabel: "1",
    hint: "단식 코트의 왼쪽 위 꼭짓점(안쪽 사이드라인 기준)을 클릭하세요.",
    color: "#3B82F6",
    netPoint: false,
  },
  {
    label: "코트 오른쪽 위 모서리",
    stepLabel: "오른쪽 위",
    shortLabel: "2",
    hint: "단식 코트의 오른쪽 위 꼭짓점(안쪽 사이드라인 기준)을 클릭하세요.",
    color: "#10B981",
    netPoint: false,
  },
  {
    label: "코트 오른쪽 아래 모서리",
    stepLabel: "오른쪽 아래",
    shortLabel: "3",
    hint: "단식 코트의 오른쪽 아래 꼭짓점(안쪽 사이드라인 기준)을 클릭하세요.",
    color: "#EC4899",
    netPoint: false,
  },
  {
    label: "코트 왼쪽 아래 모서리",
    stepLabel: "왼쪽 아래",
    shortLabel: "4",
    hint: "단식 코트의 왼쪽 아래 꼭짓점(안쪽 사이드라인 기준)을 클릭하세요.",
    color: "#F59E0B",
    netPoint: false,
  },
  {
    label: "네트 왼쪽 상단",
    stepLabel: "네트 왼쪽",
    shortLabel: "5",
    hint: "네트 왼쪽 끝의 맨 윗부분(네트 상단 모서리)을 클릭하세요. 기둥 바닥이 아닙니다.",
    color: "#8B5CF6",
    netPoint: true,
  },
  {
    label: "네트 오른쪽 상단",
    stepLabel: "네트 오른쪽",
    shortLabel: "6",
    hint: "네트 오른쪽 끝의 맨 윗부분(네트 상단 모서리)을 클릭하세요. 기둥 바닥이 아닙니다.",
    color: "#06B6D4",
    netPoint: true,
  },
];

type ModalStep = "upload" | "frame" | "corners";

// 백엔드가 최근 영상을 최대 10개까지만 내려줌 → 페이지네이션은 사실상 휴면 상태(1페이지).
// 백엔드 조회 제한이 늘어나면 이 값만 조정하면 페이지네이션이 다시 활성화됨.
const VIDEOS_PER_PAGE = 10;

const LOCAL_THUMBNAIL_PREFIX = "rallytrack-thumbnail-";

function getLocalThumbnailKey(videoId: string) {
  return `${LOCAL_THUMBNAIL_PREFIX}${videoId}`;
}

function saveLocalThumbnail(videoId: string, dataUrl: string) {
  try {
    localStorage.setItem(getLocalThumbnailKey(videoId), dataUrl);
  } catch (error) {
    console.warn("로컬 썸네일 저장 실패:", error);
  }
}

function loadLocalThumbnail(videoId: string): string | null {
  try {
    return localStorage.getItem(getLocalThumbnailKey(videoId));
  } catch {
    return null;
  }
}

function removeLocalThumbnail(videoId: string) {
  try {
    localStorage.removeItem(getLocalThumbnailKey(videoId));
  } catch {
    // ignore
  }
}

// ── TrendSparkline ────────────────────────────────────────────────
function TrendSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - ((last - min) / range) * (h - 6) - 3;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

// ── 스켈레톤: TrendSparkline 플레이스홀더 ──────────────────────────
function SparklineSkeleton() {
  return (
    <div className="w-[120px] h-[36px] rounded bg-slate-100 animate-pulse" />
  );
}

// ── ActivityChartCard (undefined=로딩, null=API없음, []=빈, data=렌더) ──
function ActivityChartCard({
  activityData,
}: {
  activityData: ActivityDataPoint[] | null | undefined;
}) {
  const isLoading = activityData === undefined;
  const isFailed = activityData === null;
  const isEmpty = Array.isArray(activityData) && activityData.length === 0;
  const hasData = Array.isArray(activityData) && activityData.length > 0;

  const totalUsage = hasData
    ? activityData!.reduce((s, i) => s + i.usageCount, 0)
    : 0;
  const totalUpload = hasData
    ? activityData!.reduce((s, i) => s + i.uploadCount, 0)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="size-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-800">활동 통계</h2>
        <span className="ml-auto text-[10px] text-gray-400 font-mono">
          최근 7일 · 사용/업로드 추이
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        사이트 사용 횟수와 업로드된 영상 수를 한 번에 확인할 수 있습니다.
      </p>

      {/* 차트 영역 */}
      <div className="h-72">
        {isLoading ? (
          /* 로딩 스켈레톤 */
          <div className="h-full rounded-xl bg-slate-100 animate-pulse" />
        ) : isFailed || isEmpty ? (
          /* API 없음 / 빈 데이터 → 빈 차트 프레임 */
          <div className="h-full rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2">
            <Activity className="size-6 text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">
              {isFailed ? "데이터를 불러올 수 없습니다" : "활동 데이터가 없습니다"}
            </p>
          </div>
        ) : (
          /* 실제 차트 */
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activityData!}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 6px 24px rgba(15,23,42,0.08)",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === "usageCount") return [`${value}회`, "사이트 사용"];
                  if (name === "uploadCount") return [`${value}개`, "영상 업로드"];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "#64748b",
                  paddingTop: "12px",
                }}
                formatter={(value) => {
                  if (value === "usageCount") return "사이트 사용 횟수";
                  if (value === "uploadCount") return "업로드 영상 수";
                  return value;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="uploadCount"
                name="uploadCount"
                radius={[8, 8, 0, 0]}
                barSize={26}
                fill="#60a5fa"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="usageCount"
                name="usageCount"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 요약 수치 */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
            총 사이트 사용
          </p>
          {isLoading ? (
            <div className="h-6 w-16 bg-blue-100 rounded-full animate-pulse" />
          ) : (
            <p className="text-lg font-black text-blue-700">
              {hasData ? `${totalUsage}회` : "—"}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-1">
            총 업로드 수
          </p>
          {isLoading ? (
            <div className="h-6 w-16 bg-sky-100 rounded-full animate-pulse" />
          ) : (
            <p className="text-lg font-black text-sky-700">
              {hasData ? `${totalUpload}개` : "—"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: ModalStep }) {
  const steps: { key: ModalStep; label: string }[] = [
    { key: "upload", label: "영상 선택" },
    { key: "frame", label: "프레임 선택" },
    { key: "corners", label: "좌표 지정" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? "bg-[#8ce600] border-[#8ce600] text-[#1a2b4c]"
                    : active
                      ? "bg-[#1a2b4c] border-[#1a2b4c] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  active
                    ? "text-[#1a2b4c]"
                    : done
                      ? "text-[#6bba00]"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                  done ? "bg-[#8ce600]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const BADMINTON_TIPS = [
  {
    icon: "🏸",
    title: "스매시 파워업",
    desc: "임팩트 순간 손목 스냅을 극대화하세요. 어깨·팔꿈치·손목이 순서대로 연결되는 채찍 동작을 의식하면 셔틀 속도가 15~20% 향상됩니다. 팔 힘만으론 한계가 있으니 허리 회전을 먼저 시작하는 것이 핵심입니다.",
  },
  {
    icon: "👣",
    title: "풋워크 기초",
    desc: "리턴 후 즉시 코트 센터(서비스 라인 중앙)로 복귀하는 습관을 들이세요. 매 스텝을 작고 빠르게 유지하고, 점프 스텝 대신 슬라이드 스텝으로 에너지를 아끼면 후반 랠리에서도 안정적인 수비가 가능합니다.",
  },
  {
    icon: "🎯",
    title: "드롭샷 전략",
    desc: "스매시 모션으로 준비 자세를 취한 뒤 임팩트 직전 힘을 빼 셔틀을 네트 바로 너머에 떨어뜨리세요. 상대가 후방으로 밀려있을 때 사용하면 뛰어오는 동안 체력을 크게 소모시킬 수 있습니다.",
  },
  {
    icon: "💪",
    title: "코어 강화",
    desc: "플랭크·데드버그·브리지 같은 코어 운동을 주 3회 이상 꾸준히 하세요. 허리와 복근이 탄탄할수록 스윙 축이 흔들리지 않아 정확도가 높아지고, 장시간 경기에서 허리 부상 위험도 현저히 줄어듭니다.",
  },
  {
    icon: "👁️",
    title: "셔틀 예측",
    desc: "상대의 라켓 헤드 방향과 어깨 각도를 동시에 읽으세요. 어깨가 열리면 크로스 방향, 닫히면 직선 코스일 확률이 높습니다. 이 패턴을 익히면 셔틀이 타격되기 0.1~0.2초 전에 먼저 움직이는 예측 이동이 가능해집니다.",
  },
  {
    icon: "🌬️",
    title: "호흡 관리",
    desc: "스트로크 임팩트 순간 짧고 강하게 숨을 내뱉는 '케이아이(기합)'를 연습하세요. 호흡이 근육 긴장을 순간적으로 해제해 스윙 스피드와 타점 정확도가 동시에 올라가며, 장기 랠리에서도 페이스 유지에 도움이 됩니다.",
  },
  {
    icon: "🔄",
    title: "백핸드 활용",
    desc: "백핸드를 포핸드로 돌아가며 처리하면 이동 거리가 늘어 빈틈이 생깁니다. 엄지를 라켓 그립 넓은 면에 얹는 백핸드 그립으로 전환해 네트 전방 리턴을 짧고 정확하게 처리하는 연습을 꾸준히 하세요.",
  },
  {
    icon: "📐",
    title: "서비스 루틴",
    desc: "숏 서비스는 셔틀 코르크 하단을 라켓 면 중앙으로 살짝 밀어내듯 치는 것이 핵심입니다. 매번 같은 높이·같은 위치에서 임팩트하는 루틴을 만들면 실점 유발 서비스 미스를 90% 이상 줄일 수 있습니다.",
  },
  {
    icon: "🧠",
    title: "멘탈 리셋",
    desc: "실점 직후 라켓 그립을 한 번 쥐었다 펴는 '그립 리셋' 루틴으로 잡생각을 지우세요. 심리 연구에 따르면 신체적 소동작이 부정적 감정의 지속 시간을 40% 단축시켜 다음 포인트에 더 빠르게 집중할 수 있습니다.",
  },
  {
    icon: "🌡️",
    title: "워밍업 필수",
    desc: "경기 15분 전부터 가벼운 조깅 → 동적 스트레칭 → 셔틀 토스 순서로 몸을 올리세요. 차가운 근육으로 풀스윙을 하면 어깨 회전근개 부상 위험이 3배 이상 증가합니다. 땀이 살짝 날 때가 이상적인 경기 시작 타이밍입니다.",
  },
  {
    icon: "⚡",
    title: "헤어핀 완성",
    desc: "헤어핀은 네트 바로 앞에서 셔틀을 가장 낮은 탄도로 넘기는 기술입니다. 라켓 면을 45° 열고 손목 고정을 유지한 채 아주 짧게 터치하세요. 셔틀이 네트 테이프를 아슬아슬하게 넘을수록 상대가 처리하기 어렵습니다.",
  },
  {
    icon: "🏋️",
    title: "점프력 향상",
    desc: "스쿼트 점프·박스 점프를 주 2회 루틴에 추가하세요. 점프 스매시의 타점 높이가 10cm 올라갈 때마다 공격 각도가 넓어져 코트 대각선 전체를 위협할 수 있습니다. 착지 시 무릎이 발끝을 넘지 않도록 주의하세요.",
  },
];

function toDateString(value?: string) {
  if (!value) return new Date().toISOString().split("T")[0];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

// 백엔드가 "HH:MM:SS" / "MM:SS" 형태로 주면 "N시간 N분 N초"로, 이미 한국어 표기면 그대로 반환
function formatAnalysisTime(raw?: string): string {
  if (!raw) return "0초";
  const m = raw.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (!m) return raw; // "2시간 16분" 등 이미 포맷된 문자열
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  return formatSecondsKo(h * 3600 + min * 60 + sec);
}

// "45:23", "1:02:03", "8", "0:08" → 초. 숫자로 파싱 안 되면(“분석 중” 등) 0
function parseDurationToSeconds(raw?: string): number {
  if (!raw) return 0;
  const t = raw.trim();
  if (!/^\d+(:\d+)*$/.test(t)) return 0;
  return t.split(":").reduce((acc, part) => acc * 60 + parseInt(part, 10), 0);
}

// 총 초 → "1시간 0분 8초" (앞자리 0 단위는 생략, 초는 항상 표시)
function formatSecondsKo(total: number): string {
  const t = Math.max(0, Math.floor(total));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const out: string[] = [];
  if (h > 0) out.push(`${h}시간`);
  if (h > 0 || m > 0) out.push(`${m}분`);
  out.push(`${s}초`);
  return out.join(" ");
}

function buildCourtCornersPayload(points: Point[]) {
  return JSON.stringify({
    topLeft: { x: points[0].x, y: points[0].y },
    topRight: { x: points[1].x, y: points[1].y },
    bottomRight: { x: points[2].x, y: points[2].y },
    bottomLeft: { x: points[3].x, y: points[3].y },
    netTopLeft: { x: points[4].x, y: points[4].y },
    netTopRight: { x: points[5].x, y: points[5].y },
  });
}

// ── 비디오 status 정규화 ──────────────────────────────────────────
function normalizeStatus(
  rawStatus?: string,
  playTime?: string,
): "uploading" | "processing" | "completed" | "error" {
  if (!rawStatus) {
    // playTime 기반 fallback (기존 로직 유지)
    if (playTime === "분석 중") return "processing";
    return "completed";
  }
  const s = rawStatus.toUpperCase();
  if (s === "PROCESSING" || s === "processing") return "processing";
  if (s === "FAILED" || s === "error") return "error";
  if (s === "UPLOADING" || s === "uploading") return "uploading";
  return "completed";
}

export function DashboardPage({
  onLogout,
  onViewVideo,
  onViewReport,
  onNavigate,
  hasSelectedVideo,
  user,
}: DashboardPageProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [stats, setStats] = useState<
    DashboardResponse["data"]["dashboardSummary"] | null
  >(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [videoPage, setVideoPage] = useState(0);

  // ── 활동 통계: undefined=로딩중, null=실패, ActivityDataPoint[]=데이터 ──
  const [activityData, setActivityData] = useState<
    ActivityDataPoint[] | null | undefined
  >(undefined);

  // ── 퍼포먼스 트렌드: undefined=로딩중, null=실패, TrendData=데이터 ──
  const [trendData, setTrendData] = useState<TrendData | null | undefined>(
    undefined,
  );

  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [playerType, setPlayerType] = useState<"amateur" | "pro">("amateur");
  const [isDragging, setIsDragging] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps] = useState(30);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);
  const [fitSize, setFitSize] = useState({ w: 0, h: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(
    null,
  );
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const cornerImgRef = useRef<HTMLImageElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomBoxRef = useRef<HTMLDivElement>(null);
  const videoUrlRef = useRef<string | null>(null);

  const tryPromoteServerThumbnail = useCallback(
    (videoId: string, serverThumbnail?: string) => {
      if (!serverThumbnail) return;
      const img = new Image();
      img.onload = () => {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? { ...video, thumbnail: serverThumbnail, serverThumbnail }
              : video,
          ),
        );
      };
      img.onerror = () => {
        console.warn("서버 썸네일 아직 사용 불가:", { videoId, serverThumbnail });
      };
      img.src = serverThumbnail;
    },
    [],
  );

  const fetchData = useCallback(async () => {
    try {
      const json = await fetchDashboard();
      setStats(json.data.dashboardSummary);

      const incomingVideos: VideoRecord[] = json.data.recentVideos.map((v) => {
        const id = String(v.videoId);
        const localThumb = loadLocalThumbnail(id);
        return {
          id,
          name: v.title,
          date: v.date,
          duration: v.playTime || "00:00",
          score: v.matchScore,
          thumbnail: localThumb ?? v.thumbnailUrl,
          serverThumbnail: v.thumbnailUrl,
          status: normalizeStatus(v.status, v.playTime),
        };
      });

      setVideos(incomingVideos);
      incomingVideos.forEach((video) => {
        if (video.serverThumbnail) {
          tryPromoteServerThumbnail(video.id, video.serverThumbnail);
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tryPromoteServerThumbnail]);

  // ── 활동 통계 fetch ──────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    setActivityData(undefined); // 로딩 시작
    try {
      const json = await fetchActivityStats();
      setActivityData(json.data.stats ?? []);
    } catch {
      setActivityData(null); // API 실패 → null
    }
  }, []);

  // ── 퍼포먼스 트렌드 fetch ────────────────────────────────────────
  const fetchTrend = useCallback(async () => {
    setTrendData(undefined); // 로딩 시작
    try {
      const json = await fetchPerformanceTrend();
      setTrendData({
        smash: json.data.smash,
        defense: json.data.defense,
        accuracy: json.data.accuracy,
      });
    } catch {
      setTrendData(null); // API 실패 → null
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchActivity();
    fetchTrend();
  }, [fetchData, fetchActivity, fetchTrend]);

  useEffect(() => {
    const iv = setInterval(
      () => setTipIndex((i) => (i + 1) % BADMINTON_TIPS.length),
      6000,
    );
    return () => clearInterval(iv);
  }, []);

  const hasProcessingVideo = videos.some(
    (v) => v.status === "processing" || v.duration === "분석 중",
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (hasProcessingVideo) interval = setInterval(fetchData, 5000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasProcessingVideo, fetchData]);

  const handleDelete = async (id: string) => {
    removeLocalThumbnail(id);
    if (id.startsWith("temp-")) {
      setVideos((p) => p.filter((v) => v.id !== id));
      return;
    }
    if (confirm("이 영상을 삭제하시겠습니까?")) {
      try {
        await deleteVideo(id);
        setVideos((p) => p.filter((v) => v.id !== id));
        if (stats) {
          setStats({ ...stats, totalVideos: Math.max(0, stats.totalVideos - 1) });
        }
      } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
        console.error(e);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || modalStep !== "frame") return;
    const onLoaded = () => {
      setFps(30);
      const tf = Math.floor(video.duration * 30);
      setTotalFrames(tf);
      setVideoDuration(Math.round(video.duration));
      setVideoSize({ w: video.videoWidth, h: video.videoHeight });
      video.currentTime = 0;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [modalStep]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || totalFrames === 0 || modalStep !== "frame") return;
    video.currentTime = frameIndex / fps;
    const onSeeked = () => {
      const canvas = frameCanvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    };
    video.addEventListener("seeked", onSeeked);
    return () => video.removeEventListener("seeked", onSeeked);
  }, [frameIndex, fps, totalFrames, modalStep]);

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const img = cornerImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / (videoSize.w || img.naturalWidth || canvas.width);
    const scaleY = canvas.height / (videoSize.h || img.naturalHeight || canvas.height);

    if (points.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
      ctx.lineTo(points[1].x * scaleX, points[1].y * scaleY);
      ctx.lineTo(points[2].x * scaleX, points[2].y * scaleY);
      ctx.lineTo(points[3].x * scaleX, points[3].y * scaleY);
      ctx.closePath();
      ctx.strokeStyle = "rgba(59,130,246,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.fillStyle = "rgba(59,130,246,0.07)";
      ctx.fill();
      ctx.setLineDash([]);
    }
    if (points.length === 6) {
      ctx.beginPath();
      ctx.moveTo(points[4].x * scaleX, points[4].y * scaleY);
      ctx.lineTo(points[5].x * scaleX, points[5].y * scaleY);
      ctx.strokeStyle = "rgba(139,92,246,0.9)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    points.forEach((pt, i) => {
      const g = POINT_GUIDES[i];
      const cx = pt.x * scaleX;
      const cy = pt.y * scaleY;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = `${g.color}33`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(g.shortLabel, cx, cy);
    });
  }, [points, videoSize]);

  const recomputeFit = useCallback(() => {
    const box = zoomBoxRef.current;
    const img = cornerImgRef.current;
    if (!box) return;
    const vw = videoSize.w || img?.naturalWidth || 16;
    const vh = videoSize.h || img?.naturalHeight || 9;
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    if (!bw || !bh) return;
    const s = Math.min(bw / vw, bh / vh);
    setFitSize({ w: Math.max(1, Math.round(vw * s)), h: Math.max(1, Math.round(vh * s)) });
  }, [videoSize.w, videoSize.h]);

  const adjustZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(3, Math.max(1, Math.round((z + delta) * 100) / 100)));
  }, []);

  useEffect(() => {
    if (modalStep !== "corners") return;
    setZoom(1);
    recomputeFit();
    const box = zoomBoxRef.current;
    const onResize = () => recomputeFit();
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      adjustZoom(e.deltaY < 0 ? 0.25 : -0.25);
    };
    window.addEventListener("resize", onResize);
    box?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", onResize);
      box?.removeEventListener("wheel", onWheel);
    };
  }, [modalStep, capturedDataUrl, recomputeFit, adjustZoom]);

  useEffect(() => {
    if (modalStep === "corners") drawOverlay();
  }, [points, modalStep, zoom, fitSize, drawOverlay]);

  useEffect(() => {
    if (modalStep !== "corners" || points.length !== 6) {
      if (points.length < 6) setThumbnailBlob(null);
      return;
    }
    const timer = setTimeout(() => {
      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas || !capturedDataUrl) return;
      const offscreen = document.createElement("canvas");
      offscreen.width = overlayCanvas.width;
      offscreen.height = overlayCanvas.height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, offscreen.width, offscreen.height);
        ctx.drawImage(overlayCanvas, 0, 0);
        offscreen.toBlob(
          (blob) => { if (blob) setThumbnailBlob(blob); },
          "image/jpeg",
          0.9,
        );
      };
      bgImg.src = capturedDataUrl;
    }, 100);
    return () => clearTimeout(timer);
  }, [points, modalStep, capturedDataUrl]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (points.length >= 6) return;
    const canvas = overlayCanvasRef.current;
    const img = cornerImgRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (videoSize.w || img?.naturalWidth || rect.width) / rect.width;
    const scaleY = (videoSize.h || img?.naturalHeight || rect.height) / rect.height;
    setPoints((prev) => [
      ...prev,
      {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      },
    ]);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setUploadFile(file);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = URL.createObjectURL(file);
    setPoints([]);
    setFrameIndex(0);
    setCapturedDataUrl(null);
    setThumbnailBlob(null);
    setSubmitResult(null);
    setModalStep("frame");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirmFrame = () => {
    if (!capturedDataUrl) {
      const video = videoRef.current;
      const canvas = frameCanvasRef.current;
      if (video && canvas) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.92));
        }
      }
    }
    setPoints([]);
    setThumbnailBlob(null);
    setModalStep("corners");
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setModalStep("upload");
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setModalStep("upload");
    setUploadFile(null);
    setVideoName("");
    setPlayerType("amateur");
    setPoints([]);
    setFrameIndex(0);
    setCapturedDataUrl(null);
    setThumbnailBlob(null);
    setVideoDuration(0);
    setSubmitResult(null);
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (points.length < 6 || !uploadFile) return;
    if (!thumbnailBlob || !capturedDataUrl) {
      alert("썸네일 생성이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);

    const currentUploadFile = uploadFile;
    const currentVideoName = videoName || uploadFile.name;
    const currentPoints = [...points];
    const currentThumbnailBlob = thumbnailBlob;
    const currentThumbnailDataUrl = capturedDataUrl;
    const currentVideoDuration = videoDuration;
    const tempId = `temp-${Date.now()}`;

    const tempVideo: VideoRecord = {
      id: tempId,
      name: currentVideoName,
      date: new Date().toISOString().split("T")[0],
      duration: "업로드 중...",
      status: "uploading",
      thumbnail: currentThumbnailDataUrl,
      serverThumbnail: undefined,
    };

    setVideos((prev) => [tempVideo, ...prev]);
    closeModal();

    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("videoFile", currentUploadFile);
      formData.append("title", currentVideoName);
      formData.append("thumbnailImage", currentThumbnailBlob, "thumbnail.jpg");
      formData.append("courtCorners", buildCourtCornersPayload(currentPoints));
      formData.append("durationSeconds", String(currentVideoDuration));
      formData.append("mode", playerType);

      const res = await fetch("/api/v1/videos", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json: UploadApiResponse | null = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || `업로드 실패 (${res.status})`;
        throw new Error(message);
      }

      const uploaded = json?.data;
      const newVideoId = uploaded?.videoId ? String(uploaded.videoId) : null;
      const newTitle = uploaded?.title || currentVideoName;
      const uploadDate = toDateString(uploaded?.uploadDate);

      if (!newVideoId) throw new Error("업로드 응답에 videoId가 없습니다.");

      const newThumbnailUrl =
        uploaded?.thumbnailUrl || `/api/v1/videos/${newVideoId}/thumbnail`;

      saveLocalThumbnail(newVideoId, currentThumbnailDataUrl);

      setVideos((prev) =>
        prev.map((v) =>
          v.id === tempId
            ? {
                ...v,
                id: newVideoId,
                name: newTitle,
                date: uploadDate,
                duration: "분석 중",
                status: "processing",
                thumbnail: currentThumbnailDataUrl,
                serverThumbnail: newThumbnailUrl,
              }
            : v,
        ),
      );

      tryPromoteServerThumbnail(newVideoId, newThumbnailUrl);
      setStats((prev) =>
        prev ? { ...prev, totalVideos: prev.totalVideos + 1 } : prev,
      );
      setSubmitResult("success");
    } catch (err) {
      console.error("Upload Error:", err);
      setVideos((prev) =>
        prev.map((v) =>
          v.id === tempId ? { ...v, duration: "업로드 실패", status: "error" } : v,
        ),
      );
      setSubmitResult("error");
      alert(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevTip = () =>
    setTipIndex((p) => (p === 0 ? BADMINTON_TIPS.length - 1 : p - 1));
  const handleNextTip = () =>
    setTipIndex((p) => (p === BADMINTON_TIPS.length - 1 ? 0 : p + 1));

  const currentTip = BADMINTON_TIPS[tipIndex];
  const currentGuide = points.length < 6 ? POINT_GUIDES[points.length] : null;

  const reduceMotion = useReducedMotion();
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "좋은 아침이에요"
      : greetingHour < 18
        ? "좋은 오후예요"
        : "좋은 저녁이에요";
  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const analysisSeconds = videos.reduce(
    (sum, v) => sum + parseDurationToSeconds(v.duration),
    0,
  );
  const analysisTimeLabel =
    analysisSeconds > 0
      ? formatSecondsKo(analysisSeconds)
      : formatAnalysisTime(stats?.totalAnalysisTime);

  const totalVideoPages = Math.max(1, Math.ceil(videos.length / VIDEOS_PER_PAGE));
  const safeVideoPage = Math.min(videoPage, totalVideoPages - 1);
  const pagedVideos = videos.slice(
    safeVideoPage * VIDEOS_PER_PAGE,
    safeVideoPage * VIDEOS_PER_PAGE + VIDEOS_PER_PAGE,
  );

  useEffect(() => {
    setVideoPage((p) =>
      Math.min(p, Math.max(0, Math.ceil(videos.length / VIDEOS_PER_PAGE) - 1)),
    );
  }, [videos.length]);

  // ── 퍼포먼스 트렌드 렌더 헬퍼 ─────────────────────────────────
  const trendIsLoading = trendData === undefined;
  const trendIsFailed = trendData === null;

  const trendRows = [
    { label: "스매시", key: "smash" as const, color: "#ef4444" },
    { label: "수비력", key: "defense" as const, color: "#3b82f6" },
    { label: "정확도", key: "accuracy" as const, color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
        user={user}
      />

      <main className="relative flex-1 max-w-6xl mx-auto w-full px-6 py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-72 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-56 w-[46rem] max-w-full -translate-x-1/2 rounded-full bg-[#8ce600]/[0.09] blur-[110px]" />
          <div className="absolute left-[12%] top-6 h-40 w-72 -translate-x-1/2 rounded-full bg-[#1a2b4c]/[0.06] blur-[90px]" />
        </div>

        <motion.div
          {...fadeUp()}
          className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-1 text-sm font-medium text-slate-400">
              {user?.nickname ? `${user.nickname}님, ${greeting}` : greeting}
            </p>
            <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-slate-900">
              영상 대시보드
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              업로드한 경기 영상과 AI 분석 리포트를 한곳에서 관리하세요
            </p>
          </div>
          <button
            onClick={openUploadModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1a2b4c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition-all hover:bg-[#243a63] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ce600] focus-visible:ring-offset-2"
          >
            <Upload className="size-4" />
            영상 업로드
          </button>
        </motion.div>

        {/* ── 통계 ── */}
        {isLoading ? (
          <div className="relative mb-8 grid grid-cols-1 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {[0, 1].map((i) => (
              <div key={i} className="p-5">
                <div className="h-2.5 w-24 rounded-full bg-slate-100 animate-pulse" />
                <div className="mt-3 h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <motion.div
            {...fadeUp(0.05)}
            className="relative mb-8 grid grid-cols-1 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0"
          >
            {[
              { icon: Film, label: "총 업로드 영상", value: `${stats.totalVideos}`, suffix: "개" },
              { icon: Clock, label: "총 분석 시간", value: analysisTimeLabel, suffix: "" },
            ].map(({ icon: Icon, label, value, suffix }) => (
              <div
                key={label}
                className="relative p-5 transition-colors hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon className="size-4 text-[#1a2b4c]" />
                  <p className="text-[13px] font-medium">{label}</p>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-slate-900 sm:text-[28px]">
                    {value}
                  </span>
                  {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
                </div>
              </div>
            ))}
          </motion.div>
        ) : null}

        {/* ── 오늘의 팁 ── */}
        <motion.div
          {...fadeUp(0.1)}
          className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2b4c] to-[#24406e] p-6 text-white"
        >
          <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-[#8ce600]/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 bottom-0 size-24 translate-y-10 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-4xl ring-1 ring-white/15">
              {currentTip.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[#8ce600]">
                <Lightbulb className="size-3.5" />
                <span className="text-xs font-semibold">오늘의 배드민턴 팁</span>
              </div>
              <motion.div
                key={tipIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mt-1.5 text-base font-bold">{currentTip.title}</p>
                <div className="mt-1 flex min-h-[100px] items-center sm:min-h-[80px]">
                  <p className="text-[13px] leading-normal text-white/65 sm:max-w-[62ch]">
                    {currentTip.desc}
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
              <div className="flex items-center gap-1.5">
                {BADMINTON_TIPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTipIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tipIndex ? "w-5 bg-[#8ce600]" : "w-1.5 bg-white/25 hover:bg-white/40"
                    }`}
                    aria-label={`${i + 1}번째 팁`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevTip}
                  className="flex size-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                  aria-label="이전 팁"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextTip}
                  className="flex size-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                  aria-label="다음 팁"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 최근 영상 ── */}
        <motion.section
          {...fadeUp(0.15)}
          className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900">최근 영상</h2>
              {!isLoading && videos.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                  {videos.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-5 px-6 py-4">
                  <div className="w-28 shrink-0 rounded-xl bg-slate-100 animate-pulse" style={{ height: "72px" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-44 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-2.5 w-28 rounded-full bg-slate-100 animate-pulse" />
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="h-8 w-20 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-8 w-20 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1a2b4c]/[0.06]">
                <Film className="size-6 text-[#1a2b4c]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-800">아직 업로드된 영상이 없어요</p>
              <p className="mt-1 text-xs text-slate-500">
                첫 경기 영상을 올리면 AI 분석 리포트를 받아볼 수 있어요
              </p>
              <button
                onClick={openUploadModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1a2b4c] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#243a63] active:translate-y-px"
              >
                <Upload className="size-4" />
                영상 업로드
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {pagedVideos.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onViewVideo={onViewVideo}
                    onViewReport={onViewReport}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {totalVideoPages > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
                  <p className="text-xs tabular-nums text-slate-400">
                    {safeVideoPage * VIDEOS_PER_PAGE + 1}–
                    {safeVideoPage * VIDEOS_PER_PAGE + pagedVideos.length}
                    <span className="text-slate-300"> / </span>
                    {videos.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVideoPage((p) => Math.max(0, p - 1))}
                      disabled={safeVideoPage === 0}
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="이전 페이지"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="min-w-[3.5rem] text-center text-xs font-semibold tabular-nums text-slate-600">
                      {safeVideoPage + 1} / {totalVideoPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setVideoPage((p) => Math.min(totalVideoPages - 1, p + 1))
                      }
                      disabled={safeVideoPage === totalVideoPages - 1}
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="다음 페이지"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.section>
      </main>

      <Footer />

      {/* ── 업로드 모달 ── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {modalStep === "upload" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                <div>
                  <StepIndicator step="upload" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">영상 업로드</h2>
                  <p className="text-xs text-gray-400 mt-0.5">경기 영상을 업로드하여 AI 분석을 받으세요</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </div>
              <div className="px-6 py-5 overflow-y-auto">
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">영상 이름</label>
                  <input
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8ce600] focus:border-transparent transition-all bg-gray-50 placeholder:text-gray-400"
                    placeholder="예: 주말 복식 경기"
                  />
                </div>

                {/* ── 선수 유형 선택 ── */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">선수 유형</label>
                  <p className="text-[11px] text-gray-400 mb-3">분석 방식이 달라지니 정확히 선택해주세요</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPlayerType("amateur")}
                      className={`relative flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        playerType === "amateur"
                          ? "border-[#8ce600] bg-[#f2fde0]"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <UserRound className={`size-[18px] ${playerType === "amateur" ? "text-[#1a2b4c]" : "text-gray-400"}`} />
                        <span className={`text-sm font-bold ${playerType === "amateur" ? "text-[#1a2b4c]" : "text-gray-700"}`}>
                          아마추어
                        </span>
                        {playerType === "amateur" && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-[#8ce600] flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-[#1a2b4c]" fill="none" viewBox="0 0 10 10">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${playerType === "amateur" ? "text-slate-600" : "text-gray-400"}`}>
                        동호회·학교·취미 경기
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlayerType("pro")}
                      className={`relative flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        playerType === "pro"
                          ? "border-[#8ce600] bg-[#f2fde0]"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Trophy className={`size-[18px] ${playerType === "pro" ? "text-[#1a2b4c]" : "text-gray-400"}`} />
                        <span className={`text-sm font-bold ${playerType === "pro" ? "text-[#1a2b4c]" : "text-gray-700"}`}>
                          프로
                        </span>
                        {playerType === "pro" && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-[#8ce600] flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-[#1a2b4c]" fill="none" viewBox="0 0 10 10">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${playerType === "pro" ? "text-slate-600" : "text-gray-400"}`}>
                        실업·국가대표·공식 대회
                      </p>
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">영상 파일</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging ? "border-[#8ce600] bg-[#f2fde0]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Upload className="size-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 mb-1">드래그 앤 드롭 또는 클릭하여 업로드</p>
                    <p className="text-xs text-gray-400 mb-4">MP4, MOV 등 영상 파일</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2b4c] text-white rounded-xl text-sm font-semibold hover:bg-[#243a63] cursor-pointer transition-colors">
                      <Plus className="size-4" />
                      파일 선택
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} />
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">취소</button>
                </div>
              </div>
            </div>
          )}

          {modalStep === "frame" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                <div>
                  <StepIndicator step="frame" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">프레임 선택</h2>
                  <p className="text-xs text-gray-400 mt-0.5">코트가 가장 잘 보이는 프레임을 선택하세요</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <video ref={videoRef} src={videoUrlRef.current ?? undefined} className="hidden" controls={false} />
                <canvas ref={frameCanvasRef} className="hidden" />
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black mb-5">
                  {capturedDataUrl ? (
                    <img src={capturedDataUrl} alt="선택 프레임" className="w-full max-h-[50vh] object-contain mx-auto" />
                  ) : (
                    <div className="h-[480px] flex items-center justify-center text-white/70">프레임 불러오는 중...</div>
                  )}
                </div>
                <div className="mb-4">
                  <input type="range" min={0} max={Math.max(totalFrames - 1, 0)} value={frameIndex} onChange={(e) => setFrameIndex(Number(e.target.value))} className="w-full accent-[#8ce600]" />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>프레임: {frameIndex}</span>
                    <span>총 프레임: {totalFrames}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setModalStep("upload")} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">이전</button>
                  <button type="button" onClick={handleConfirmFrame} className="px-5 py-2.5 bg-[#1a2b4c] text-white rounded-xl text-sm font-semibold hover:bg-[#243a63]">이 프레임으로 선택</button>
                </div>
              </div>
            </div>
          )}

          {modalStep === "corners" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">코트 좌표 지정</h2>
                    <span className="inline-flex items-center rounded-md bg-[#1a2b4c]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1a2b4c]">
                      단식 코트 기준
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">단식 코트 네 모서리와 네트 상단 양 끝을 순서대로 클릭하세요</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                <div
                  className="mb-3 flex items-start gap-3 rounded-xl border p-3 transition-colors"
                  style={
                    currentGuide
                      ? { borderColor: `${currentGuide.color}59`, backgroundColor: `${currentGuide.color}12` }
                      : { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }
                  }
                >
                  {currentGuide ? (
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: currentGuide.color }}
                    >
                      {points.length + 1}
                    </span>
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                      <CheckCircle2 className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-[15px] font-bold text-gray-900 leading-tight">
                        {currentGuide ? currentGuide.label : "좌표 지정 완료"}
                      </p>
                      {currentGuide && (
                        <span className="text-xs font-medium text-gray-400">
                          {points.length + 1} / {POINT_GUIDES.length}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-gray-500">
                      {currentGuide ? currentGuide.hint : "아래 ‘업로드 시작’ 버튼을 눌러 진행하세요."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPoints([])}
                    disabled={points.length === 0}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="size-3.5" />초기화
                  </button>
                </div>
                <div className="relative mb-3">
                  <div
                    ref={zoomBoxRef}
                    className="relative flex overflow-auto rounded-xl border border-gray-200 bg-black"
                    style={{ height: "44vh" }}
                  >
                    {capturedDataUrl ? (
                      <div
                        className="relative m-auto shrink-0"
                        style={{
                          width: fitSize.w ? fitSize.w * zoom : "100%",
                          height: fitSize.h ? fitSize.h * zoom : "100%",
                        }}
                      >
                        <img
                          ref={cornerImgRef}
                          src={capturedDataUrl}
                          alt="코트 좌표 지정"
                          draggable={false}
                          className="block h-full w-full select-none object-contain"
                          onLoad={() => {
                            recomputeFit();
                            drawOverlay();
                          }}
                        />
                        <canvas
                          ref={overlayCanvasRef}
                          className="absolute inset-0 h-full w-full cursor-crosshair"
                          onClick={handleCanvasClick}
                        />
                      </div>
                    ) : (
                      <div className="m-auto text-white/70">이미지 불러오는 중...</div>
                    )}
                  </div>
                  {capturedDataUrl && (
                    <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => adjustZoom(-0.25)}
                        disabled={zoom <= 1}
                        className="flex size-7 items-center justify-center rounded-md text-white transition-colors hover:bg-white/15 disabled:opacity-30"
                        aria-label="축소"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-[3.5ch] text-center text-xs font-semibold tabular-nums text-white">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustZoom(0.25)}
                        disabled={zoom >= 3}
                        className="flex size-7 items-center justify-center rounded-md text-white transition-colors hover:bg-white/15 disabled:opacity-30"
                        aria-label="확대"
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        disabled={zoom === 1}
                        className="ml-0.5 flex size-7 items-center justify-center rounded-md text-white transition-colors hover:bg-white/15 disabled:opacity-30"
                        aria-label="원래 크기"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-center text-[11px] text-gray-400">
                    확대하면 스크롤로 이동 · Ctrl + 휠로도 확대/축소
                  </p>
                </div>
                <div className="flex">
                  {POINT_GUIDES.map((guide, i) => {
                    const done = Boolean(points[i]);
                    const active = i === points.length;
                    const prevDone = i > 0 && Boolean(points[i - 1]);
                    return (
                      <div key={guide.label} className="relative flex flex-1 flex-col items-center">
                        {i > 0 && (
                          <span
                            className="absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 transition-colors"
                            style={{ backgroundColor: prevDone ? POINT_GUIDES[i - 1].color : "#E5E7EB" }}
                          />
                        )}
                        <span
                          className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            done || active ? "text-white" : "bg-gray-100 text-gray-400"
                          }`}
                          style={
                            active
                              ? { backgroundColor: guide.color, boxShadow: `0 0 0 4px ${guide.color}33` }
                              : done
                              ? { backgroundColor: guide.color }
                              : undefined
                          }
                        >
                          {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span
                          className={`mt-1 whitespace-nowrap text-[10px] leading-tight transition-colors ${
                            active ? "font-bold text-gray-900" : done ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {guide.stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-3 shrink-0">
                <button type="button" onClick={() => setModalStep("frame")} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">이전</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={points.length < 6 || isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${
                    points.length < 6 || isSubmitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#1a2b4c] text-white hover:bg-[#243a63]"
                  }`}
                >
                  {isSubmitting ? "업로드 중..." : "업로드 시작"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}