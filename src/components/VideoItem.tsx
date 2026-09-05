import { useState } from "react";
import {
  Play,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  ImageOff,
} from "lucide-react";

export interface VideoItemProps {
  video: {
    id: string;
    name: string;
    date: string;
    duration: string;
    status?: "uploading" | "processing" | "completed" | "error";
    thumbnail?: string;
    serverThumbnail?: string;
  };
  onViewVideo: (id: string) => void;
  onViewReport: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VideoItem({
  video,
  onViewVideo,
  onViewReport,
  onDelete,
}: VideoItemProps) {
  const isUploading = video.status === "uploading";
  const isProcessing = video.status === "processing" || video.duration === "분석 중";
  const isError = video.status === "error";
  const isReady = !isUploading && !isProcessing && !isError;

  const [thumbnailError, setThumbnailError] = useState(false);

  const shouldShowThumbnail = !!video.thumbnail && !thumbnailError;

  return (
    <div className="group flex items-center gap-5 px-6 py-4 hover:bg-slate-50/70 transition-colors border-b last:border-b-0 border-slate-100">
      <div
        className={`relative w-28 h-18 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${
          isError ? "bg-red-50" : "bg-slate-100"
        }`}
        style={{ height: "72px", minWidth: "112px" }}
      >
        {shouldShowThumbnail ? (
          <>
            <img
              src={video.thumbnail}
              alt={video.name}
              className="w-full h-full object-cover"
              onError={() => {
                console.error("썸네일 로드 실패:", {
                  id: video.id,
                  thumbnail: video.thumbnail,
                  serverThumbnail: video.serverThumbnail,
                });
                setThumbnailError(true);
              }}
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Loader2 className="size-6 text-white animate-spin" />
              </div>
            )}

            {isProcessing && (
              <>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="h-1 bg-violet-100/80 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-2/3" />
                  </div>
                </div>
              </>
            )}

            {isError && (
              <div className="absolute inset-0 bg-red-500/15 flex items-center justify-center">
                <AlertCircle className="size-6 text-red-500" />
              </div>
            )}
          </>
        ) : isUploading ? (
          <Loader2 className="size-6 text-blue-400 animate-spin" />
        ) : isProcessing ? (
          <div className="relative flex items-center justify-center">
            <Loader2 className="size-6 text-violet-400 animate-spin" />
          </div>
        ) : isError ? (
          <AlertCircle className="size-6 text-red-400" />
        ) : video.thumbnail && thumbnailError ? (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
            <ImageOff className="size-5" />
            <span className="text-[10px] font-medium">썸네일 실패</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm">
            <Play className="size-4 text-[#1a2b4c] ml-0.5" />
          </div>
        )}

        {isUploading && (
          <div className="absolute top-2 right-2">
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              업로드 중
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="absolute top-2 right-2">
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              분석 중
            </span>
          </div>
        )}

        {isError && (
          <div className="absolute top-2 right-2">
            <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full shadow-sm">
              오류
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{video.name}</h3>

          {isUploading && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              업로드 중
            </span>
          )}

          {isProcessing && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              분석 중
            </span>
          )}

          {isError && (
            <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
              오류
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {video.date}
          </span>

          <span className="text-slate-200">·</span>

          {isProcessing ? (
            <span className="flex items-center gap-1 text-violet-500 font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
              </span>
              AI 분석 처리 중
            </span>
          ) : isUploading ? (
            <span className="flex items-center gap-1 text-blue-500 font-medium">
              <Loader2 className="size-3 animate-spin" />
              업로드 진행 중
            </span>
          ) : isError ? (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <AlertCircle className="size-3" />
              업로드 또는 처리 실패
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {video.duration}
            </span>
          )}
        </div>
      </div>

      {/* 버튼과 상태 표시등을 절대 위치로 배치하여 레이아웃 시프트 방지 */}
      <div className="relative shrink-0" style={{ width: "280px", height: "36px" }}>
        {/* 상태 표시등 - hover 시 숨김 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-opacity duration-200 group-hover:opacity-0 group-hover:pointer-events-none">
          {isReady ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400" title="분석 완료" />
          ) : isProcessing ? (
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" title="분석 중" />
          ) : isUploading ? (
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="업로드 중" />
          ) : isError ? (
            <div className="w-2 h-2 rounded-full bg-red-400" title="오류" />
          ) : null}
        </div>

        {/* 버튼들 - hover 시 표시 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => isReady && onViewVideo(video.id)}
            disabled={!isReady}
            title="영상 보기"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:translate-y-px ${
              isReady
                ? "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Play className="size-3.5" />
            영상 보기
          </button>

          <button
            onClick={() => isReady && onViewReport(video.id)}
            disabled={!isReady}
            title="분석 보기"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:translate-y-px ${
              isReady
                ? "bg-[#1a2b4c] text-white hover:bg-[#243a63] shadow-sm shadow-slate-900/10"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <FileText className="size-3.5" />
            분석 보기
          </button>

          <button
            onClick={() => onDelete(video.id)}
            title="삭제"
            className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}