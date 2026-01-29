import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const DrawingLine = ({ d, delay, duration = 1.5 }) => (
    <motion.path
        d={d}
        fill="transparent"
        stroke="rgba(100, 116, 139, 0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0]
        }}
        transition={{
            duration: duration * 2,
            ease: "easeInOut",
            delay: delay,
            repeat: Infinity,
            repeatDelay: 0.5
        }}
    />
);

const WireframeLoader = ({ deviceType = 'mobile' }) => {
    const isMobile = deviceType === 'mobile';
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        "Crafting a stunning UI experience",
        "Analyzing project blueprint",
        "Synthesizing visual aesthetics",
        "Assembling premium components",
        "Optimizing user flows"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [messages.length]);

    // Viewbox and Dimensions
    const width = isMobile ? 375 : 800;
    const height = isMobile ? 667 : 500;
    const viewBox = `0 0 ${width} ${height}`;

    return (
        <div className="relative flex flex-col items-center justify-center p-12">
            {/* SVG Wireframe Layer - No Background Frame */}
            <motion.svg
                width={width}
                height={height}
                viewBox={viewBox}
                className="overflow-visible"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {isMobile ? (
                    <>
                        {/* Mobile Wireframe Logic */}
                        <DrawingLine d="M 40 60 H 335" delay={0.1} />
                        <DrawingLine d="M 40 100 H 335 V 250 H 40 V 100" delay={0.3} />
                        <DrawingLine d="M 40 100 L 335 250" delay={0.5} />
                        <DrawingLine d="M 335 100 L 40 250" delay={0.5} />
                        <DrawingLine d="M 40 290 H 200" delay={0.7} />
                        <DrawingLine d="M 40 320 H 335" delay={0.8} />
                        <DrawingLine d="M 40 340 H 335" delay={0.9} />
                        <DrawingLine d="M 40 420 H 180 V 550 H 40 V 420" delay={1.1} />
                        <DrawingLine d="M 195 420 H 335 V 550 H 195 V 420" delay={1.2} />
                        <DrawingLine d="M 60 600 H 315" delay={1.4} />
                    </>
                ) : (
                    <>
                        {/* Web Wireframe Logic (Bento/Dashboard Style) */}
                        <DrawingLine d="M 50 20 H 750" delay={0.1} /> {/* Navbar */}
                        <DrawingLine d="M 50 60 H 200 V 450 H 50 V 60" delay={0.3} /> {/* Sidebar */}

                        {/* Hero / Big Chart Area */}
                        <DrawingLine d="M 220 60 H 750 V 220 H 220 V 60" delay={0.5} />
                        <DrawingLine d="M 220 60 L 750 220" delay={0.7} />
                        <DrawingLine d="M 750 60 L 220 220" delay={0.7} />

                        {/* Bento Grids */}
                        <DrawingLine d="M 220 240 H 380 V 340 H 220 V 240" delay={0.9} />
                        <DrawingLine d="M 400 240 H 560 V 340 H 400 V 240" delay={1.0} />
                        <DrawingLine d="M 580 240 H 750 V 340 H 580 V 240" delay={1.1} />

                        {/* Bottom List */}
                        <DrawingLine d="M 220 360 H 750" delay={1.3} />
                        <DrawingLine d="M 220 385 H 650" delay={1.4} />
                        <DrawingLine d="M 220 410 H 700" delay={1.5} />
                    </>
                )}
            </motion.svg>

            {/* Premium Loading Message - Cycling with AnimatePresence */}
            <div className="absolute bottom-10 flex flex-col items-center gap-2 h-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center h-full justify-center"
                    >
                        <span className="text-[16px] font-bold text-slate-300 tracking-[0.2em] uppercase text-center max-w-[500px]">
                            {messages[messageIndex]}
                        </span>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-4 flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1 h-1 bg-blue-500 rounded-full"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </div>

            {/* Antigravity Field Effect */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full z-[-1]" />
        </div>
    );
};

export default WireframeLoader;
