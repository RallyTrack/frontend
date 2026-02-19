import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bot,
  Clock,
  ScatterChart as ScatterIcon,
  Target,
  Zap,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
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
} from "recharts";

import { Header, type Page } from "./Header";


// ✅ 
import { fetchReport } from "../api/reportpageApi";
import type { ReportResponse } from "../types/reportpageType";

interface AnalysisReportPageProps {
  videoId: string;
  onBack: () => void;
  onJumpToVideo: (time: number) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

type UiHeatmapZone = {
  x: number;
  y: number;
  intensity: number;
  time?: number; // API에 없으면 undefined
};

export function AnalysisReportPage({
  videoId,
  onBack,
  onJumpToVideo,
  onNavigate,
  onLogout,
}: AnalysisReportPageProps) {
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<number | null>(null);

  // ✅ API 상태
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetchReport(videoId);
        if (!alive) return;

        setReport(res);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message ?? "리포트를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [videoId]);

  // ✅ 데이터 매핑 (report가 없을 수도 있으니 안전하게)
  const ui = useMemo(() => {
    const data = report?.data;

    const summary = data?.summary;
    const position = data?.positionAnalysis;
    const strokeTypes = data?.strokeTypes;
    const ability = data?.abilityMetrics;
    const coaching = data?.aiCoaching;

    // 1) 히트맵: API는 좌표만(예시). intensity/time은 임시로 구성
    //    - 좌표 값 범위가 0~100 기준이라고 가정(너 예시가 그런 스타일)
    const heatmapZones: UiHeatmapZone[] =
      position?.heatmapData?.map((p, idx) => ({
        x: p.x,
        y: p.y,
        // intensity는 없으니 임시: 데이터 분포에 따라 랜덤/고정치 (여기선 idx 기반)
        intensity: 0.4 + (idx % 5) * 0.12,
    
      })) ?? [];

    // 2) 산점도: 히트맵 데이터를 그대로 써도 되고, 별도라면 백엔드에 추가하면 됨
    const positionData =
      position?.heatmapData?.map((p) => ({ x: p.x, y: p.y })) ?? [];

    // 3) 스트로크 바 차트: API는 {smash, clear, drop, drive}
    const strokeData =
      strokeTypes
        ? [
          { name: "스매시", key: "smash" as const, count: strokeTypes.smash, color: "#ef4444" },
          { name: "클리어", key: "clear" as const, count: strokeTypes.clear, color: "#3b82f6" },
          { name: "드롭", key: "drop" as const, count: strokeTypes.drop, color: "#10b981" },
          { name: "드라이브", key: "drive" as const, count: strokeTypes.drive, color: "#f59e0b" },
        ].filter((s) => typeof s.count === "number")
        : [];

    // 4) 능력치 레이더: API는 {smash, defense, speed, stamina, accuracy}
    const abilityData =
      ability
        ? [
          { name: "스매시", value: ability.smash },
          { name: "수비", value: ability.defense },
          { name: "스피드", value: ability.speed },
          { name: "지구력", value: ability.stamina },
          { name: "정확도", value: ability.accuracy },
        ]
        : [];

    // 5) AI 코칭: 현재 API는 feedbackText 하나
    const feedbackText = coaching?.feedbackText ?? "";

    return {
      summary,
      heatmapZones,
      positionData,
      strokeData,
      abilityData,
      feedbackText,
    };
  }, [report]);

  // ---- 로딩/에러 UI ----
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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

          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">리포트 불러오는 중...</div>
            <div className="mt-2 text-xs text-gray-400">잠시만 기다려줘.</div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white">
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

          <div className="rounded-xl border border-red-100 bg-red-50 p-8">
            <div className="text-sm font-bold text-red-700">리포트를 불러오지 못했습니다.</div>
            <div className="mt-2 text-xs text-red-600">{errorMsg}</div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-sm text-red-700"
            >
              새로고침
            </button>
          </div>
        </main>
      </div>
    );
  }

  // report가 null이면(이론상 거의 없음)
  if (!report || !ui.summary) {
    return (
      <div className="min-h-screen bg-white">
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

          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">리포트 데이터가 비어있어</div>
            <div className="mt-2 text-xs text-gray-400">백엔드 응답을 확인해줘.</div>
          </div>
        </main>
      </div>
    );
  }

  const summary = ui.summary;

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

        {/* ✅ Summary Cards (API 매핑) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="size-4 text-blue-500" />
              <div className="text-xs font-semibold text-gray-500">내 점수</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{summary.myScore}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="size-4 text-gray-600" />
              <div className="text-xs font-semibold text-gray-500">상대 점수</div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{summary.opponentScore}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-4 text-purple-500" />
              <div className="text-xs font-semibold text-gray-500">총 스트로크</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{summary.totalStrokeCount}회</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-orange-500" />
              <div className="text-xs font-semibold text-gray-500">경기 시간</div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{summary.matchTime}</div>
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
              {ui.heatmapZones.length > 0
                ? "클릭하여 선택 (time 데이터가 있으면 영상 점프 연결 가능)"
                : "히트맵 데이터가 없습니다."}
            </p>

            <div className="aspect-[4/3] bg-[#f0f9ff] rounded-xl relative overflow-hidden border border-gray-100">
              {/* Court lines */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 300 400">
                  <rect
                    x="20"
                    y="20"
                    width="260"
                    height="360"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line x1="150" y1="20" x2="150" y2="380" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="200" x2="280" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="120" x2="280" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="280" x2="280" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>

              {/* Heatmap points */}
              {ui.heatmapZones.map((zone, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedHeatmapPoint(index);

                    // ✅ time이 있으면 점프
                    if (typeof zone.time === "number") {
                      onJumpToVideo(zone.time);
                    }
                  }}
                  className={`absolute rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${selectedHeatmapPoint === index ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                  style={{
                    left: `${zone.y}%`,
                    top: `${zone.x}%`,
                    width: `${24 + zone.intensity * 36}px`,
                    height: `${24 + zone.intensity * 36}px`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: `rgba(248, 113, 113, ${0.25 + zone.intensity * 0.45})`,
                  }}
                  aria-label={`heatmap-point-${index}`}
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
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="위치" data={ui.positionData} fill="#60a5fa" fillOpacity={0.8} />
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
                <BarChart data={ui.strokeData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {ui.strokeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {ui.strokeData.map((stroke) => (
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
                <RadarChart data={ui.abilityData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
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
              {ui.abilityData.map((ability) => (
                <div
                  key={ability.name}
                  className="flex items-center justify-between py-1 border-b border-gray-50"
                >
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

          {/* ✅ 현재 API는 feedbackText만 있으니 그대로 출력 */}
          <div className="bg-white rounded-xl border border-blue-100 p-6">
            <div className="text-sm font-bold text-blue-700 mb-2">피드백</div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
              {ui.feedbackText || "AI 코칭 피드백이 아직 없습니다."}
            </p>
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-8 text-gray-900">경기 결과 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                점수 / 결과
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {summary.myScore} - {summary.opponentScore}
              </div>
              <div
                className={`text-sm font-bold ${summary.matchOutcome === "WIN"
                    ? "text-green-600"
                    : summary.matchOutcome === "LOSE"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
              >
                {summary.matchOutcome === "WIN"
                  ? "승리"
                  : summary.matchOutcome === "LOSE"
                    ? "패배"
                    : "무승부"}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                총 시간
              </div>
              <div className="text-4xl font-bold text-blue-600">{summary.matchTime}</div>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                총 스트로크: {summary.totalStrokeCount}회
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
