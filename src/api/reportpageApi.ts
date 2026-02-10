import type { ReportResponse } from "../types/reportpageApi";

export async function fetchReport(videoId: string | number): Promise<ReportResponse> {
  const res = await fetch(`/api/reports/${videoId}`);

  if (!res.ok) {
    // 백엔드 에러 템플릿이 있으면 여기에서 파싱해 메시지 뽑아도 됨
    throw new Error(`리포트 조회 실패: ${res.status}`);
  }

  return (await res.json()) as ReportResponse;
}
