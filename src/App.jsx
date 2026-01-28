import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUp, ChevronDown, Wand2, Layers, Cpu, Users, BarChart, Settings, Home, Search, Bell, X, CheckCircle2, Zap, RefreshCw, Smartphone, Monitor } from 'lucide-react';
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
const SCROLL_HEIGHT = 4000; // Total scroll height for the experience

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
        const jitter = radius * 0.15;
        const noiseX = (Math.random() - 0.5) * jitter;
        const noiseY = (Math.random() - 0.5) * jitter;
        const noiseZ = (Math.random() - 0.5) * jitter;

        points.push({ x: x + noiseX, y: y + noiseY, z: z + noiseZ });
    }
    return points;
};

// --- Components ---


const ParticleEngine = () => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const targets = useRef({
        phase0: [], // Dual Ring
        phase1: [], // Research Layer
        phase2: [], // Design Layer
        phase3: [], // PPT Layer
        background: []
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        let frame;

        const initTargets = (w, h) => {
            const cx = w / 2;
            const cy = h / 2;
            const bgCount = 1000;
            const activeCount = 10000;

            targets.current.background = Array.from({ length: bgCount }).map(() => ({
                x: randomRange(0, w),
                y: randomRange(0, h),
                z: randomRange(-800, 200)
            }));

            const ringRadius = h * 0.25;
            const tubeRadius = h * 0.05;
            const ring1 = generateTorus(ringRadius, tubeRadius, activeCount / 2);
            const ring2 = generateTorus(ringRadius, tubeRadius, activeCount / 2);
            targets.current.phase0 = [...ring1, ...ring2].map((p, i) => ({
                x: cx + p.x,
                y: cy + p.y,
                z: p.z,
                ringIndex: i < (activeCount / 2) ? 0 : 1,
                color: { r: 255, g: 255, b: 255 }
            }));

            // Feature Showcase 2.0: 3D Layers (Tilted Rhomboids)
            const layerW = w * 0.45;
            const layerH = h * 0.35;
            const rightX = w * 0.7;
            const gap = 350; // Increased gap for clear separation

            const makeLayer = (zCenter, baseColor) => Array.from({ length: Math.floor(activeCount / 3) }).map(() => {
                const rx = randomRange(-layerW / 2, layerW / 2);
                const ry = randomRange(-layerH / 2, layerH / 2);
                const tilt = -0.6; // Slightly more tilt
                return {
                    x: rightX + rx + (ry * tilt),
                    y: cy + ry + (rx * tilt * 0.5),
                    z: zCenter + randomRange(-10, 10),
                    color: baseColor
                };
            });

            targets.current.phase1 = makeLayer(gap, { r: 100, g: 140, b: 255 }); // Research (Blue)
            targets.current.phase2 = makeLayer(0, { r: 180, g: 110, b: 255 });   // Design (Purple)
            targets.current.phase3 = makeLayer(-gap, { r: 110, g: 255, b: 180 }); // PPT (Green)
        };

        const initParticles = (w, h) => {
            particles.current = Array.from({ length: PARTICLE_COUNT }).map(() => ({
                x: randomRange(-w, w * 2),
                y: randomRange(-h, h * 2),
                z: randomRange(-2000, 2000),
                vx: 0, vy: 0, vz: 0,
                color: { r: 255, g: 255, b: 255 },
                size: randomRange(0.6, 1.2)
            }));
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
            // High-fidelity background clear
            ctx.fillStyle = '#101010';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scroll = window.scrollY;
            const vh = window.innerHeight;
            const time = Date.now() * 0.001;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // --- Draw "Framer Aura" (Ambient Glow behind focused layer) ---
            if (scroll >= vh * 1.0) {
                let activeColor = 'rgba(100, 150, 255, 0.15)'; // Blue
                if (scroll > vh * 3.0) activeColor = 'rgba(120, 255, 180, 0.15)'; // Green
                else if (scroll > vh * 2.0) activeColor = 'rgba(180, 120, 255, 0.15)'; // Purple

                const gradient = ctx.createRadialGradient(
                    canvas.width * 0.7, cy, 0,
                    canvas.width * 0.7, cy, 500
                );
                gradient.addColorStop(0, activeColor);
                gradient.addColorStop(1, 'rgba(16, 16, 16, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            let lerpFactor = 0.04;
            const bgCount = targets.current.background?.length || 0;
            const activeCount = particles.current.length - bgCount;

            particles.current.forEach((p, i) => {
                let target;
                let layerIndex = -1; // -1: bg/logo, 0: Research, 1: Design, 2: PPT

                if (i < bgCount) {
                    target = targets.current.background[i];
                    p.x += Math.sin(time + i) * 0.05;
                    p.y += Math.cos(time + i) * 0.05;
                } else {
                    const relativeIdx = i - bgCount;
                    // Divide active particles into 3 layers
                    layerIndex = Math.floor((relativeIdx / activeCount) * 3);

                    if (scroll < vh * 0.8) {
                        // Hero Logo Phase
                        target = targets.current.phase0[relativeIdx % targets.current.phase0.length];
                        lerpFactor = 0.04;
                    } else {
                        // Showcase Phase: Particles move to their specific layer
                        const layers = [targets.current.phase1, targets.current.phase2, targets.current.phase3];
                        const layerTargets = layers[layerIndex];
                        target = layerTargets[relativeIdx % layerTargets.length];
                        lerpFactor = 0.07;
                    }
                }

                let tx = target.x;
                let ty = target.y;
                let tz = target.z;

                // --- Hero Logo Rotation ---
                if (scroll < vh * 0.8 && layerIndex !== -1) {
                    const lx = tx - cx;
                    const ly = ty - cy;
                    const lz = tz;

                    // New Rotation Logic (Orthogonal)
                    // Request: One ring Left-Right (Y-axis), One ring Top-Bottom (X-axis). Same Speed.
                    const speed = 0.5; // Constant speed
                    const angle = time * speed;

                    if (target.ringIndex === 0) {
                        // Ring 0: Left-Right (Y-axis Rotation)
                        const cosY = Math.cos(angle);
                        const sinY = Math.sin(angle);

                        // Rotate around Y
                        // x' = x*cos - z*sin
                        // z' = x*sin + z*cos
                        tx = cx + (lx * cosY - lz * sinY);
                        ty = cy + ly;
                        tz = lx * sinY + lz * cosY;
                    } else {
                        // Ring 1: Top-Bottom (X-axis Rotation)
                        const cosX = Math.cos(angle);
                        const sinX = Math.sin(angle);

                        // Rotate around X
                        // y' = y*cos - z*sin
                        // z' = y*sin + z*cos
                        tx = cx + lx;
                        ty = cy + (ly * cosX - lz * sinX);
                        tz = ly * sinX + lz * cosX;
                    }

                    // Add subtle floating to the whole group
                    ty += Math.sin(time * 0.5) * 5;

                    // Add some internal flow (spinning the tube pattern)
                    // We can't easily rotate the 'texture' without UVs, but the noise in generation helps.
                }

                // --- Showcase Focus Logic ---
                let colorMultiplier = 1;
                if (scroll >= vh * 1.0 && layerIndex !== -1) {
                    // Determine which step is currently active (0, 1, or 2)
                    let activeStep = 0;
                    if (scroll > vh * 3.0) activeStep = 2;
                    else if (scroll > vh * 2.0) activeStep = 1;

                    if (layerIndex === activeStep) {
                        // Magnetic Breathing: Subtle Z oscillation
                        const breathe = Math.sin(time * 2 + i * 0.1) * 20;
                        tz -= (250 + breathe); // Pull active layer forward significantly
                        colorMultiplier = 1.6; // Make it significantly brighter
                    } else {
                        tz += 150; // Push inactive layers back further
                        colorMultiplier = 0.3; // Dim them more
                    }
                }

                p.x += (tx - p.x) * lerpFactor;
                p.y += (ty - p.y) * lerpFactor;
                p.z += (tz - p.z) * lerpFactor;

                if (target.color) {
                    p.color.r += (target.color.r * colorMultiplier - p.color.r) * 0.05;
                    p.color.g += (target.color.g * colorMultiplier - p.color.g) * 0.05;
                    p.color.b += (target.color.b * colorMultiplier - p.color.b) * 0.05;
                }

                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                const dsq = dx * dx + dy * dy;
                if (dsq < 22500) {
                    const d = Math.sqrt(dsq);
                    p.x += (dx / d) * 2;
                    p.y += (dy / d) * 2;
                }

                const perspective = 1000;
                let scale = perspective / (perspective + p.z);
                scale = Math.min(scale, 1.3);
                let opacity = Math.min(1, scale * 0.9);

                if (scroll > vh * 0.5 && scroll < vh * 1.0) {
                    const prog = (scroll - vh * 0.5) / (vh * 0.5);
                    opacity *= (1 - prog);
                } else if (scroll >= vh * 1.0) {
                    opacity = Math.min(1, scale * 1.25);
                }

                if (scale > 0 && opacity > 0) {
                    ctx.fillStyle = `rgba(${Math.floor(p.color.r)}, ${Math.floor(p.color.g)}, ${Math.floor(p.color.b)}, ${opacity})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
                    ctx.fill();
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
    const { scrollY } = useScroll();
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
        <div className="relative w-full text-white font-['Inter'] bg-[#000000] selection:bg-[#0070ff]/40">
            <ParticleEngine scrollYProgress={scrollY} />
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 text-xs font-medium text-white mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0070ff]"></span>
                        </span>
                        Introducing Sketchon AI 2.0
                    </motion.div>

                    {/* Main Title - Framer Style: "Build better Ideas, faster" - ALL WHITE */}
                    <h1 className="text-6xl md:text-[100px] font-['Outfit'] font-medium tracking-[-0.05em] mb-12 leading-[0.95] text-center text-white">
                        Build better <br />
                        ideas, faster
                    </h1>

                    {/* Prompt Input Area - Polished to match reference image */}
                    <form onSubmit={handlePromptSubmit} className="relative w-full max-w-xl mx-auto mb-10 group px-4">
                        {/* Outer Glow - very subtle */}
                        <div className="absolute -inset-1 bg-white/5 rounded-[24px] opacity-10 blur-xl group-hover:opacity-20 transition duration-700"></div>

                        <div className="relative flex flex-col bg-black/80 border border-white/10 rounded-[22px] p-4 shadow-2xl transition-all group-focus-within:border-white/20 min-h-[140px]">
                            <textarea
                                placeholder="Create a landing page for..."
                                className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/30 text-[16px] font-medium resize-none leading-relaxed flex-1 mb-2 scrollbar-none"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />

                            <div className="flex items-end justify-between mt-auto">
                                {/* Platform Selector - Moved Inside */}
                                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('mobile')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${platform === 'mobile' ? 'bg-[#0070ff] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Smartphone size={12} /> App
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('web')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${platform === 'web' ? 'bg-[#0070ff] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Monitor size={12} /> Web
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isAnalyzing}
                                    className="bg-white text-black hover:bg-blue-500 hover:text-white rounded-full p-2.5 transition-all duration-300 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Tags below Prompt Bar - Optimized for Gemini UI Generation */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        {['Glassmorphic Fintech Dashboard', 'Apple-style Product Landing', 'Dark SaaS Platform UI', 'Luxury Fashion Interface'].map(tag => (
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
                    className="absolute bottom-10 opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <div className="flex flex-col items-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
                        Scroll to explore
                        <ChevronDown size={16} />
                    </div>
                </motion.div>
            </Section>

            {/* Feature Showcase 2.0: Interactive Scroll Journey */}
            <div className="relative">
                {/* Feature 1: Analyze */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-12 max-w-7xl w-full items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="pl-12"
                        >
                            <span className="text-blue-500 font-bold tracking-widest text-[11px] mb-6 block">Step 01. Analyze</span>
                            <h2 className="text-[80px] font-['Outfit'] font-bold mb-8 tracking-tighter text-white leading-[0.9]">
                                Market <br /> <span className="text-white/30">Analysis</span>
                            </h2>
                            <p className="text-base text-slate-400 leading-relaxed max-w-md font-light">
                                RFP와 시장을 분석하여 <span className="text-white/60">논리적 근거</span>를 만드는 단계입니다.
                                AI가 실시간 데이터를 스캔하여 타겟 오디언스와 경쟁력을 초단위로 추출합니다.
                            </p>
                        </motion.div>
                        <div className="hidden md:block" />
                    </div>
                </Section>

                {/* Feature 2: Visualize */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-12 max-w-7xl w-full items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="pl-12"
                        >
                            <span className="text-purple-500 font-bold tracking-widest text-[11px] mb-6 block">Step 02. Visualize</span>
                            <h2 className="text-[80px] font-['Outfit'] font-bold mb-8 tracking-tighter text-white leading-[0.9]">
                                Idea <br /> <span className="text-white/30">Synthesis</span>
                            </h2>
                            <p className="text-base text-slate-400 leading-relaxed max-w-md font-light">
                                Creon 엔진으로 아이디어를 <span className="text-white/60">눈에 보이는 실체</span>로 바꾸는 단계입니다.
                                분석된 통찰력을 바탕으로 브랜드 정체성이 담긴 고해상도 UI 프로토타입을 직관적으로 생성합니다.
                            </p>
                        </motion.div>
                        <div className="hidden md:block" />
                    </div>
                </Section>

                {/* Feature 3: Deliver */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-12 max-w-7xl w-full items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="pl-12"
                        >
                            <span className="text-green-500 font-bold tracking-widest text-[11px] mb-6 block">Step 03. Deliver</span>
                            <h2 className="text-[80px] font-['Outfit'] font-bold mb-8 tracking-tighter text-white leading-[0.9]">
                                Proactive <br /> <span className="text-white/30">Packaging</span>
                            </h2>
                            <p className="text-base text-slate-400 leading-relaxed max-w-md font-light">
                                분석과 시안을 엮어 <span className="text-white/60">최종 제안서</span>로 완성하는 단계입니다.
                                결과물을 즉시 사용 가능한 프로페셔널한 PPT/PDF 덱으로 자동 변환하여 설득력을 극대화합니다.
                            </p>
                        </motion.div>
                        <div className="hidden md:block" />
                    </div>
                </Section>
            </div>

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
