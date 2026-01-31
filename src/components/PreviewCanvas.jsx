import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Move, Type, Square, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Loader2, Sparkles, Edit3, Wand2, ArrowRight } from 'lucide-react';
import WireframeLoader from './WireframeLoader';

const PreviewCanvas = ({
    code,
    viewMode = 'desktop',
    deviceType = 'desktop',
    onSelectArtboard,
    selectedArtboard,
    bgColor = '#121212',
    zoom = 0.6,
    onSelectArea,
    onZoomChange,
    onInteractionChange,
    onApply,
    selectedArea,
    isLoading,
    interactionMode = 'select',
    ...otherProps
}) => {
    // Infinite Canvas State
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [hoveredFrame, setHoveredFrame] = useState(null);
    const panStartRef = useRef({ x: 0, y: 0 });
    // Ref for the static wrapper to get accurate bounding client rect
    const wrapperRef = useRef(null);
    const iframeRefs = useRef({}); // Added missing ref

    // Auto-Height State
    const [frameHeights, setFrameHeights] = useState({});

    // Listen for height updates from iframes
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'FRAME_HEIGHT') {
                setFrameHeights(prev => ({
                    ...prev,
                    [event.data.frameId]: event.data.height
                }));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Device dimensions & Layout settings
    // User Request: Mobile -> 1 design per frame (vertical? or horizontal?). 
    // Tablet/PC -> Expand size.
    // We will render [0, 1, 2] for all device types, but change dimensions and layout direction.

    const getLayoutSettings = () => {
        switch (viewMode) {
            case 'mobile':
                return {
                    width: 360, // User requested 360
                    minHeight: 812,
                    label: 'iPhone X',
                    gap: 64,
                    direction: 'flex-row', // Global decision: 3 screens horizontal
                    count: 3,
                    titles: ["Main Step Tracker Dashboard", "Rewards and Earnings History", "Active Challenges Mission Page"]
                };
            case 'tablet':
                return {
                    width: 768, // User requested 768
                    minHeight: 1024,
                    label: 'iPad',
                    gap: 80,
                    direction: 'flex-row', // Now shows 3 tablet screens
                    count: 3,
                    titles: ["Main Tablet View", "Side Panel Content", "Settings Overlay"]
                };
            case 'desktop':
            default:
                return {
                    width: 1024, // User requested 1024
                    minHeight: 900,
                    label: 'Desktop',
                    gap: 120,
                    direction: 'flex-row', // Now shows 3 desktop screens
                    count: 3,
                    titles: ["Main Desktop App", "Workplace Analysis", "Final Review"]
                };
        }
    };

    const { width, minHeight, gap, direction, count, titles } = getLayoutSettings();

    // Wheel Handler for Zoom & Pan
    // Use effect to handle passive wheel listeners
    useEffect(() => {
        const onWheelHandler = (e) => {
            if (e.ctrlKey || e.metaKey) {
                // Zoom
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
                if (onZoomChange) onZoomChange(newZoom);
            } else {
                // Pan
                setPanOffset(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        const wrapper = wrapperRef.current;
        if (wrapper) {
            wrapper.addEventListener('wheel', onWheelHandler, { passive: false });
        }
        return () => {
            if (wrapper) {
                wrapper.removeEventListener('wheel', onWheelHandler);
            }
        };
    }, [zoom, onZoomChange]);

    // Mouse Event Handlers for Panning & Selection
    const handleMouseDown = (e) => {
        if (interactionMode === 'pan' || e.button === 1) { // Middle mouse or Pan mode
            setIsPanning(true);
            panStartRef.current = { x: e.clientX, y: e.clientY };
        } else if (interactionMode === 'select' || interactionMode === 'area') {
            // Area selection logic
            if (!onSelectArea) return;
            if (!wrapperRef.current) return;

            // Calculate relative to the VIRTUAL content origin
            // 1. Get Mouse relative to the viewport container (wrapper)
            const rect = wrapperRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 2. Adjust for Pan Offset (effectively moving the origin)
            const panCorrectedX = mouseX - panOffset.x;
            const panCorrectedY = mouseY - panOffset.y;

            // 3. Adjust for Zoom (Scale)
            const finalX = panCorrectedX / zoom;
            const finalY = panCorrectedY / zoom;

            setStartPos({ x: finalX, y: finalY });
            setCurrentPos({ x: finalX, y: finalY });
            setIsDragging(true);
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            panStartRef.current = { x: e.clientX, y: e.clientY };
        } else if (isDragging && startPos) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const finalX = (mouseX - panOffset.x) / zoom;
            const finalY = (mouseY - panOffset.y) / zoom;

            setCurrentPos({ x: finalX, y: finalY });
        }
    };

    // Listen for Capture Response
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'AREA_CAPTURED') {
                if (onSelectArea) {
                    onSelectArea({
                        ...selectedArea, // Maintain existing coords
                        snapshot: event.data.base64,
                        html: event.data.html // 🎯 Store the targeted HTML snippet
                    });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSelectArea, selectedArea]);

    const handleMouseUp = (e) => {
        if (isPanning) {
            setIsPanning(false);
        } else if (isDragging && startPos && currentPos) {
            const x = Math.min(startPos.x, currentPos.x);
            const y = Math.min(startPos.y, currentPos.y);
            const w = Math.abs(currentPos.x - startPos.x);
            const h = Math.abs(currentPos.y - startPos.y);

            if (w > 10 && h > 10) {
                // 1. Notify parent of coordinates
                onSelectArea({ x, y, width: w, height: h });

                // 2. Trigger visual capture in the correct iframe
                const { gap, width: frameWidth } = getLayoutSettings();

                // Selection logic: Content is horizontally centered or laid out.
                // We determine which artboard the start point is in.
                // X is relative to the content wrapper which is centered.

                const artboardIndex = Math.floor(x / (frameWidth + gap));
                const localX = x - (artboardIndex * (frameWidth + gap));

                const targetIframe = iframeRefs.current[`${deviceType}-${artboardIndex}`];
                if (targetIframe && targetIframe.contentWindow) {
                    targetIframe.contentWindow.postMessage({
                        type: 'CAPTURE_AREA',
                        x: localX,
                        y: y,
                        width: w,
                        height: h
                    }, '*');
                }
            }
        }
        setIsDragging(false);
        setStartPos(null);
        setCurrentPos(null);
    };

    // Construct srcDoc for iframe with unique ID injection and Step Isolation
    const getSrcDoc = (id, index) => `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <style>
                    body { margin: 0; padding: 0; overflow-x: hidden; min-height: 100vh; background-color: transparent; }
                    /* Step Isolation: Force full width and prevent AI-generated nested frames */
                    [data-step] { 
                        display: none !important; 
                        width: 100vw !important; 
                        max-width: 100% !important; 
                        margin: 0 !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    [data-step="${index + 1}"] { display: block !important; }
                    /* Fallback: If NO data-step elements exist, show everything normally */
                    body:not(:has([data-step])) * { display: revert; }
                </style>
                <style>
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                </style>
                <script>
                    const sendHeight = () => {
                        const height = document.body.scrollHeight;
                        window.parent.postMessage({ type: 'FRAME_HEIGHT', height: height, frameId: '${id}' }, '*');
                    };
                    window.addEventListener('load', sendHeight);
                    window.addEventListener('resize', sendHeight);

                    // Listener for Capture Requests
                    window.addEventListener('message', async (event) => {
                        if (event.data.type === 'CAPTURE_AREA') {
                            const { x, y, width, height } = event.data;
                            
                            // 1. Identify targeted elements
                            const targetedElements = [];
                            const allElements = document.body.querySelectorAll('*');
                            allElements.forEach(el => {
                                // Only target leaf nodes or small containers with meaningful content
                                if (el.children.length === 0 || (el.innerText && el.innerText.trim().length > 0 && el.innerText.length < 500)) {
                                    const rect = el.getBoundingClientRect();
                                    const overlapX = Math.max(0, Math.min(x + width, rect.right) - Math.max(x, rect.left));
                                    const overlapY = Math.max(0, Math.min(y + height, rect.bottom) - Math.max(y, rect.top));
                                    const overlapArea = overlapX * overlapY;
                                    const elementArea = rect.width * rect.height;
                                    
                                    // If > 50% of element is inside or element is mostly the selection
                                    if (overlapArea > elementArea * 0.5 || overlapArea > (width * height) * 0.5) {
                                        targetedElements.push(el);
                                    }
                                }
                            });

                            // 2. Find Lowest Common Ancestor (LCA) to get a contiguous block
                            let targetEl = null;
                            if (targetedElements.length > 0) {
                                targetEl = targetedElements[0];
                                for (let i = 1; i < targetedElements.length; i++) {
                                    let ancestor = targetedElements[i];
                                    while (ancestor && !ancestor.contains(targetEl)) {
                                        ancestor = ancestor.parentElement;
                                    }
                                    if (ancestor) targetEl = ancestor;
                                }
                            }

                            // Fallback: If no specific element found, just use the selection or body
                            if (!targetEl || targetEl === document.body) {
                                targetEl = targetedElements[0] || document.body;
                            }

                            const targetHtml = targetEl.outerHTML;

                            // 3. Visual Feedback: Temporary Highlight
                            const originalOutline = targetEl.style.outline;
                            const originalTransition = targetEl.style.transition;
                            targetEl.style.transition = 'outline 0.3s ease';
                            targetEl.style.outline = '4px solid #3b82f6';
                            targetEl.style.outlineOffset = '2px';
                            setTimeout(() => {
                                targetEl.style.outline = originalOutline;
                                targetEl.style.transition = originalTransition;
                            }, 2000);

                            try {
                                const canvas = await html2canvas(document.body, {
                                    x: x,
                                    y: y,
                                    width: width,
                                    height: height,
                                    useCORS: true,
                                    backgroundColor: null
                                });
                                const base64 = canvas.toDataURL('image/png');
                                window.parent.postMessage({ 
                                    type: 'AREA_CAPTURED', 
                                    base64, 
                                    frameId: '${id}',
                                    html: targetHtml 
                                }, '*');
                            } catch (e) {
                                console.error('Capture failed', e);
                            }
                        }
                    });

                    // Observer for DOM changes
                    const observer = new MutationObserver(sendHeight);
                    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
                </script>
            </head>
            <body>
                ${code || '<div class="flex items-center justify-center h-screen text-gray-400">No code generated yet</div>'}
            </body>
        </html>
    `;

    // Local state for dragging logic
    const [startPos, setStartPos] = useState(null);
    const [currentPos, setCurrentPos] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    return (
        <div
            ref={wrapperRef}
            className="relative w-full h-full overflow-hidden cursor-default transition-colors duration-300"
            style={{ backgroundColor: bgColor }} // 1. Fix: Apply bgColor directly
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            {...otherProps}
        >
            {/* Infinite Canvas Container */}
            <div
                ref={containerRef}
                className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                }}
            >
                {/* Content Wrapper */}
                <div
                    className={`flex ${direction} items-center justify-center min-h-screen min-w-max p-32`}
                    style={{
                        gap: gap,
                        cursor: (interactionMode === 'select' || interactionMode === 'area') ? 'crosshair' : 'grab'
                    }}
                >
                    {/* Dynamic Frame Layout */}
                    {[...Array(count)].map((_, index) => {
                        const i = index;
                        const currentFrameHeight = frameHeights[`${deviceType}-${i}`] ? frameHeights[`${deviceType}-${i}`] : minHeight;

                        return (
                            <div key={`${deviceType}-${i}`} className="flex flex-col gap-4 items-center">
                                {/* Frame Title - Only show for Mobile or multi-frame */}
                                {count > 1 && !isLoading && (
                                    <div className="text-center">
                                        <span className="text-white/40 text-sm font-medium tracking-wide uppercase">{titles[i]}</span>
                                    </div>
                                )}

                                <div
                                    className={`relative transition-all duration-200 ${isLoading ? 'bg-transparent shadow-none' : 'bg-white shadow-2xl'} ${(hoveredFrame === i && !isLoading) ? 'ring-4 ring-blue-500/50 scale-[1.005]' : ''}`}
                                    style={{
                                        width,
                                        height: Math.max(minHeight, currentFrameHeight),
                                        overflow: 'visible' // Allow shadow/content to breathe if needed
                                    }}
                                    onMouseEnter={() => setHoveredFrame(i)}
                                    onMouseLeave={() => setHoveredFrame(null)}
                                >
                                    {/* Context Menu (Floating above) */}
                                    <AnimatePresence>
                                        {hoveredFrame === i && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="absolute -top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1 bg-[#2a2a2a] rounded-full border border-white/10 shadow-2xl whitespace-nowrap"
                                            >
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-full text-white text-xs font-semibold bg-blue-600 hover:bg-blue-500 transition-colors">
                                                    <Sparkles size={12} />
                                                    Generate
                                                </button>
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white text-xs font-medium transition-colors">
                                                    <Edit3 size={12} />
                                                    Edit
                                                </button>
                                                <div className="w-[1px] h-3 bg-white/20 mx-1" />
                                                <button
                                                    onClick={() => onApply && onApply()}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-500/20 rounded-full text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
                                                    title="Apply to Proposal"
                                                >
                                                    <ArrowRight size={12} />
                                                    Apply
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Components */}
                                    <AnimatePresence>
                                        {isLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 z-50 flex items-center justify-center bg-transparent" // Transparent BG for Loader
                                            >
                                                <WireframeLoader deviceType={deviceType} showText={i === 1} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <iframe
                                        ref={el => iframeRefs.current[`${deviceType}-${i}`] = el}
                                        title={`Preview ${i}`}
                                        srcDoc={getSrcDoc(`${deviceType}-${i}`, i)}
                                        className="w-full h-full border-none bg-white transition-opacity duration-300"
                                        style={{
                                            // 4. Fix: Disable pointer events on iframe when in 'area' select mode so drag works over it
                                            pointerEvents: interactionMode === 'area' ? 'none' : 'auto',
                                            opacity: isLoading ? 0 : 1
                                        }}
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            </div>
                        )
                    })}

                    {/* Selection Visuals (Global Overlay) */}
                    {selectedArea && (
                        <div
                            className="absolute border-2 border-blue-500 bg-blue-500/10 z-40"
                            style={{
                                left: selectedArea.x,
                                top: selectedArea.y,
                                width: selectedArea.width,
                                height: selectedArea.height,
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                    {isDragging && startPos && currentPos && (
                        <div
                            className="absolute border-2 border-blue-400 bg-blue-400/20 z-40"
                            style={{
                                left: Math.min(startPos.x, currentPos.x),
                                top: Math.min(startPos.y, currentPos.y),
                                width: Math.abs(currentPos.x - startPos.x),
                                height: Math.abs(currentPos.y - startPos.y),
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Floating Toolbar (Bottom Center) */}
            <AnimatePresence>
                {!isLoading && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2"
                    >
                        <div className="flex items-center gap-2 p-2 bg-[#1e1e1e]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                            {/* Interaction Modes */}
                            <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                                <button
                                    onClick={() => onInteractionChange && onInteractionChange('select')}
                                    className={`p-2 rounded-xl transition-all ${interactionMode === 'select' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    title="Select Mode"
                                >
                                    <MousePointer2 size={18} fill={interactionMode === 'select' ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={() => onInteractionChange && onInteractionChange('pan')}
                                    className={`p-2 rounded-xl transition-all ${interactionMode === 'pan' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    title="Pan Mode"
                                >
                                    <Move size={18} />
                                </button>
                                <button
                                    onClick={() => onInteractionChange && onInteractionChange('area')}
                                    className={`p-2 rounded-xl transition-all ${interactionMode === 'area' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    title="Area Select"
                                >
                                    {/* 5. Fix: Use Wand2 icon for Area Select */}
                                    <Wand2 size={18} />
                                </button>
                            </div>

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1 pl-2">
                                <button
                                    onClick={() => onZoomChange && onZoomChange(zoom - 0.1)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-xs text-slate-500 w-12 text-center font-medium">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => onZoomChange && onZoomChange(zoom + 0.1)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PreviewCanvas;
