import React, { useState } from 'react';
import { Layout, Plus, Play, ChevronLeft, ChevronRight, Image as ImageIcon, Type, BarChart2 } from 'lucide-react';

const PresentationBuilder = () => {
    const [selectedSlide, setSelectedSlide] = useState(0);

    const slides = [
        { id: 1, title: "Market Opportunity", type: "title" },
        { id: 2, title: "User Persona: Gen Z", type: "content" },
        { id: 3, title: "Competitive Landscape", type: "chart" },
        { id: 4, title: "UI Concept: Home", type: "image" },
        { id: 5, title: "UI Concept: Checkout", type: "image" },
    ];

    return (
        <div className="w-full h-full bg-[#1e1e1e] flex flex-col font-['Inter'] text-white">
            {/* Toolbar */}
            <div className="h-14 bg-[#252525] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors">
                        <Plus size={14} /> New Slide
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2" />
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Layout"><Layout size={16} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Text"><Type size={16} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Image"><ImageIcon size={16} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Chart"><BarChart2 size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono hidden md:inline-block">Auto-saved 2m ago</span>
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">
                        <Play size={14} /> Present
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Slide Sorter (Left) */}
                <div className="w-48 bg-[#1e1e1e] border-r border-white/5 overflow-y-auto p-4 flex flex-col gap-4">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            onClick={() => setSelectedSlide(index)}
                            className={`group relative aspect-video bg-white/5 rounded-lg border-2 transition-all cursor-pointer hover:border-white/20 ${selectedSlide === index ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent'}`}
                        >
                            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 group-hover:text-slate-300">{index + 1}</div>
                            <div className="absolute inset-4 bg-white/5 rounded flex items-center justify-center">
                                <span className="text-[8px] text-slate-600 uppercase tracking-widest">{slide.type}</span>
                            </div>
                        </div>
                    ))}
                    <button className="h-12 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>

                {/* Main Editor (Center) */}
                <div className="flex-1 bg-[#121212] relative flex items-center justify-center p-8 overflow-hidden">
                    <div className="aspect-video w-full max-w-4xl bg-white text-black shadow-2xl rounded-sm p-12 relative flex flex-col">
                        {/* Mock Content based on selected slide */}
                        <div className="text-4xl font-bold font-['Outfit'] mb-4 text-slate-900">{slides[selectedSlide].title}</div>
                        <div className="flex-1 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center">
                            <span className="text-slate-400 font-medium">Slide Content Area</span>
                        </div>
                        <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-4">
                            <div className="text-xs text-slate-400">Confidential Research v1.0</div>
                            <div className="text-xs font-bold text-slate-900">Page {selectedSlide + 1}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PresentationBuilder;
