import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import PreviewCanvas from '../components/PreviewCanvas';
import AnalyzeDashboard from '../components/AnalyzeDashboard';
import PresentationBuilder from '../components/PresentationBuilder';
import ProjectInputModal from '../components/ProjectInputModal';
import AnalysisProgress from '../components/AnalysisProgress';
import { v0 } from '../lib/gemini';
import { generateModularAnalysis, buildUIPrompt } from '../lib/unifiedArchitect';
import { applyPatch } from '../lib/patching';
import { ChevronLeft, Share2, Download, Zap, Monitor, Tablet, Smartphone, Menu, PanelLeftClose, PanelLeftOpen, Edit3, CircleUser, Layout, Compass, Target, Users, Layers, Settings, HelpCircle, Plus, Search, ExternalLink, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import creonLogo from '../assets/creon-logo.png';
import creonLogoWhite from '../assets/creon-logo-white.png';
import sketchonLogo from '../assets/sketchon_logo.png';
import AIBorder from '../components/AIBorder';
import CreonSidebar from '../components/CreonSidebar';

const GeneratorPage = () => {
    const location = useLocation();
    const [messages, setMessages] = useState({
        research: [],
        ui: [],
        ppt: []
    });
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('gemini-3-flash');
    const [deviceType, setDeviceType] = useState('mobile'); // 'mobile' | 'web'
    const [activeTab, setActiveTab] = useState('ui');
    const [viewMode, setViewMode] = useState('desktop');
    const [bgColor, setBgColor] = useState('#e5e5e5');
    const [selectedArtboard, setSelectedArtboard] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedElements, setSelectedElements] = useState([]); // 🎯 Selected elements from area selection
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isCreonModalOpen, setIsCreonModalOpen] = useState(false);
    const [isCreonSessionActive, setIsCreonSessionActive] = useState(false);
    const [tempTitle, setTempTitle] = useState('');
    const [analyzeSubTab, setAnalyzeSubTab] = useState('all');

    // AI Analysis States
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('idle'); // 'idle' | 'input' | 'analyzing' | 'complete'
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 5 });
    const [selectedModules, setSelectedModules] = useState(['strategicContext', 'intelligence', 'benchmark', 'userStrategy', 'implementation']); // Default: all selected

    const [projectTitle, setProjectTitle] = useState('Untitled Project');
    const hasInitialLoaded = React.useRef(false);
    const [panelWidth, setPanelWidth] = useState(800);
    const [isResizing, setIsResizing] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [zoom, setZoom] = useState(0.6);
    const [interactionMode, setInteractionMode] = useState('select'); // 'select' | 'pan'

    // Initial load & ID management
    // Initial load useEffect moved below to access handleAnalysisSubmit

    // Auto-Save Effect
    useEffect(() => {
        if (!projectId) return;

        const saveProject = () => {
            const projects = JSON.parse(localStorage.getItem('sketchon_projects') || '[]');
            const now = new Date().toISOString();

            const projectData = {
                id: projectId,
                title: projectTitle,
                messages,
                code: generatedCode,
                updatedAt: now,
                thumbnail: null // Placeholder for future schematic capture
            };

            const existingIndex = projects.findIndex(p => p.id === projectId);
            if (existingIndex >= 0) {
                projects[existingIndex] = projectData;
            } else {
                projects.push(projectData);
            }

            localStorage.setItem('sketchon_projects', JSON.stringify(projects));
        };

        const timeoutId = setTimeout(saveProject, 1000); // 1s Debounce
        return () => clearTimeout(timeoutId);
    }, [projectId, projectTitle, messages, generatedCode]);

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            e.preventDefault(); // Prevent text selection

            const newWidth = window.innerWidth - e.clientX;
            // More permissive range for smoother resizing
            if (newWidth > 280 && newWidth < 1400) {
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = ''; // Re-enable text selection
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Creon Integration Listener
    useEffect(() => {
        const handleCreonMessage = (event) => {
            // Security check: In production, verify event.origin
            // if (event.origin !== "https://creon-umber.vercel.app") return; 

            const { type, payload } = event.data;

            if (type === 'CREON_ASSET_SELECTED') {
                console.log("Creon Asset Received:", payload);
                // Payload structure: { type: 'image' | 'text' | 'video', value: 'url', base64: '...', mimeType: '...' }

                if (payload.type === 'image') {
                    // console.log("Creon Asset Received:", payload);

                    // Construct the full image source for the AI to include in <img> tags
                    const imageSource = payload.base64
                        ? `data:${payload.mimeType || 'image/png'};base64,${payload.base64}`
                        : payload.value;

                    const attachments = payload.base64 ? [{
                        base64: payload.base64,
                        type: payload.mimeType || 'image/png'
                    }] : [];

                    handleSendMessage(
                        `I found this high-quality PNG asset in Creon. Please apply this visual style to the UI AND directly insert this image into the design at an appropriate location (e.g., as a main icon or featured graphic) using an <img> tag with this exact source: "${imageSource}"`,
                        currentModel,
                        undefined,
                        attachments
                    );
                } else if (payload.type === 'text') {
                    setIsCreonModalOpen(false);
                    handleSendMessage(`Ensure the design includes this content: "${payload.value}"`, currentModel);
                } else if (payload.type === 'video') {
                    // For video, we might just pass the reference text for now as most LLMs handle images better
                    setIsCreonModalOpen(false);
                    handleSendMessage(`I found this video reference in Creon: ${payload.value}. Please use this as inspiration for motion and dynamic elements in the design.`, currentModel);
                }
            }
        };

        window.addEventListener('message', handleCreonMessage);
        return () => window.removeEventListener('message', handleCreonMessage);
    }, [currentModel, activeTab]); // Re-bind if model changes (or remove dependency if handleSendMessage is stable)

    // AI Analysis Handlers
    const handleAnalysisSubmit = async (userInput) => {
        try {
            setIsLoading(true);
            setAnalysisStatus('analyzing');
            setAnalysisProgress({ current: 0, total: 5 });

            // Generate modular analysis (Background)
            const result = await generateModularAnalysis(userInput);

            setAnalysisProgress({ current: 5, total: 5 });
            setAnalysisData(result);
            setAnalysisStatus('complete');

            // Stay on Visualize tab (don't switch to research)
            setActiveTab('ui');

            // Auto-trigger UI generation based on Analysis Results
            if (result.implementation?.uiConcept) {
                const uiPrompt = buildUIPrompt(result.implementation.uiConcept);
                await handleSendMessage(uiPrompt, currentModel);
            } else {
                // Fallback: use query if analysis fails to provide a uiConcept
                const searchParams = new URLSearchParams(location.search);
                const query = searchParams.get('q');
                if (query) await handleSendMessage(query, currentModel);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            setAnalysisStatus('idle');
            setIsLoading(false);
            alert(`분석 중 오류가 발생했습니다.\n\n오류 상세: ${error.message || error}`);
        }
    };

    // Initial load & ID management (Moved here to use handleAnalysisSubmit)
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('q');
        const id = searchParams.get('id');
        const platform = searchParams.get('platform');
        const model = searchParams.get('model');

        if (platform) {
            setDeviceType(platform);
            setViewMode(platform === 'mobile' ? 'mobile' : 'desktop');
        }
        if (model) setCurrentModel(model);

        // If it's a different project than current one, or if it's the first load
        if (id && id !== projectId) {
            setProjectId(id);
            const savedProjects = JSON.parse(localStorage.getItem('sketchon_projects') || '[]');
            const project = savedProjects.find(p => p.id === id);

            if (project) {
                setProjectTitle(project.title);
                setMessages(project.messages || { research: [], ui: [], ppt: [] });
                setGeneratedCode(project.code || '');
                return;
            }
        }

        // Fresh Start logic (no ID or different initial load)
        if (!hasInitialLoaded.current) {
            if (!id) {
                const newId = `proj_${Date.now()}`;
                setProjectId(newId);

                // [MODIFIED] Auto-start Modular Analysis based on query & params
                if (query) {
                    const serviceName = searchParams.get('service');
                    const coreTask = searchParams.get('task');
                    const style = searchParams.get('style');
                    const systemPrompt = searchParams.get('sys');
                    const assetSubject = searchParams.get('assetSubject');

                    setProjectTitle(serviceName || (query.length > 20 ? query.substring(0, 20) + '...' : query));

                    // PHASE 4: SEQUENTIAL GENERATION PIPELINE
                    const initiateGeneration = async () => {
                        let generatedAssetUrl = null;

                        // Step 1: Creative Director (Asset Generation)
                        if (assetSubject) {
                            setIsLoading(true);
                            // Visual feedback for Asset Generation
                            setMessages(prev => ({
                                ...prev,
                                ui: [...(prev.ui || []), {
                                    role: 'assistant',
                                    content: `🎨 **Creative Director (The Artist)**\n\nDesigning custom 3D asset for: *"${assetSubject}"*...`
                                }]
                            }));

                            // Simulate Generation Time (Creative Process)
                            await new Promise(r => setTimeout(r, 2000));

                            // Mock Result (In production, this would be the NanoBanana V0 call)
                            generatedAssetUrl = `https://placehold.co/600x600/2962ff/FFF?text=${encodeURIComponent(assetSubject)}`;

                            setMessages(prev => ({
                                ...prev,
                                ui: [...prev.ui, {
                                    role: 'assistant',
                                    content: `✅ **Asset Created**\n\nPassing to Sketon...`,
                                    parts: [{ text: `Asset URL: ${generatedAssetUrl}` }]
                                }]
                            }));
                        }

                        // Step 2: Sketon (Analysis & UI Generation)
                        handleAnalysisSubmit({
                            keyword: query,
                            projectType: serviceName || (platform === 'mobile' ? 'Mobile App' : 'Web Service'),
                            targetUser: 'Extracted from Blueprint',
                            goals: coreTask || `Successful Project Launch`,
                            // Inject specific instruction about the asset into the notes/context
                            notes: `${systemPrompt ? `[Expert Persona]: ${systemPrompt}. ` : ''}Visual Style: ${style || 'Premium'}.${generatedAssetUrl ? `\n\n[MANDATORY INSTRUCTION]: You MUST integrate the generated 3D asset into the Hero Section. Use this URL: "${generatedAssetUrl}" inside an <img> tag with class "w-32 h-32 object-contain".` : ''}`
                        });
                    };

                    initiateGeneration();
                }
            }
            hasInitialLoaded.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const handleSendToDelivery = () => {
        if (selectedModules.length === 0) {
            alert('최소 1개 이상의 모듈을 선택해주세요.');
            return;
        }

        // Switch to Delivery tab
        setActiveTab('ppt');

        // TODO: Pass selected modules data to PresentationBuilder
        console.log('Selected modules for delivery:', selectedModules);
        console.log('Analysis data:', analysisData);
    };


    const handleSendMessage = async (input, modelId = currentModel, type = undefined, attachments = []) => {
        setIsLoading(true);
        const generationType = type || deviceType; // Use passed type or current state
        const targetTab = activeTab; // Capture current tab at start of fn
        const newUserMessage = { role: 'user', content: input };

        // Get history for Current Tab
        const currentTabHistory = messages[targetTab] || [];

        const history = currentTabHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Fix: Remove leading model messages to comply with Gemini API requirements (First content must be user)
        while (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        setMessages(prev => ({
            ...prev,
            [targetTab]: [...(prev[targetTab] || []), newUserMessage]
        }));

        let contextPrefix = "";
        if (selectedArea) {
            contextPrefix = `[AREA: ${Math.round(selectedArea.width)}x${Math.round(selectedArea.height)} at ${Math.round(selectedArea.left)},${Math.round(selectedArea.top)}] `;
        } else if (selectedArtboard) {
            contextPrefix = `[TARGET: Screen ${selectedArtboard}] `;
        }

        const contextInput = contextPrefix + input;

        try {
            const isRefinement = !!(selectedArea && selectedArea.html);
            const targetHtml = isRefinement ? selectedArea.html : null;

            const result = await v0(contextInput, history, modelId, generationType, attachments, isRefinement, targetHtml);

            if (result.code) {
                if (isRefinement && generatedCode) {
                    // 🎯 SMART PATCHING: Replace only the relevant section using robust utility
                    console.log("Applying smart patch to selected area...");
                    try {
                        const patchedCode = applyPatch(generatedCode, targetHtml, result.code);
                        setGeneratedCode(patchedCode);
                    } catch (patchError) {
                        console.error("Smart patch failed, falling back to full replacement:", patchError);
                        setGeneratedCode(result.code);
                    }
                } else {
                    setGeneratedCode(result.code);
                }
            }

            const aiMessage = {
                role: 'assistant',
                content: result.explanation || "디자인을 생성했습니다."
            };

            setMessages(prev => ({
                ...prev,
                [targetTab]: [...(prev[targetTab] || []), aiMessage]
            }));
        } catch (error) {
            console.error("Design Generation Error:", error);
            setMessages(prev => ({
                ...prev,
                [targetTab]: [...(prev[targetTab] || []), { role: 'assistant', content: "죄송합니다. 디자인 생성 중 오류가 발생했습니다." }]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCanvasDrop = async (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        // console.log("Drop detected!", e.dataTransfer.types);
        setIsLoading(true);

        try {
            // 1. Handle Creon Data or HTML (priority)
            const htmlData = e.dataTransfer.getData('text/html');
            const urlData = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('url');

            // Context Prefix for Drop
            let dropContext = "";
            let instructionPrefix = "";

            if (selectedArea) {
                dropContext = `[AREA: ${Math.round(selectedArea.width)}x${Math.round(selectedArea.height)} at ${Math.round(selectedArea.x)},${Math.round(selectedArea.y)}] `;
                instructionPrefix = "REPLACE the content within this selected area with this image. maintain the surrounding layout. ";
            }

            if (htmlData) {
                const doc = new DOMParser().parseFromString(htmlData, 'text/html');
                const img = doc.querySelector('img');
                if (img && img.src) {
                    const isCreonAsset = img.dataset.creonAsset === 'true' || img.src.includes('data:image');
                    const promptText = isCreonAsset
                        ? `${dropContext}[Creon Asset] ${instructionPrefix}Use this high-quality 3D asset from Creon. Image source: "${img.src}"`
                        : `${dropContext}I just dragged this image into the canvas. ${instructionPrefix}Please incorporate this image using this source: "${img.src}"`;

                    handleSendMessage(promptText, currentModel);
                    return;
                }
            }

            // 2. Handle Files (from local disk)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result;
                        const base64Data = base64String.split(',')[1];
                        const mimeType = file.type;
                        const imageSource = `data:${mimeType};base64,${base64Data}`;

                        handleSendMessage(
                            `${dropContext}User dropped a local image. ${instructionPrefix}Analyze this image and insert it using an <img> tag (src: "${imageSource}").`,
                            currentModel,
                            undefined,
                            [{ base64: base64Data, type: mimeType }]
                        );
                    };
                    reader.readAsDataURL(file);
                    return;
                }
            }

            if (urlData) {
                // Some browsers might provide multiple URLs separated by newlines
                const firstUrl = urlData.split('\n')[0].trim();
                handleSendMessage(
                    `${dropContext}I just dragged this image URL into the canvas. ${instructionPrefix}Please include it: "${firstUrl}"`,
                    currentModel
                );
                return;
            }

            // 3. Fallback to text link
            const textData = e.dataTransfer.getData('text/plain');
            if (textData && (textData.startsWith('http') || textData.includes('data:image'))) {
                handleSendMessage(
                    `${dropContext}I just dragged this image into the canvas. ${instructionPrefix}Please include it: "${textData}"`,
                    currentModel
                );
                return;
            }

        } catch (err) {
            console.error("Drop handling failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDraggingOver) setIsDraggingOver(true);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we are not moving into a child element
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDraggingOver(false);
    };

    return (
        <div className="flex flex-col h-screen bg-[#070707] overflow-hidden font-['Pretendard_Variable'] selection:bg-primary/30">
            {isLoading && <AIBorder />}
            {/* Header - Dark Mode */}
            {/* Header - Toss Dark Mode */}
            <header className="h-14 flex items-center justify-between bg-[#0A0A0A] z-20 text-white pl-0 pr-4">
                <div className="flex items-center h-full px-4 gap-3 w-[280px] shrink-0 transition-all duration-300 ease-in-out">
                    <Link to="/" className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors">
                        <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-colors">
                            <ChevronLeft size={20} />
                        </div>
                    </Link>

                    <div className="h-4 w-[1px] bg-white/10 mx-2" />

                    <div className="flex-1 overflow-hidden">
                        <span className="text-sm font-bold text-white whitespace-nowrap truncate block">
                            {projectTitle}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white h-7 w-7"
                            onClick={() => {
                                setTempTitle(projectTitle);
                                setIsRenameModalOpen(true);
                            }}
                        >
                            <Edit3 size={14} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white shrink-0"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <PanelLeftClose size={20} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Centered Tab Navigation - Toss Style Pills */}
                <div className="absolute left-1/2 -translate-x-1/2 flex p-1 bg-[#2C2C2E] rounded-full border border-[#333D4B]">
                    {[
                        { id: 'research', label: 'Analyze', desc: 'RFP와 시장을 분석하여 논리적 근거를 만드는 단계' },
                        { id: 'ui', label: 'Visualize', desc: 'Creon 엔진으로 아이디어를 눈에 보이는 실체로 바꾸는 단계' },
                        { id: 'ppt', label: 'Deliver', desc: '분석과 시안을 엮어 최종 제안서로 완성하는 단계' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.desc}
                            className={`px-6 py-1.5 text-xs font-bold rounded-full transition-all tracking-wider ${activeTab === tab.id ? 'bg-[#3182F6] text-white shadow-lg shadow-blue-900/20' : 'text-[#B0B8C1] hover:text-white hover:bg-[#333D4B]'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 pr-4">
                    {/* Help Icon */}
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <HelpCircle size={20} />
                    </button>

                    {/* Settings Icon */}
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <Settings size={20} />
                    </button>

                    {/* Profile Icon */}
                    <button className="relative group focus:outline-none transition-transform hover:scale-105 ml-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                            W
                        </div>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden bg-[#0A0A0A] p-2 gap-2">
                {/* Left Sidebar Card */}
                <div
                    className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}
                >
                    <div className="w-[280px] h-full bg-[#161618] rounded-2xl overflow-hidden shadow-xl">
                        <ChatSidebar
                            messages={messages[activeTab] || []}
                            onSendMessage={(msg, model, attachments) => handleSendMessage(msg, model, undefined, attachments)}
                            isLoading={isLoading}
                            currentModel={currentModel}
                            onModelSelect={setCurrentModel}
                            selectedArtboard={selectedArtboard}
                            selectedArea={selectedArea}
                            selectedElements={selectedElements} // 🎯 Pass selected elements
                            onClearSelection={() => {
                                setSelectedArtboard(null);
                                setSelectedArea(null);
                                setSelectedElements([]);
                            }}
                            onStartAnalysis={() => setIsInputModalOpen(true)}
                            onToggleSidebar={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>

                {/* Main Content Area Card */}
                <div className="flex-1 min-w-0 bg-[#161618] rounded-2xl border border-white/5 shadow-xl relative flex flex-col overflow-hidden">
                    {/* Sub Tab Navigation for Analyze */}
                    {activeTab === 'research' && (
                        <div className="flex items-center gap-6 px-8 py-3 bg-[#161618] border-b border-[#333D4B] overflow-x-auto scrollbar-hide shrink-0 z-10 transition-all duration-300">
                            {[
                                { id: 'all', label: 'Overall', icon: Layout },
                                { id: 'guide', label: '1. Guide', icon: Compass },
                                { id: 'benchmark', label: '2. Benchmark', icon: Target },
                                { id: 'logic', label: '3. Logic', icon: Users },
                                { id: 'strategy', label: '4. Strategy', icon: Layers }
                            ].map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => setAnalyzeSubTab(sub.id)}
                                    className={`flex items-center gap-2 whitespace-nowrap text-xs font-bold transition-all ${analyzeSubTab === sub.id ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <sub.icon size={14} className={analyzeSubTab === sub.id ? 'text-blue-500' : 'text-slate-600'} />
                                    {sub.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="flex-1 relative overflow-hidden">
                        {activeTab === 'research' && (
                            <AnalyzeDashboard
                                projectTitle={projectTitle}
                                messages={messages.research || []}
                                selectedSection={analyzeSubTab}
                                analysisData={analysisData}
                                selectedModules={selectedModules}
                                onToggleModule={setSelectedModules}
                                onSendToDelivery={handleSendToDelivery}
                            />
                        )}
                        {activeTab === 'ppt' && (
                            <PresentationBuilder
                                analysisData={analysisData}
                                selectedModules={selectedModules}
                                generatedUIUrl={generatedCode ? 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(generatedCode))) : null}
                            />
                        )}

                        <div
                            className={`w-full h-full flex flex-col transition-all duration-300 ${activeTab === 'ui' ? 'block' : 'hidden'} ${isDraggingOver ? 'ring-4 ring-blue-500/50 bg-blue-500/5' : ''}`}
                            onDrop={handleCanvasDrop}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                        >
                            {/* Canvas Controls (Bottom-Left) */}
                            {activeTab === 'ui' && (
                                <div className="absolute bottom-8 left-8 z-[60] flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 p-1.5 bg-[#1e1e1e]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                        <button
                                            onClick={() => {
                                                setViewMode('desktop');
                                                setDeviceType('web');
                                            }}
                                            className={`p-2 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <Monitor size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('tablet');
                                                setDeviceType('web');
                                            }}
                                            className={`p-2 rounded-xl transition-all ${viewMode === 'tablet' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <Tablet size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('mobile');
                                                setDeviceType('mobile');
                                            }}
                                            className={`p-2 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <Smartphone size={18} />
                                        </button>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute bottom-full left-0 mb-3 p-2 bg-[#1e1e1e]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2 transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0">
                                            {['#ffffff', '#f5f5f5', '#e5e5e5', '#1a1a1a'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setBgColor(color)}
                                                    className={`w-6 h-6 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-110 ${bgColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1e1e1e]' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>

                                        <div className="p-2.5 bg-[#1e1e1e]/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl cursor-pointer hover:bg-white/5 transition-all">
                                            <div
                                                className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
                                                style={{ backgroundColor: bgColor }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <PreviewCanvas
                                code={generatedCode}
                                deviceType={deviceType}
                                viewMode={viewMode}
                                bgColor={bgColor}
                                onSelectArtboard={setSelectedArtboard}
                                selectedArtboard={selectedArtboard}
                                onSelectArea={(area) => {
                                    setSelectedArea(area);
                                    if (area && area.elements) {
                                        setSelectedElements(area.elements);
                                    } else {
                                        setSelectedElements([]);
                                    }
                                }}
                                selectedArea={selectedArea}
                                isLoading={isLoading}
                                onDrop={handleCanvasDrop}
                                onDragOver={handleDragOver}
                                zoom={zoom}
                                onZoomChange={setZoom}
                                interactionMode={interactionMode}
                                onInteractionChange={setInteractionMode}
                                onApply={handleSendToDelivery}
                            />
                        </div>
                    </div>
                </div>

                {/* Creon Service Side Panel Card */}
                <div
                    className={`flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out z-30`}
                    style={{ width: isCreonModalOpen ? `${panelWidth}px` : '0px', overflow: 'hidden' }}
                >
                    <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-2xl shadow-xl border border-white/5 h-full relative">
                        {/* Resize Handle (Google Style) - Moved outside or kept? Kept for resizing */}
                        {isCreonModalOpen && (
                            <div
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-500/50 transition-colors z-50 group"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsResizing(true);
                                }}
                            >
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400/50 rounded-full group-hover:bg-blue-500 transition-colors" />
                            </div>
                        )}

                        {/* Keep mounted if session is active, even if closed (width 0) */}
                        {isCreonSessionActive && (
                            <CreonSidebar
                                onClose={() => {
                                    setIsCreonModalOpen(false);
                                    setIsCreonSessionActive(false); // Fully reset on X click
                                }}
                                logo={creonLogo}
                            />
                        )}
                    </div>
                </div>

                {/* Right Companion Sidebar */}
                <div className="w-[48px] flex-shrink-0 flex flex-col items-center py-4 gap-4 z-20 bg-[#0A0A0A]">
                    <div className="flex flex-col items-center gap-2 w-full">
                        {/* Third Party Icons (Creon placeholders) */}
                        {[1, 2, 3, 4].map((i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (!isCreonModalOpen) setIsCreonSessionActive(true); // Start session on open
                                    setIsCreonModalOpen(!isCreonModalOpen);
                                }}
                                className={`w-9 h-9 rounded-xl overflow-hidden hover:scale-110 transition-all p-2 flex items-center justify-center group ${isCreonModalOpen && i === 1 ? 'bg-white/10 ring-2 ring-blue-500' : 'bg-transparent'}`}
                            >
                                <img src={creonLogo} alt={`Creon ${i}`} className={`w-full h-full object-contain transition-opacity ${isCreonModalOpen && i === 1 ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                    </div>

                    <div className="w-6 h-[1px] bg-white/5 my-2" />

                    <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                        <Plus size={18} />
                    </button>
                </div>
            </main>

            {/* Project Input Modal */}
            < ProjectInputModal
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                onSubmit={handleAnalysisSubmit}
                initialKeyword=""
            />

            {/* Analysis Progress Overlay Removed - Progress shown via Canvas Loader */}
        </div >
    );
};

export default GeneratorPage;
