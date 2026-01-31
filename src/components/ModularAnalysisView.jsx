import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Copy, Check, Globe, ExternalLink, Image as ImageIcon } from 'lucide-react';

const ModuleCard = ({ category, data, selected, onToggle, icon: Icon, color }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedSection, setCopiedSection] = useState(null);

    const handleCopy = (text, sectionName) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(sectionName);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const renderSection = (title, content) => {
        if (!content) return null;

        const isArray = Array.isArray(content);
        const isObject = typeof content === 'object' && !isArray;

        // Special handling for Benchmark Comparative Analysis
        if (title.toLowerCase().includes('comparative analysis') && isArray) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {content.map((item, idx) => (
                        <div key={idx} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden group hover:border-[#3182F6]/30 transition-all">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-bold text-white text-sm">{item.service}</h5>
                                    {item.url && item.url !== "#" && (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                                <p className="text-xs text-white/60 mb-4 line-clamp-2">{item.analysis}</p>

                                {/* Screenshot Area with Microlink integration */}
                                <div className="aspect-video bg-black/40 rounded-lg overflow-hidden relative border border-white/10">
                                    {item.url && item.url !== "#" ? (
                                        <>
                                            <img
                                                src={`https://api.microlink.io/?url=${encodeURIComponent(item.url)}&screenshot=true&meta=false&embed=screenshot.url`}
                                                alt={item.service}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/600x400/1e1e1e/333333?text=Preview+Not+Available";
                                                }}
                                            />
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Live Analysis</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                                            <ImageIcon size={20} />
                                            <span className="text-[10px] uppercase font-bold tracking-widest">No Preview URL</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white/80">{title}</h4>
                    <button
                        onClick={() => handleCopy(
                            isArray ? content.join('\n') : isObject ? JSON.stringify(content, null, 2) : content,
                            title
                        )}
                        className="p-1 text-white/40 hover:text-white transition-colors"
                        title="복사"
                    >
                        {copiedSection === title ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>

                {isArray ? (
                    <ul className="space-y-2">
                        {content.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-white/70 text-sm">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                            </li>
                        ))}
                    </ul>
                ) : isObject ? (
                    <div className="space-y-2">
                        {Object.entries(content).map(([key, value]) => (
                            <div key={key} className="text-sm">
                                <span className="text-white/50">{key}:</span>{' '}
                                <span className="text-white/70">
                                    {typeof value === 'object' ? JSON.stringify(value) : value}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white/70 text-sm leading-relaxed">{content}</p>
                )}
            </div>
        );
    };

    return (
        <div
            className={`relative rounded-[24px] border-2 transition-all ${selected
                ? 'border-[#3182F6] bg-[#3182F6]/10'
                : 'border-[#333D4B] bg-[#2C2C2E] hover:border-[#4E5968]'
                }`}
        >
            {/* Header */}
            <div
                className="p-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-[14px] ${selected ? 'bg-[#3182F6]/20' : 'bg-[#333D4B]'}`}>
                            <Icon className={selected ? 'text-[#3182F6]' : 'text-[#B0B8C1]'} size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{category}</h3>
                            <p className="text-xs text-white/50">
                                {Object.keys(data).length}개 섹션
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selected ? (
                            <CheckCircle className="text-[#3182F6]" size={20} />
                        ) : (
                            <Circle className="text-white/30" size={20} />
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            <div className="border-t border-white/10">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 py-2 flex items-center justify-between text-white/60 hover:text-white transition-colors"
                >
                    <span className="text-xs font-medium">
                        {isExpanded ? '접기' : '상세 보기'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 max-h-96 overflow-y-auto">
                        {Object.entries(data).map(([key, value]) => (
                            <div key={key}>
                                {renderSection(
                                    key.replace(/([A-Z])/g, ' $1').trim(),
                                    value
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ModularAnalysisView = ({ analysisData, selectedModules, onToggleModule, onSendToDelivery }) => {
    if (!analysisData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-white/40">분석 데이터가 없습니다.</p>
            </div>
        );
    }

    const modules = [
        {
            id: 'strategicContext',
            category: 'Strategic Context',
            icon: ({ className, size }) => (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
            ),
            color: 'blue',
            data: analysisData.strategicContext || {}
        },
        {
            id: 'intelligence',
            category: 'Intelligence & Insight',
            icon: ({ className, size }) => (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            ),
            color: 'purple',
            data: analysisData.intelligence || {}
        },
        {
            id: 'benchmark',
            category: 'Benchmark & Differentiation',
            icon: ({ className, size }) => (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            ),
            color: 'green',
            data: analysisData.benchmark || {}
        },
        {
            id: 'userStrategy',
            category: 'User & Experience Strategy',
            icon: ({ className, size }) => (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: 'orange',
            data: analysisData.userStrategy || {}
        },
        {
            id: 'implementation',
            category: 'Implementation & Architecture',
            icon: ({ className, size }) => (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            color: 'cyan',
            data: analysisData.implementation || {}
        }
    ];

    const selectedCount = selectedModules.length;

    return (
        <div className="h-full flex flex-col bg-[#1B1C1D]">
            {/* Header */}
            <div className="p-6 border-b border-[#333D4B]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">분석 결과</h2>
                        <p className="text-white/60 text-sm">
                            원하는 모듈을 선택하여 제안서에 추가하세요
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const allIds = modules.map(m => m.id);
                                if (selectedCount === modules.length) {
                                    onToggleModule([]);
                                } else {
                                    onToggleModule(allIds);
                                }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white border border-white/10 rounded-lg transition-colors"
                        >
                            {selectedCount === modules.length ? '전체 해제' : '전체 선택'}
                        </button>
                        <button
                            onClick={onSendToDelivery}
                            disabled={selectedCount === 0}
                            className="px-6 py-2 bg-[#3182F6] hover:bg-[#2974E0] disabled:bg-[#333D4B] disabled:text-[#6B7684] text-white font-bold rounded-[20px] transition-colors flex items-center gap-2"
                        >
                            <span>제안서 생성</span>
                            <span className="text-xs opacity-80">({selectedCount}/5)</span>
                        </button>
                    </div>
                </div>

                {/* Metadata */}
                {analysisData.metadata && (
                    <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>키워드: {analysisData.metadata.keyword}</span>
                        <span>•</span>
                        <span>유형: {analysisData.metadata.projectType}</span>
                        <span>•</span>
                        <span>생성: {new Date(analysisData.metadata.generatedAt).toLocaleString('ko-KR')}</span>
                    </div>
                )}
            </div>

            {/* Module Cards */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                    {modules.map((module) => (
                        <ModuleCard
                            key={module.id}
                            category={module.category}
                            data={module.data}
                            selected={selectedModules.includes(module.id)}
                            onToggle={() => {
                                if (selectedModules.includes(module.id)) {
                                    onToggleModule(selectedModules.filter(id => id !== module.id));
                                } else {
                                    onToggleModule([...selectedModules, module.id]);
                                }
                            }}
                            icon={module.icon}
                            color={module.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModularAnalysisView;
