import { useEffect, useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { OnboardingPage } from "./components/OnboardingPage2";
import { DashboardPage } from "./components/DashboardPage";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { AnalysisReportPage } from "./components/AnalysisReportPage";
import { AccountPage } from "./components/AccountPage";
import "../styles/index.css"
// import { LoginModal } from "./components/ui/LoginModal";
import { AuthModal } from "./components/ui/AuthModal";

type Page = "onboarding" | "dashboard" | "video" | "report" | "account";

function buildUrl(page: Page, videoId?: string | null) {
  switch (page) {
    case "onboarding":
      return "/";
    case "dashboard":
      return "/dashboard";
    case "video":
      return videoId ? `/video/${videoId}` : "/video";
    case "report":
      return videoId ? `/report/${videoId}` : "/report";
    case "account":
      return "/account";
    default:
      return "/";
  }
}

function parseLocation(): { page: Page; videoId: string | null } {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "onboarding", videoId: null };

  const [first, second] = parts;

  if (first === "dashboard") return { page: "dashboard", videoId: null };
  if (first === "account") return { page: "account", videoId: null };
  if (first === "video") return { page: "video", videoId: second ?? null };
  if (first === "report") return { page: "report", videoId: second ?? null };

  return { page: "onboarding", videoId: null };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("onboarding");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<"login" | "signup" | "forgot">("login");

  const openLoginModal = () => {
    setAuthInitialView("login");
    setIsAuthOpen(true);
  };

const openSignupModal = () => {
  setAuthInitialView("signup");
  setIsAuthOpen(true);
};

const closeAuthModal = () => setIsAuthOpen(false);

  // // 로그인 모달 상태
  // const [isLoginOpen, setIsLoginOpen] = useState(false);
  // const openLogin = () => setIsLoginOpen(true);
  // const closeLogin = () => setIsLoginOpen(false);

  // 페이지 처음 로드 시 토큰 있으면 로그인 유지
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // URL -> state (새로고침/직접접속/뒤로가기 대응)
  useEffect(() => {
    const apply = () => {
      const { page, videoId } = parseLocation();
      setCurrentPage(page);
      setSelectedVideoId(videoId);
    };

    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  //  state -> URL
  const go = (page: Page, videoId?: string | null) => {
    const url = buildUrl(page, videoId ?? selectedVideoId);
    window.history.pushState(
      { page, videoId: videoId ?? selectedVideoId },
      "",
      url
    );
    setCurrentPage(page);
    if (typeof videoId !== "undefined") setSelectedVideoId(videoId);
  };

  // 로그인 성공(모달에서 호출)
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    closeAuthModal();
    go("dashboard", selectedVideoId);
  };

  const handleLogout = () => {
    localStorage.clear();   // 토큰 삭제
    setIsLoggedIn(false);
    setSelectedVideoId(null);
    go("onboarding", null);
  };

  const handleViewVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    go("video", videoId);
  };

  const handleViewReport = (videoId: string) => {
    setSelectedVideoId(videoId);
    go("report", videoId);
  };

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    if ((page === "video" || page === "report") && !selectedVideoId) return;
    go(page, selectedVideoId);
  };

  const handleJumpToVideo = (time: number) => {
    // 실제론 video player seek가 좋지만, 지금은 video 페이지로 이동만
    go("video", selectedVideoId);
  };

  //  로그인 필요한데 로그인 안했으면: 모달 열기(선택)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    
    if (!token && currentPage !== "onboarding") {
      // 대시보드/리포트 같은 곳에 갔는데 로그인 안 되어있으면 모달 띄우고 온보딩으로
      openLoginModal();
      go("onboarding", null);
    }
  }, [currentPage]);

  return (
    <>
      {currentPage === "onboarding" && (
        <OnboardingPage 
        onGetStarted={openLoginModal}
        onOpenLogin={openLoginModal}
       onOpenSignup={openSignupModal}
         />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          onViewVideo={handleViewVideo}
          onViewReport={handleViewReport}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}

      {currentPage === "video" && selectedVideoId && (
        <VideoPlayerPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "report" && selectedVideoId && (
        <AnalysisReportPage
          videoId={selectedVideoId}
          onBack={() => window.history.back()}
          onJumpToVideo={handleJumpToVideo}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "account" && (
        <AccountPage
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          hasSelectedVideo={!!selectedVideoId}
        />
      )}

      {/* 로그인 모달은 항상 렌더링(조건부 표시만 open으로) */}
     <AuthModal
      open={isAuthOpen}
      onClose={closeAuthModal}
      onLoginSuccess={handleLoginSuccess}
      initialView={authInitialView}
/>
    </>
  );
}
