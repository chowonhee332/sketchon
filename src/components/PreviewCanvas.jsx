import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Monitor, Smartphone, Tablet, ZoomIn, ZoomOut, Wand2, Edit3, Eye, MoreHorizontal, ThumbsUp, ThumbsDown, Loader2, Hand } from 'lucide-react';

import WireframeLoader from './WireframeLoader';

const PreviewCanvas = ({ code, deviceType, viewMode, bgColor, selectedArtboard, onSelectArtboard, selectedArea, onSelectArea, isLoading, onDrop, onDragOver }) => {
    // Canvas State
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0, width: 0 });
    const [scale, setScale] = useState(deviceType === 'mobile' ? 0.4 : 0.7);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState(null);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [interactionMode, setInteractionMode] = useState('select'); // 'hand' | 'select'

    const containerRef = useRef(null);
    const iframeRef = useRef(null);

    // 🎯 Calculate iframe height based on container
    const [iframeHeight, setIframeHeight] = useState(900);

    // 🎯 NEW: Separate pages state
    const [separatedPages, setSeparatedPages] = useState([]);

    useEffect(() => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.clientHeight;
            setIframeHeight(containerHeight);
        }
    }, [viewMode]);

    // 🎯 Parse HTML and extract individual pages
    useEffect(() => {
        if (!code) {
            setSeparatedPages([]);
            return;
        }

        try {
            // Create a temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, 'text/html');

            // Find all elements with data-screen-id
            const pageElements = doc.querySelectorAll('[data-screen-id]');

            if (pageElements.length === 0) {
                // If no pages found, treat entire code as single page
                setSeparatedPages([{
                    id: 'main',
                    title: 'Main',
                    html: code
                }]);
                return;
            }

            // Extract each page
            const pages = Array.from(pageElements).map((pageEl, index) => {
                const screenId = pageEl.getAttribute('data-screen-id');
                const pageHTML = pageEl.outerHTML;

                // Create a complete HTML document for this page
                const fullHTML = `
                    <!DOCTYPE html>
                    <html class="bg-transparent h-full">
                        <head>
                            <meta charset="utf-8">
                            <script src="https://cdn.tailwindcss.com"></script>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;700&display=swap" rel="stylesheet">
                            <style>
                                body { 
                                    font-family: 'Inter', sans-serif; 
                                    margin: 0; 
                                    padding: 0; 
                                    background: transparent; 
                                    overflow: visible; 
                                }
                                ::-webkit-scrollbar { display: none; }
                            </style>
                        </head>
                        <body>
                            ${pageHTML}
                        </body>
                    </html>
                `;

                return {
                    id: screenId || `page-${index}`,
                    title: screenId ? screenId.charAt(0).toUpperCase() + screenId.slice(1) : `Page ${index + 1}`,
                    html: fullHTML
                };
            });

            setSeparatedPages(pages);
        } catch (error) {
            console.error('Error parsing HTML:', error);
            setSeparatedPages([{
                id: 'main',
                title: 'Main',
                html: code
            }]);
        }
    }, [code]);

    const canvasWidth = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px'
    }[viewMode];

    // Handle messages from Iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'ARTBOARD_CLICK') {
                onSelectArtboard(event.data.id);
                if (event.data.rect) {
                    setToolbarPos({
                        top: event.data.rect.top,
                        left: event.data.rect.left,
                        width: event.data.rect.width
                    });
                }
            }

            // 🎯 Handle selected elements from area selection
            if (event.data?.type === 'ELEMENTS_SELECTED') {
                const elements = event.data.elements || [];
                // Pass selected elements to parent component
                if (onSelectArea) {
                    onSelectArea({
                        ...selectedArea,
                        elements: elements
                    });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [selectedArea]);

    const resetSelection = () => onSelectArtboard(null);

    return (
        <div
            className={`w-full h-full flex flex-col overflow-hidden relative transition-colors duration-300 font-['Inter'] ${interactionMode === 'select' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
                backgroundColor: bgColor,
                backgroundImage: 'radial-gradient(rgba(128, 128, 128, 0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                userSelect: interactionMode === 'select' || isSelecting ? 'none' : 'auto'
            }}
            ref={containerRef}
            onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    // Smooth zoom centered on mouse
                    const zoomSensitivity = 0.0015;
                    const delta = -e.deltaY * zoomSensitivity;
                    const newScale = Math.min(Math.max(0.05, scale * (1 + delta)), 5);
                    setScale(newScale);
                } else {
                    // Pan with wheel (Shift for horizontal)
                    const panSensitivity = 1;
                    if (e.shiftKey) {
                        setPosition(prev => ({ ...prev, x: prev.x - e.deltaY * panSensitivity }));
                    } else {
                        setPosition(prev => ({
                            x: prev.x - e.deltaX * panSensitivity,
                            y: prev.y - e.deltaY * panSensitivity
                        }));
                    }
                }
            }}
            onPointerDown={(e) => {
                if (interactionMode === 'select' && e.button === 0) {
                    setIsSelecting(true);
                    const rect = containerRef.current.getBoundingClientRect();
                    const rx = e.clientX - rect.left;
                    const ry = e.clientY - rect.top;
                    setStartPoint({ x: rx, y: ry });
                    setSelectionRect({ left: rx, top: ry, width: 0, height: 0 });
                }
            }}
            onPointerMove={(e) => {
                if (isSelecting && selectionRect) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const currentX = e.clientX - rect.left;
                    const currentY = e.clientY - rect.top;

                    const left = Math.min(startPoint.x, currentX);
                    const top = Math.min(startPoint.y, currentY);
                    const width = Math.abs(currentX - startPoint.x);
                    const height = Math.abs(currentY - startPoint.y);

                    setSelectionRect({ left, top, width, height });
                }
            }}
            onPointerUp={() => {
                if (isSelecting && selectionRect) {
                    setIsSelecting(false);
                    if (selectionRect.width > 10 && selectionRect.height > 10) {
                        onSelectArea(selectionRect);

                        // 🎯 Send selection rect to iframe to find elements within
                        if (iframeRef.current && iframeRef.current.contentWindow) {
                            // Convert selection rect to iframe coordinates
                            const containerRect = containerRef.current.getBoundingClientRect();
                            const iframeRect = iframeRef.current.getBoundingClientRect();

                            // Calculate relative position within iframe
                            const relativeRect = {
                                left: selectionRect.left - (iframeRect.left - containerRect.left),
                                top: selectionRect.top - (iframeRect.top - containerRect.top),
                                width: selectionRect.width,
                                height: selectionRect.height
                            };

                            iframeRef.current.contentWindow.postMessage({
                                type: 'SELECT_ELEMENTS_IN_RECT',
                                rect: relativeRect
                            }, '*');
                        }
                    } else {
                        setSelectionRect(null);
                        onSelectArea(null);
                    }
                }
            }}
            onClick={(e) => {
                if (e.target === containerRef.current) {
                    resetSelection();
                    setSelectionRect(null);
                }
            }}
        >

            {/* Selection Marquee Box */}
            < AnimatePresence >
                {selectionRect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-[100] border-2 border-blue-500 bg-blue-500/10 pointer-events-none rounded-sm"
                        style={{
                            left: selectionRect.left,
                            top: selectionRect.top,
                            width: selectionRect.width,
                            height: selectionRect.height,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.15)', // Dim background
                        }}
                    >
                        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-2 whitespace-nowrap">
                            <Wand2 size={10} />
                            Area Selection ({Math.round(selectionRect.width)} x {Math.round(selectionRect.height)})
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Selection Toolbar Overlay (Synced with Zoom/Pan) */}
            < AnimatePresence >
                {selectedArtboard && (() => {
                    // 🎯 Calculate toolbar position: Place it directly above the artboard
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (!containerRect) return null;

                    // Calculate artboard's actual screen position (with scale + pan applied)
                    const scaledTop = (toolbarPos.top * scale) + position.y + (containerRect.height / 2) - (iframeHeight * scale / 2);
                    const scaledLeft = (toolbarPos.left * scale) + position.x + (containerRect.width / 2) - (1200 * scale / 2);
                    const scaledWidth = toolbarPos.width * scale;

                    // Position toolbar 10px above the artboard
                    const toolbarHeight = 50;
                    const toolbarGap = 10;
                    let finalTop = scaledTop - toolbarHeight - toolbarGap;
                    let finalLeft = scaledLeft + (scaledWidth / 2); // Center of artboard

                    // 🎯 Boundary check: Keep toolbar within viewport
                    const toolbarWidth = 400; // Approximate toolbar width
                    finalTop = Math.max(10, Math.min(finalTop, containerRect.height - toolbarHeight - 10));
                    finalLeft = Math.max(toolbarWidth / 2 + 10, Math.min(finalLeft, containerRect.width - toolbarWidth / 2 - 10));

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                top: finalTop,
                                left: finalLeft
                            }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-[100] -translate-x-1/2 pointer-events-auto"
                        >
                            <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-white">
                                <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-bold transition-all group">
                                    <Wand2 size={14} className="text-blue-400 group-hover:scale-110" />
                                    Generate
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-white/10 px-1 rounded text-[10px]">v</span>
                                </button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
                                    <Eye size={14} /> Preview
                                </button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <button className="p-2 hover:bg-white/10 rounded-xl"><MoreHorizontal size={14} /></button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <button className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-xl"><ThumbsUp size={14} /></button>
                                <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl"><ThumbsDown size={14} /></button>
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence >

            {/* Infinite Canvas Area (Centered Logic) */}
            < motion.div
                className={`flex-1 w-full h-full relative overflow-hidden ${interactionMode === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                onMouseDown={interactionMode === 'hand' ? (e) => {
                    const startX = e.clientX - position.x;
                    const startY = e.clientY - position.y;
                    const onMove = (moveEvent) => {
                        setPosition({
                            x: moveEvent.clientX - startX,
                            y: moveEvent.clientY - startY
                        });
                    };
                    const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                } : undefined}
            >
                {/* Dotted Grid Background */}
                < div className="absolute inset-0 pointer-events-none opacity-[0.15]"
                    style={{
                        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        transform: `translate(${position.x}px, ${position.y}px)` // Grid moves with pan
                    }}
                />

                {/* Content Container (Centered by default + Pan/Zoom) */}
                <motion.div
                    className="absolute left-1/2 top-1/2 will-change-transform"
                    initial={false}
                    animate={{
                        x: position.x,
                        y: position.y,
                        scale: scale,
                        translateX: '-50%',
                        translateY: '-50%'
                    }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                    style={{
                        width: viewMode === 'mobile' ? 'auto' : canvasWidth,
                        // minHeight: viewMode === 'mobile' ? 'auto' : '812px',
                        // height: viewMode === 'desktop' ? '100vh' : 'auto'
                    }}
                >
                    <div className="flex flex-col gap-3 relative items-center justify-center">
                        {/* Header Badge */}
                        {/* Header Badge Removed */}

                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <WireframeLoader deviceType={deviceType} />
                                </motion.div>
                            ) : (code && separatedPages.length > 0 ? (
                                <motion.div
                                    key="iframe-content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-row gap-10 items-start"
                                    style={{
                                        width: 'max-content',
                                        height: 'max-content',
                                    }}
                                >
                                    {separatedPages.map((page, index) => (
                                        <motion.div
                                            key={page.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="relative flex-shrink-0"
                                            style={{
                                                width: viewMode === 'mobile' ? '375px' : '100%',
                                            }}
                                        >
                                            {/* Page Title */}
                                            <div className="absolute -top-8 left-0 text-xs text-gray-400 font-mono flex items-center gap-2">
                                                <span>{page.title}</span>
                                                <button className="opacity-50 hover:opacity-100">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Individual iframe for each page */}
                                            <iframe
                                                title={`Preview - ${page.title}`}
                                                className="border-none bg-white rounded-xl shadow-2xl"
                                                sandbox="allow-scripts allow-forms"
                                                style={{
                                                    width: viewMode === 'mobile' ? '375px' : '100%',
                                                    height: `${iframeHeight}px`,
                                                    pointerEvents: interactionMode === 'select' ? 'auto' : 'none'
                                                }}
                                                srcDoc={page.html}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : null)}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div >


            {/* Floating Bottom Toolbar (Refined Zoom & Tools) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-[#1e1e1e]/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/10 z-50">
                {/* Interaction Modes */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setInteractionMode('hand')}
                        className={`p-2 rounded-xl transition-all ${interactionMode === 'hand' ? 'bg-white/15 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title="Hand Mode (Pan)"
                    >
                        <Hand size={18} />
                    </button>
                    <button
                        onClick={() => setInteractionMode('select')}
                        className={`p-2 rounded-xl transition-all ${interactionMode === 'select' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title="Selection Mode (Marquee)"
                    >
                        <Wand2 size={18} />
                    </button>
                </div>

                <div className="w-[1px] h-4 bg-white/10 mx-1.5" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                    <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white" title="Zoom Out">
                        <ZoomOut size={18} />
                    </button>
                    <span className="font-mono text-[11px] w-12 text-center select-none font-bold text-blue-400">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(5, scale + 0.1))} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white" title="Zoom In">
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>
        </div >
    );
};

export default PreviewCanvas;
