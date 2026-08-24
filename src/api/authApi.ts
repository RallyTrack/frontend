// src/api/authApi.ts

/**
 * refreshToken으로 새 accessToken을 발급받습니다.
 * 성공 시 localStorage를 갱신하고 새 accessToken을 반환합니다.
 * 실패 시 null을 반환합니다.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch("/api/v1/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const result = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = result.data;

    localStorage.setItem("accessToken", accessToken);
    // 백엔드가 새 refreshToken도 내려주면 함께 갱신
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }

    return accessToken;
  } catch {
    return null;
  }
}

/**
 * 로그아웃 처리 — App.tsx의 handleLogout 대신 API 레이어에서 호출합니다.
 * "auth:logout" 이벤트를 발행해 App이 상태를 초기화하도록 합니다.
 */
export function clearAuthAndRedirect() {
  localStorage.clear();
  window.dispatchEvent(new CustomEvent("auth:logout"));
}