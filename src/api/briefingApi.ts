import { apiClient } from "./apiClient.ts";

export async function fetchBriefing(videoId: string | number, player: "top" | "bottom", signal?: AbortSignal): Promise<string> {
  const response = await apiClient(`/api/v1/videos/${encodeURIComponent(videoId)}/briefing`, {
    method: "POST", body: JSON.stringify({ player }), signal,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const messages: Record<number, string> = {
      429: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
      503: "브리핑 기능을 사용할 수 없습니다.",
      504: "브리핑 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
    };
    throw new Error(messages[response.status] ?? json.message ?? "브리핑을 생성하지 못했습니다.");
  }
  if (json.data?.videoId !== Number(videoId) || json.data?.player !== player || typeof json.data?.text !== "string") {
    throw new Error("브리핑 응답을 확인할 수 없습니다.");
  }
  return json.data.text;
}
