import { useState, useEffect, useCallback, useRef } from "react";
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
  DashboardResponse,
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

const POINT_GUIDES = [
  { label: "Top Left", shortLabel: "TL", color: "#3B82F6", netPoint: false },
  { label: "Top Right", shortLabel: "TR", color: "#10B981", netPoint: false },
  {
    label: "Bottom Right",
    shortLabel: "BR",
    color: "#EC4899",
    netPoint: false,
  },
  { label: "Bottom Left", shortLabel: "BL", color: "#F59E0B", netPoint: false },
  { label: "Net Left", shortLabel: "NL", color: "#8B5CF6", netPoint: true },
  { label: "Net Right", shortLabel: "NR", color: "#06B6D4", netPoint: true },
];

type ModalStep = "upload" | "frame" | "corners";

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

const BADMINTON_TIPS = [
  {
    icon: "🏸",
    title: "스매시 파워업",
    desc: "임팩트 순간 손목 스냅을 극대화하면 셔틀 속도가 15~20% 향상됩니다.",
  },
  {
    icon: "👣",
    title: "풋워크 기초",
    desc: "리턴 기준 위치(센터)로 빠르게 복귀하는 습관이 수비력을 크게 높입니다.",
  },
  {
    icon: "🎯",
    title: "드롭샷 전략",
    desc: "네트 근처 빈 공간을 노리는 드롭은 상대 체력 소모에 효과적입니다.",
  },
  {
    icon: "💪",
    title: "코어 강화",
    desc: "복근·허리 근력 강화로 스윙 안정성과 부상 방지 두 마리를 잡으세요.",
  },
  {
    icon: "👁️",
    title: "셔틀 예측",
    desc: "상대 라켓 각도와 어깨 방향을 읽으면 0.1초 먼저 움직일 수 있습니다.",
  },
  {
    icon: "🌬️",
    title: "호흡 관리",
    desc: "스트로크 직전 짧게 내쉬는 호흡이 근육 긴장을 줄이고 정확도를 높입니다.",
  },
];

const MOCK_TREND = {
  smash: [62, 68, 65, 72, 70, 75, 75],
  defense: [70, 72, 75, 73, 78, 80, 88],
  accuracy: [60, 65, 63, 70, 75, 78, 80],
};

const MOCK_ACTIVITY = [
  { day: "월", usageCount: 5, uploadCount: 1 },
  { day: "화", usageCount: 8, uploadCount: 2 },
  { day: "수", usageCount: 4, uploadCount: 0 },
  { day: "목", usageCount: 10, uploadCount: 3 },
  { day: "금", usageCount: 7, uploadCount: 1 },
  { day: "토", usageCount: 12, uploadCount: 4 },
  { day: "일", usageCount: 6, uploadCount: 1 },
];

function toDateString(value?: string) {
  if (!value) return new Date().toISOString().split("T")[0];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

function buildCourtCornersPayload(points: Point[]) {
  return JSON.stringify({
    topLeft: {
      x: points[0].x,
      y: points[0].y,
    },
    topRight: {
      x: points[1].x,
      y: points[1].y,
    },
    bottomRight: {
      x: points[2].x,
      y: points[2].y,
    },
    bottomLeft: {
      x: points[3].x,
      y: points[3].y,
    },
    netTopLeft: {
      x: points[4].x,
      y: points[4].y,
    },
    netTopRight: {
      x: points[5].x,
      y: points[5].y,
    },
  });
}

function ActivityChartCard() {
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

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={MOCK_ACTIVITY}
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
                if (name === "uploadCount")
                  return [`${value}개`, "영상 업로드"];
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
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
            총 사이트 사용
          </p>
          <p className="text-lg font-black text-blue-700">
            {MOCK_ACTIVITY.reduce((s, i) => s + i.usageCount, 0)}회
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-1">
            총 업로드 수
          </p>
          <p className="text-lg font-black text-sky-700">
            {MOCK_ACTIVITY.reduce((s, i) => s + i.uploadCount, 0)}개
          </p>
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
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  active
                    ? "text-blue-600"
                    : done
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                  done ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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

  const [modalStep, setModalStep] = useState<ModalStep>("upload");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [frameIndex, setFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps] = useState(30);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(
    null,
  );
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const cornerImgRef = useRef<HTMLImageElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoUrlRef = useRef<string | null>(null);

  // ✅ 수정: thumbnail 필드도 함께 업데이트하여 화면에 표시되도록 변경
  const tryPromoteServerThumbnail = useCallback(
    (videoId: string, serverThumbnail?: string) => {
      if (!serverThumbnail) return;

      const img = new Image();

      img.onload = () => {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  thumbnail: serverThumbnail, // ✅ 실제 표시되는 필드 업데이트
                  serverThumbnail,
                }
              : video,
          ),
        );
      };

      img.onerror = () => {
        console.warn("서버 썸네일 아직 사용 불가:", {
          videoId,
          serverThumbnail,
        });
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
          status: v.playTime === "분석 중" ? "processing" : "completed",
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          setStats({
            ...stats,
            totalVideos: Math.max(0, stats.totalVideos - 1),
          });
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

    const scaleX =
      canvas.width / (videoSize.w || img.naturalWidth || canvas.width);
    const scaleY =
      canvas.height / (videoSize.h || img.naturalHeight || canvas.height);

    // 코트 라인 (4개 포인트가 찍혔을 때)
    if (points.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY); // TL
      ctx.lineTo(points[1].x * scaleX, points[1].y * scaleY); // TR
      ctx.lineTo(points[2].x * scaleX, points[2].y * scaleY); // BR
      ctx.lineTo(points[3].x * scaleX, points[3].y * scaleY); // BL
      ctx.closePath();

      ctx.strokeStyle = "rgba(59,130,246,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.fillStyle = "rgba(59,130,246,0.07)";
      ctx.fill();
      ctx.setLineDash([]);
    }

    // 네트 라인 (6개 포인트가 모두 찍혔을 때)
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

  useEffect(() => {
    if (modalStep === "corners") drawOverlay();
  }, [points, modalStep, drawOverlay]);

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
          (blob) => {
            if (blob) setThumbnailBlob(blob);
          },
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
    const scaleX =
      (videoSize.w || img?.naturalWidth || rect.width) / rect.width;
    const scaleY =
      (videoSize.h || img?.naturalHeight || rect.height) / rect.height;

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

  const closeModal = () => {
    setShowUploadModal(false);
    setModalStep("upload");
    setUploadFile(null);
    setVideoName("");
    setPoints([]);
    setFrameIndex(0);
    setCapturedDataUrl(null);
    setThumbnailBlob(null);
    setSubmitResult(null);

    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (points.length < 6 || !uploadFile) return;

    if (!thumbnailBlob || !capturedDataUrl) {
      alert(
        "썸네일 생성이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    const currentUploadFile = uploadFile;
    const currentVideoName = videoName || uploadFile.name;
    const currentPoints = [...points];
    const currentThumbnailBlob = thumbnailBlob;
    const currentThumbnailDataUrl = capturedDataUrl;

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

      if (!newVideoId) {
        throw new Error("업로드 응답에 videoId가 없습니다.");
      }

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
          v.id === tempId
            ? {
                ...v,
                duration: "업로드 실패",
                status: "error",
              }
            : v,
        ),
      );

      setSubmitResult("error");
      alert(
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.",
      );
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
        user={user}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-1">
              My Dashboard
            </p>
            <h1 className="text-2xl font-bold text-slate-900">영상 대시보드</h1>
            <p className="mt-1 text-sm text-slate-500">
              업로드한 경기 영상과 AI 분석 리포트를 관리하세요
            </p>
          </div>

          <button
            onClick={() => {
              setShowUploadModal(true);
              setModalStep("upload");
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-sm font-semibold"
          >
            <Upload className="size-4" />
            영상 업로드
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-slate-100 rounded-full animate-pulse w-24" />
                  <div className="h-6 bg-slate-100 rounded-full animate-pulse w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Film className="size-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400 mb-1">
                  총 업로드 영상
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {stats.totalVideos}
                  </span>
                  <span className="text-sm text-slate-400 ml-0.5">개</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400 mb-1">
                  총 영상 시간
                </p>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.totalAnalysisTime}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <ActivityChartCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                퍼포먼스 트렌드
              </h2>
              <span className="ml-auto text-[10px] text-slate-400">
                최근 7주 · 분석 데이터 기반
              </span>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "스매시",
                  data: MOCK_TREND.smash,
                  color: "#ef4444",
                  current: MOCK_TREND.smash[6],
                },
                {
                  label: "수비력",
                  data: MOCK_TREND.defense,
                  color: "#3b82f6",
                  current: MOCK_TREND.defense[6],
                },
                {
                  label: "정확도",
                  data: MOCK_TREND.accuracy,
                  color: "#10b981",
                  current: MOCK_TREND.accuracy[6],
                },
              ].map(({ label, data, color, current }) => {
                const prev = data[data.length - 2];
                const diff = current - prev;

                return (
                  <div key={label} className="flex items-center gap-4">
                    <span className="w-14 text-xs font-semibold text-gray-500 shrink-0">
                      {label}
                    </span>
                    <div className="flex-1">
                      <TrendSparkline data={data} color={color} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-sm font-black tabular-nums"
                        style={{ color }}
                      >
                        {current}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          diff >= 0
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] text-slate-300">
              * 트렌드는 분석된 경기 리포트 데이터를 기반으로 자동 계산됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-[#1a2b4c] to-[#2a4070] rounded-2xl p-5 text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="size-4 text-[#8ce600]" />
                  <span className="text-[10px] font-bold text-[#8ce600] uppercase tracking-widest">
                    오늘의 배드민턴 팁
                  </span>
                </div>

                <div className="text-3xl mb-2">{currentTip.icon}</div>
                <p className="text-sm font-bold mb-1">{currentTip.title}</p>
                <p className="text-xs text-white/70 leading-relaxed min-h-[48px]">
                  {currentTip.desc}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={handlePrevTip}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="이전 팁"
                  >
                    <ChevronLeft className="size-4 text-white" />
                  </button>

                  <div className="flex gap-1">
                    {BADMINTON_TIPS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTipIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === tipIndex
                            ? "w-5 bg-[#8ce600]"
                            : "w-2 bg-white/30 hover:bg-white/50"
                        }`}
                        aria-label={`${i + 1}번째 팁`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextTip}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="다음 팁"
                  >
                    <ChevronRight className="size-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-slate-800">
                최근 영상
              </span>
              {!isLoading && videos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold tabular-nums">
                  {videos.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-5">
                  <div
                    className="w-28 rounded-xl bg-slate-100 animate-pulse shrink-0"
                    style={{ height: "72px" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-44" />
                    <div className="h-2.5 bg-slate-100 rounded-full animate-pulse w-28" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-8 w-20 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-8 w-20 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Upload className="size-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">
                업로드된 영상이 없습니다
              </p>
              <p className="text-xs text-slate-400">
                첫 번째 경기 영상을 업로드해보세요
              </p>
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setModalStep("upload");
                }}
                className="mt-5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                영상 업로드
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {videos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  onViewVideo={onViewVideo}
                  onViewReport={onViewReport}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {modalStep === "upload" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <StepIndicator step="upload" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">
                    영상 업로드
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    경기 영상을 업로드하여 AI 분석을 받으세요
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="px-6 py-5">
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    영상 이름
                  </label>
                  <input
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 placeholder:text-gray-400"
                    placeholder="예: 주말 복식 경기"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    영상 파일
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Upload className="size-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      드래그 앤 드롭 또는 클릭하여 업로드
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      MP4, MOV 등 영상 파일
                    </p>

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 cursor-pointer transition-colors">
                      <Plus className="size-4" />
                      파일 선택
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalStep === "frame" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <StepIndicator step="frame" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">
                    프레임 선택
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    코트가 가장 잘 보이는 프레임을 선택하세요
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6">
                <video
                  ref={videoRef}
                  src={videoUrlRef.current ?? undefined}
                  className="hidden"
                  controls={false}
                />
                <canvas ref={frameCanvasRef} className="hidden" />

                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black mb-5">
                  {capturedDataUrl ? (
                    <img
                      src={capturedDataUrl}
                      alt="선택 프레임"
                      className="w-full max-h-[70vh] object-contain mx-auto"
                    />
                  ) : (
                    <div className="h-[480px] flex items-center justify-center text-white/70">
                      프레임 불러오는 중...
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(totalFrames - 1, 0)}
                    value={frameIndex}
                    onChange={(e) => setFrameIndex(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>프레임: {frameIndex}</span>
                    <span>총 프레임: {totalFrames}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setModalStep("upload")}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmFrame}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
                  >
                    이 프레임으로 선택
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalStep === "corners" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <StepIndicator step="corners" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">
                    코트 좌표 지정
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    코트 네 꼭짓점과 네트 양 끝을 순서대로 클릭하세요
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      현재 선택:{" "}
                      <span style={{ color: currentGuide?.color }}>
                        {currentGuide?.label ?? "완료"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      순서: TL → TR → BR → BL → NL → NR
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPoints([])}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <RotateCcw className="size-4" />
                      초기화
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black mb-5">
                  {capturedDataUrl ? (
                    <>
                      <img
                        ref={cornerImgRef}
                        src={capturedDataUrl}
                        alt="코트 좌표 지정"
                        className="w-full max-h-[70vh] object-contain mx-auto block"
                        onLoad={drawOverlay}
                      />
                      <canvas
                        ref={overlayCanvasRef}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                        onClick={handleCanvasClick}
                      />
                    </>
                  ) : (
                    <div className="h-[480px] flex items-center justify-center text-white/70">
                      이미지 불러오는 중...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {POINT_GUIDES.map((guide, i) => {
                    const selected = points[i];
                    return (
                      <div
                        key={guide.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: guide.color }}
                          />
                          <p className="text-sm font-semibold text-gray-700">
                            {guide.label}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {selected
                            ? `(${selected.x}, ${selected.y})`
                            : "아직 선택 안 됨"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setModalStep("frame")}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={points.length < 6 || isSubmitting}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${
                      points.length < 6 || isSubmitting
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? "업로드 중..." : "업로드 시작"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
