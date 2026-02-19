<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import type { ReportResponse } from "../types/reportpageApi";
=======
import {ReportResponse} from "../types/reportpageType"
>>>>>>> 3578ac69 (api update in feat#/6-result-report)

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
<<<<<<< HEAD
    method : "GET",
    headers: { Accept: "application/json" },
=======
=======
>>>>>>> origin/develop
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
<<<<<<< HEAD
=======
>>>>>>> 3578ac69 (api update in feat#/6-result-report)
=======
>>>>>>> origin/develop
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> b10ebf17 (analysis-report api is connected)
=======
>>>>>>> 3578ac69 (api update in feat#/6-result-report)
=======
>>>>>>> origin/develop
  });

  if (!res.ok) {
    throw new Error(`리포트 조회 실패: ${res.status}`);
  }

  return (await res.json()) as ReportResponse;
}
