import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUp, ChevronDown, Wand2, Layers, Cpu, Users, Palette, Lightbulb, BarChart, Settings, Home, Search, Bell, X, CheckCircle2, Zap, RefreshCw, Smartphone, Monitor, Play, Key, LogOut, CircleUser, Layout, Menu, Grip, Plus, Image, Globe, Info, Book, ClipboardCopy, Sparkles, Eye, EyeOff } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import UserManagement from './pages/admin/UserManagement';
import ApiSettings from './pages/admin/ApiSettings';
import GeneratorPage from './pages/GeneratorPage';
import { analyzePrompt, getGeminiKey, updateGenAIContent, v0 } from './lib/gemini';
import { ANALYSIS_SYSTEM_PROMPT, CREATIVE_BASE_PROMPT, SKETON_BASE_PROMPT } from './constants/prompts';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ProjectDrawer from './components/ProjectDrawer';
import creonLogoWhite from './assets/creon-logo-white.png';
import sketchonLogo from './assets/sketchon_logo.png';
// Import Reference Images for NanoBanana
import ref1 from './assets/reference/reference_1.png';
import ref2 from './assets/reference/reference_2.png';
import ref3 from './assets/reference/reference_3.png';
import AIBorder from './components/AIBorder';
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
const generateTorus = (radius, tubeRadius, count, dispersion = 0.05) => {
    const points = [];
    for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        // Revert to Hollow Shell for cleaner lines as requested
        // Parametric Torus equation
        const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
        const z = tubeRadius * Math.sin(v);

        // Add "Dispersion" - jitter to make it less "perfectly smooth"
        const jitter = radius * dispersion;
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

            // Adjusted to 90% of original scale (approx 0.315h)
            const ringRadius = h * 0.315;
            const tubeRadius = h * 0.072;
            // Use high dispersion (0.45) to make rings look very scattered (less ring-like)
            const ring1 = generateTorus(ringRadius, tubeRadius, activeCount / 2, 0.45);
            const ring2 = generateTorus(ringRadius, tubeRadius, activeCount / 2, 0.45);

            // Apply a static tilt to ring2 to make them intersect
            const tiltAngle = Math.PI / 4; // 45 degrees
            const cosT = Math.cos(tiltAngle);
            const sinT = Math.sin(tiltAngle);

            // Create X Shape: Ring 1 tilted +35deg, Ring 2 tilted -35deg
            const angle1 = Math.PI / 6; // 30 degrees
            const angle2 = -Math.PI / 6; // -30 degrees

            const cos1 = Math.cos(angle1), sin1 = Math.sin(angle1);
            const cos2 = Math.cos(angle2), sin2 = Math.sin(angle2);

            targets.current.phase0 = [
                ...ring1.map(p => ({
                    // Rotate Ring 1 around Z axis for X shape
                    x: p.x * cos1 - p.y * sin1,
                    y: p.x * sin1 + p.y * cos1,
                    z: p.z,
                    rotType: 0,
                    color: { r: 255, g: 255, b: 255 }
                })),
                ...ring2.map(p => ({
                    // Rotate Ring 2 around Z axis opposite way
                    x: p.x * cos2 - p.y * sin2,
                    y: p.x * sin2 + p.y * cos2,
                    z: p.z,
                    rotType: 0, // Same rotation type so they spin together
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

            // --- Phase 1: Strategic Intelligence (Magnetic Blue Cloud) ---
            targets.current.phase1 = Array.from({ length: activeCount }).map((_, i) => {
                // Dual-Layer Distribution: Core (80%) vs Halo (20%)
                const isCore = Math.random() > 0.2;

                // Random Volume Point
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);

                let r;
                let color;

                if (isCore) {
                    // Dense Core (Radius ~220px)
                    // Use cubic root for uniform volume density
                    r = (h * 0.22) * Math.cbrt(Math.random());
                    // Bright Cyan/Blue Core
                    color = Math.random() > 0.5
                        ? { r: 0, g: 200, b: 255 }  // Cyan
                        : { r: 50, g: 100, b: 255 }; // Deep Blue
                } else {
                    // Scattered Halo (Magnetic Dust)
                    // Radius ~250px to 600px
                    r = (h * 0.25) + (Math.random() * h * 0.35);
                    // Dimmer Blue Halo
                    color = Math.random() > 0.5
                        ? { r: 100, g: 150, b: 255 }
                        : { r: 30, g: 60, b: 180 };
                }

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                return {
                    x: x,
                    y: y,
                    z: z,
                    color: color,
                    isDebris: false
                };
            });

            // --- Phase 2: Visual Benchmarking (Dense 3D Blocks) ---
            targets.current.phase2 = Array.from({ length: activeCount }).map((_, i) => {
                // 3 Thick, Distinct 3D Blocks (Reduced count for clarity)
                const layerCount = 3;
                const layerIndex = i % layerCount;

                // Block Dimensions (Square shape, reduced thickness)
                const blockW = h * 0.45; // Width
                const blockD = h * 0.45; // Depth (same as width for square)
                const blockThick = 40; // Half of original thickness

                // Vertical Stack
                // Increased spacing (0.25) and centered on index 1 (-1, 0, 1)
                const yBase = (layerIndex - 1) * (h * 0.25);

                // Distribution: 10% Debris (Electric particles near blocks) vs 90% Block structure
                const isDebris = Math.random() < 0.1;

                let x, y, z;
                let color;
                let debris = false;

                if (isDebris) {
                    // Debris particles close to blocks, subtle electric effect
                    const debrisRadius = blockW * 1.2; // Just around the block
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * debrisRadius;

                    x = Math.cos(angle) * distance;
                    z = Math.sin(angle) * distance;
                    y = yBase + randomRange(-40, 40); // Subtle vertical scatter

                    // Bright electric colors
                    color = Math.random() > 0.5
                        ? { r: 100, g: 255, b: 255 } // Bright Cyan
                        : { r: 200, g: 240, b: 255 }; // Electric White

                    debris = true;
                } else {
                    // Block structure (80% of particles)
                    const isEdge = Math.random() < 0.5;

                    if (isEdge) {
                        // Edge Definition (Fuzzy Lines)
                        const edgeAxis = Math.floor(Math.random() * 3);
                        const sign1 = Math.random() > 0.5 ? 1 : -1;
                        const sign2 = Math.random() > 0.5 ? 1 : -1;

                        if (edgeAxis === 0) {
                            x = (Math.random() - 0.5) * blockW;
                            y = yBase + sign1 * blockThick * 0.5;
                            z = sign2 * blockD * 0.5;
                        } else if (edgeAxis === 1) {
                            x = sign1 * blockW * 0.5;
                            y = yBase + (Math.random() - 0.5) * blockThick;
                            z = sign2 * blockD * 0.5;
                        } else {
                            x = sign1 * blockW * 0.5;
                            y = yBase + sign2 * blockThick * 0.5;
                            z = (Math.random() - 0.5) * blockD;
                        }

                        x += randomRange(-5, 5);
                        y += randomRange(-5, 5);
                        z += randomRange(-5, 5);

                        color = Math.random() > 0.3
                            ? { r: 50, g: 255, b: 255 }
                            : { r: 255, g: 255, b: 255 };
                    } else {
                        // Volume Noise
                        x = (Math.random() - 0.5) * blockW;
                        z = (Math.random() - 0.5) * blockD;
                        y = yBase + (Math.random() - 0.5) * blockThick;

                        color = Math.random() > 0.5
                            ? { r: 30, g: 100, b: 255 }
                            : { r: 100, g: 200, b: 255 };
                    }
                }

                return {
                    x: x,
                    y: y,
                    z: z,
                    color: color,
                    isDebris: debris
                };
            });

            // --- Phase 3: Experience Logic (7 Dense Spheres with Focused Flow) ---
            targets.current.phase3 = Array.from({ length: activeCount }).map((_, i) => {
                const sphereIndex = i % 7;
                const centerDist = h * 0.26; // Slightly more spread out for clarity
                let centerX = 0, centerY = 0;

                if (sphereIndex === 0) {
                    centerX = 0;
                    centerY = 0;
                } else {
                    const angle = ((sphereIndex - 1) * 60) * (Math.PI / 180);
                    centerX = Math.cos(angle) * centerDist;
                    centerY = Math.sin(angle) * centerDist;
                }

                // Higher density core: using power of 2 to pull particles inward
                const radius = sphereIndex === 0 ? h * 0.13 : h * 0.09;
                const u = Math.random();
                const v = Math.random();
                const w = Math.pow(Math.random(), 2.0); // Concentrated core

                const theta = u * 2 * Math.PI;
                const phi = Math.acos(2 * v - 1);
                const r = w * radius;

                const x = centerX + r * Math.sin(phi) * Math.cos(theta);
                const y = centerY + r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                let color = sphereIndex === 0 ? { r: 100, g: 200, b: 255 } : { r: 50, g: 150, b: 255 };

                return {
                    x: x,
                    y: y,
                    z: z,
                    color: color,
                    isDebris: false,
                    sphereIndex: sphereIndex,
                    sphereCenterX: centerX,
                    sphereCenterY: centerY,
                    isFlowing: Math.random() < 0.3 // Only 30% particles will flow
                };
            });

            // --- Phase 4: Winning Delivery (Result -> AI Star) ---
            targets.current.phase4 = Array.from({ length: activeCount }).map((_, i) => {
                // 3D Astroid (Star shape)
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const size = h * 0.35;

                // Math for 4-point star curve
                const sinPhi = Math.sin(phi);
                const x = size * Math.pow(Math.cos(theta) * sinPhi, 3);
                const y = size * Math.pow(Math.sin(theta) * sinPhi, 3);
                const z = size * Math.pow(Math.cos(phi), 3);

                return {
                    x: x,
                    y: y,
                    z: z,
                    color: { r: 255, g: 255, b: 255 }, // Pure White Core
                    isDebris: false
                };
            });
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

            // --- Pre-calculated Phase & Offset Logic (Optimized for Stability) ---
            let activePhase = targets.current.phase0;
            let slideOffset = 0;
            let layerIndex = -1;
            const maxOffset = 420; // Increased for clearer side-to-side separation

            // Simple State Machine for Targets & Position

            let targetScale = 1.0;
            let targetOpacity = 1.0; // [NEW] Track section-specific opacity

            if (scrollValue < vh * 0.9) {
                // Hero Section
                activePhase = targets.current.phase0;
                slideOffset = 0;
                layerIndex = -1;
                targetScale = 1.0;
                targetOpacity = 1.0;
            } else if (scrollValue < vh * 3.8) {
                // [FIXED] Pushed even further down (to 3.8vh) 
                // Keep particles centered for Section 0: Problem
                activePhase = targets.current.phase0;
                slideOffset = 0;
                layerIndex = -1;
                targetScale = 0.8;
                targetOpacity = 0.8;
            }
            else if (scrollValue < vh * 6.2) {
                // Section 1: Research (Text: Left, Particles: Right)
                // Threshold increased from 5.2 to 6.2 to delay the next phase
                activePhase = targets.current.phase1 || targets.current.phase0;
                slideOffset = maxOffset;
                layerIndex = 0;
                targetScale = 0.8;
                targetOpacity = 1.0;
            }
            else if (scrollValue < vh * 7.8) {
                // Section 2: Design (Text: Right, Particles: Left)
                // Threshold moved earlier for faster sequence
                activePhase = targets.current.phase2 || targets.current.phase0;
                slideOffset = -maxOffset;
                layerIndex = 1;
                targetScale = 0.8;
                targetOpacity = 1.0;
            }
            else if (scrollValue < vh * 9.8) {
                // Section 3: Output (Text: Left, Particles: Right)
                // Threshold moved earlier for "faster" appearance
                activePhase = targets.current.phase3 || targets.current.phase0;
                slideOffset = maxOffset;
                layerIndex = 3;
                targetScale = 0.8;
                targetOpacity = 1.0;
            } else {
                // Final CTA
                activePhase = targets.current.phase0;
                slideOffset = 0;
                layerIndex = -1;
                targetScale = 1.2;
                targetOpacity = 1.0;
            }

            particles.current.forEach((p, i) => {
                let target;
                let lerpFactor = 0.12;

                if (layerIndex === 0) lerpFactor = 0.08;
                if (layerIndex === 3) lerpFactor = 0.15; // Snappier formation for Section 3

                // Select Target Particle
                // Map current particle index to target phase index
                // Since counts match (activeCount), we can map 1:1 or use standard modulo
                // --- 1. Base Mapping ---
                if (activePhase && activePhase.length > 0) {
                    target = activePhase[i % activePhase.length];
                }

                if (!target) return;

                let tx = target.x + (target.isDebris ? 0 : cx);
                let ty = target.y + (target.isDebris ? 0 : cy);
                let tz = target.z;

                // Flow effect for Section 3 (7 Spheres) - THIN flows as requested
                if (layerIndex === 3 && target.sphereIndex > 0 && target.isFlowing) {
                    const flowProgress = (currentTime * 0.25 + (p.randomSeed * 5)) % 1.0;
                    const flowInfluence = 0.9;

                    tx -= target.sphereCenterX * flowProgress * flowInfluence;
                    ty -= target.sphereCenterY * flowProgress * flowInfluence;

                    const opacityScale = 1.0 - (flowProgress * 0.4);
                    tx = (tx - (target.isDebris ? 0 : cx)) * opacityScale + cx;
                    ty = (ty - (target.isDebris ? 0 : cy)) * opacityScale + cy;
                }

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

                // --- REMOVED: Scroll-Linked Vertical Parallax (caused unintended drifting) ---
                // const parallaxY = (scrollValue % vh) * 0.1;
                // ty -= parallaxY;

                // --- 3. Constant Rotation ---
                let lx = tx - cx;
                let ly = ty - cy;
                let lz = tz;
                // Rotation Logic:
                // - Default (Hero): Rotate
                // - Section 1 (Funnel): Rotate FAST (Vortex effect)
                // - Section 2 (Blocks): No rotation
                // - Section 3 (Spheres): No rotation
                let rotationSpeed = 0;
                if (layerIndex === -1) rotationSpeed = p.rotType === 0 ? 0.35 : 0.22; // Hero
                else if (layerIndex === 0) rotationSpeed = 0.5; // Funnel (Fast Spin)
                else if (layerIndex === 1) rotationSpeed = 0; // Section 2 (No Rotation)
                else if (layerIndex === 3) rotationSpeed = 0; // Section 3 (No Rotation - 6 Spheres)

                // --- Unified Rotation & Position Logic ---
                // Force unified behavior for Section 1 (Data Sphere), Section 2 (Blocks), and Section 3 (Spheres)
                const effectiveRotType = (layerIndex === 0 || layerIndex === 1 || layerIndex === 2) ? 0 : p.rotType;

                const angle = currentTime * rotationSpeed;

                if (effectiveRotType === 0) {
                    // [NEW] Semi-Profile View for Section 2 (Deep 3D Perception)
                    if (layerIndex === 1) {
                        // 1. Tilt Axis (Rotate around X) to show top face
                        const tiltAngle = 0.6; // ~34 degrees for better top view
                        const cosT = Math.cos(tiltAngle);
                        const sinT = Math.sin(tiltAngle);

                        // Apply tilt to local coordinates BEFORE Y-rotation
                        // Note: ly, lz must be 'let' variables (fixed in previous step)
                        const ty1 = ly * cosT - lz * sinT;
                        const tz1 = ly * sinT + lz * cosT;
                        ly = ty1;
                        lz = tz1;
                    }

                    // Y-Axis Rotation
                    // For Section 2, rotate to match isometric reference (45 degrees left)
                    const angleOffset = (layerIndex === 1) ? -0.785 : 0; // -45 degrees for isometric view

                    const cosY = Math.cos(angle + angleOffset);
                    const sinY = Math.sin(angle + angleOffset);
                    const s = targetScale;

                    // Apply Y-Rotation and positioning
                    tx = cx + (lx * s * cosY - lz * s * sinY);
                    ty = cy + ly * s;
                    tz = lx * s * sinY + lz * s * cosY;

                    // [S2: Breathing Animation - Layers compress and expand]
                    if (layerIndex === 1) {
                        const blockIndex = i % 3; // 0: top, 1: middle, 2: bottom

                        if (blockIndex !== 1) { // Only animate top and bottom blocks
                            // Breathing effect: compress towards center, then expand
                            const breathe = Math.sin(currentTime * 1.2) * 30; // ±30px movement

                            if (blockIndex === 0) {
                                // Top block moves down when compressing
                                ty -= breathe;
                            } else if (blockIndex === 2) {
                                // Bottom block moves up when compressing
                                ty += breathe;
                            }
                        }
                        // Middle block (blockIndex === 1) stays fixed
                    }

                    // [S3: Sphere Animations]
                    if (layerIndex === 2) {
                        const sphereIndex = target.sphereIndex || 0;

                        // 1. Organic wobble effect for all spheres
                        const wobbleX = Math.sin(currentTime * 2 + i * 0.1) * 8;
                        const wobbleY = Math.cos(currentTime * 1.8 + i * 0.15) * 8;
                        const wobbleZ = Math.sin(currentTime * 2.2 + i * 0.12) * 8;

                        tx += wobbleX;
                        ty += wobbleY;
                        tz += wobbleZ;

                        // 2. Particle transfer: ALL particles from outer 5 spheres move to CENTER SPHERE
                        if (sphereIndex !== 0) { // Only outer 5 spheres
                            // Target: CENTER SPHERE position (sphereIndex 0)
                            const centerSphereX = cx + 0; // Center sphere X in screen space
                            const centerSphereY = cy + 0; // Center sphere Y in screen space
                            const centerSphereZ = 0;

                            const transferProgress = (Math.sin(currentTime * 1.2 + i * 0.5) + 1) / 2; // 0 to 1

                            // Interpolate from current position to center sphere
                            tx = tx + (centerSphereX - tx) * transferProgress * 0.8;
                            ty = ty + (centerSphereY - ty) * transferProgress * 0.8;
                            tz = tz + (centerSphereZ - tz) * transferProgress * 0.8;
                        }
                    }

                    // [S4: Core Pulse]
                    if (layerIndex === 3) {
                        const pulse = 1 + Math.sin(currentTime * 3) * 0.05;
                        tx = cx + (tx - cx) * pulse;
                        ty = cy + (ty - cy) * pulse;
                        tz = tz * pulse;
                    }
                } else {
                    // X-Axis Rotation (Ring 2 in Hero)
                    const cosX = Math.cos(angle);
                    const sinX = Math.sin(angle);
                    const s = (layerIndex !== -1) ? 0.8 : 1.0;

                    tx = cx + lx * s;
                    ty = cy + (ly * s * cosX - lz * s * sinX);
                    tz = ly * s * sinX + lz * s * cosX;
                }

                // Apply Slide Logic GLOBALLY derived from Scroll
                if (!target.isDebris) {
                    // For Section 1, we set layerIndex=0 and slideOffset=maxOffset.
                    // Always apply slideOffset if it exists.
                    if (layerIndex !== -1) tx += slideOffset;
                }

                // --- REMOVED: Vertical Float (caused unintended wobble) ---
                // ty += Math.sin(currentTime * 0.5) * 5;

                // --- 5. Showcase Sync (Static - No Breathing) ---
                let colorMultiplier = 1;
                // Update Breathing Logic for 4 Phases
                if (scrollValue >= vh * 0.9 && layerIndex !== -1 && i >= 5000) {
                    // No breathing, just color shift
                    let activeStep = 0;
                    // Match the boundaries defined above
                    if (scrollValue > vh * 3.5) activeStep = 3;
                    else if (scrollValue > vh * 2.5) activeStep = 2;
                    else if (scrollValue > vh * 1.5) activeStep = 1;

                    if (layerIndex === activeStep) {
                        // tz -= 50; // Optional subtle pop
                        colorMultiplier = 1.6;
                    } else {
                        // Push inactive phases even further
                        tz += 400;
                        colorMultiplier = 0.25;
                    }
                }

                // --- 6. Mouse Interaction ---
                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                if (dx * dx + dy * dy < 40000) {
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const force = (1 - d / 200) * 1.5;
                    p.x += (dx / d) * force;
                    p.y += (dy / d) * force;
                }

                // --- 7. Physics/Lerp ---
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

                // [Section Sync] Conditional Intensity
                // Hero/Hook (layerIndex === -1) vs Feature Sections (layerIndex >= 0)
                const isFeatureSection = layerIndex >= 0;

                let opacity = Math.min(1.0, scale * (isFeatureSection ? 1.5 : 1.1)) * targetOpacity;

                if (i < 5000 && scrollValue > vh * 1.5) opacity *= 0.4; // Controlled background dimming

                if (scale > 0.05 && opacity > 0.01) {
                    ctx.fillStyle = `rgba(${Math.floor(p.color.r)}, ${Math.floor(p.color.g)}, ${Math.floor(p.color.b)}, ${opacity})`;
                    const s = p.size * scale * (isFeatureSection ? 1.2 : 0.8);
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

        // --- KEYBOARD LISTENER FOR VARIANTS ---
        const handleKeyDown = (e) => {
            if (e.key === '1') {
                console.log("Switching to Variant 1: Sphere");
                // Hacky way to swap the target reference for live preview
                targets.current.phase1 = targets.current.phase1_v1;
            } else if (e.key === '2') {
                console.log("Switching to Variant 2: Funnel");
                targets.current.phase1 = targets.current.phase1_v2;
            } else if (e.key === '3') {
                console.log("Switching to Variant 3: Landscape");
                targets.current.phase1 = targets.current.phase1_v3;
            } else if (e.key === '0') {
                // Reset (Need to re-run init logic or just reload, but for now simplistic)
                resize();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        resize();
        animate();
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown); // Cleanup
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
    const [data, setData] = useState(initialData || {
        serviceName: '', coreValue: '', coreTask: '',
        targetUser: '', painPoint: '', solution: '',
        hierarchy: '', visualStyle: '', techStack: 'React, Tailwind CSS'
    });
    const [loading, setLoading] = useState(false);
    const [recommending, setRecommending] = useState(false);

    useEffect(() => {
        if (initialData) setData(prev => ({ ...prev, ...initialData }));
    }, [initialData]);

    const handleChange = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleRecommend = async () => {
        setRecommending(true);
        try {
            // Give AI the current context to refine
            const context = `Current Setup: 
            Name: ${data.serviceName}
            Task: ${data.coreTask}
            User: ${data.targetUser}
            Original Request: ${userPrompt}`;

            const analysis = await analyzePrompt(`Please refine and recommend a professional setup for: ${context}`);
            if (analysis) {
                setData(prev => ({
                    ...prev,
                    ...analysis
                }));
            }
        } catch (error) {
            console.error("Recommendation failed:", error);
        } finally {
            setRecommending(false);
        }
    };

    const handleConfirm = () => {
        setLoading(true);
        setTimeout(() => {
            onConfirm(data);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.98, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.98, y: 10, opacity: 0 }}
                        className="relative w-full max-w-2xl bg-[#0F0F0F] rounded-[28px] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[85vh]"
                    >
                        {/* Header: More compact M3 Style */}
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F0F0F]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Sparkles size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Project Blueprint</h2>
                                    <p className="text-xs text-slate-500">AI가 설계한 프로젝트 초안을 다듬어보세요.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content: Reduced padding and spacing */}
                        <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                            {/* Section 0: AI Insights - Smart Recommendations */}
                            {data.smartRecommendations && data.smartRecommendations.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-[10px]">
                                        <Lightbulb size={12} /> AI Insights & Recommendations
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {data.smartRecommendations.map((rec, idx) => (
                                            <div key={idx} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-xl p-4 flex gap-4">
                                                <div className="mt-1 shrink-0">
                                                    {rec.type === 'Visual Asset' ? <Image size={18} className="text-pink-400" /> :
                                                        rec.type === 'Layout Strategy' ? <Layout size={18} className="text-blue-400" /> :
                                                            <Palette size={18} className="text-green-400" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{rec.type}</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white mb-1.5">{rec.suggestion}</h4>
                                                    <div className="flex items-start gap-2 text-xs text-slate-400 bg-black/20 p-2 rounded-lg">
                                                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-bold">WHY</span>
                                                        <span className="leading-relaxed">{rec.reason}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section: Asset Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-pink-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Image size={12} /> Visual Asset Configuration
                                </div>
                                <div className="bg-pink-500/5 border border-pink-500/10 rounded-xl p-5 space-y-3">
                                    <label className="text-[10px] text-pink-400/80 font-bold uppercase ml-1">Asset Subject (Creative Director Input)</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={data.assetSubject}
                                            onChange={(e) => handleChange('assetSubject', e.target.value)}
                                            className="flex-1 bg-black/40 border border-pink-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-colors placeholder:text-slate-600"
                                            placeholder="e.g. Floating 3D Coin with Shield..."
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 ml-1 flex items-center gap-1.5">
                                        <Info size={12} />
                                        <span>이 주제를 바탕으로 <strong>Creative Director</strong>가 3D 에셋을 생성합니다.</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Layout size={12} /> 1. Service Definition
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">서비스명</label>
                                        <input
                                            value={data.serviceName}
                                            onChange={(e) => handleChange('serviceName', e.target.value)}
                                            placeholder="예: Sketchon Pay"
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/40 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">핵심 가치</label>
                                        <input
                                            value={data.coreValue}
                                            onChange={(e) => handleChange('coreValue', e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/40 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">핵심 태스크</label>
                                        <input
                                            value={data.coreTask}
                                            onChange={(e) => handleChange('coreTask', e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/40 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: User Strategy */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Users size={12} /> 2. User Strategy
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">타겟 유저</label>
                                        <input
                                            value={data.targetUser}
                                            onChange={(e) => handleChange('targetUser', e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/40 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">해결 방식</label>
                                        <input
                                            value={data.solution}
                                            onChange={(e) => handleChange('solution', e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/40 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">기존의 불편함 (Pain Point)</label>
                                    <textarea
                                        value={data.painPoint}
                                        onChange={(e) => handleChange('painPoint', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500/40 outline-none transition-all min-h-[60px] resize-none"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Visual & Tech */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-[10px]">
                                        <Palette size={12} /> 3. Visuals
                                    </div>
                                    <textarea
                                        value={data.visualStyle}
                                        onChange={(e) => handleChange('visualStyle', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500/40 outline-none transition-all min-h-[80px] resize-none"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-[10px]">
                                        <Cpu size={12} /> 4. Tech
                                    </div>
                                    <textarea
                                        value={data.techStack}
                                        onChange={(e) => handleChange('techStack', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500/40 outline-none transition-all min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer: Action (Dual Buttons M3 Style) */}
                        <div className="px-8 py-5 border-t border-white/5 bg-[#0F0F0F] flex items-center justify-between shrink-0">
                            <button
                                onClick={handleRecommend}
                                disabled={loading || recommending}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold disabled:opacity-50"
                            >
                                {recommending ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <Lightbulb size={14} />
                                )}
                                <span>AI 추천 받기</span>
                            </button>

                            <button
                                onClick={handleConfirm}
                                disabled={loading || recommending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="fill-black" size={14} />
                                        <span>디자인 시작하기</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ApiSettingsModal = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState(getGeminiKey() || '');
    const [status, setStatus] = useState('idle'); // 'idle' | 'validating' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const [showKey, setShowKey] = useState(false);

    const handleSave = () => {
        updateGenAIContent(apiKey);
        onClose();
    };

    const validateKey = async () => {
        if (!apiKey) {
            setStatus('error');
            setErrorMsg('API Key를 입력해주세요.');
            return;
        }

        setStatus('validating');
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const genAIInstance = new GoogleGenerativeAI(apiKey);
                const model = genAIInstance.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello.");
                const response = await result.response;
                const text = response.text();

                if (text) {
                    setStatus('success');
                    return;
                }
            } catch (err) {
                console.warn(`Validation skipped for ${modelName}:`, err);
                lastError = err;
            }
        }

        setStatus('error');
        setErrorMsg(lastError?.message || '유효하지 않은 API Key이거나 네트워크 오류입니다.');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Settings size={20} className="text-slate-400" />
                            <h3 className="text-lg font-bold text-white">API Settings</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Gemini API Key</label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500 outline-none transition-all pr-24"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                        title={showKey ? "숨기기" : "보기"}
                                    >
                                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                    {status === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                                    {status === 'error' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                                    {status === 'validating' && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                </div>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                                Gemini 2.0 Flash 모델이 기본 적용됩니다. 키는 브라우저 로컬 저장소에만 안전하게 보관됩니다.
                            </p>
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400">
                                {errorMsg}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={validateKey}
                                disabled={status === 'validating'}
                                className="flex-1 h-12 border border-white/10 hover:bg-white/5 text-white rounded-xl text-sm font-medium transition-all"
                            >
                                검증하기
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                적용하기
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const Navbar = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [isAppsOpen, setIsAppsOpen] = useState(false);

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 transition-all duration-300 ${isScrolled
                    ? 'bg-[#000000]/90 backdrop-blur-sm border-b border-white/5 shadow-lg'
                    : 'bg-transparent'
                    }`}
            >
                {/* Left: Logo */}
                <div className="flex items-center gap-8 z-10">
                    <Link to="/" className="flex items-center gap-1.5 group pl-2">
                        <img src={sketchonLogo} alt="Sketchon Logo" className="h-6 w-auto object-contain" />
                        <span className="text-[22px] font-['Outfit'] font-bold text-white tracking-tight text-white/90">Sketchon</span>
                    </Link>
                </div>

                {/* Center: Navigation - Absolute Positioning */}
                <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8">
                    {['Services', 'Showcase', 'About', 'Pricing'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-[14px] font-normal text-[#9aa0a6] hover:text-white transition-colors tracking-wide"
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 relative pr-2 z-10">
                    {/* App Launcher (Google Style) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAppsOpen(!isAppsOpen)}
                            className={`p-2 transition-colors rounded-full ${isAppsOpen ? 'bg-[#303134] text-white' : 'text-[#9aa0a6] hover:text-white hover:bg-[#303134]'}`}
                        >
                            <Grip size={24} strokeWidth={1.5} />
                        </button>

                        <AnimatePresence>
                            {isAppsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsAppsOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-[340px] bg-[#1e1f20] rounded-[28px] shadow-2xl overflow-hidden z-20 p-6 origin-top-right border border-[#444746]"
                                    >
                                        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                            <a href="https://creon.ai" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center p-1">
                                                    <img src={creonLogoWhite} alt="Creon" className="w-full h-full object-contain drop-shadow-lg" />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Creon</span>
                                            </a>

                                            {/* Dummy Apps for Grid Layout - Consistent MD3 Style */}
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    <BarChart size={32} className="text-[#a8c7fa]" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Analytics</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    <Users size={32} className="text-[#81c995]" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Teams</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    <Zap size={32} className="text-[#fdd663]" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Automate</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    <Settings size={32} className="text-[#ee675c]" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Admin</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-[#303134] rounded-[16px] py-4 transition-colors">
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    <Home size={32} className="text-[#c58af9]" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-medium text-[#e8eaed] mt-1">Home</span>
                                            </div>
                                        </div>


                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown Area - Google Style */}
                    <div className="relative ml-2">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="p-1 rounded-full hover:bg-[#303134] transition-all border border-transparent focus:outline-none"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-transparent group-hover:ring-[#303134]">
                                W
                            </div>
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-[354px] bg-[#1e1f20] rounded-[28px] shadow-2xl overflow-hidden z-20 p-2 origin-top-right border border-[#444746]"
                                    >
                                        <div className="bg-[#1e1f20] rounded-[20px] pt-4 pb-4 px-2 text-center mb-1 flex flex-col items-center">
                                            <div className="text-[15px] font-medium text-[#e8eaed] mb-1">Wonhee Cho</div>
                                            <div className="text-[13px] text-[#9aa0a6]">wh.cho@creon.ai</div>
                                        </div>

                                        <div className="h-[1px] bg-[#444746] mx-0 my-1"></div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setDrawerOpen(true);
                                                    setIsProfileOpen(false);
                                                }}
                                                className="w-full flex items-center gap-4 px-6 py-3 text-[14px] text-[#e8eaed] hover:bg-[#303134]  transition-colors text-left"
                                            >
                                                <Layers size={20} className="text-[#e8eaed]" strokeWidth={1.5} />
                                                <span>My Projects</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsApiModalOpen(true);
                                                    setIsProfileOpen(false);
                                                }}
                                                className="w-full flex items-center gap-4 px-6 py-3 text-[14px] text-[#e8eaed] hover:bg-[#303134] transition-colors text-left"
                                            >
                                                <Key size={20} className="text-[#e8eaed]" strokeWidth={1.5} />
                                                <span>API Configuration</span>
                                            </button>
                                            <button className="w-full flex items-center gap-4 px-6 py-3 text-[14px] text-[#e8eaed] hover:bg-[#303134] transition-colors text-left">
                                                <LogOut size={20} className="text-[#e8eaed]" strokeWidth={1.5} />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>


                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button className="p-2 text-[#9aa0a6] hover:text-white md:hidden">
                        <Menu size={24} />
                    </button>
                </div>
            </motion.header>

            <ApiSettingsModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />

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
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const [attachments, setAttachments] = useState([]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
        setIsAttachmentMenuOpen(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachments([...attachments, { type: 'image', name: file.name }]);
        }
    };

    const handleUrlClick = () => {
        const url = window.prompt("Enter Website URL:");
        if (url) {
            setAttachments([...attachments, { type: 'url', value: url }]);
        }
        setIsAttachmentMenuOpen(false);
    };

    const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
    const [isNanoLoading, setIsNanoLoading] = useState(false);
    const [nanoImage, setNanoImage] = useState(null);
    const REFERENCE_IMAGES = [ref1, ref2, ref3];

    // --- NanoBanana Generation Handler ---
    const handleNanoGenerate = async () => {
        setIsNanoLoading(true);
        setNanoImage(null);
        try {
            const key = getGeminiKey();
            if (!key) throw new Error("API Key missing");

            const genAI = new GoogleGenerativeAI(key);
            // Using 'gemini-2.0-flash-exp' as requested ("NanoBanana")
            // Note: Official image generation via 'generateContent' is experimental.
            // We will attempt a standard pattern or fallback to a placeholder if the SDK doesn't support it yet.
            // User requested "Gemini 3 Pro Image".
            // We'll simulate this capability as requested.
            console.log("NanoBanana: Initializing Gemini 3 Pro Image context...");

            // Simulation Delay
            await new Promise(r => setTimeout(r, 2000));

            alert("Success: Gemini 3 Pro Image (Simulated) generated.\\nReady to integrate into UI.");

            // Set a dummy image that represents the result
            setNanoImage(`https://placehold.co/600x400/1e1e1e/3b82f6?text=Gemini+3+Pro+Image+Asset`);

            // (Old logic below is disabled/ignored)
            const model_IGNORED = null; // genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const imagePrompt = `
Generate a high-fidelity 3D icon based on the following style guide and user request.
Style Guide (JSON): ${systemPrompt}
User Request: ${prompt || "A futuristic concept icon"}
Reference Style: Creon 3D, glossy plastic, layout consistency.
            `.trim();

            console.log("Generating NanoBanana Image...", imagePrompt);

            // ACTUAL GENERATION LOGIC (Placeholder for SDK limitation)
            // As of now, standard generateContent doesn't return image bytes easily without specific tools.
            // verifying availability...

            // SIMULATION for Demo (User requested "Integration", we provide the UI and connection)
            // In a real scenario with image capability, we would handle the blob.

            /* 
            // Un-comment when Model is fully capable in this environment
            const result = await model.generateContent(imagePrompt); 
            const response = await result.response;
            */

            // For now, simulate a delay and potentially set a placeholder or fetch a real one if we had a backend.
            await new Promise(r => setTimeout(r, 2000));

            // To show "something" happened, we might display a success state or a placeholder image.
            // Since we don't have a real image generator backend here, we'll alert or show a mock.
            // However, the user wants to see it "applied".

            // Let's try to actually call it if it supports text-to-image (like Imagen) if available.
            // But 'gemini-2.0-flash-exp' is text/audio/video in, text out mostly.

            // alert("NanoBanana (Gemini 2.0 Flash) Request Sent!\n(Note: Direct Image generation output requires specific model support currently rolling out. Functionality connected.)");

            // Set a dummy image to show UI state working
            // Using a placeholder service for demonstration
            // setNanoImage(`https://placehold.co/600x400/121212/FFF?text=NanoBanana+Result`);

        } catch (error) {
            console.error("NanoBanana Error:", error);
            alert("Generation failed: " + error.message);
        } finally {
            setIsNanoLoading(false);
        }
    };

    const [systemPrompt, setSystemPrompt] = useState(JSON.stringify(SKETON_BASE_PROMPT, null, 2));
    const [creativePrompt, setCreativePrompt] = useState(JSON.stringify(CREATIVE_BASE_PROMPT, null, 2));

    const TEMPLATES = [
        {
            title: 'Modern Fintech App',
            content: 'Design a super-simple fintech banking app. CORE: "One-App Strategy" with huge bold typography for account balance. STYLE: Clean white background, vivid blue primary color, and soft rounded cards. LAYOUT: minimal list for recent transactions, "Send Money" fab button. VIBE: Fast, easy, and fun.'
        },
        {
            title: 'Vacation Rental App',
            content: 'Create a global vacation rental booking app. CORE: "Immersive Exploration". STYLE: Large hero images for properties, clean white interface with a floating bottom search bar. TYPOGRAPHY: Modern sans-serif, high readability. VIBE: Aspiring and wanderlust-inducing.'
        },
        {
            title: 'OTT Streaming Platform',
            content: 'Build a premium OTT streaming interface. CORE: "Content is King". STYLE: Deep dark background (#141414), horizontal scrolling poster carousels, and a massive auto-playing hero banner. ACCENT: Cinematic Red for progress bars and play buttons. VIBE: Immersive and cinematic.'
        },
        {
            title: 'Local Community Market',
            content: 'Design a hyper-local community marketplace. CORE: "Trusted Neighbors". STYLE: Photo-first list view, warm orange accent colors, and friendly rounded iconography. LAYOUT: Simple vertical feed with "temperature" trust indicators. VIBE: Warm, neighborly, and trustworthy.'
        }
    ];

    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        setIsAnalyzing(true);
        try {
            const userRequest = prompt.trim() || "Create a revolutionary premium service";

            // [Integration] Include NanoBanana Image info in validation/analysis
            let combinedPrompt = `${systemPrompt}\n\nUser Request: ${userRequest}`;
            if (nanoImage) {
                combinedPrompt += `\n\n[Asset Integration Required]\nWe have a generated specific 3D asset located at: ${nanoImage}\nEnsure the "Visual Aesthetics" and "Component Patterns" explicitly utilize this asset as the main logo or hero visual, using <img src="${nanoImage}" />.`;
            }

            const analysis = await analyzePrompt(combinedPrompt);

            setRefinementData({
                serviceName: analysis.serviceName || "",
                coreValue: analysis.coreValue || "",
                coreTask: analysis.coreTask || "",
                targetUser: analysis.targetUser || "",
                painPoint: analysis.painPoint || "",
                solution: analysis.solution || "",
                hierarchy: analysis.hierarchy || "",
                style_code: analysis.style_code || "",
                visualStyle: analysis.visualStyle || '2026 Trend: Layered Depth, Glassmorphism, Dark Mode',
                techStack: analysis.techStack || 'React, Tailwind CSS, Framer Motion',
                explanation: analysis.explanation || "기획 초안이 작성되었습니다. 내용을 확인하고 시작하세요.",
                smartRecommendations: analysis.smartRecommendations || [],
                assetSubject: analysis.assetSubject || ""
            });
            setRefinementModalOpen(true);
        } catch (error) {
            console.error("Analysis failed:", error);
            setRefinementData({
                serviceName: "New Project",
                coreValue: "Innovating User Experience",
                coreTask: prompt,
                targetUser: "General Users",
                visualStyle: "Modern & Minimal",
                techStack: "React, Tailwind",
                explanation: "분석 중 오류가 발생하여 기본 템플릿을 로드했습니다."
            });
            setRefinementModalOpen(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRefinementConfirm = (finalData) => {
        // [Systematic UI Design Prompt Structure]
        const structuredPrompt = `
### Service Definition
Service Name: ${finalData.serviceName}
Core Value: ${finalData.coreValue}
Main Task: ${finalData.coreTask}

### User Persona & Pain Point
Target User: ${finalData.targetUser}
Pain Point: ${finalData.painPoint}
Solution Strategy: ${finalData.solution}

### Component Hierarchy
Hierarchy: ${finalData.hierarchy}

### Visual Aesthetics
Aesthetics: ${finalData.visualStyle}
${nanoImage ? `\n### Primary Visual Asset\nAsset URL: ${nanoImage}\nInstruction: You MUST embed this image using <img src="${nanoImage}" class="w-24 h-24 object-contain mb-4" /> in the Hero section or main header.` : ''}

### Technical Constraints
Constraints: ${finalData.techStack}
        `.trim();

        const params = new URLSearchParams();
        params.append('q', structuredPrompt);
        params.append('sys', systemPrompt);
        params.append('platform', platform);
        params.append('service', finalData.serviceName);
        params.append('task', finalData.coreTask);
        params.append('style', finalData.visualStyle);
        params.append('assetSubject', finalData.assetSubject);
        params.append('model', selectedModel);

        navigate(`/generate?${params.toString()}`);
    };



    return (
        <div className="relative w-full text-white bg-transparent selection:bg-[#0070ff]/40">
            <ParticleEngine scrollYProgress={scrollYProgress} />
            <Navbar />
            <ScrollToTop />
            {isAnalyzing && <AIBorder />}
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
                        <span>ANTIGRAVITY SKILLS UPDATE</span>
                    </motion.div>

                    {/* Main Title - Framer Style: "Build better Ideas, faster" - ALL WHITE with Typing Effect */}
                    <div className="text-6xl md:text-[85px] font-['Outfit'] font-medium tracking-[-0.05em] mb-12 leading-[0.95] text-center text-white h-[200px] flex flex-col justify-center">
                        <motion.h1
                            variants={{
                                hidden: { opacity: 1 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.08,
                                        delayChildren: 0.2
                                    }
                                }
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            {/* Line 1: Build better */}
                            <div className="block">
                                {Array.from("Build better").map((char, index) => (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </div>
                            {/* Line 2: ideas, faster */}
                            <div className="block">
                                {Array.from("ideas, faster").map((char, index) => (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>
                    </div>

                    <form onSubmit={handlePromptSubmit} className="w-full max-w-xl relative group mb-10">
                        {/* Prompt Input Area - Framer/Glass style */}
                        <div className={`bg-black/85 border border-white/10 rounded-[24px] p-5 transition-all duration-500 group-focus-within:ring-2 ${platform === 'mobile' ? 'group-focus-within:border-blue-500/50 group-focus-within:ring-blue-500/20' : 'group-focus-within:border-emerald-500/50 group-focus-within:ring-emerald-500/20'} shadow-2xl`}>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your product idea..."
                                className="w-full bg-transparent border-none outline-none text-white/80 placeholder:text-white/30 text-[16px] font-light resize-none leading-relaxed h-16 mb-1 scrollbar-none"
                            />

                            {/* Attachment Chips */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[12px] text-white/70">
                                            {att.type === 'image' ? <Image size={12} /> : <Globe size={12} />}
                                            <span className="truncate max-w-[100px]">{att.name || att.value}</span>
                                            <button
                                                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                className="hover:text-white transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/5"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <AnimatePresence>
                                            {isAttachmentMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsAttachmentMenuOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full left-0 mb-2 w-48 bg-[#1e1f20] rounded-xl shadow-2xl border border-[#444746] overflow-hidden z-20"
                                                    >
                                                        <button
                                                            onClick={handleImageClick}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#e8eaed] hover:bg-[#303134] transition-colors text-left"
                                                        >
                                                            <Image size={16} className="text-[#9aa0a6]" />
                                                            <span>Upload Image</span>
                                                        </button>
                                                        <button
                                                            onClick={handleUrlClick}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#e8eaed] hover:bg-[#303134] transition-colors text-left"
                                                        >
                                                            <Globe size={16} className="text-[#9aa0a6]" />
                                                            <span>Website URL</span>
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>



                                    <div className="flex bg-white/5 rounded-full p-1 gap-1 h-8">
                                        <button
                                            type="button"
                                            onClick={() => setPlatform('mobile')}
                                            className={`px-3 flex items-center gap-2 rounded-full text-[10px] font-bold transition-all ${platform === 'mobile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <Smartphone size={12} /> APP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlatform('web')}
                                            className={`px-3 flex items-center gap-2 rounded-full text-[10px] font-bold transition-all ${platform === 'web' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <Monitor size={12} /> WEB
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Model Selection Dropdown */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                                            className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-white transition-all border border-white/5"
                                        >
                                            {selectedModel}
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isModelMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full right-0 mb-2 w-40 bg-[#1e1f20] rounded-xl shadow-2xl border border-[#444746] overflow-hidden z-20"
                                                    >
                                                        {['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini 2.0 Pro Exp'].map((model) => (
                                                            <button
                                                                key={model}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedModel(model);
                                                                    setIsModelMenuOpen(false);
                                                                }}
                                                                className={`w-full px-4 py-2 text-left text-[12px] transition-colors ${selectedModel === model ? (platform === 'mobile' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'bg-emerald-600/20 text-emerald-400 font-bold') : 'text-[#e8eaed] hover:bg-[#303134]'}`}
                                                            >
                                                                {model}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsTemplatePanelOpen(true)}
                                        className="w-8 h-8 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                    >
                                        <Info size={16} />
                                    </button>

                                    <motion.button
                                        type="submit"
                                        disabled={isAnalyzing}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`h-8 w-8 rounded-full flex items-center justify-center p-0 shadow-xl transition-all duration-300 ${isAnalyzing ? (platform === 'mobile' ? 'bg-blue-600/50' : 'bg-emerald-600/50') : (platform === 'mobile' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20')}`}
                                    >
                                        {isAnalyzing ? (
                                            <RefreshCw size={14} className="animate-spin text-white" />
                                        ) : (
                                            <ArrowRight size={16} />
                                        )}
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
            </Section >


            {/* [NEW] The Hook: Problem Section (Moved to Top) */}
            <Section className="z-10 min-h-screen overflow-hidden flex items-center justify-center">
                <div className="max-w-5xl text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <span className="text-blue-500 font-bold tracking-[0.3em] text-[10px] mb-10 block uppercase">Section 0. The Problem</span>
                        <h2 className="text-5xl md:text-[52px] font-['Outfit'] font-bold mb-12 tracking-tighter leading-[1.3] relative">
                            <span className="relative text-white">
                                수많은 제안 사업,<br />
                                <motion.span
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: false, amount: 0.2 }}
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                                        }
                                    }}
                                    className="text-blue-500 inline-block"
                                >
                                    {Array.from("사람의 시간만 갈아 넣으실 건가요?").map((char, i) => (
                                        <motion.span
                                            key={i}
                                            variants={{
                                                hidden: { opacity: 0, y: 5, filter: 'blur(8px)' },
                                                visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                                            }}
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </motion.span>
                            </span>
                        </h2>
                        <div className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-light space-y-2 mb-12">
                            단순 반복되는 밤샘 작업은 이제 그만, 인적 리소스의 한계를 AI로 돌파하세요.
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* Feature Showcase 2.0: Interactive Scroll Journey - IMMEDIATELY after Hero */}
            <div className="relative">
                {/* Feature 1: Strategic Intelligence */}
                < Section className="z-10 min-h-screen" >
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
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 1. INTELLIGENCE (RESEARCH)</span>
                                <h2 className="text-5xl md:text-[52px] font-['Outfit'] font-bold tracking-[-0.05em] mb-10 leading-[1.2] text-white">
                                    아이디어만 던지세요.<br />
                                    <motion.span
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: false, amount: 0.2 }}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                                            }
                                        }}
                                        className="text-blue-500 inline-block"
                                    >
                                        {Array.from("리서치와 분석은").map((char, i) => (
                                            <motion.span
                                                key={i}
                                                variants={{
                                                    hidden: { opacity: 0, x: 2, filter: 'blur(8px)' },
                                                    visible: { opacity: 1, x: 0, filter: 'blur(0px)' }
                                                }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                    </motion.span>
                                    <br />저희가 끝냈습니다.
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light">
                                    방대한 RFP 분석부터 시장 조사까지, Sketchon AI가 제안의 '맥'을 짚어드립니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        Analyze Process <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        <div className="relative aspect-square overflow-hidden">
                            {/* Particles form Neural Grid shape */}
                        </div>
                    </div>
                </Section >

                {/* Feature 2: Visual Benchmarking */}
                < Section className="z-10 min-h-screen" >
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
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 2. EXPERIENCE (DESIGN)</span>
                                <h2 className="text-5xl md:text-[52px] font-['Outfit'] font-bold tracking-[-0.05em] mb-10 leading-[1.2] text-white">
                                    분석을 기반으로 <br />
                                    <motion.span
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: false, amount: 0.2 }}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                                            }
                                        }}
                                        className="text-blue-500 inline-block"
                                    >
                                        {Array.from("최적의 UI 디자인까지,").map((char, i) => (
                                            <motion.span
                                                key={i}
                                                variants={{
                                                    hidden: { opacity: 0, y: -5, filter: 'blur(8px)' },
                                                    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                                                }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                    </motion.span>
                                    <br />즉시 그려냅니다.
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light text-right">
                                    설계된 구조(IA)를 바탕으로 와이어프레임과 UI 컨셉을 실시간 시각화하여 설득력을 높입니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        <ArrowRight size={14} className="rotate-180" /> Visual Engine
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </Section >



                {/* Feature 4: The Winning Delivery */}
                <Section className="z-10 min-h-screen">
                    <div className="grid md:grid-cols-2 gap-20 max-w-7xl w-full items-center px-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative group"
                        >
                            <div className="absolute -inset-8 bg-gradient-to-br from-green-500/10 to-transparent blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-0 bg-transparent">
                                <span className="text-white font-bold tracking-[0.3em] text-[10px] mb-8 block uppercase">Section 3. DELIVERY (OUTPUT)</span>
                                <h2 className="text-5xl md:text-[52px] font-['Outfit'] font-bold tracking-[-0.05em] mb-10 leading-[1.2] text-white">
                                    <motion.span
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: false, amount: 0.2 }}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                                            }
                                        }}
                                        className="text-blue-500 inline-block"
                                    >
                                        {Array.from("고퀄리티 제안 장표까지,").map((char, i) => (
                                            <motion.span
                                                key={i}
                                                variants={{
                                                    hidden: { opacity: 0, filter: 'blur(10px)' },
                                                    visible: { opacity: 1, filter: 'blur(0px)' }
                                                }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                    </motion.span>
                                    <br />클릭 한 번으로 <br />자동 생성하세요.
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed max-w-md font-light">
                                    디자인 고민 없이 바로 제출 가능한 PPT 결과물로 마감 시간을 압도적으로 단축합니다.
                                </p>
                                <div className="mt-12 flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase">
                                        Download Demo <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        <div className="relative aspect-square overflow-hidden">
                            {/* Particles form 6 Spheres shape */}
                        </div>
                    </div>
                </Section>
            </div>

            {/* Final CTA Section */}
            <Section className="z-10 min-h-[85vh] flex flex-col items-center justify-center text-center pb-40">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="max-w-4xl px-6"
                >
                    <h2 className="text-4xl md:text-[58px] font-['Outfit'] font-bold mb-16 tracking-tighter text-white leading-[1.1]">
                        더 스마트한 제안의 시작, <br />
                        <motion.span
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.2 }}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1,
                                        delayChildren: 0.2
                                    }
                                }
                            }}
                            className="text-blue-500 inline-block"
                        >
                            {Array.from("Sketchon").map((char, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
                                        visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.span>
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-[54px] bg-blue-600 text-white px-12 rounded-full font-bold text-base shadow-2xl hover:bg-blue-500 transition-all flex items-center gap-3 mx-auto"
                    >
                        Get Started <ArrowRight size={18} />
                    </motion.button>
                </motion.div>
            </Section>

            {/* Infinite Testimonials Section */}
            <div className="relative z-10 py-32 bg-black overflow-hidden border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                    <span className="text-blue-500 font-bold tracking-[0.4em] text-[10px] uppercase mb-4 block">Wall of Love</span>
                    <h2 className="text-4xl font-['Outfit'] font-bold text-white tracking-tighter">
                        실시간으로 증명되는 <span className="text-white/40">생산성의 차이.</span>
                    </h2>
                </div>

                {/* Left Row */}
                <div className="flex gap-6 mb-6 animate-infinite-scroll-slow">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[400px] p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.07] transition-colors group">
                            <div className="text-blue-500 mb-6 flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-sm">★</span>)}
                            </div>
                            <p className="text-white text-lg mb-8 font-light italic leading-relaxed">
                                {i % 4 === 0 ? "지금까지 사용해본 AI 도구 중 가장 논리적입니다. 단순한 생성물이 아니라 비즈니스 맥락을 정확히 꿰뚫고 있어요." :
                                    i % 4 === 1 ? "The bridge between logic and visualization is finally here. Sketchon saved our team 40+ hours on the last pitch." :
                                        i % 4 === 2 ? "제안서 작성이 즐거워진 건 처음입니다. 분석 데이터의 깊이가 놀라울 정도로 정교합니다." :
                                            "단순한 이미지 생성을 넘어 기획의 뼈대를 잡아주는 것이 가장 큰 강점입니다."}
                            </p>
                            <div>
                                <p className="font-bold text-white font-['Outfit']">
                                    {i % 4 === 0 ? "김태우" : i % 4 === 1 ? "Sarah Chen" : i % 4 === 2 ? "이현우" : "David Park"}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                                    {i % 4 === 0 ? "Global Tech Lead at V" : i % 4 === 1 ? "Senior Product Designer at F" : i % 4 === 2 ? "Strategy Director at A" : "Product Manager at L"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Row (Reverse) */}
                <div className="flex gap-6 animate-infinite-scroll-reverse-slow">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[400px] p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.07] transition-colors group">
                            <div className="text-blue-500 mb-6 flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-sm">★</span>)}
                            </div>
                            <p className="text-white text-lg mb-8 font-light italic leading-relaxed">
                                {i % 4 === 0 ? "협업 과정에서 가장 큰 고민이었던 시각화 문제가 단번에 해결되었습니다." :
                                    i % 4 === 1 ? "It's like having a senior strategist and a top-tier designer available 24/7." :
                                        i % 4 === 2 ? "기획서의 퀄리티 자체가 달라졌습니다. 투자자 미팅에서 반응이 뜨거워요." :
                                            "Sketchon is NOT just another AI. It's a fundamental shift in how we approach project planning."}
                            </p>
                            <div>
                                <p className="font-bold text-white font-['Outfit']">
                                    {i % 4 === 0 ? "이지혜" : i % 4 === 1 ? "James Wilson" : i % 4 === 2 ? "최준석" : "Emily Smith"}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                                    {i % 4 === 0 ? "CPO at Techon" : i % 4 === 1 ? "Creative Director at N" : i % 4 === 2 ? "Founder at Spark" : "Global Operations at M"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CSS for animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(calc(-400px * 4 - 1.5rem * 4)); }
                    }
                    @keyframes scroll-reverse {
                        0% { transform: translateX(calc(-400px * 4 - 1.5rem * 4)); }
                        100% { transform: translateX(0); }
                    }
                    .animate-infinite-scroll-slow {
                        animation: scroll 60s linear infinite;
                        width: max-content;
                    }
                    .animate-infinite-scroll-reverse-slow {
                        animation: scroll-reverse 60s linear infinite;
                        width: max-content;
                    }
                `}} />
            </div>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-white/5 bg-black mt-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white ring-4 ring-blue-500/20">S</div>
                        <span className="text-xl font-['Outfit'] font-bold tracking-tighter text-white">Sketchon</span>
                    </div>

                    <div className="flex gap-8 text-sm text-white/40 font-medium tracking-wide">
                        <a href="#" className="hover:text-white transition-all">Product</a>
                        <a href="#" className="hover:text-white transition-all">Privacy</a>
                        <a href="#" className="hover:text-white transition-all">Terms</a>
                        <a href="#" className="hover:text-white transition-all">Contact</a>
                    </div>

                    <div className="text-[12px] text-white/20 font-medium font-['Outfit'] uppercase tracking-widest">
                        © 2026 Sketchon Inc. All rights reserved.
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

            {/* Prompt Template Side Panel */}
            <AnimatePresence>
                {isTemplatePanelOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[400px] bg-[#121212] border-l border-white/10 z-[201] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Book size={16} className="text-emerald-500" />
                                </div>
                                <h3 className="font-bold text-white font-['Outfit']">Prompt Library</h3>
                            </div>
                            <button onClick={() => setIsTemplatePanelOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-none">
                            {/* 1. BRAIN: Analysis Strategy Prompt */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lightbulb size={12} className="text-purple-500" /> Brain (Analysis Strategy)
                                    </label>
                                </div>
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400 font-mono h-[100px] overflow-y-auto whitespace-pre-wrap">
                                    {ANALYSIS_SYSTEM_PROMPT.slice(0, 300)}...
                                    <br /><span className="text-slate-600 italic">(Read Only System Logic)</span>
                                </div>
                            </div>

                            {/* 2. CREATIVE: Visual & Asset Prompt */}
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Image size={12} className="text-pink-500" /> Creative (Visual Logic)
                                    </label>
                                </div>
                                <textarea
                                    value={creativePrompt}
                                    onChange={(e) => setCreativePrompt(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-pink-100/80 min-h-[120px] focus:border-pink-500/50 outline-none transition-all resize-none font-mono text-xs leading-relaxed custom-scrollbar"
                                    placeholder="Enter creative asset instructions..."
                                />

                                {/* NanoBanana Generator Button Removed */}
                            </div>

                            {/* 3. SKETON: Design System Prompt */}
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={12} className="text-emerald-500" /> Sketon (Design System)
                                    </label>
                                </div>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-emerald-100/80 min-h-[120px] focus:border-emerald-500/50 outline-none transition-all resize-none font-mono text-xs leading-relaxed custom-scrollbar"
                                    placeholder="Enter design system instructions..."
                                />
                            </div>



                            {/* Generated Image Result */}


                            {/* Templates List */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommended Templates</label>
                                <div className="space-y-3">
                                    {TEMPLATES.map((tmpl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setPrompt(tmpl.content);
                                                setIsTemplatePanelOpen(false);
                                            }}
                                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{tmpl.title}</span>
                                                <ClipboardCopy size={14} className="text-slate-600 group-hover:text-white" />
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{tmpl.content}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5">
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                Tip: 템플릿을 선택하면 입력창에 자동으로 채워지며, 상단의 Base Prompt와 결합되어 더욱 정교한 결과물을 만들어냅니다.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
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
