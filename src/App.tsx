import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OnboardingPage } from "./components/OnboardingPage";
import { DashboardPage } from "./components/DashboardPage";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { AnalysisReportPage } from "./components/AnalysisReportPage";
import { AccountPage } from "./components/AccountPage";
import { AuthModal } from "./components/ui/AuthModal";
import { useAuth } from "./contexts/AuthContext";
import "../styles/index.css";

export function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleViewVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    navigate(`/video/${videoId}`);
  };

  const handleViewReport = (videoId: string) => {
    setSelectedVideoId(videoId);
    navigate(`/report/${videoId}`);
  };

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    switch (page) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "account":
        navigate("/account");
        break;
      case "video":
        if (selectedVideoId) navigate(`/video/${selectedVideoId}`);
        break;
      case "report":
        if (selectedVideoId) navigate(`/report/${selectedVideoId}`);
        break;
    }
  };

  return (
    <DashboardPage
      onLogout={handleLogout}
      onViewVideo={handleViewVideo}
      onViewReport={handleViewReport}
      onNavigate={handleNavigate}
      hasSelectedVideo={!!selectedVideoId}
    />
  );
}

export function VideoLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { videoId } = useParams<{ videoId: string }>();

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    switch (page) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "account":
        navigate("/account");
        break;
      case "video":
        if (videoId) navigate(`/video/${videoId}`);
        break;
      case "report":
        if (videoId) navigate(`/report/${videoId}`);
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    videoId && (
      <VideoPlayerPage
        videoId={videoId}
        onBack={() => navigate(-1)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    )
  );
}

export function ReportLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { videoId } = useParams<{ videoId: string }>();

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    switch (page) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "account":
        navigate("/account");
        break;
      case "video":
        if (videoId) navigate(`/video/${videoId}`);
        break;
      case "report":
        if (videoId) navigate(`/report/${videoId}`);
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleJumpToVideo = (time: number) => {
    if (videoId) {
      navigate(`/video/${videoId}`);
    }
  };

  return (
    videoId && (
      <AnalysisReportPage
        videoId={videoId}
        onBack={() => navigate(-1)}
        onJumpToVideo={handleJumpToVideo}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    )
  );
}

export function AccountLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleNavigate = (page: "dashboard" | "video" | "report" | "account") => {
    switch (page) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "account":
        navigate("/account");
        break;
      case "video":
        if (selectedVideoId) navigate(`/video/${selectedVideoId}`);
        break;
      case "report":
        if (selectedVideoId) navigate(`/report/${selectedVideoId}`);
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <AccountPage
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      hasSelectedVideo={!!selectedVideoId}
    />
  );
}

export function OnboardingLayout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<"login" | "signup" | "forgot">("login");
  const navigate = useNavigate();
  const { login } = useAuth();

  const openLoginModal = () => {
    setAuthInitialView("login");
    setIsAuthOpen(true);
  };

  const openSignupModal = () => {
    setAuthInitialView("signup");
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (data: { accessToken: string; refreshToken: string; user: any }) => {
    login(data.accessToken, data.refreshToken, data.user);
    setIsAuthOpen(false);
    navigate("/dashboard");
  };

  return (
    <>
      <OnboardingPage
        onGetStarted={openLoginModal}
        onOpenLogin={openLoginModal}
        onOpenSignup={openSignupModal}
      />
      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialView={authInitialView}
      />
    </>
  );
}
