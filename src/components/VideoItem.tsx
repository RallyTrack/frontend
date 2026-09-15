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

  /**
   * 액션 버튼은 두 곳에서 쓰인다.
   * - 좁은 화면: 카드 아래 한 줄로 펼쳐 항상 보인다 (stack)
   * - 넓은 화면: 오른쪽 끝에서 hover/focus 때만 나타난다 (row)
   * 마크업을 한 번만 적어 두 배치가 어긋나지 않게 한다.
   */
  const actions = (layout: "stack" | "row") => {
    const stacked = layout === "stack";
    // 손가락으로 누르는 쪽만 44px 터치 목표가 필요하다.
    const size = stacked
      ? "min-h-11 flex-1 px-3 text-sm"
      : "px-3.5 py-2 text-xs";

    return (
      <>
        <button
          onClick={() => isReady && onViewVideo(video.id)}
          disabled={!isReady}
          className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors active:translate-y-px ${size} ${
            isReady
              ? "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          <Play className="size-3.5 shrink-0" aria-hidden="true" />
          영상 보기
        </button>

        <button
          onClick={() => isReady && onViewReport(video.id)}
          disabled={!isReady}
          className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors active:translate-y-px ${size} ${
            isReady
              ? "bg-[#1a2b4c] text-white shadow-sm shadow-slate-900/10 hover:bg-[#243a63]"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          <FileText className="size-3.5 shrink-0" aria-hidden="true" />
          분석 보기
        </button>

        <button
          onClick={() => onDelete(video.id)}
          aria-label={`${video.name} 삭제`}
          className={`flex shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 ${
            stacked ? "size-11" : "p-2"
          }`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </>
    );
  };

  return (
    <div className="group border-b border-slate-100 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-slate-50/70 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3.5 sm:gap-5">
        {/* ── 썸네일 ── */}
        <div
          className={`relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-[72px] sm:w-28 ${
            isError ? "bg-red-50" : "bg-slate-100"
          }`}
        >
          {shouldShowThumbnail ? (
            <>
              <img
                src={video.thumbnail}
                alt=""
                className="h-full w-full object-cover"
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}

              {isProcessing && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>

                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <div className="h-1 overflow-hidden rounded-full bg-violet-100/80">
                      <div className="h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-violet-400" />
                    </div>
                  </div>
                </>
              )}

              {isError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/15">
                  <AlertCircle className="size-6 text-red-500" />
                </div>
              )}
            </>
          ) : isUploading ? (
            <Loader2 className="size-6 animate-spin text-blue-400" />
          ) : isProcessing ? (
            <Loader2 className="size-6 animate-spin text-violet-400" />
          ) : isError ? (
            <AlertCircle className="size-6 text-red-400" />
          ) : video.thumbnail && thumbnailError ? (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
              <ImageOff className="size-5" />
              <span className="text-[10px] font-medium">썸네일 실패</span>
            </div>
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm">
              <Play className="ml-0.5 size-4 text-[#1a2b4c]" />
            </div>
          )}

          {/* 상태 뱃지는 좁은 화면에서 썸네일을 거의 다 덮어 제목 옆 뱃지와도
              겹쳐 보였다. sm 이상에서만 띄운다. */}
          {(isUploading || isProcessing || isError) && (
            <div className="absolute right-2 top-2 hidden sm:block">
              {isUploading && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 shadow-sm">
                  <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
                  업로드 중
                </span>
              )}
              {isProcessing && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600 shadow-sm">
                  <span className="size-1.5 animate-ping rounded-full bg-violet-400" />
                  분석 중
                </span>
              )}
              {isError && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500 shadow-sm">
                  오류
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 제목 · 메타 ── */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-800">
              {video.name}
            </h3>

            {isUploading && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                <span className="size-1.5 animate-pulse rounded-full bg-blue-400" />
                업로드 중
              </span>
            )}

            {isProcessing && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                <span className="size-1.5 animate-ping rounded-full bg-violet-400" />
                분석 중
              </span>
            )}

            {isError && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500">
                오류
              </span>
            )}
          </div>

          {/* 좁은 화면에서는 날짜·길이가 한 줄에 안 들어가면 줄을 바꾼다 */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 shrink-0" aria-hidden="true" />
              {video.date}
            </span>

            <span className="hidden text-slate-200 sm:inline">·</span>

            {isProcessing ? (
              <span className="flex items-center gap-1 font-medium text-violet-500">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-violet-500" />
                </span>
                AI 분석 처리 중
              </span>
            ) : isUploading ? (
              <span className="flex items-center gap-1 font-medium text-blue-500">
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                업로드 진행 중
              </span>
            ) : isError ? (
              <span className="flex items-center gap-1 font-medium text-red-500">
                <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                업로드 또는 처리 실패
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="size-3 shrink-0" aria-hidden="true" />
                {video.duration}
              </span>
            )}
          </div>
        </div>

        {/* ── 넓은 화면 액션 ──
            폭을 고정해 hover로 버튼이 나타날 때 레이아웃이 밀리지 않게 한다.
            sm 미만에서는 아예 렌더하지 않는다 — 280px가 자리를 차지해
            좁은 화면에서 행 전체가 잘려 나갔다. */}
        <div className="relative hidden h-9 w-[272px] shrink-0 sm:block">
          {/* 상태 표시등 — 버튼이 나타나면 비켜준다 */}
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 transition-opacity duration-200 group-hover:opacity-0 group-focus-within:opacity-0">
            {isReady ? (
              <span className="size-2 rounded-full bg-emerald-400" title="분석 완료" />
            ) : isProcessing ? (
              <span className="size-2 animate-pulse rounded-full bg-violet-400" title="분석 중" />
            ) : isUploading ? (
              <span className="size-2 animate-pulse rounded-full bg-blue-400" title="업로드 중" />
            ) : isError ? (
              <span className="size-2 rounded-full bg-red-400" title="오류" />
            ) : null}
          </div>

          {/* 키보드로 Tab 해도 나타나야 한다 — group-focus-within */}
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            {actions("row")}
          </div>
        </div>
      </div>

      {/* ── 좁은 화면 액션 ──
          터치 기기에는 hover가 없다. Tailwind v4의 hover: 는 @media (hover: hover)로
          감싸지므로 예전 구조에서는 버튼이 끝까지 opacity-0으로 남아 있었다. */}
      <div className="mt-3 flex items-center gap-2 sm:hidden">
        {actions("stack")}
      </div>
    </div>
  );
}
