const DEFAULT_API_PROXY_TARGET = "http://localhost:8080";

/**
 * 로컬 Vite 개발 서버가 /api 요청을 전달할 백엔드 origin을 결정합니다.
 * 운영 빌드에서는 nginx가 /api를 처리하므로 이 값이 번들에 포함되지 않습니다.
 */
export function resolveApiProxyTarget(rawTarget?: string): string {
  const candidate = rawTarget?.trim() || DEFAULT_API_PROXY_TARGET;
  const target = new URL(candidate);

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("VITE_API_PROXY_TARGET은 http 또는 https URL이어야 합니다.");
  }
  if (target.username || target.password) {
    throw new Error("VITE_API_PROXY_TARGET에 인증 정보를 포함할 수 없습니다.");
  }

  return target.origin;
}
