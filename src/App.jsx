import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUp, ChevronDown, Wand2, Layers, Cpu, Users, BarChart, Settings, Home, Search, Bell, X, CheckCircle2, Zap, RefreshCw, Smartphone, Monitor, Play } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import UserManagement from './pages/admin/UserManagement';
import ApiSettings from './pages/admin/ApiSettings';
import GeneratorPage from './pages/GeneratorPage';
import { analyzePrompt } from './lib/gemini';
import ProjectDrawer from './components/ProjectDrawer';
// Removed FeatureShowcase import as we are integrating it into the particle engine

// --- Context & State Management ---
export const UserContext = createContext();

const INITIAL_USERS = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Premium', status: 'Active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Free', status: 'Inactive', joined: '2024-01-20' },
    { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'Premium', status: 'Active', joined: '2024-02-01' },
];

const ADMIN_CREDS = { email: 'wonhee@kt.com', password: 'wonhee' };

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('devax_admin_auth') === 'true');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('devax_api_key') || '');

    const addUser = (userData) => {
        const newUser = {
            id: users.length + 1,
            ...userData,
            role: 'Free',
            status: 'Active',
            joined: new Date().toISOString().split('T')[0]
        };
        setUsers([newUser, ...users]);
        return newUser;
    };

    const loginAdmin = (email, password) => {
        if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) {
            setIsAdmin(true);
            localStorage.setItem('devax_admin_auth', 'true');
            return true;
        }
        return false;
    };

    const logoutAdmin = () => {
        setIsAdmin(false);
        localStorage.removeItem('devax_admin_auth');
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('devax_api_key', key);
    };

    return (
        <UserContext.Provider value={{
            users, setUsers,
            currentUser, setCurrentUser,
            addUser,
            isAdmin, loginAdmin, logoutAdmin,
            apiKey, saveApiKey
        }}>
            {children}
        </UserContext.Provider>
    );
};

// --- Configuration ---
const PARTICLE_COUNT = 11000; // 10,000 for the ring + 1,000 scattered around
const SCROLL_HEIGHT = 12000; // Expanded for 12 sections (roughly 1000vh)

// --- Math & Geometry Helpers ---
const randomRange = (min, max) => Math.random() * (max - min) + min;

// Generates points for a Torus (Dual Ring Logo)
const generateTorus = (radius, tubeRadius, count, offsetAngle = 0) => {
    const points = [];
    for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        // Parametric Torus equation
        const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
        const z = tubeRadius * Math.sin(v);

        // Add "Dispersion" - jitter to make it less "perfectly smooth"
        // Random offset based on the reference image (organic cloud style)
        const jitter = radius * 0.22;
        const noiseX = (Math.random() - 0.5) * jitter;
        const noiseY = (Math.random() - 0.5) * jitter;
        const noiseZ = (Math.random() - 0.5) * jitter;

        points.push({ x: x + noiseX, y: y + noiseY, z: z + noiseZ });
    }
    return points;
};

// --- Components ---


const ParticleEngine = ({ scrollYProgress }) => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const targets = useRef({
        phase0: [], // Dual Ring
        phaseChaos: [], // Chaos (Problem)
        phase1: [], // Analyze (Brackets)
        phase2: [], // Visualize (Grid)
        phase3: [], // Deliver (Document)
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        let frame;
        let lastTime = performance.now();
        let totalTime = 0;

        const initTargets = (w, h) => {
            const cx = w / 2;
            const cy = h / 2;
            const activeCount = 10000;

            const ringRadius = h * 0.315;
            const tubeRadius = h * 0.063;
            const ring1 = generateTorus(ringRadius, tubeRadius, activeCount / 2);
            const ring2 = generateTorus(ringRadius, tubeRadius, activeCount / 2);

            // Apply a static tilt to ring2 to make them intersect
            const tiltAngle = Math.PI / 4; // 45 degrees
            const cosT = Math.cos(tiltAngle);
            const sinT = Math.sin(tiltAngle);

            targets.current.phase0 = [
                ...ring1.map(p => ({
                    x: p.x,
                    y: p.y,
                    z: p.z,
                    rotType: 0, // Y-axis (Left-Right)
                    color: { r: 255, g: 255, b: 255 }
                })),
                ...ring2.map(p => ({
                    x: p.x,
                    y: p.y * cosT - p.z * sinT,
                    z: p.y * sinT + p.z * cosT,
                    rotType: 1, // X-axis (Top-Bottom)
                    color: { r: 255, g: 255, b: 255 }
                }))
            ].map((p, i) => {
                // 7% of particles become "debris" floating around the rings
                const isDebris = i % 15 === 0;
                let dx = p.x;
                let dy = p.y;
                let dz = p.z;

                if (isDebris) {
                    // Spread out a bit more
                    const spread = 1.1 + Math.random() * 0.6;
                    dx *= spread;
                    dy *= spread;
                    dz *= spread;

                    // More noise for wider distribution
                    dx += (Math.random() - 0.5) * 60;
                    dy += (Math.random() - 0.5) * 60;
                    dz += (Math.random() - 0.5) * 60;
                }

                return {
                    x: dx + (Math.random() - 0.5) * 15, // Extra scattering for organic feel
                    y: dy + (Math.random() - 0.5) * 15,
                    z: dz + (Math.random() - 0.5) * 15,
                    rotType: p.rotType,
                    isDebris: isDebris,
                    color: isDebris ? { r: 150, g: 150, b: 180 } : { r: 255, g: 255, b: 255 }
                };
            });
            // Other phases removed to persist Phase 0 (Rings) throughout.
            // --- Phase Chaos ---
            targets.current.phaseChaos = Array.from({ length: activeCount }).map(() => ({
                x: cx + randomRange(-w * 0.45, w * 0.45),
                y: cy + randomRange(-h * 0.45, h * 0.45),
                z: randomRange(-200, 800), // Prevent extreme negative Z (close to camera)
                color: { r: 100, g: 110, b: 130 }
            }));
        };

        const initParticles = (w, h) => {
            particles.current = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
                let rotType = 0;
                if (i < 2500) {
                    rotType = 0; // Persistent Ring 1 (Y)
                } else if (i < 5000) {
                    rotType = 1; // Persistent Ring 2 (X)
                } else {
                    rotType = i % 2; // Interactive Feature Particles
                }

                return {
                    x: randomRange(-w, w * 2),
                    y: randomRange(-h, h * 2),
                    z: randomRange(-2000, 2000),
                    vx: 0, vy: 0, vz: 0,
                    color: { r: 255, g: 255, b: 255 },
                    size: randomRange(0.6, 1.2),
                    rotType: rotType,
                    rotSpeed: randomRange(0.2, 0.5),
                    randomSeed: Math.random() * 10
                };
            });
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initTargets(canvas.width, canvas.height);
            if (particles.current.length === 0) initParticles(canvas.width, canvas.height);
        };

        const handleMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY };
        };

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const vh = window.innerHeight;

            // performance.now is relative to page load, always increasing
            const currentTime = performance.now() * 0.001;
            // CORRECTED: Multiplier set to 14 to match actual content length (Hero + 4 Sections + 8 others approx)
            const scrollValue = (scrollYProgress?.get() || 0) * (vh * 14);

            // High-fidelity background clear
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);

            // --- Draw Ambient Aura ---
            if (scrollValue >= vh * 1.0) {
                let activeColor = 'rgba(100, 150, 255, 0.1)'; // Blue
                if (scrollValue > vh * 3.0) activeColor = 'rgba(120, 255, 180, 0.12)'; // Green
                else if (scrollValue > vh * 2.0) activeColor = 'rgba(180, 120, 255, 0.12)'; // Purple

                const gradient = ctx.createRadialGradient(w * 0.7, cy, 0, w * 0.7, cy, 500);
                gradient.addColorStop(0, activeColor);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, w, h);
            }

            particles.current.forEach((p, i) => {
                let target;
                let activePhase;
                let layerIndex = -1;
                let lerpFactor = 0.04;

                // --- 1. Determine Target (Always Phase 0) & Scroll-Linked Offset ---
                let slideOffset = 0; // The horizontal push

                // Enforce Phase 0 (Rings) always
                activePhase = targets.current.phase0;
                const subIndex = (i % 5000);
                if (subIndex % 2 === 0) target = activePhase[(subIndex % 2500) * 2 + 1];
                else target = activePhase[5000 + (subIndex % 2500) * 2 + 1];

                // Calculate Slide Offset based on Scroll
                const maxOffset = 450; // Optimized for centering in 50% column (avoid edge sticking)

                // --- Pre-emptive Snap Logic (Corrected for 14vh Scale) ---
                // S1 (Right): 0.1 -> 0.9 (Ready at 1.0)
                // S2 (Left): 1.5 -> 2.0 (Ready at 2.0)
                // S3 (Right): 2.5 -> 3.0 (Ready at 3.0)
                // S4 (Left): 3.5 -> 4.0 (Ready at 4.0)

                if (scrollValue < vh * 0.1) {
                    slideOffset = 0;
                } else if (scrollValue < vh * 1.5) {
                    // Section 1: Strategic Intelligence (Target: Right)
                    layerIndex = 0;

                    const start = vh * 0.1;
                    const duration = vh * 0.8;
                    const progress = Math.min(Math.max((scrollValue - start) / duration, 0), 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    slideOffset = maxOffset * easeOut;

                } else if (scrollValue < vh * 2.5) {
                    // Section 2: Visual Benchmarking (Target: Left)
                    layerIndex = 1;

                    // Transition starts at 1.5 (Mid S1), ends at 2.0 (Start S2)
                    const start = vh * 1.5;
                    const duration = vh * 0.5;
                    const pRaw = Math.min(Math.max((scrollValue - start) / duration, 0), 1);
                    const progress = pRaw < 0.5 ? 2 * pRaw * pRaw : 1 - Math.pow(-2 * pRaw + 2, 2) / 2;

                    slideOffset = maxOffset - (maxOffset * 2 * progress); // 450 -> -450

                } else if (scrollValue < vh * 3.5) {
                    // Section 3: Experience Logic (Target: Right)
                    layerIndex = 2;

                    // Transition starts at 2.5 (Mid S2), ends at 3.0 (Start S3)
                    const start = vh * 2.5;
                    const duration = vh * 0.5;
                    const pRaw = Math.min(Math.max((scrollValue - start) / duration, 0), 1);
                    const progress = pRaw < 0.5 ? 2 * pRaw * pRaw : 1 - Math.pow(-2 * pRaw + 2, 2) / 2;

                    slideOffset = -maxOffset + (maxOffset * 2 * progress); // -450 -> 450

                } else if (scrollValue < vh * 6.0) {
                    // Section 4: Winning Delivery (Target: Left)
                    layerIndex = 3;

                    // Transition starts at 3.5 (Mid S3), ends at 4.0 (Start S4)
                    const start = vh * 3.5;
                    const duration = vh * 0.5;
                    const pRaw = Math.min(Math.max((scrollValue - start) / duration, 0), 1);
                    const progress = pRaw < 0.5 ? 2 * pRaw * pRaw : 1 - Math.pow(-2 * pRaw + 2, 2) / 2;

                    slideOffset = maxOffset - (maxOffset * 2 * progress); // 450 -> -450
                } else {
                    slideOffset = 0;
                }

                if (!target) return;

                // Apply target base position
                let tx = target.x + (target.isDebris ? 0 : cx);
                let ty = target.y + (target.isDebris ? 0 : cy);
                let tz = target.z;

                // --- 2. Effects & Debris ---
                if (target.isDebris && i < 5000 && scrollValue < vh * 1.0) {
                    // Suck effect (Intro)
                    const suckProgress = (currentTime * 0.3 + p.randomSeed) % 1.0;
                    const startRange = 0.3 + (p.randomSeed % 0.3);
                    const suckFactor = 1.0 + Math.pow(1.0 - suckProgress, 2) * startRange;
                    tx = target.x * suckFactor + cx;
                    ty = target.y * suckFactor + cy;
                    tz = target.z * suckFactor;
                } else if (target.isDebris) {
                    tx = target.x + cx;
                    ty = target.y + cy;
                    tz = target.z;
                }

                // --- Scroll-Linked Vertical Parallax (Subtle Rise) ---
                const parallaxY = (scrollValue % vh) * 0.1;
                ty -= parallaxY;

                // --- 3. Constant Rotation ---
                const lx = tx - cx;
                const ly = ty - cy;
                const lz = tz;
                const rotationSpeed = p.rotType === 0 ? 0.35 : 0.22;
                const angle = currentTime * rotationSpeed;

                if (p.rotType === 0) {
                    const cosY = Math.cos(angle);
                    const sinY = Math.sin(angle);
                    // Apply 0.8 scale to keep particles tighter during showcase
                    const s = (layerIndex !== -1) ? 0.8 : 1.0;
                    tx = cx + (lx * s * cosY - lz * s * sinY); // Rotate around 0
                    ty = cy + ly * s;
                    tz = lx * s * sinY + lz * s * cosY;
                } else {
                    const cosX = Math.cos(angle);
                    const sinX = Math.sin(angle);
                    const s = (layerIndex !== -1) ? 0.8 : 1.0;
                    tx = cx + lx * s;
                    ty = cy + (ly * s * cosX - lz * s * sinX);
                    tz = ly * s * sinX + lz * s * cosX;
                }

                // --- 4. Apply Scroll Slide AFTER Rotation ---
                // This ensures rotation is local, but position slides
                if (!target.isDebris) {
                    tx += slideOffset;
                }

                ty += Math.sin(currentTime * 0.5) * 5;

                // --- 4. Showcase Sync ---
                let colorMultiplier = 1;
                // Update Breathing Logic for 4 Phases
                if (scrollValue >= vh * 0.9 && layerIndex !== -1 && i >= 5000) {
                    let activeStep = 0;
                    // Match the boundaries defined above
                    if (scrollValue > vh * 3.5) activeStep = 3;
                    else if (scrollValue > vh * 2.5) activeStep = 2;
                    else if (scrollValue > vh * 1.5) activeStep = 1;

                    if (layerIndex === activeStep) {
                        const breathe = Math.sin(currentTime * 2 + i * 0.1) * 20;
                        // Reduced pull drastically. Only slight float.
                        tz -= (50 + breathe);
                        colorMultiplier = 1.6;
                    } else {
                        // Push inactive phases even further
                        tz += 400;
                        colorMultiplier = 0.25;
                    }
                }

                // --- 5. Mouse ---
                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                if (dx * dx + dy * dy < 40000) {
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const force = (1 - d / 200) * 1.5;
                    p.x += (dx / d) * force;
                    p.y += (dy / d) * force;
                }

                // --- 6. Physics/Lerp ---
                p.x += (tx - p.x) * lerpFactor;
                p.y += (ty - p.y) * lerpFactor;
                p.z += (tz - p.z) * lerpFactor;

                if (target.color) {
                    p.color.r += (target.color.r * colorMultiplier - p.color.r) * 0.05;
                    p.color.g += (target.color.g * colorMultiplier - p.color.g) * 0.05;
                    p.color.b += (target.color.b * colorMultiplier - p.color.b) * 0.05;
                }

                // --- 7. Draw ---
                const perspective = 1000;
                const scale = perspective / (perspective + p.z);
                let opacity = Math.min(1, scale * 1.1);

                if (i < 5000 && scrollValue > vh * 1.5) opacity *= 0.35;

                if (scale > 0.05 && opacity > 0.01) {
                    ctx.fillStyle = `rgba(${Math.floor(p.color.r)}, ${Math.floor(p.color.g)}, ${Math.floor(p.color.b)}, ${opacity})`;
                    const s = p.size * scale;
                    if (s < 1.4) {
                        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
                    } else {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            frame = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        resize();
        animate();
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(frame);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-black" />;
};

const KeywordsLayer = () => {
    const { scrollY } = useScroll();
    const [vh, setVh] = useState(window.innerHeight);
    const keywords = [
        "Research", "Reference", "Time??", "Chaos", "Logic", "Structure", "Idea", "Concept",
        "Design", "Prototype", "Strategy", "Analysis", "Insight", "Delivery", "Speed", "Quality",
        "AI", "Modern", "Premium", "Global", "Scale", "Trust", "Innovation", "Future"
    ];

    useEffect(() => {
        const handleResize = () => setVh(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Only show in the first 1.5vh
    const opacity = useSpring(0, { stiffness: 100, damping: 30 });

    useEffect(() => {
        return scrollY.onChange(latest => {
            if (latest < vh * 1.5) {
                opacity.set(Math.max(0, 1 - latest / (vh * 1.2)));
            } else {
                opacity.set(0);
            }
        });
    }, [scrollY, vh]);

    return (
        <motion.div
            style={{ opacity }}
            className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
        >
            {keywords.map((word, i) => {
                const top = (i * 7) % 100;
                const left = (i * 13) % 100;
                const rotation = (i % 2 === 0) ? 0 : 90;
                const size = 10 + (i % 5) * 15;
                const delay = i * 0.1;
                const duration = 10 + (i % 10);

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 }}
                        animate={{
                            opacity: [0.1, 0.4, 0.1],
                            x: [0, Math.random() * 40 - 20, 0],
                            y: [0, Math.random() * 40 - 20, 0]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: "linear"
                        }}
                        className="absolute text-white/10 font-['Outfit'] font-black whitespace-nowrap select-none"
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            fontSize: `${size}px`,
                            transform: `rotate(${rotation}deg)`,
                            filter: `blur(${i % 3 === 0 ? '2px' : '0px'})`
                        }}
                    >
                        {word.toUpperCase()}
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

const Section = ({ children, className }) => (
    <section className={`relative min-h-screen flex flex-col items-center justify-center p-6 ${className}`}>
        {children}
    </section>
);

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl transition-all cursor-pointer"
                >
                    <ArrowUp size={24} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

// --- Modal Component ---
const SignUpModal = ({ isOpen, onClose }) => {
    const { addUser } = useContext(UserContext);
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        addUser({ name: formData.name, email: formData.email });
        setStep('success');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 pt-12">
                        {step === 'form' ? (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create account</h2>
                                    <p className="text-slate-500 mt-2">Join DevAX and start building today.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Wonhee Cho"
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="name@example.com"
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-base mt-4 shadow-lg shadow-slate-200">
                                        Sign up
                                    </Button>
                                </form>

                                <div className="mt-8 pt-8 border-t text-center text-sm text-slate-500">
                                    Already have an account? <button className="text-blue-600 font-bold hover:underline">Log in</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center py-10">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to Sketchon!</h2>
                                <p className="text-slate-500 mt-3 px-4">
                                    Your account has been created successfully. <br />
                                    You can now explore the admin dashboard to see your profile.
                                </p>
                                <div className="flex flex-col gap-3 w-full mt-10">
                                    <Link to="/admin" onClick={onClose} className="w-full">
                                        <Button className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold">
                                            Go to Admin Dashboard
                                        </Button>
                                    </Link>
                                    <Button onClick={onClose} variant="ghost" className="text-slate-500">
                                        Browse Landing Page
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const RefinementModal = ({ isOpen, onClose, initialData, userPrompt, onConfirm }) => {
    const [data, setData] = useState(initialData || { domain: '', target: '', style: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setData(initialData);
    }, [initialData]);



    const handleConfirm = () => {
        setLoading(true);
        // Simulate a small delay or proceed immediately
        setTimeout(() => {
            onConfirm(data);
            setLoading(false);
        }, 500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        key="modal-content"
                        initial={{ scale: 0.95, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] shadow-2xl"
                    >
                        {/* Glass Container Background */}
                        <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-10 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-0 p-8">
                            <div className="mb-8 text-center">
                                <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Wand2 className="text-blue-500" size={24} />
                                </div>
                                <h2 className="text-2xl font-bold font-['Outfit'] text-white mb-2 tracking-tight">AI Project Setup</h2>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                                    {initialData?.explanation || "Based on your request, we've configured the optimal settings for your project."}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* User Prompt Display */}
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5 block">Original Request</label>
                                    <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed font-light">"{userPrompt}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Domain</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-white/20"
                                            value={data.domain}
                                            onChange={(e) => setData({ ...data, domain: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-white/20"
                                            value={data.target}
                                            onChange={(e) => setData({ ...data, target: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Visual Style</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Minimal', 'Modern', 'Corporate', 'Playful', 'Dark', 'Brutalist'].map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setData({ ...data, style: tag })}
                                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${data.style === tag
                                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter custom style..."
                                        className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all mt-2 placeholder:text-white/20"
                                        value={data.style}
                                        onChange={(e) => setData({ ...data, style: e.target.value })}
                                    />
                                </div>

                                <Button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-base mt-2 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Designing Interface...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Zap className="fill-white" size={18} />
                                            <span>Generate UI</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Navbar = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-transparent"
            >
                <div className="flex items-center gap-2">
                    <span className="font-['Outfit'] font-bold text-xl tracking-tight text-white">Sketchon</span>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Projects
                    </button>
                    <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Showcase</a>
                    <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Updates</a>
                    <Link to="/admin" className="text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase px-3 py-1 border border-white/10 rounded-full">
                        Admin
                    </Link>
                    <Button variant="ghost" className="text-white hover:bg-white/10 h-8 px-3 text-sm">Log In</Button>
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="rounded-full h-9 px-5 bg-white hover:bg-slate-200 text-black font-semibold text-sm transition-all"
                    >
                        Sign Up
                    </Button>
                </div>
            </motion.header>

            <SignUpModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
            <ProjectDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
};

const LandingPage = () => {
    const { scrollYProgress } = useScroll();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [platform, setPlatform] = useState('mobile'); // 'mobile' | 'web'
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [refinementModalOpen, setRefinementModalOpen] = useState(false);
    const [refinementData, setRefinementData] = useState(null);

    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        if (prompt.trim()) {
            setIsAnalyzing(true);

            let resultData = null;

            try {
                // Race analysis against a 3-second timeout to ensure UI responsiveness
                const analysisPromise = analyzePrompt(prompt);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Analysis timeout")), 3000)
                );

                resultData = await Promise.race([analysisPromise, timeoutPromise]);
            } catch (error) {
                console.warn("Analysis failed or timed out:", error);
                // Fallback data if API fails/timeouts
                resultData = {
                    domain: "Web Project",
                    target: "General Audience",
                    style: "Modern",
                    explanation: "Could not analyze prompt in time. Please configure manually."
                };
            } finally {
                // ALWAYS open the modal, whether analysis succeeded or failed
                setRefinementData(resultData);
                setRefinementModalOpen(true);
                setIsAnalyzing(false);
            }
        }
    };

    const handleRefinementConfirm = (finalData) => {
        // Construct query params
        const params = new URLSearchParams();
        params.append('q', prompt);
        params.append('platform', platform);
        params.append('domain', finalData.domain);
        params.append('target', finalData.target);
        params.append('style', finalData.style);

        navigate(`/generate?${params.toString()}`);
    };

    return (
        <div className="relative w-full text-white bg-[#000000] selection:bg-[#0070ff]/40">
            <ParticleEngine scrollYProgress={scrollYProgress} />
            <Navbar />
            <ScrollToTop />


            {/* Hero Section (Phase 0) */}
            <Section className="z-10 text-center pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl flex flex-col items-center"
                >
                    {/* Badge - Framer Style: Subtle Pill */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-400 mb-8 backdrop-blur-md"
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                        SKETCHON AI 2.0 • INTRODUCING THE NEW STANDARD
                    </motion.div>

                    {/* Main Title - Framer Style: "Build better Ideas, faster" - ALL WHITE */}
                    <h1 className="text-6xl md:text-[85px] font-['Outfit'] font-medium tracking-[-0.05em] mb-12 leading-[0.95] text-center text-white">
                        Build better <br />
                        ideas, faster
                    </h1>

                    <form onSubmit={handlePromptSubmit} className="w-full max-w-xl relative group mb-10">
                        {/* Prompt Input Area - Framer/Glass style */}
                        <div className="bg-black/85 border border-white/10 rounded-[24px] p-5 transition-all duration-500 group-focus-within:border-blue-500/50 shadow-2xl">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your product idea..."
                                className="w-full bg-transparent border-none outline-none text-white/80 placeholder:text-white/30 text-[18px] font-light resize-none leading-relaxed h-16 mb-1 scrollbar-none"
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex bg-white/5 rounded-full p-1 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('mobile')}
                                        className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-2 ${platform === 'mobile' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <Smartphone size={14} /> APP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('web')}
                                        className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-2 ${platform === 'web' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <Monitor size={14} /> WEB
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <motion.button
                                        type="submit"
                                        disabled={isAnalyzing || !prompt.trim()}
                                        whileHover={prompt.trim() ? { scale: 1.05 } : {}}
                                        whileTap={prompt.trim() ? { scale: 0.95 } : {}}
                                        className={`h-10 w-10 rounded-full flex items-center justify-center p-0 shadow-xl transition-all duration-300 ${prompt.trim() ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                                    >
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Tags below Prompt Bar - Optimized for Gemini UI Generation */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        {['Personal Page', 'Landing Page', 'About Page', 'Resume', 'Portfolio'].map(tag => (
                            <span
                                key={tag}
                                onClick={() => setPrompt(tag)}
                                className="px-5 py-2 rounded-full border border-white/10 text-[12px] text-slate-400 font-medium hover:bg-white/5 hover:text-white hover:border-white/20 cursor-pointer transition-all"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <div className="flex flex-col items-center gap-2 text-xs text-white uppercase tracking-widest">
                        Scroll to explore
                        <ChevronDown size={16} />
                    </div>
                </motion.div>
            </Section>

            {/* Feature Showcase 2.0: Interactive Scroll Journey - IMMEDIATELY after Hero */}
            <div className="relative">
                {/* Feature 1: Strategic Intelligence */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-20 max-w-7xl w-full items-center px-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative group mt-20"
                        >
                            <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-0 bg-transparent">
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 1. STRATEGIC INTELLIGENCE</span>
                                <h2 className="text-5xl md:text-[62px] font-['Outfit'] font-medium tracking-[-0.05em] mb-10 leading-[1.0] text-white">
                                    Turn raw ideas <br /> <span className="text-white">into winning plans.</span>
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light">
                                    파편화된 RFP와 모호한 아이디어를 실시간 시장 데이터와 결합하여 정교한 비즈니스 전략으로 변환합니다. 수주의 시작은 완벽한 분석에서 시작됩니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        Learn more <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        <div className="relative aspect-square overflow-hidden">
                            {/* Particles form Neural Grid shape */}
                        </div>
                    </div>
                </Section>

                {/* Feature 2: Visual Benchmarking */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-20 max-w-7xl w-full items-center px-12">
                        <div className="relative aspect-square overflow-hidden order-2 md:order-1">
                            {/* Particles form UI Focus shape */}
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="order-1 md:order-2 text-right flex flex-col items-end relative group"
                        >
                            <div className="absolute -inset-8 bg-gradient-to-bl from-purple-500/10 to-transparent blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-0 bg-transparent flex flex-col items-end">
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 2. VISUAL BENCHMARKING</span>
                                <h2 className="text-5xl md:text-[62px] font-['Outfit'] font-medium tracking-[-0.05em] mb-10 leading-[1.0] text-white">
                                    Build the skeleton <br /> <span className="text-white">of your service.</span>
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light text-right">
                                    글로벌 리딩 서비스의 UI/UX 패턴을 분석하여 제안의 시각적 근거를 구축합니다. 경쟁사의 약점을 파악하고 우리만의 압도적인 차별화 포인트를 시각적으로 증명합니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        <ArrowRight size={14} className="rotate-180" /> Explore Engine
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </Section>

                {/* Feature 3: Experience Logic */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-20 max-w-7xl w-full items-center px-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative group mt-20"
                        >
                            <div className="absolute -inset-8 bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-0 bg-transparent">
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 3. EXPERIENCE LOGIC</span>
                                <h2 className="text-5xl md:text-[62px] font-['Outfit'] font-medium tracking-[-0.05em] mb-10 leading-[1.0] text-white">
                                    Design and prototype <br /> <span className="text-white">in one place</span>
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light">
                                    타겟 유저의 여정을 설계하고 AI 히트맵 예측을 통해 사용성을 사전에 검증합니다. 모든 디자인 결정에는 흔들리지 않는 데이터 논리가 뒷받침됩니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        See Heatmaps <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        <div className="relative aspect-square overflow-hidden">
                            {/* Particles form Heatmap shape */}
                        </div>
                    </div>
                </Section>

                {/* Feature 4: The Winning Delivery */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-20 max-w-7xl w-full items-center px-12">
                        <div className="relative aspect-square overflow-hidden order-2 md:order-1">
                            {/* Particles form Solid Stacks shape */}
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="order-1 md:order-2 text-right flex flex-col items-end relative group"
                        >
                            <div className="absolute -inset-8 bg-gradient-to-bl from-green-500/10 to-transparent blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-0 bg-transparent flex flex-col items-end">
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 4. THE WINNING DELIVERY</span>
                                <h2 className="text-5xl md:text-[62px] font-['Outfit'] font-medium tracking-[-0.05em] mb-10 leading-[1.0] text-white">
                                    Create your final <br /> <span className="text-white">pitch in seconds</span>
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light text-right">
                                    Creon 엔진이 분석된 로직을 바탕으로 고해상도 UI와 3D 에셋을 즉시 생성합니다. 모든 기획과 디자인은 즉시 제출 가능한 전문가 수준의 제안 장표로 완성됩니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        Build Now <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </Section>
            </div>

            {/* Section: Social Proof (Infinite Slider) - Moved here */}
            <div className="relative z-10 py-24 bg-black/50 backdrop-blur-sm border-y border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Trusted by Forward-Thinking Teams</p>
                </div>
                <div className="flex gap-24 animate-infinite-scroll whitespace-nowrap px-10">
                    {['Google', 'Vercel', 'Stripe', 'Framer', 'Linear', 'OpenAI', 'Anthropic', 'Netflix', 'Airbnb', 'Replicate'].map((brand) => (
                        <div key={brand} className="text-4xl font-['Outfit'] font-bold text-white/10 hover:text-white/30 transition-colors uppercase tracking-tighter">
                            {brand}
                        </div>
                    ))}
                    {['Google', 'Vercel', 'Stripe', 'Framer', 'Linear', 'OpenAI', 'Anthropic', 'Netflix', 'Airbnb', 'Replicate'].map((brand) => (
                        <div key={`${brand}-clone`} className="text-4xl font-['Outfit'] font-bold text-white/10 hover:text-white/30 transition-colors uppercase tracking-tighter">
                            {brand}
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 7: Bento Grid (Core Capabilities) */}
            <section className="relative z-10 py-32 px-6 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-blue-500 font-bold tracking-[0.3em] text-[10px] mb-6 block uppercase">Capability</span>
                        <h2 className="text-5xl font-['Outfit'] font-bold tracking-tighter">Everything you need to <span className="text-white/40">win the deal.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap size={120} />
                            </div>
                            <h3 className="text-2xl font-['Outfit'] font-bold mb-4">Precision Engineering</h3>
                            <p className="text-slate-400 max-w-sm font-light">단순 생성을 넘어 실제 비즈니스 로직이 담긴 정교한 결과물을 제공합니다. 모든 버튼 하나, 텍스트 한 줄에 근거가 있습니다.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-end">
                            <h3 className="text-xl font-['Outfit'] font-bold mb-2">Real-time Data</h3>
                            <p className="text-sm text-slate-500 font-light">최신 시장 트렌드와 경쟁사 데이터를 즉시 반영합니다.</p>
                        </div>
                        <div className="bg-blue-600 rounded-[2.5rem] p-10 flex flex-col justify-between group cursor-pointer overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Wand2 className="text-white" size={32} />
                            <div>
                                <h3 className="text-xl font-['Outfit'] font-bold text-white mb-2">Creon Engine®</h3>
                                <p className="text-blue-100 text-sm font-light">Sketchon만의 독자적인 AI 디자인 추론 엔진.</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="grid grid-cols-2 h-full items-center">
                                <div>
                                    <h3 className="text-2xl font-['Outfit'] font-bold mb-4">Design System First</h3>
                                    <p className="text-slate-400 font-light">임의의 디자인이 아닌, 확장 가능한 디자인 시스템 가이드라인을 함께 생성합니다.</p>
                                </div>
                                <div className="flex justify-end pr-10">
                                    <div className="w-32 h-32 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                                        <div className="w-16 h-16 bg-white/10 rounded-xl rotate-45" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 8: Interactive Demo (Simplified Visual) */}
            <section className="relative z-10 py-32 px-6 bg-black overflow-hidden">
                <div className="max-w-6xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-1 overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)]">
                    <div className="bg-black/40 rounded-[2.8rem] p-12 md:p-20 text-center relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                        <h2 className="text-4xl md:text-6xl font-['Outfit'] font-bold mb-8 tracking-tighter">Experience the <span className="text-blue-500">Speed.</span></h2>
                        <p className="text-slate-400 mb-12 max-w-2xl mx-auto font-light text-lg">기존에 며칠이 걸리던 리서치와 시안 제작 작업을 단 몇 분 만에 끝내세요. <br />팀의 생산성이 10배 이상 향상됩니다.</p>
                        <div className="relative aspect-video max-w-4xl mx-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                <Play fill="currentColor" size={32} />
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sketchon Engine v2.0</div>
                                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">04:15 - Logic Sync</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 9: Testimonials */}
            <section className="relative z-10 py-32 px-6 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: '김태우', role: 'Global Tech Lead at V', text: '지금까지 사용해본 AI 도구 중 가장 논리적입니다. 단순한 생성물이 아니라 비즈니스 맥락을 정확히 꿰뚫고 있어요.' },
                            { name: 'Sarah Chen', role: 'Senior Product Designer at F', text: 'The bridge between logic and visualization is finally here. Sketchon saved our team 40+ hours on the last pitch.' },
                            { name: '이현우', role: 'Strategy Director at A', text: '제안서 작성이 즐거워진 건 처음입니다. 분석 데이터의 깊이가 놀라울 정도로 정교합니다.' }
                        ].map((t, i) => (
                            <div key={i} className="p-10 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.07] transition-colors">
                                <div className="text-blue-500 mb-6">
                                    {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
                                </div>
                                <p className="text-white text-lg mb-8 font-light italic leading-relaxed">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-white">{t.name}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 10: Final Showcase (Gallery) */}
            <section className="relative z-10 py-32 px-6 bg-black">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-['Outfit'] font-bold mb-20 tracking-tighter">Crafted with <span className="text-white/30">Sketchon.</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-[3/4] bg-white/5 border border-white/5 rounded-2xl overflow-hidden group">
                                <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent group-hover:scale-105 transition-transform duration-700" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section: Feature Summary / Capability (Bento) */}
            <section className="relative z-10 py-32 px-6 bg-black">
                {/* ... existing bento code ... */}
            </section>

            {/* Section: Problem (Chaos to Clarity) - Now after features to explain WHY they matter */}
            <Section className="z-10 min-h-screen overflow-hidden">
                <div className="max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <span className="text-blue-500 font-bold tracking-[0.3em] text-[10px] mb-10 block uppercase">The Old Workflow</span>
                        <h2 className="text-6xl md:text-8xl font-['Outfit'] font-bold mb-12 tracking-tighter leading-[0.9] relative">
                            {/* Chaos background text */}
                            <span className="absolute inset-x-0 top-0 blur-3xl opacity-20 pointer-events-none select-none text-slate-500">
                                72 hours of manual research. Zero logic. Blank canvas anxiety. Overwhelmed. Slow. Messy.
                            </span>
                            <span className="relative text-white/90">
                                빈 화면 앞에서 지치는 <br />
                                <span className="text-white/30">무의미한 삽질의 시간들.</span>
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
                            기획부터 장표 한 장까지 어지러운 데이터 속에서 길을 잃지 마세요. <br />
                            <span className="text-white font-medium">Chaos</span>에서 <span className="text-blue-500 font-medium">Clarity</span>로의 전환이 시작됩니다.
                        </p>
                    </motion.div>
                </div>
            </Section>

            {/* Section: Final CTA */}
            <section className="relative z-10 py-40 px-6 bg-black">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-6xl md:text-8xl font-['Outfit'] font-bold mb-12 tracking-tighter leading-tight">Start building <br /> the future.</h2>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button className="h-16 px-12 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(59,130,246,0.5)]">Get Started Today</button>
                            <button className="h-16 px-12 rounded-full bg-white/10 text-white font-bold text-lg border border-white/20 hover:bg-white/20 transition-all">Book a Demo</button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-20 border-t border-white/10 bg-black mt-20 z-10">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h3 className="text-3xl font-['Outfit'] font-bold mb-6 text-white">Ready to Build?</h3>
                    <p className="text-slate-400 mb-8">지금 바로 Sketchon과 함께 제안의 퀄리티를 높여보세요.</p>
                    <Button size="lg" className="rounded-full h-12 px-10 bg-white text-black hover:scale-105 transition-transform hover:bg-slate-200">
                        Start Free Trial
                    </Button>
                    <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500">
                        <a href="#" className="hover:text-slate-300">Terms</a>
                        <a href="#" className="hover:text-slate-300">Privacy</a>
                        <a href="#" className="hover:text-slate-300">Contact</a>
                    </div>
                </div>
            </footer>

            <RefinementModal
                isOpen={refinementModalOpen}
                onClose={() => setRefinementModalOpen(false)}
                initialData={refinementData}
                userPrompt={prompt}
                onConfirm={handleRefinementConfirm}
            />
        </div>
    );
};

// --- Auth Protection ---
const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useContext(UserContext);
    const location = useLocation();

    if (!isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

// --- Admin Login Component ---
const AdminLogin = () => {
    const { loginAdmin, isAdmin } = useContext(UserContext);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/admin";

    useEffect(() => {
        if (isAdmin) navigate(from, { replace: true });
    }, [isAdmin]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loginAdmin(formData.email, formData.password)) {
            navigate(from, { replace: true });
        } else {
            setError('Invalid email or password.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl"
            >
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 font-['Outfit']">Admin Portal</h1>
                    <p className="text-slate-500 mt-2 font-medium">Please enter your credentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                        <input
                            required
                            type="email"
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input
                            required
                            type="password"
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

                    <Button type="submit" className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-base mt-4 shadow-lg shadow-slate-200">
                        Log In
                    </Button>
                </form>

                <div className="mt-8 pt-8 border-t text-center">
                    <Link to="/" className="text-slate-400 hover:text-slate-600 text-sm font-medium">← Back to Site</Link>
                </div>
            </motion.div>
        </div>
    );
};

// --- Admin Component ---
const AdminLayout = () => {
    const location = useLocation();
    const { logoutAdmin } = useContext(UserContext);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-8 flex-shrink-0">
                <div className="text-2xl font-bold font-['Outfit'] px-2">Sketchon Admin</div>
                <nav className="flex flex-col gap-1">
                    {[
                        { icon: Home, label: 'Dashboard', path: '/admin' },
                        { icon: Users, label: 'Users', path: '/admin/users' },
                        { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
                        { icon: Settings, label: 'API Settings', path: '/admin/settings' },
                    ].map((item) => {
                        const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-auto space-y-4">
                    <button
                        onClick={logoutAdmin}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium text-sm"
                    >
                        <RefreshCw size={18} className="rotate-180" />
                        Log Out
                    </button>
                    <div className="pt-6 border-t border-slate-800">
                        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-2">
                            <ArrowRight size={14} className="rotate-180" />
                            Exit Admin
                        </Link>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="relative w-96">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 h-10 text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-50 relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </Button>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-slate-900">Wonhee Cho</div>
                                <div className="text-[10px] text-slate-500">Super Admin</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Wonhee" alt="Avatar" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 overflow-y-auto">
                    <Routes>
                        <Route index element={
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                                    <p className="text-slate-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Users', value: '1,284', change: '+12.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'Growth Rate', value: '24.2%', change: '+5.4%', icon: BarChart, color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { label: 'Active Projects', value: '452', change: '+18.1%', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        { label: 'Pending RFPs', value: '18', change: '-2.4%', icon: Cpu, color: 'text-green-600', bg: 'bg-green-50' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}><stat.icon size={20} /></div>
                                                <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-slate-400'} px-2 py-1 rounded-md`}>
                                                    {stat.change}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                                            <div className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-lg font-bold text-slate-900">Recent User Activity</h2>
                                            <Link to="/admin/users"><Button variant="link" className="text-blue-600 text-sm">View all users</Button></Link>
                                        </div>
                                        <UserManagement showHeader={false} limit={3} />
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h2 className="text-lg font-bold text-slate-900 mb-6">System Status</h2>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Auth Service', status: 'Healthy', color: 'bg-green-500' },
                                                { label: 'AI Engine', status: 'Busy', color: 'bg-amber-500' },
                                                { label: 'Database', status: 'Healthy', color: 'bg-green-500' },
                                                { label: 'CDN', status: 'Healthy', color: 'bg-green-500' },
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                                    <span className="text-sm font-medium text-slate-600">{s.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">{s.status}</span>
                                                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        } />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="settings" element={<ApiSettings />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (
        <UserProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/generate" element={<GeneratorPage />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/*" element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </UserProvider>
    );
}
