// src/api/dashboardApi.ts
import { apiClient } from './apiClient';

export interface DashboardSummary {
  totalVideos: number;
  totalAnalysisTime: string;
  averageScore: number;
}

// API에서 받아올 비디오 아이템 구조 정의
export interface ApiVideoItem {
  videoId: number;
  title: string;
  date: string;
  playTime: string;
  matchScore: string;
  thumbnailUrl: string;
  status?: string; // "PROCESSING" | "COMPLETED" | "FAILED" | "uploading" | "processing" | "completed" | "error"
  actions: {
    viewVideoUrl: string;
    viewAnalysisUrl: string;
  };
}

// API 응답 타입 정의
export interface DashboardResponse {
  code: number;
  message: string;
  data: {
    dashboardSummary: DashboardSummary;
    recentVideos: ApiVideoItem[];
  };
}

// ── 활동 통계 ──────────────────────────────────────────────────

export interface ActivityDataPoint {
  day: string;
  usageCount: number;
  uploadCount: number;
}

export interface ActivityResponse {
  code: number;
  message: string;
  data: {
    stats: ActivityDataPoint[];
  };
}

// ── 퍼포먼스 트렌드 ────────────────────────────────────────────

export interface TrendResponse {
  code: number;
  message: string;
  data: {
    smash: number[];
    defense: number[];
    accuracy: number[];
  };
}

// 대시보드 데이터 가져오기
export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient('/api/v1/dashboard');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

// 활동 통계 (최근 7일 사용/업로드 추이)
export async function fetchActivityStats(): Promise<ActivityResponse> {
  const response = await apiClient('/api/v1/dashboard/activity');
  if (!response.ok) throw new Error('Failed to fetch activity stats');
  return response.json();
}

// 퍼포먼스 트렌드 (최근 7주 분석 기반)
export async function fetchPerformanceTrend(): Promise<TrendResponse> {
  const response = await apiClient('/api/v1/dashboard/trend');
  if (!response.ok) throw new Error('Failed to fetch performance trend');
  return response.json();
}

// 비디오 삭제 API
export async function deleteVideo(videoId: string): Promise<void> {
  const response = await apiClient(`/api/v1/videos/${videoId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete video');
}
