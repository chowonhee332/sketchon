import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Particle = ({ delay, target }) => {
    // Random start position within a larger splash zone
    const randomX = (Math.random() - 0.5) * 800;
    const randomY = (Math.random() - 0.5) * 800;

    return (
        <motion.div
            initial={{ x: randomX, y: randomY, scale: 0, opacity: 0 }}
            animate={{
                x: target.x,
                y: target.y,
                scale: 1,
                opacity: 1,
                transition: {
                    duration: 1.5,
                    ease: "anticipate",
                    delay: delay
                }
            }}
            className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] z-10"
        />
    );
};

const DrawingLine = ({ d, delay }) => (
    <motion.path
        d={d}
        fill="transparent"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: delay }}
    />
);

const WireframeLoader = () => {
    // Defined target positions for particles (relative to center of loader)
    // These correspond roughly to UI element positions in the SVG
    const particleTargets = [
        { x: -120, y: -280 }, { x: 120, y: -280 }, // Header
        { x: 0, y: -200 }, // Hero Image Center
        { x: -100, y: -100 }, { x: 100, y: -100 }, { x: -80, y: -80 }, // Content lines
        { x: 0, y: 50 }, // Big section
        { x: -120, y: 180 }, { x: 120, y: 180 }, // Footer button area
    ];

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Glass Container */}
            <div className="relative w-[375px] h-[667px] bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col items-center p-8">

                {/* SVG Wireframe Layer */}
                <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 375 667">
                    {/* Header */}
                    <DrawingLine d="M 40 60 H 335" delay={0.2} />
                    <DrawingLine d="M 40 40 H 100" delay={0.3} /> {/* Time/Status */}

                    {/* Hero Image Box */}
                    <DrawingLine d="M 40 100 H 335 V 250 H 40 V 100" delay={0.5} />
                    <DrawingLine d="M 40 100 L 335 250" delay={0.8} /> {/* Cross for placeholder */}
                    <DrawingLine d="M 335 100 L 40 250" delay={0.8} />

                    {/* Content Lines */}
                    <DrawingLine d="M 40 290 H 200" delay={1.0} /> {/* Title */}
                    <DrawingLine d="M 40 320 H 335" delay={1.1} />
                    <DrawingLine d="M 40 340 H 335" delay={1.2} />
                    <DrawingLine d="M 40 360 H 280" delay={1.3} />

                    {/* Cards Section */}
                    <DrawingLine d="M 40 420 H 180 V 550 H 40 V 420" delay={1.5} />
                    <DrawingLine d="M 195 420 H 335 V 550 H 195 V 420" delay={1.6} />

                    {/* Button */}
                    <DrawingLine d="M 60 600 H 315" delay={2.0} />
                    <motion.rect
                        x="60" y="585" width="255" height="40" rx="20"
                        fill="transparent" stroke="#3b82f6" strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 2.0 }}
                    />
                </svg>

                {/* Particle Layer - Centered relative to container for easier coordinate mapping */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {particleTargets.map((target, i) => (
                        <Particle key={i} target={target} delay={0.5 + i * 0.1} />
                    ))}
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-12 flex flex-col items-center gap-3 z-20">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Loader2 className="animate-spin text-blue-400" size={16} />
                        <span className="text-sm font-bold text-white tracking-tight">Antigravity Synthesis...</span>
                    </div>
                </div>
            </div>

            {/* Outer Glow/Antigravity Field Effect */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full z-[-1]" />
        </div>
    );
};

export default WireframeLoader;
