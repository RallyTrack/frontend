import { useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Zap, 
  Award, 
  Bot, 
  Clock, 
  BarChart3, 
  ScatterChart as ScatterIcon,
  Target
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Header, type Page } from './Header';

interface AnalysisReportPageProps {
  videoId: string;
  onBack: () => void;
  onJumpToVideo: (time: number) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function AnalysisReportPage({
  videoId,
  onBack,
  onJumpToVideo,
  onNavigate,
  onLogout,
}: AnalysisReportPageProps) {
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<number | null>(null);

  // Mock data for ability pentagon
  const abilityData = [
    { name: '스매시', value: 85 },
    { name: '수비', value: 72 },
    { name: '정확도', value: 82 },
    { name: '지구력', value: 65 },
    { name: '스피드', value: 78 },
  ];

  // Mock data for position scatter plot
  const positionData = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  // Mock data for stroke types
  const strokeData = [
    { name: '스매시', count: 45, color: '#ef4444' },
    { name: '클리어', count: 38, color: '#3b82f6' },
    { name: '드롭', count: 32, color: '#10b981' },
    { name: '드라이브', count: 28, color: '#f59e0b' },
  ];

  // Mock heatmap zones
  const heatmapZones = [
    { x: 25, y: 35, intensity: 0.8, time: 120 },
    { x: 55, y: 55, intensity: 1.0, time: 340 },
    { x: 75, y: 45, intensity: 0.6, time: 580 },
    { x: 30, y: 70, intensity: 0.7, time: 720 },
    { x: 65, y: 20, intensity: 0.5, time: 890 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header
        currentPage="report"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={true}
      />

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        <button
    onClick={onBack}
    className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
  >
    ← 돌아가기
  </button>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="size-4 text-blue-500" />
              <div className="text-xs font-semibold text-gray-500">종합 점수</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">85점</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-green-500" />
              <div className="text-xs font-semibold text-gray-500">평균 랠리 시간</div>
            </div>
            <div className="text-3xl font-bold text-green-600">2분 12초</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-4 text-purple-500" />
              <div className="text-xs font-semibold text-gray-500">총 스트로크</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">165회</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-orange-500" />
              <div className="text-xs font-semibold text-gray-500">경기 시간</div>
            </div>
            <div className="text-3xl font-bold text-orange-600">45:23</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Heatmap */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2 text-gray-900">
              <Target className="size-5 text-blue-600" />
              히트맵
            </h2>
            <p className="text-[11px] text-gray-400 mb-6 font-medium">
              클릭하여 해당 시점의 영상으로 이동
            </p>
            <div className="aspect-[4/3] bg-[#f0f9ff] rounded-xl relative overflow-hidden border border-gray-100">
              {/* Court lines */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Outer boundary */}
                  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                  {/* Center lines */}
                  <line x1="200" y1="20" x2="200" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="150" x2="380" y2="150" stroke="#cbd5e1" strokeWidth="1" />
                  {/* Service lines */}
                  <line x1="120" y1="20" x2="120" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="280" y1="20" x2="280" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>

              {/* Heatmap points */}
              {heatmapZones.map((zone, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedHeatmapPoint(index);
                    onJumpToVideo(zone.time);
                  }}
                  className={`absolute rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                    selectedHeatmapPoint === index
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${30 + zone.intensity * 40}px`,
                    height: `${30 + zone.intensity * 40}px`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: `rgba(248, 113, 113, ${0.3 + zone.intensity * 0.4})`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Position Scatter Plot */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
              <ScatterIcon className="size-5 text-indigo-600" />
              위치 산점도
            </h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                  <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="위치"
                    data={positionData}
                    fill="#60a5fa"
                    fillOpacity={0.8}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Stroke Types */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-gray-900">
              <Zap className="size-5 text-purple-600" />
              스트로크 종류
            </h2>
            <div className="h-[200px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strokeData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {strokeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {strokeData.map((stroke) => (
                <div key={stroke.name} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stroke.color }} />
                    <span className="text-xs font-semibold text-gray-600">{stroke.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{stroke.count}회</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ability Analysis */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Award className="size-5 text-orange-500" />
              능력치 분석
            </h2>
            <div className="h-[240px] mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={abilityData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar
                    name="능력치"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-2">
              {abilityData.map((ability) => (
                <div key={ability.name} className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-500">{ability.name}</span>
                  <span className="text-xs font-bold text-blue-600">{ability.value}점</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Coach Analysis */}
        <div className="bg-[#eff6ff] rounded-2xl p-10 border border-blue-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="size-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI 코치 분석</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-8">
              <div className="w-20 shrink-0 text-lg font-bold text-blue-600">강점</div>
              <div className="pl-6 border-l-2 border-blue-200 text-sm text-gray-700 leading-relaxed font-medium">
                스매시와 정확도가 뛰어납니다. 특히 전반부에서 강력한 스매시로 많은 득점을 올렸습니다.
                네트 플레이도 안정적이며, 드롭샷의 정확도가 높습니다.
              </div>
            </div>
            <div className="flex gap-8">
              <div className="w-20 shrink-0 text-lg font-bold text-indigo-600">개선점</div>
              <div className="pl-6 border-l-2 border-indigo-200 text-sm text-gray-700 leading-relaxed font-medium">
                경기 후반부로 갈수록 이동 거리가 줄어들고 지구력이 떨어지는 모습이 관찰되었습니다.
                코트 후방에서의 수비 위치 선정을 개선하면 에너지를 절약할 수 있습니다.
              </div>
            </div>
            <div className="flex gap-8">
              <div className="w-20 shrink-0 text-lg font-bold text-purple-600">추천 훈련</div>
              <div className="pl-6 border-l-2 border-purple-200 text-sm text-gray-700 leading-relaxed font-medium">
                인터벌 트레이닝으로 지구력을 향상시키고, 후방 수비 포지셔닝 연습을 추천합니다.
                또한 롱 랠리 상황에서의 체력 배분 전략을 개발해보세요.
              </div>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-8 text-gray-900">경기 결과 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">점수</div>
              <div className="text-4xl font-bold text-gray-800 mb-2">21 - 18</div>
              <div className="text-sm font-bold text-green-600">승리</div>
            </div>
            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">총 시간</div>
              <div className="text-4xl font-bold text-blue-600">18:18</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}