import React, { useState, useEffect } from 'react';
import { Layout, Plus, Play, ChevronLeft, ChevronRight, Image as ImageIcon, Type, BarChart2, Download, FileText } from 'lucide-react';
import { generatePresentationData, getNestedValue } from '../data/slideTemplates';

const SlideRenderer = ({ slide, slideNumber, totalSlides }) => {
    const renderContent = () => {
        if (!slide.data) return null;

        return slide.sections?.map((section, idx) => {
            const value = getNestedValue(slide.data, section.key);
            if (!value) return null;

            switch (section.type) {
                case 'paragraph':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">{section.label}</h3>
                            <p className="text-base text-slate-300 leading-relaxed max-w-3xl border-l border-blue-500/30 pl-4">{value}</p>
                        </div>
                    );

                case 'bullets':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">{section.label}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {value.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        <span className="text-sm text-slate-300">{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'comparison':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">{section.label}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {value.map((comp, i) => (
                                    <div key={i} className="flex flex-col bg-[#161618] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                                        <div className="p-3 bg-blue-500/20 text-center border-b border-white/5">
                                            <h4 className="font-bold text-blue-400 text-xs">{comp.service}</h4>
                                        </div>
                                        <div className="p-4 flex-1">
                                            <p className="text-[11px] text-slate-400 leading-relaxed text-center italic">"{comp.analysis}"</p>
                                        </div>
                                        {comp.url && comp.url !== "#" && (
                                            <div className="px-4 py-2 bg-black/40 text-[9px] text-slate-600 text-center font-mono truncate">
                                                {comp.url}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'personas':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">{section.label}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {value.map((persona, i) => (
                                    <div key={i} className="relative p-6 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/10 shadow-xl overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <ImageIcon size={64} className="text-blue-500" />
                                        </div>
                                        <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                            <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                            {persona.persona}
                                        </h4>
                                        <div className="space-y-2">
                                            {persona.painPoints?.map((point, j) => (
                                                <div key={j} className="text-xs text-slate-400 flex items-start gap-2 bg-black/30 p-2 rounded-xl">
                                                    <span className="text-blue-500 font-bold">Q.</span>
                                                    {point}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'journey':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6">{section.label}</h3>
                            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                {value.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex-shrink-0 w-44 p-4 bg-white/5 rounded-2xl border border-white/10 relative group hover:border-blue-500/50 transition-all">
                                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-4 border-[#070707]">
                                                {i + 1}
                                            </div>
                                            <div className="text-xs font-bold text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{step.split(' ')[0]}</div>
                                            <div className="text-[10px] text-slate-500 leading-tight h-12 overflow-hidden line-clamp-3">{step}</div>
                                        </div>
                                        {i < value.length - 1 && (
                                            <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                                <div className="w-full h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent" />
                                                <ChevronRight size={14} className="text-blue-500/50 -ml-2" />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );

                case 'colorPalette':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6">{section.label}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                {Object.entries(value).map(([name, color]) => (
                                    <div key={name} className="flex flex-col items-center group">
                                        <div
                                            className="w-20 h-20 rounded-full border-4 border-white/5 shadow-2xl transition-transform group-hover:scale-110 duration-300 flex items-center justify-center relative overflow-hidden"
                                            style={{ backgroundColor: color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                        </div>
                                        <div className="text-[10px] text-white font-mono mt-3 px-2 py-1 bg-white/5 rounded-lg">{color}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'architecture':
                    return (
                        <div key={idx} className="mb-8">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">{section.label}</h3>
                            <div className="p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 font-mono text-[11px] text-green-400 leading-relaxed shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                <pre className="whitespace-pre-wrap">{value.structure || JSON.stringify(value, null, 2)}</pre>
                            </div>
                        </div>
                    );

                case 'image':
                    if (value) {
                        return (
                            <div key={idx} className="mb-8">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">{section.label}</h3>
                                <div className="aspect-video bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative group">
                                    <img src={value} alt={section.label} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    }
                    return null;

                default:
                    return null;
            }
        });
    };

    return (
        <div className="aspect-video w-full max-w-5xl bg-[#070707] text-white shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-sm p-16 relative flex flex-col overflow-hidden select-none group">
            {/* Background Accents (Google Antigravity Style) */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header / Design Chip */}
            <div className="mb-10 text-center relative z-10">
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 shadow-xl">
                    {slide.dataSource ? slide.dataSource.replace(/([A-Z])/g, ' $1').toUpperCase() : 'SKETCHON AI PROPOSAL'}
                </div>
                <h1 className="text-5xl font-extrabold font-['Outfit'] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight leading-tight">
                    {slide.title}
                </h1>
                {slide.subtitle && (
                    <p className="text-base text-slate-500 mt-2 font-medium">{slide.subtitle}</p>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-4">
                {renderContent()}
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">SK</div>
                    <div className="text-[10px] font-medium text-slate-500 tracking-wider">
                        PREMIUM AI DESIGN AGENT <br />
                        <span className="text-slate-700 italic">Antigravity Engine Powered</span>
                    </div>
                </div>
                <div className="text-sm font-mono font-bold text-slate-600">
                    P. <span className="text-blue-500">{slideNumber.toString().padStart(2, '0')}</span> / {totalSlides.toString().padStart(2, '0')}
                </div>
            </div>
        </div>
    );
};


const PresentationBuilder = ({ analysisData = null, selectedModules = [], generatedUIUrl = null }) => {
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        if (analysisData && selectedModules.length > 0) {
            const generatedSlides = generatePresentationData(analysisData, selectedModules, generatedUIUrl);
            setSlides(generatedSlides);
            setSelectedSlide(0);
        }
    }, [analysisData, selectedModules, generatedUIUrl]);

    if (!analysisData || slides.length === 0) {
        return (
            <div className="w-full h-full bg-[#1B1C1D] flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-[#2C2C2E] p-4 rounded-full inline-block mb-4">
                        <FileText size={48} className="text-[#333D4B]" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">제안서 생성 대기중</h2>
                    <p className="text-[#B0B8C1]">분석 탭에서 분석을 완료하고 제안서를 생성해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#1B1C1D] overflow-hidden">
            {/* Slide Navigation Sidebar */}
            <div className="w-48 bg-[#2C2C2E] border-r border-[#333D4B] flex flex-col shrink-0">
                <div className="p-4 border-b border-[#333D4B]">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layout size={16} className="text-[#3182F6]" />
                        슬라이드 목록
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {slides.map((slide, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedSlide(idx)}
                            className={`w-full text-left p-3 rounded-[16px] mb-2 transition-all flex items-center gap-3 border ${selectedSlide === idx
                                ? 'bg-[#3182F6]/10 border-[#3182F6]'
                                : 'bg-[#1B1C1D] border-[#333D4B] hover:border-[#4E5968]'
                                }`}
                        >
                            <span className={`text-xs font-bold w-5 h-5 shrink-0 flex items-center justify-center rounded-full ${selectedSlide === idx ? 'bg-[#3182F6] text-white' : 'bg-[#333D4B] text-[#B0B8C1]'
                                }`}>
                                {idx + 1}
                            </span>
                            <div className="overflow-hidden min-w-0">
                                <div className={`text-xs font-medium truncate ${selectedSlide === idx ? 'text-white' : 'text-[#B0B8C1]'}`}>
                                    {slide.title}
                                </div>
                                <div className="text-[10px] text-[#6B7684] truncate">
                                    {slide.type}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#070707]">
                {/* Toolbar */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0A] shrink-0">
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#333D4B] rounded-lg text-[#B0B8C1] hover:text-white transition-colors">
                            <Plus size={18} />
                        </button>
                        <div className="w-[1px] h-4 bg-[#333D4B] mx-2" />
                        <button className="p-2 hover:bg-[#333D4B] rounded-lg text-[#B0B8C1] hover:text-white transition-colors">
                            <ImageIcon size={18} />
                        </button>
                        <button className="p-2 hover:bg-[#333D4B] rounded-lg text-[#B0B8C1] hover:text-white transition-colors">
                            <Type size={18} />
                        </button>
                        <button className="p-2 hover:bg-[#333D4B] rounded-lg text-[#B0B8C1] hover:text-white transition-colors">
                            <BarChart2 size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[#B0B8C1] mr-2">
                            {analysisData.metadata?.keyword} 제안서
                        </span>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#3182F6] hover:bg-[#2974E0] text-white rounded-[16px] text-xs font-bold transition-colors">
                            <Download size={14} />
                            <span>PPT 다운로드</span>
                        </button>
                    </div>
                </div>

                {/* Slide Viewport */}
                <div className="flex-1 overflow-auto p-12 bg-[#070707] flex items-start justify-center custom-scrollbar relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
                    <SlideRenderer
                        slide={slides[selectedSlide]}
                        slideNumber={selectedSlide + 1}
                        totalSlides={slides.length}
                    />
                </div>
            </div>
        </div>
    );
};

export default PresentationBuilder;
