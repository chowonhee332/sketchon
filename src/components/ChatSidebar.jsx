import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GenerationStatus from './GenerationStatus';
import { Send, Wand2, User, Bot, Loader2, Sparkles, ChevronDown, Check, Info, X, Monitor, Smartphone, Maximize2 } from 'lucide-react';

const MODELS = [
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro Preview',
        badge: 'New',
        description: 'Latest generation model with advanced reasoning.',
        pros: ['State-of-the-art', 'Best constraints adherence', 'Deepest logic'],
        cons: ['Preview stability', 'Rate limits'],
        features: ['Advanced Reasoning', 'Complex Layouts']
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        badge: 'Fastest',
        description: 'Next-gen speed for instant UI prototyping.',
        pros: ['Extremely low latency', 'Efficient generation', 'Great for iterations'],
        cons: ['Slightly less nuanced than Pro'],
        features: ['Real-time Preview', 'High Throughput']
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        badge: 'Stable',
        description: 'High reasoning capabilities for complex UI structures.',
        pros: ['Deepest reasoning', 'Complex logic handling', '1M+ Context'],
        cons: ['Slower than flash'],
        features: ['Premium Logic', 'Full Page Design']
    }
];

const ModelSelector = ({ currentModel, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors group px-2 py-1 rounded-md hover:bg-white/5"
            >
                <span>{MODELS.find(m => m.id === currentModel)?.name || 'Select Model'}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 opacity-50 group-hover:opacity-100 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-2 space-y-0.5 max-h-[400px] overflow-y-auto">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Model Selection
                                </div>
                                {MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            onSelect(model.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${currentModel === model.id
                                            ? 'bg-blue-600/20 hover:bg-blue-600/30'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`mt-0.5 p-1 rounded-md ${currentModel === model.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
                                            <Bot size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${currentModel === model.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                                    {model.name}
                                                </span>
                                                {model.badge && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded-full text-white/70">
                                                        {model.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-tight mb-2">
                                                {model.description}
                                            </p>

                                            {/* Pros/Cons/Features Mini-Grid */}
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 pt-2 border-t border-white/5">
                                                <div className="col-span-2 text-[10px] font-semibold text-slate-400">Features</div>
                                                {model.features.slice(0, 2).map((feat, i) => (
                                                    <div key={i} className="flex items-center gap-1 text-[10px] text-slate-500">
                                                        <span className="w-1 h-1 rounded-full bg-blue-500/50" />
                                                        {feat}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {currentModel === model.id && (
                                            <Check size={14} className="text-blue-400 mt-1" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const ChatSidebar = ({ messages, onSendMessage, isLoading, currentModel, onModelSelect, selectedArtboard, selectedArea, onClearSelection, onStartAnalysis }) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState([]); // Array of { id, type, base64, preview }
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newAttachments = await Promise.all(files.map(async (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result;
                    // Extract base64 part for API (remove data:image/xxx;base64,)
                    const base64Data = base64String.split(',')[1];

                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        type: file.type,
                        base64: base64Data, // For API
                        preview: base64String, // For UI
                        name: file.name
                    });
                };
                reader.readAsDataURL(file);
            });
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSendMessage(input, currentModel, attachments); // Pass attachments
            setInput('');
            setAttachments([]);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#1B1C1D] border-r border-[#333D4B] text-white">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide font-mono text-sm">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-1 group"
                        >
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                {msg.role === 'user' ? (
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">You</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Bot size={12} className="text-purple-400" />
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">AI Designer</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-slate-600">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`p-4 rounded-[20px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#3182F6] text-white ml-8 rounded-tr-none' : 'bg-[#2C2C2E] text-white mr-8 rounded-tl-none'}`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pl-5 pr-2 py-2"
                        >
                            <GenerationStatus />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-transparent">
                {/* AI Analysis Button */}
                {onStartAnalysis && (
                    <button
                        onClick={onStartAnalysis}
                        className="w-full mb-3 px-4 py-3 bg-[#3182F6] hover:bg-[#2974E0] text-white font-bold rounded-[20px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Sparkles size={18} />
                        <span>AI 프로젝트 분석 시작</span>
                    </button>
                )}

                <AnimatePresence mode="wait">
                    {selectedArea ? (
                        <motion.div
                            key="area-selection"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="mb-3 flex items-center justify-between p-2 bg-indigo-900/20 border border-indigo-500/30 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-500/20 rounded-md">
                                    <Maximize2 size={14} className="text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Focus Area Active</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {Math.round(selectedArea.width)}x{Math.round(selectedArea.height)} at ({Math.round(selectedArea.x)}, {Math.round(selectedArea.y)})
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClearSelection}
                                className="p-1.5 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Attachment Preview Area */}
                {attachments.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-hide">
                        {attachments.map((att) => (
                            <div key={att.id} className="relative group shrink-0">
                                <div className="w-16 h-16 rounded-lg border border-white/20 overflow-hidden bg-black/50 flex items-center justify-center">
                                    {att.type.startsWith('image/') ? (
                                        <img src={att.preview} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-slate-400 text-[10px] p-1 text-center break-words">{att.name}</div>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative group bg-[#2C2C2E] border border-[#333D4B] rounded-[24px] transition-all focus-within:border-[#3182F6] focus-within:ring-1 focus-within:ring-[#3182F6]/20 shadow-sm">
                    <div className="flex items-start p-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.nativeEvent.isComposing) return; // Prevent IME double submission
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Describe your UI changes..."
                            className="w-full bg-transparent border-none text-sm text-[#B0B8C1] placeholder:text-[#6B7684] focus:ring-0 resize-none min-h-[60px] max-h-[200px] py-1 px-2 font-mono leading-relaxed scrollbar-hide outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between px-2 pb-2 mt-1">
                        <div className="flex items-center gap-2">
                            {/* Model Selector Dropdown - Integrated */}
                            <ModelSelector currentModel={currentModel} onSelect={onModelSelect} />

                            <div className="w-[1px] h-4 bg-white/10 mx-1" />

                            {/* Real Attachment Button */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                title="Attach Image or Video"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && attachments.length === 0)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#3182F6]/10 hover:bg-[#3182F6] text-[#3182F6] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <span>Execute</span>
                            <Send size={12} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatSidebar;
