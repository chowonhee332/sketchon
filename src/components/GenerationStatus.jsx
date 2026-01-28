import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

const GenerationStatus = () => {
    return (
        <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                        <Sparkles size={16} className="text-blue-400" />
                    </motion.div>

                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"
                    />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-widest uppercase">Antigravity Synthesis</span>
                        <Loader2 size={10} className="text-blue-400 animate-spin" />
                    </div>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[10px] text-slate-500 font-mono"
                    >
                        Aligning design language & components...
                    </motion.span>
                </div>
            </div>

            {/* Progress Bar (Mock) */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: ["10%", "40%", "70%", "95%"] }}
                    transition={{ duration: 20, times: [0, 0.2, 0.6, 1], ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
            </div>
        </div>
    );
};

export default GenerationStatus;
