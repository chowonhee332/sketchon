import React, { useState, useContext } from 'react';
import { Save, ShieldCheck, AlertCircle, Key, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserContext } from '../../App';

const ApiSettings = () => {
    const { apiKey, saveApiKey } = useContext(UserContext);
    const [localKey, setLocalKey] = useState(apiKey);
    const [isValidating, setIsValidating] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'

    const handleSave = () => {
        saveApiKey(localKey);
        setStatus('idle');
    };

    const handleValidate = () => {
        setIsValidating(true);
        // Mock validation logic
        setTimeout(() => {
            if (localKey.startsWith('AIza') && localKey.length > 20) {
                setStatus('valid');
            } else {
                setStatus('invalid');
            }
            setIsValidating(false);
        }, 1200);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">API Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Configure your external AI service keys for research and generation.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                        <Key size={20} className="flex-shrink-0" />
                        <p className="text-sm font-medium">Your API keys are stored locally in your browser and are never sent to our servers except when performing requests.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Google Gemini API Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="password"
                                        placeholder="AIzaSy••••••••••••••••••••••••"
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={localKey}
                                        onChange={(e) => setLocalKey(e.target.value)}
                                    />
                                    {status === 'valid' && <ShieldCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                                    {status === 'invalid' && <AlertCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                                </div>
                                <Button
                                    onClick={handleValidate}
                                    disabled={isValidating || !localKey}
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl border-slate-200 flex items-center gap-2"
                                >
                                    {isValidating ? <RefreshCw size={16} className="animate-spin" /> : 'Validate'}
                                </Button>
                            </div>
                            {status === 'invalid' && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">Invalid key format. Google API keys usually start with 'AIza'.</p>}
                            {status === 'valid' && <p className="text-xs text-green-600 mt-1 ml-1 font-medium">Key validated successfully.</p>}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={localKey === apiKey}
                                className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200"
                            >
                                <Save size={18} />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">How to manage?</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        This key is used for both Design Analysis and UI Generation.
                        By default, the system uses the <b>VITE_GEMINI_API_KEY</b> defined in the server environment,
                        but you can override it here for your current session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiSettings;
