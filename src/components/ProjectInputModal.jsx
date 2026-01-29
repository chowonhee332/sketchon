import React, { useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

const ProjectInputModal = ({ isOpen, onClose, onSubmit, initialKeyword = '' }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        keyword: initialKeyword,
        projectType: '',
        targetUser: '',
        goals: '',
        notes: ''
    });

    const projectTypes = [
        { id: 'ui-ux', label: 'UI/UX 리뉴얼', icon: '🎨' },
        { id: 'web-app', label: '웹/앱 개발', icon: '💻' },
        { id: 'si-ito', label: 'SI/ITO 구축 사업', icon: '🏢' },
        { id: 'other', label: '기타', icon: '✨' }
    ];

    const handleNext = () => {
        if (step === 1 && !formData.keyword.trim()) {
            alert('키워드를 입력해주세요');
            return;
        }
        if (step === 2 && !formData.projectType) {
            alert('프로젝트 유형을 선택해주세요');
            return;
        }
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    const handleSkip = () => {
        handleSubmit();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-8 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="text-blue-400" size={24} />
                        <h2 className="text-2xl font-bold text-white">AI 프로젝트 분석</h2>
                    </div>
                    <p className="text-white/60 text-sm">
                        최소한의 정보만 입력하시면 AI가 완벽한 기획을 만들어드립니다
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="px-8 pt-6">
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center flex-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s === step
                                            ? 'bg-blue-500 text-white'
                                            : s < step
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 3 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 rounded transition-all ${s < step ? 'bg-green-500' : 'bg-white/10'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                    {/* Step 1: Keyword */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-white font-medium mb-2 block">
                                    프로젝트 키워드 <span className="text-red-400">*</span>
                                </span>
                                <input
                                    type="text"
                                    value={formData.keyword}
                                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                    placeholder="예: 쇼핑몰, 병원 예약 시스템, 공공기관 포털"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                                    autoFocus
                                />
                            </label>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-blue-300 text-sm">
                                    💡 단어 하나만 입력해도 괜찮습니다. AI가 자동으로 완벽한 분석을 수행합니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Project Type */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-white font-medium mb-3 block">
                                    프로젝트 유형 <span className="text-red-400">*</span>
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    {projectTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, projectType: type.id })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${formData.projectType === type.id
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">{type.icon}</div>
                                            <div className="text-white font-medium">{type.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Step 3: Additional Info */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <p className="text-white/60 text-sm">
                                    아래 정보는 선택사항입니다. 입력하지 않으셔도 AI가 자동으로 추론합니다.
                                </p>
                            </div>

                            <label className="block">
                                <span className="text-white font-medium mb-2 block">타겟 사용자</span>
                                <input
                                    type="text"
                                    value={formData.targetUser}
                                    onChange={(e) => setFormData({ ...formData, targetUser: e.target.value })}
                                    placeholder="예: 20-30대 여성, 기업 담당자, 공무원"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </label>

                            <label className="block">
                                <span className="text-white font-medium mb-2 block">핵심 목표</span>
                                <input
                                    type="text"
                                    value={formData.goals}
                                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                    placeholder="예: 전환율 향상, 업무 효율화, 사용자 경험 개선"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </label>

                            <label className="block">
                                <span className="text-white font-medium mb-2 block">특이사항</span>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="예: 반응형 필수, 보안 인증 필요, 다국어 지원"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                            >
                                이전
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {step === 3 && (
                            <button
                                onClick={handleSkip}
                                className="px-6 py-2 text-white/60 hover:text-white transition-colors"
                            >
                                건너뛰기
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            {step === 3 ? (
                                <>
                                    <Sparkles size={18} />
                                    AI 분석 시작
                                </>
                            ) : (
                                <>
                                    다음
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectInputModal;
