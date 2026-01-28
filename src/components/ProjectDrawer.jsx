import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, Layout, ArrowRight, Search, MoreVertical, Trash2, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = () => {
        try {
            const saved = localStorage.getItem('sketchon_projects');
            if (saved) {
                setProjects(JSON.parse(saved).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            } else {
                // Initial Example Data if empty
                setProjects([
                    { id: 'ex-1', title: 'Food Delivery App', updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), thumbnail: null }, // 10 mins ago
                    { id: 'ex-2', title: 'Portfolio Website', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), thumbnail: null }, // Yesterday
                ]);
            }
        } catch (e) {
            console.error("Failed to load projects", e);
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem('sketchon_projects', JSON.stringify(updated));
    };

    const handleSelect = (project) => {
        navigate(`/generate?id=${project.id}&q=${encodeURIComponent(project.title)}`);
        onClose();
    };

    const handleNewProject = () => {
        navigate('/');
        onClose();
    };

    // Grouping Logic
    const groupedProjects = projects.reduce((groups, project) => {
        const date = new Date(project.updatedAt);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        let key = 'Earlier';
        if (diffDays === 0) key = 'Recent';
        else if (diffDays === 1) key = 'Yesterday';
        else if (diffDays <= 30) key = 'Last 30 Days';

        if (!groups[key]) groups[key] = [];
        groups[key].push(project);
        return groups;
    }, {});

    const sections = ['Recent', 'Yesterday', 'Last 30 Days', 'Earlier'];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-[400px] bg-[#09090b] border-l border-white/10 shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#09090b]">
                            <h2 className="text-lg font-bold text-white font-['Outfit']">My Projects</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Actions */}
                        <div className="p-4 space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Project List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {sections.map(section => {
                                const sectionProjects = groupedProjects[section]?.filter(p =>
                                    (p.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
                                ) || [];

                                if (sectionProjects.length === 0) return null;

                                return (
                                    <div key={section}>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">{section}</h3>
                                        <div className="space-y-3">
                                            {sectionProjects.map(project => (
                                                <div
                                                    key={project.id}
                                                    onClick={() => handleSelect(project)}
                                                    className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/10"
                                                >
                                                    {/* Thumbnail Placeholder */}
                                                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                                                        {project.thumbnail ? (
                                                            <img src={project.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        ) : (
                                                            <Layout size={20} className="text-slate-600" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-white truncate transition-colors">
                                                            {project.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                            <Monitor size={10} />
                                                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => handleDelete(e, project.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 text-slate-500 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {projects.length === 0 && (
                                <div className="text-center py-10 text-slate-500">
                                    <Clock size={40} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">No projects found.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 text-center">
                            <p className="text-[10px] text-slate-600">
                                Projects are stored locally in your browser.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProjectDrawer;
