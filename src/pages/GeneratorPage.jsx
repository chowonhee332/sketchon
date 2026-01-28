import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import PreviewCanvas from '../components/PreviewCanvas';
import AnalyzeDashboard from '../components/AnalyzeDashboard';
import PresentationBuilder from '../components/PresentationBuilder';
import { v0 } from '../lib/gemini';
import { ChevronLeft, Share2, Download, Zap, Monitor, Tablet, Smartphone, Menu, PanelLeftClose, PanelLeftOpen, Edit3, CircleUser } from 'lucide-react';
import { Button } from "@/components/ui/button";
import creonLogo from '../assets/creon-logo.png';
import creonLogoWhite from '../assets/creon-logo-white.png';

const GeneratorPage = () => {
    const location = useLocation();
    const [messages, setMessages] = useState({
        research: [],
        ui: [],
        ppt: []
    });
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('gemini-3-pro-preview');
    const [deviceType, setDeviceType] = useState('mobile'); // 'mobile' | 'web'
    const [activeTab, setActiveTab] = useState('ui');
    const [viewMode, setViewMode] = useState('desktop');
    const [bgColor, setBgColor] = useState('#e5e5e5');
    const [selectedArtboard, setSelectedArtboard] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isCreonModalOpen, setIsCreonModalOpen] = useState(false);
    const [tempTitle, setTempTitle] = useState('');
    const [analyzeSubTab, setAnalyzeSubTab] = useState('all');

    const [projectTitle, setProjectTitle] = useState('Untitled Project');
    const hasInitialLoaded = React.useRef(false);
    const [panelWidth, setPanelWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const [projectId, setProjectId] = useState(null);

    // Initial load & ID management
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('q');
        const id = searchParams.get('id');
        const platform = searchParams.get('platform');

        if (platform) setDeviceType(platform);

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
                if (query) {
                    setProjectTitle(query.length > 20 ? query.substring(0, 20) + '...' : query);
                    handleSendMessage(query, currentModel, platform || deviceType);
                }
            }
            hasInitialLoaded.current = true;
        }
    }, [location.search]); // Listen to URL changes

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
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 1200) {
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
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
                // Payload structure: { type: 'image' | 'text', value: 'url' or 'text content' }

                if (payload.type === 'image') {
                    // Automatically add to chat
                    // We need to convert URL to base64 if possible or just handle URL. 
                    // For now, let's treat it as a user message with context.
                    setIsCreonModalOpen(false); // Close panel
                    handleSendMessage(`I found this visual reference in Creon: ${payload.value}. Please apply this style/image to the design.`, currentModel);
                } else if (payload.type === 'text') {
                    setIsCreonModalOpen(false);
                    handleSendMessage(`Ensure the design includes this content: "${payload.value}"`, currentModel);
                }
            }
        };

        window.addEventListener('message', handleCreonMessage);
        return () => window.removeEventListener('message', handleCreonMessage);
    }, [currentModel, activeTab]); // Re-bind if model changes (or remove dependency if handleSendMessage is stable)

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
            const result = await v0(contextInput, history, modelId, generationType, attachments);

            if (result.code) {
                setGeneratedCode(result.code);
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

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden font-['Inter']">
            {/* Header - Dark Mode */}
            {/* Header - Dark Mode */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between bg-[#050505] z-20 text-white pl-0 pr-4">
                <div className="flex items-center h-full border-r border-white/10 px-4 gap-3 w-[380px] shrink-0 transition-all duration-300 ease-in-out">
                    <Link to="/" className="text-slate-400 hover:text-white shrink-0 p-2 hover:bg-white/10 rounded-md transition-colors">
                        <ChevronLeft size={20} />
                    </Link>

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

                {/* Centered Tab Navigation */}
                <div className="absolute left-1/2 -translate-x-1/2 flex p-1 bg-white/5 rounded-lg border border-white/5">
                    {[
                        { id: 'research', label: 'Analyze', desc: 'RFP와 시장을 분석하여 논리적 근거를 만드는 단계' },
                        { id: 'ui', label: 'Visualize', desc: 'Creon 엔진으로 아이디어를 눈에 보이는 실체로 바꾸는 단계' },
                        { id: 'ppt', label: 'Deliver', desc: '분석과 시안을 엮어 최종 제안서로 완성하는 단계' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.desc}
                            className={`px-6 py-1.5 text-xs font-bold rounded-md transition-all tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 pr-4">
                    {/* Creon Logo Button */}
                    <button
                        className="relative group focus:outline-none transition-all duration-200"
                        onClick={() => setIsCreonModalOpen(!isCreonModalOpen)}
                    >
                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${isCreonModalOpen ? 'bg-blue-500 text-white shadow-blue-500/50 shadow-lg' : 'hover:scale-110'}`}>
                            <img
                                src={isCreonModalOpen ? creonLogoWhite : creonLogo}
                                alt="Creon"
                                className={`object-contain transition-all duration-200 ${isCreonModalOpen ? 'w-6 h-6' : 'w-full h-full p-0.5 opacity-90'}`}
                            />
                        </div>
                    </button>

                    {/* Profile Icon */}
                    <button className="relative group focus:outline-none transition-transform hover:scale-105">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-lg">
                            U
                        </div>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Dark Mode */}
                <div
                    className={`flex-shrink-0 bg-[#050505] border-r border-white/10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[380px]' : 'w-0 border-r-0 overflow-hidden'}`}
                >
                    <div className="w-[380px] h-full"> {/* Inner container to maintain width during animation */}
                        <ChatSidebar
                            messages={messages[activeTab] || []}
                            onSendMessage={(msg, model, attachments) => handleSendMessage(msg, model, undefined, attachments)}
                            isLoading={isLoading}
                            currentModel={currentModel}
                            onModelSelect={setCurrentModel}
                            selectedArtboard={selectedArtboard}
                            selectedArea={selectedArea}
                            onClearSelection={() => {
                                setSelectedArtboard(null);
                                setSelectedArea(null);
                            }}
                        />
                    </div>
                </div>

                {/* Main Content Area (Tabs) */}
                <div className="flex-1 min-w-0 bg-[#0a0a0a] relative flex flex-col overflow-hidden">
                    {/* Sub Tab Navigation for Analyze */}
                    {activeTab === 'research' && (
                        <div className="flex items-center gap-6 px-8 py-3 bg-[#0a0a0a] border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0 z-10 transition-all duration-300">
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
                            />
                        )}
                        {activeTab === 'ppt' && <PresentationBuilder />}

                        <div className={`w-full h-full flex flex-col ${activeTab === 'ui' ? 'block' : 'hidden'}`}>
                            {/* Canvas Controls (Lifted to Bottom-Left) */}
                            {/* Canvas Controls (Bottom-Left) */}
                            {activeTab === 'ui' && (
                                <div className="absolute bottom-6 left-6 z-[60] flex items-end gap-2">
                                    {/* Responsive Controls */}
                                    <div className="flex items-center gap-1 p-1 bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl">
                                        <button
                                            onClick={() => {
                                                setViewMode('desktop');
                                                setDeviceType('web');
                                            }}
                                            className={`p-2 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <Monitor size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('tablet');
                                                setDeviceType('web');
                                            }}
                                            className={`p-2 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <Tablet size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('mobile');
                                                setDeviceType('mobile');
                                            }}
                                            className={`p-2 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            <Smartphone size={16} />
                                        </button>
                                    </div>

                                    {/* Expandable Color Picker */}
                                    <div className="relative group">
                                        {/* Expanded Colors (Show on hover/group-focus or click) - Using CSS group-hover for simplicity or state */}
                                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl flex flex-col gap-2 transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0">
                                            {['#ffffff', '#f5f5f5', '#e5e5e5', '#1a1a1a'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setBgColor(color)}
                                                    className={`w-5 h-5 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-110 ${bgColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1e1e1e]' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>

                                        {/* Trigger Button (Current Color) */}
                                        <div className="p-2 bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl cursor-pointer">
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
                                deviceType={deviceType} // Note: Keeping code logic, but might want to sync with viewMode eventually
                                viewMode={viewMode}
                                bgColor={bgColor}
                                onSelectArtboard={setSelectedArtboard}
                                selectedArtboard={selectedArtboard}
                                onSelectArea={setSelectedArea}
                                selectedArea={selectedArea}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </main >
            {/* Rename Modal */}
            {isRenameModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Rename Project</h3>
                        <input
                            autoFocus
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500"
                            placeholder="Enter project name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setProjectTitle(tempTitle);
                                    setIsRenameModalOpen(false);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                className="text-slate-400 hover:text-white"
                                onClick={() => setIsRenameModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                                onClick={() => {
                                    setProjectTitle(tempTitle);
                                    setIsRenameModalOpen(false);
                                }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Creon Service Right Panel */}
            {/* Creon Service Right Panel */}
            <div
                className={`fixed top-[57px] bottom-0 right-0 z-[100] bg-[#1a1a1a] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isCreonModalOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: isCreonModalOpen ? `${panelWidth}px` : '0px' }}
            >
                {/* Resize Handle - Only for Web Mode (Responsive Testing) */}
                {deviceType === 'web' && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize transition-colors z-50"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                    />
                )}

                {/* Iframe Content - No Header */}
                <div className="flex-1 bg-white relative">
                    {isCreonModalOpen && (
                        <iframe
                            src="https://creon-umber.vercel.app/"
                            title="Creon Service"
                            className={`w-full h-full border-none ${isResizing ? 'pointer-events-none' : ''}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    )}
                </div>
            </div>
        </div >
    );
};

export default GeneratorPage;
