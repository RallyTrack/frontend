import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  // 로그인 안 되어 있으면 메인으로 바로 리다이렉트
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // 로그인 되어 있으면 보호된 페이지 렌더링
  return <Outlet />;
}
