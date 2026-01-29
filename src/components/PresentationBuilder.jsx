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
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{section.label}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{value}</p>
                        </div>
                    );

                case 'bullets':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <ul className="space-y-2">
                                {value.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );

                case 'comparison':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {value.map((comp, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <h4 className="font-bold text-slate-800 mb-1">{comp.service}</h4>
                                        <p className="text-xs text-slate-600">{comp.analysis}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'personas':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            {value.map((persona, i) => (
                                <div key={i} className="mb-4 p-4 bg-slate-50 rounded-lg">
                                    <h4 className="font-bold text-slate-800 mb-2">{persona.persona}</h4>
                                    <ul className="space-y-1">
                                        {persona.painPoints?.map((point, j) => (
                                            <li key={j} className="text-xs text-slate-600 flex items-start gap-2">
                                                <span className="text-red-500">▸</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    );

                case 'journey':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <div className="flex items-center gap-2 overflow-x-auto">
                                {value.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="text-xs font-bold text-blue-800">{i + 1}</div>
                                            <div className="text-xs text-slate-600 mt-1 w-24">{step}</div>
                                        </div>
                                        {i < value.length - 1 && (
                                            <div className="text-blue-400">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );

                case 'colorPalette':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <div className="flex gap-3">
                                {Object.entries(value).map(([name, color]) => (
                                    <div key={name} className="flex flex-col items-center">
                                        <div
                                            className="w-16 h-16 rounded-lg border-2 border-slate-300 shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="text-xs text-slate-600 mt-2 font-mono">{color}</div>
                                        <div className="text-xs text-slate-400">{name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                case 'architecture':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <div className="p-4 bg-slate-900 rounded-lg font-mono text-xs text-green-400">
                                <pre className="whitespace-pre-wrap">{value.structure || JSON.stringify(value, null, 2)}</pre>
                            </div>
                        </div>
                    );

                case 'image':
                    if (value) {
                        return (
                            <div key={idx} className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                                <div className="aspect-video bg-slate-100 rounded-lg border border-slate-300 overflow-hidden">
                                    <img src={value} alt={section.label} className="w-full h-full object-contain" />
                                </div>
                            </div>
                        );
                    }
                    return null;

                case 'contact':
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{section.label}</h3>
                            <div className="space-y-2 text-sm text-slate-600">
                                {value.email && <div>Email: {value.email}</div>}
                                {value.phone && <div>Phone: {value.phone}</div>}
                            </div>
                        </div>
                    );

                default:
                    return (
                        <div key={idx} className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{section.label}</h3>
                            <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                                {JSON.stringify(value, null, 2)}
                            </pre>
                        </div>
                    );
            }
        });
    };

    return (
        <div className="aspect-video w-full max-w-4xl bg-white text-black shadow-2xl rounded-sm p-12 relative flex flex-col">
            {/* Title */}
            <div className="mb-6">
                <h1 className="text-4xl font-bold font-['Outfit'] text-slate-900 mb-2">
                    {slide.title}
                </h1>
                {slide.subtitle && (
                    <p className="text-sm text-slate-500">{slide.subtitle}</p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-400">Sketchon AI Proposal</div>
                <div className="text-xs font-bold text-slate-900">
                    {slideNumber} / {totalSlides}
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
            <div className="flex-1 flex flex-col min-w-0 bg-[#1B1C1D]">
                {/* Toolbar */}
                <div className="h-14 border-b border-[#333D4B] flex items-center justify-between px-6 bg-[#2C2C2E] shrink-0">
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
                <div className="flex-1 overflow-auto p-12 bg-[#1B1C1D] flex items-start justify-center custom-scrollbar">
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
