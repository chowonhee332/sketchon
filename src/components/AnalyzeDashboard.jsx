import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModularAnalysisView from './ModularAnalysisView';
import {
    Search, Globe, Layout, Users, Target, Compass,
    Layers, Zap, Loader2, CheckCircle2, AlertCircle,
    ArrowRight, Info, Eye, BarChart3, Image as ImageIcon,
    TrendingUp
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, subtitle, badge }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-[#3182F6]/10 rounded-[14px] border border-[#3182F6]/20">
                <Icon size={20} className="text-[#3182F6]" />
            </div>
            <div>
                <h2 className="text-2xl font-bold font-['Pretendard'] text-white">{title}</h2>
                <p className="text-sm font-medium text-[#B0B8C1]">{subtitle}</p>
            </div>
        </div>
        {badge && (
            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {badge}
            </span>
        )}
    </div>
);

const Card = ({ children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-[#2C2C2E] border border-[#333D4B] rounded-[24px] p-8 hover:border-[#4E5968] transition-all shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

const AnalyzeDashboard = ({ projectTitle, messages = [], selectedSection = 'all', analysisData = null, selectedModules = [], onToggleModule = () => { }, onSendToDelivery = () => { } }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Initializing AI Synthesis...");

    useEffect(() => {
        const steps = [
            { p: 10, t: "Connecting to Global Search (Google, Naver)..." },
            { p: 30, t: "Crawling Domain Trends & Competitor Data..." },
            { p: 60, t: "Analyzing Visual Benchmarks (UI/UX Case Studies)..." },
            { p: 85, t: "Synthesizing User Journey & Logic Models..." },
            { p: 100, t: "Finalizing Design Strategy..." }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                setProgress(steps[currentStep].p);
                setStatusText(steps[currentStep].t);
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => setIsAnalyzing(false), 500);
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    if (isAnalyzing) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md flex flex-col items-center gap-8"
                >
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 rounded-full border-2 border-dashed border-blue-500/30 flex items-center justify-center"
                        >
                            <div className="w-20 h-20 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        </motion.div>
                        <Zap size={32} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold font-['Outfit'] tracking-tight">Essential 4 Synthesis</h2>
                        <div className="flex items-center justify-center gap-2 text-slate-400 font-mono text-sm">
                            <Loader2 className="animate-spin" size={14} />
                            <span>{statusText}</span>
                        </div>
                    </div>

                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    // If we have analysis data, show the modular view
    if (analysisData) {
        return (
            <ModularAnalysisView
                analysisData={analysisData}
                selectedModules={selectedModules}
                onToggleModule={onToggleModule}
                onSendToDelivery={onSendToDelivery}
            />
        );
    }

    return (
        <div className="w-full h-full bg-[#1B1C1D] text-white overflow-y-auto overflow-x-hidden pt-6 px-8 font-['Pretendard'] custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-20">

                {/* Header Section - Hide if a specific section is selected to avoid redundancy */}
                {selectedSection === 'all' && (
                    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
                                <CheckCircle2 size={14} />
                                Phase 01: Analyze Complete
                            </div>
                            <h1 className="text-4xl font-bold font-['Outfit'] tracking-tight">
                                Project <span className="text-blue-500">Intelligence</span> Report
                            </h1>
                            <p className="text-slate-500 max-w-2xl leading-relaxed">
                                "{projectTitle}"에 최적화된 시장 분석과 전략 수립이 완료되었습니다.
                                이 데이터를 기반으로 Creon 엔진이 다음 단계의 시각화를 준비합니다.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                                <ImageIcon size={14} /> Export PPT
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                Visualize Now <ArrowRight size={14} />
                            </button>
                        </div>
                    </header>
                )}

                <div className="grid grid-cols-12 gap-8 pt-4">

                    {/* 1. Project Guide */}
                    {(selectedSection === 'all' || selectedSection === 'guide') && (
                        <div className="col-span-12">
                            <SectionHeader
                                icon={Compass}
                                title="1. Project Guide"
                                subtitle="AI 파워업 - 시장 조계 및 요구사항 보강"
                                badge="AI Powered"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-1 border-l-4 border-l-blue-500">
                                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <Target size={14} className="text-blue-400" /> 배경 및 목적
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                                        사용자의 요구에 부합하는 현대적 디자인 요소를 반영하고, 시장 내 경쟁 우위를 확보하기 위한 핵심 가치를 정의합니다. 복잡함을 걷어내고 사용자 중심의 간결한 인터페이스를 목표로 합니다.
                                    </p>
                                </Card>
                                <Card className="md:col-span-1 border-l-4 border-l-purple-500">
                                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-purple-400" /> 도메인 & 트렌드
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                                        AI 데이터가 수집한 최신 트렌드에 따르면, 유리질(Glassmorphism) 효과와 마이크로 애니메이션이 사용자 체류 시간을 15% 이상 증대시키는 것으로 나타났습니다.
                                    </p>
                                </Card>
                                <Card className="md:col-span-1 border-l-4 border-l-orange-500">
                                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-orange-400" /> RFP 핵심 요약 (Essential)
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            "실시간 데이터 시각화 라이브러리 연동",
                                            "모바일 우선(Mobile-First) 하이브리드 인터페이스",
                                            "다크 모드 기본 지원 및 사용자 커스텀 컬러"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                                <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* 2. Visual Benchmark */}
                    {(selectedSection === 'all' || selectedSection === 'benchmark') && (
                        <div className="col-span-12">
                            <SectionHeader
                                icon={Layout}
                                title="2. Visual Benchmark"
                                subtitle="유사 서비스 UI/UX 분석 및 USP 발굴"
                                badge="Market Analysis"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    {
                                        name: "Friendli.ai",
                                        desc: "생성형 AI 모델 서빙 플랫폼",
                                        ui: "우측 인스펙터를 통한 파라미터 조절 직관성",
                                        ux: "복잡한 로그 데이터의 실시간 시각화 우수",
                                        tags: ["Control Panel", "Live Data"]
                                    },
                                    {
                                        name: "Vercel SDK",
                                        desc: "개발자 중심의 UI 스트리밍 라이브러리",
                                        ui: "미니멀한 타이포그래피와 고대비 레이아웃",
                                        ux: "배포 프로세스의 시각적 흐름 추적 용이",
                                        tags: ["Minimal", "Work Flow"]
                                    }
                                ].map((comp, i) => (
                                    <Card key={i} className="group relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#121212]">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{comp.name}</h3>
                                                <p className="text-xs text-slate-500">{comp.desc}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                {comp.tags.map(t => <span key={t} className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-400">{t}</span>)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-xs font-bold text-slate-300">UI적 측면</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{comp.ui}</p>
                                            </div>
                                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-xs font-bold text-slate-300">UX적 측면</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{comp.ux}</p>
                                            </div>
                                        </div>
                                        {/* Mock Image Placeholder */}
                                        <div className="mt-6 aspect-video rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-blue-500/30 transition-colors overflow-hidden">
                                            <div className="text-slate-700 font-mono text-[10px]">CRAWLED_SCREENSHOT_{i + 1}.PNG</div>
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. User Logic & 4. Design Strategy (Side by Side) */}
                    {(selectedSection === 'all' || selectedSection === 'logic') && (
                        <div className={`col-span-12 ${selectedSection === 'all' ? 'lg:col-span-6' : ''}`}>
                            <SectionHeader
                                icon={Users}
                                title="3. User Logic"
                                subtitle="설계의 근거 - Persona & Journey"
                            />
                            <Card className="h-full">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20 p-2 overflow-hidden">
                                        <Users className="text-white w-full h-full" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Project Persona: Data Visionary</h4>
                                        <p className="text-[11px] text-slate-500">정보의 명확성과 도구의 효율성을 중시하는 30대 기획자</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">User Journey Steps</div>
                                        <div className="space-y-4">
                                            {[
                                                { s: "Discover", desc: "복잡한 데이터 사이에서 유의미한 패턴 발견" },
                                                { s: "Identify", desc: "Pain Point 정의 및 개선 우선순위 설정" },
                                                { s: "Transform", desc: "도출된 로직을 시각적 디자인 컨셉으로 전환" }
                                            ].map((step, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] flex items-center justify-center font-bold text-blue-400">{idx + 1}</div>
                                                        {idx < 2 && <div className="w-[1px] h-4 bg-white/5" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-200 mb-0.5">{step.s}</div>
                                                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {(selectedSection === 'all' || selectedSection === 'strategy') && (
                        <div className={`col-span-12 ${selectedSection === 'all' ? 'lg:col-span-6' : ''}`}>
                            <SectionHeader
                                icon={Layers}
                                title="4. Design Strategy"
                                subtitle="최종 설계도 - Mood & IA Structure"
                            />
                            <Card className="h-full flex flex-col">
                                <div className="mb-8">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Key Concept Keywords</div>
                                    <div className="flex flex-wrap gap-2">
                                        {["Premium Dark", "Logical Alignment", "High-Efficiency", "Adaptive System"].map(kw => (
                                            <span key={kw} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Information Architecture (Simplified)</div>
                                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl font-mono text-[10px] text-slate-400 space-y-2">
                                        <div className="text-blue-400">Root.App</div>
                                        <div className="pl-4">├── Dashboard (Analysis Engine)</div>
                                        <div className="pl-4">├── Visualizer (Real-time Preview)</div>
                                        <div className="pl-8">├── Artboard Handler</div>
                                        <div className="pl-8">└── Component Registry</div>
                                        <div className="pl-4">└── Delivery (Export Manager)</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzeDashboard;
