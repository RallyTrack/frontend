import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import {
  Upload,
  Play,
  FileText,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Header, type Page } from './Header';

// API 응답용 인터페이스 정의
interface DashboardSummary {
  totalVideos: number;
  totalAnalysisTime: string;
  averageScore: number;
}

interface ApiVideoItem {
  videoId: number;
  title: string;
  date: string;
  playTime: string;
  matchScore: string;
  thumbnailUrl: string;
  actions: {
    viewVideoUrl: string;
    viewAnalysisUrl: string;
  };
}

interface DashboardResponse {
  code: number;
  message: string;
  data: {
    dashboardSummary: DashboardSummary;
    recentVideos: ApiVideoItem[];
  };
}

interface VideoRecord {
  id: string;
  name: string;
  date: string;
  duration: string;
  score?: string;
  thumbnail?: string;
  // 영상 상태 관리
  status?: 'uploading' | 'processing' | 'completed' | 'error';
}

interface DashboardPageProps {
  onLogout: () => void;
  onViewVideo: (id: string) => void;
  onViewReport: (id: string) => void;
  onNavigate: (page: Page) => void;
  hasSelectedVideo: boolean;
}

export function DashboardPage({
  onLogout,
  onViewVideo,
  onViewReport,
  onNavigate,
  hasSelectedVideo,
}: DashboardPageProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState('');

  // 통계 상태 관리
  const [stats, setStats] = useState<DashboardSummary | null>(null);


  // 영상 목록 상태 관리
  const [videos, setVideos] = useState<VideoRecord[]>([
  ]);

// 대시보드 데이터 조회 API 호출
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
<<<<<<< HEAD
      // 백엔드 포트(8080) 명시 및 Authorization 헤더에 토큰 추가
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8080/api/v1/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const json: DashboardResponse = await response.json();
      
      // 상태 업데이트
      setStats(json.data.dashboardSummary);
      // 영상 목록 매핑
      setVideos(json.data.recentVideos.map(v => ({
=======
      const { data }: { data: DashboardResponse } = await apiClient.get('/api/v1/dashboard');
      setStats(data.data.dashboardSummary);
      setVideos(data.data.recentVideos.map(v => ({
>>>>>>> 01fae018 (feat: Axios 인터셉터 도입 및 DashboardPage API 로직 리팩토링)
        id: String(v.videoId),
        name: v.title,
        date: v.date,
        duration: v.playTime,
        score: v.matchScore,
        thumbnail: v.thumbnailUrl,
        status: 'completed',
      })));
    } catch (e) {
      console.error(e);
      setVideos([]);
    }
  };
  fetchDashboardData();
}, []);

  const handleDelete = (id: string) => {
    if (confirm('이 영상을 삭제하시겠습니까?')) {
      // API 연동 시 삭제 API 호출 필요 (예: await fetch(`/api/videos/${id}`, { method: 'DELETE' }))
      setVideos(videos.filter((v) => v.id !== id));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('업로드할 영상 파일을 선택해주세요.');
      return;
    }
    // 1. 임시 ID 생성 및 목록에 '업로드 중' 상태로 즉시 추가 (Optimistic UI)
    const tempId = `temp-${Date.now()}`;
    const tempVideo: VideoRecord = {
      id: tempId,
      name: videoName || uploadFile.name,
      date: new Date().toISOString().split('T')[0],
      duration: '업로드 중...',
      status: 'uploading',
    };
    setVideos([tempVideo, ...videos]);
    setShowUploadModal(false);
    setUploadFile(null);
    setVideoName('');
    // 3. 백그라운드에서 API 요청 진행
    try {
<<<<<<< HEAD
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8080/api/v1/videos', {
        method: 'POST',
        headers: {
          // 아직 영상 XML 업로드는 구현하지 않았으므로 JSON으로 메타데이터 전송
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: videoName || uploadFile.name,
          matchDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        }),
=======
      const { data: newVideoData } = await apiClient.post('/api/v1/videos', {
        title: videoName || uploadFile.name,
        matchDate: new Date().toISOString().split('T')[0],
>>>>>>> 01fae018 (feat: Axios 인터셉터 도입 및 DashboardPage API 로직 리팩토링)
      });
      setVideos((prevVideos) =>
        prevVideos.map((video) => {
          if (video.id === tempId) {
            return {
              ...video,
              id: newVideoData.id || tempId,
              name: newVideoData.title || video.name,
              date: newVideoData.date || video.date,
              duration: '분석 완료',
              status: 'completed',
            };
          }
          return video;
        })
      );
    } catch (error) {
      console.error('Upload Error:', error);
      setVideos((prevVideos) =>
        prevVideos.map((video) => {
          if (video.id === tempId) {
            return {
              ...video,
              duration: '업로드 실패',
              status: 'error',
            };
          }
          return video;
        })
      );
      alert('영상 업로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl mb-2">내 경기 기록</h1>
            <p className="text-gray-600">업로드한 영상과 분석 리포트를 확인하세요</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="size-5" />
            <span>영상 업로드</span>
          </button>
        </div>

        {/* Stats */}
        {stats && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">총 업로드 영상</div>
            <div className="text-3xl text-blue-600">{stats.totalVideos}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">총 분석 시간</div>
            <div className="text-3xl text-indigo-600">{stats.totalAnalysisTime}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">평균 점수</div>
            <div className="text-3xl text-purple-600">{stats.averageScore}점</div>
          </div>
        </div>
        )}

        {/* Video List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl">최근 영상</h2>
          </div>

          {videos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Upload className="size-12 mx-auto mb-4 text-gray-400" />
              <p>업로드된 영상이 없습니다</p>
              <p className="text-sm mt-2">첫 영상을 업로드해보세요!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {videos.map((video) => {
                // 상태별 변수 정의
                const isUploading = video.status === 'uploading';
                const isError = video.status === 'error';
                const isReady = video.status === 'completed' || !video.status; // status가 없으면 완료된 것으로 간주

                return (
                  <div
                    key={video.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {/* 상태에 따라 로딩 스피너 또는 에러 아이콘 표시 */}
                      <div className={`w-32 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isError ? 'bg-red-50' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                      }`}>
                         {isUploading ? (
                          <Loader2 className="size-8 text-blue-600 animate-spin" />
                        ) : isError ? (
                          <AlertCircle className="size-8 text-red-500" />
                        ) : (
                          <Play className="size-8 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl mb-2 flex items-center gap-2">
                          {video.name}
                          {/* 상태 뱃지 표시 */}
                          {isUploading && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">업로드 중...</span>}
                          {isError && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">실패</span>}
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>{video.date}</span>
                          <span className={isUploading ? "text-blue-600 font-medium" : ""}>
                            {/* 상태에 따라 duration 또는 상태 메시지 표시 */}
                            {video.duration}
                          </span>
                          {video.score && <span>점수: {video.score}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 버튼 활성화/비활성화 및 로딩 상태 표시 */}
                        <button
                          onClick={() => isReady && onViewVideo(video.id)}
                          disabled={!isReady}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isReady 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isUploading ? (
                             <Loader2 className="size-4 animate-spin" />
                          ) : (
                             <Play className="size-4" />
                          )}
                          <span>{isUploading ? '처리 중' : '영상 보기'}</span>
                        </button>

                        <button
                          onClick={() => isReady && onViewReport(video.id)}
                          disabled={!isReady}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isReady
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isUploading ? (
                             <Loader2 className="size-4 animate-spin" />
                          ) : (
                             <FileText className="size-4" />
                          )}
                          <span>{isUploading ? '처리 중' : '분석 보기'}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">영상 업로드</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  영상 이름
                </label>
                <input
                  type="text"
                  value={videoName}
                  onChange={(e) => setVideoName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 주말 복식 경기"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  영상 파일
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Plus className="size-12 mx-auto mb-4 text-gray-400" />
                    {uploadFile ? (
                      <p className="text-blue-600">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600">
                          클릭하여 파일을 선택하거나
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          드래그 앤 드롭으로 업로드
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}