import {ReportResponse} from "../types/reportpageType"

// 🔹 2. API 호출 함수
export async function fetchReport(
  videoId: string | number
): Promise<ReportResponse> {

  const token =
    localStorage.getItem("accessToken") ??
    sessionStorage.getItem("accessToken");

  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const res = await fetch(`/api/v1/analysis/${videoId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`리포트 조회 실패: ${res.status}`);
  }

  return (await res.json()) as ReportResponse;
}
