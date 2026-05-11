// src/api/videoApi.ts
import { apiClient } from './apiClient';

export interface VideoInfo {
  videoId: number | string;
  title: string;
  videoUrl: string;
  skeletonVideoUrl?: string;
  minimapVideoUrl?: string;         // ← 추가: 코트 추적 미니맵 영상
  thumbnailUrl?: string;
  duration?: number;
  uploadDate?: string;
  status?: string;
}

export interface MatchSummary {
  matchScore?: string;
  totalRallies?: number;
  totalDuration?: number;
  [key: string]: any;
}

export interface ApiTimelineEvent {
  eventId?: number | string;
  type: string;
  timestamp: number;
  displayTime?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface VideoDetailResponse {
  videoInfo: VideoInfo;
  matchSummary: MatchSummary;
  timelineEvents: ApiTimelineEvent[];
}

export async function fetchVideoDetail(videoId: string): Promise<VideoDetailResponse> {
  const response = await apiClient(`/api/v1/videos/${videoId}`);
  if (!response.ok) throw new Error(`Failed to fetch video detail: ${response.status}`);
  const json = await response.json();

  // API 응답 구조 정규화
  const data = json.data ?? json;
  return {
    videoInfo: data.videoInfo ?? data,
    matchSummary: data.matchSummary ?? {},
    timelineEvents: data.timelineEvents ?? data.events ?? [],
  };
}
