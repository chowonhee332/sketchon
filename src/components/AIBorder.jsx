import React from 'react';
import { motion } from 'framer-motion';

const AIBorder = () => {
    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            {/* Soft Inner Glow (Vignette) - Breathing Effect */}
            <motion.div
                animate={{
                    boxShadow: [
                        "inset 0 0 40px 10px rgba(59, 130, 246, 0.1)", // Faint
                        "inset 0 0 80px 20px rgba(59, 130, 246, 0.4)", // Stronger glow
                        "inset 0 0 40px 10px rgba(59, 130, 246, 0.1)"  // Back to faint
                    ]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 w-full h-full"
            />

            {/* Optional: Very subtle color tint overlay for immersion */}
            <motion.div
                animate={{ opacity: [0, 0.05, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-600 mix-blend-overlay"
            />
        </div>
    );
};

export default AIBorder;
