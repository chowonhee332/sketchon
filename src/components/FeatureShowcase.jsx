import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Layout, Printer, ArrowRight, Zap, FileText, BarChart3, Globe } from 'lucide-react';

const FEATURES = [
    {
        id: 'research',
        icon: Search,
        title: '데스크 리서치',
        description: '국내외 시장 트렌드와 경쟁 서비스의 UX 패턴을 AI가 실시간으로 수집하고 분석합니다.',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 'design',
        icon: Layout,
        title: '디자인 생성',
        description: '리서치 데이터를 기반으로 최적화된 정보 구조(IA)와 고해상도 UI 시안을 자동으로 빌드합니다.',
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    },
    {
        id: 'ppt',
        icon: Printer,
        title: '제안 장표 (PPT)',
        description: '완성된 컨셉과 디자인을 즉시 발표 가능한 수준의 전문가용 제안서로 패키징합니다.',
        color: 'text-green-500',
        bg: 'bg-green-500/10'
    }
];

const FeatureShowcase = () => {
    const [activeTab, setActiveTab] = useState('research');

    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-32 flex flex-col items-center">
            <div className="w-full mb-20">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-8xl font-['Outfit'] font-medium tracking-tight text-white mb-6"
                >
                    Research, <br />
                    Design, <br />
                    and Deliver
                </motion.h2>
            </div>

            <div className="w-full grid md:grid-cols-12 gap-12 items-start">
                <div className="md:col-span-4 space-y-4">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.id}
                            onClick={() => setActiveTab(feature.id)}
                            className={`group cursor-pointer p-6 rounded-2xl transition-all duration-500 border ${activeTab === feature.id
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                }`}
                        >
                            <h3 className={`text-xl font-bold mb-3 transition-colors ${activeTab === feature.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                {feature.title}
                            </h3>

                            <AnimatePresence mode="wait">
                                {activeTab === feature.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                            {feature.description}
                                        </p>
                                        <button className="flex items-center gap-2 text-sm font-bold text-white group/btn">
                                            자세히 보기 <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="md:col-span-8 sticky top-32">
                    <div className="relative bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-3xl overflow-hidden aspect-[16/10] min-h-[450px]">
                        <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#0d0d0d]">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                                <div className="w-2 h-2 rounded-full bg-green-500/20" />
                            </div>
                            <div className="p-1 px-4 bg-white/5 rounded-md text-[9px] text-slate-600 border border-white/5 font-medium">
                                app.sketchon.ai/{activeTab}
                            </div>
                            <div className="w-10" />
                        </div>

                        <div className="absolute inset-0 top-10 p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="w-full h-full"
                                >
                                    {activeTab === 'research' && (
                                        <div className="grid grid-cols-2 h-full gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-blue-500 border-b border-blue-500/20 pb-2">
                                                    <Globe size={14} />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">Market Scanning</span>
                                                </div>
                                                {[...Array(4)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ delay: i * 0.2, duration: 0.8 }}
                                                        className="h-12 bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3"
                                                    >
                                                        <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center">
                                                            <div className="w-3 h-3 border-2 border-blue-500/40 border-t-blue-500 animate-spin rounded-full" />
                                                        </div>
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="h-2 w-1/3 bg-white/10 rounded-full" />
                                                            <div className="h-1.5 w-2/3 bg-white/5 rounded-full" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
                                                <BarChart3 size={40} className="text-blue-500/40 mb-4" />
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-slate-400 mb-1">Analyzing Data Points</div>
                                                    <div className="text-[24px] font-['Outfit'] font-bold text-white tracking-tight">84.2% Similarity</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'design' && (
                                        <div className="relative h-full pt-4">
                                            <div className="absolute top-0 right-0 flex gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center"><Zap size={14} className="text-white fill-white" /></div>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 text-[10px] font-bold">12</div>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-2xl h-full overflow-hidden border border-white/10">
                                                <div className="h-full bg-slate-50 relative p-8">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 40 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 1 }}
                                                        className="max-w-md mx-auto"
                                                    >
                                                        <div className="w-16 h-2 bg-blue-600 rounded-full mb-6" />
                                                        <div className="space-y-4">
                                                            <motion.div
                                                                initial={{ width: '40%' }} animate={{ width: '100%' }} transition={{ delay: 0.5, duration: 1 }}
                                                                className="h-10 bg-slate-900 rounded-lg"
                                                            />
                                                            <motion.div
                                                                initial={{ width: '30%' }} animate={{ width: '70%' }} transition={{ delay: 0.7, duration: 1 }}
                                                                className="h-6 bg-slate-200 rounded-lg"
                                                            />
                                                            <div className="grid grid-cols-2 gap-4 mt-8">
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
                                                                    className="aspect-square bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col justify-end"
                                                                >
                                                                    <div className="h-2 w-1/2 bg-slate-300 rounded-full mb-2" />
                                                                    <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                                                                </motion.div>
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
                                                                    className="aspect-square bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col justify-end"
                                                                >
                                                                    <div className="h-2 w-1/2 bg-slate-300 rounded-full mb-2" />
                                                                    <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
                                                                </motion.div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'ppt' && (
                                        <div className="flex h-full gap-8">
                                            <div className="w-1/4 space-y-3">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Slides</div>
                                                {[...Array(4)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ x: -20, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className={`aspect-video rounded-md border ${i === 1 ? 'border-green-500 ring-2 ring-green-500/20' : 'border-white/10'} bg-white/5`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex-1 bg-white rounded shadow-2xl relative overflow-hidden flex flex-col">
                                                <div className="p-12 flex-1 flex flex-col">
                                                    <motion.div
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                                                        className="text-slate-900 font-bold border-l-4 border-green-500 pl-4 mb-8"
                                                    >
                                                        <div className="text-[10px] uppercase tracking-tighter text-slate-400">Section 02</div>
                                                        <div className="text-2xl font-['Outfit'] leading-none">Design Proposal</div>
                                                    </motion.div>
                                                    <div className="space-y-6">
                                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[...Array(3)].map((_, i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    transition={{ delay: 0.5 + i * 0.1 }}
                                                                    className="h-16 bg-slate-50 rounded-lg border border-slate-100"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-10 bg-slate-100 border-t flex items-center justify-between px-6">
                                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sketchon Deliverable v1.0</div>
                                                    <div className="text-[8px] text-slate-400 font-bold">PAGE 02 of 14</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureShowcase;
