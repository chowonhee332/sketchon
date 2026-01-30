import React from 'react';
import { X } from 'lucide-react';

const CreonSidebar = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full bg-[#1c1c1e] relative overflow-hidden">
            {/* Minimal Header for the sidebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2c2c2e] border-b border-white/10 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Creon Service</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* The External Creon App */}
            <iframe
                src="https://creon-umber.vercel.app/"
                className="w-full h-full border-none"
                title="Creon Contents Builder"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};

export default CreonSidebar;
