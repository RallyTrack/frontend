export const VIDEO_ACCEPT = ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm";
export function videoSelectionError(file: { name: string; size: number; type: string }): string | null {
  if (file.size <= 0) return "빈 파일은 업로드할 수 없습니다.";
  if (file.size > 500 * 1024 * 1024) return "영상은 500MB까지 업로드할 수 있습니다.";
  const extension = file.name.toLowerCase().split(".").pop();
  const types: Record<string, string> = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
  if (!extension || !types[extension] || (file.type && file.type !== "application/octet-stream" && file.type !== types[extension])) {
    return "MP4·MOV·WebM 영상만 선택해주세요.";
  }
  return null;
}
