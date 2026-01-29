import React from 'react';
import { Search, Brain, Palette, FileText, CheckCircle, Loader } from 'lucide-react';

const AnalysisProgress = ({ status, currentStep, totalSteps }) => {
    const steps = [
        {
            id: 'input',
            icon: Search,
            label: '사용자 입력 수집',
            description: '프로젝트 정보 확인'
        },
        {
            id: 'analysis',
            icon: Brain,
            label: 'AI 분석 중',
            description: `${currentStep}/${totalSteps} 카테고리 완료`
        },
        {
            id: 'ui',
            icon: Palette,
            label: 'UI 생성 대기',
            description: '디자인 컨셉 준비'
        },
        {
            id: 'delivery',
            icon: FileText,
            label: '제안서 합성 대기',
            description: '최종 결과물 생성'
        }
    ];

    const getStepStatus = (stepId) => {
        if (status === 'input' && stepId === 'input') return 'active';
        if (status === 'analyzing' && stepId === 'input') return 'complete';
        if (status === 'analyzing' && stepId === 'analysis') return 'active';
        if (status === 'complete' && (stepId === 'input' || stepId === 'analysis')) return 'complete';
        if (status === 'generating-ui' && stepId === 'ui') return 'active';
        if (status === 'generating-ui' && (stepId === 'input' || stepId === 'analysis')) return 'complete';
        if (status === 'synthesizing' && stepId === 'delivery') return 'active';
        if (status === 'synthesizing' && stepId !== 'delivery') return 'complete';
        if (status === 'done') return 'complete';
        return 'pending';
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-8">
            <div className="space-y-6">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const stepStatus = getStepStatus(step.id);

                    return (
                        <div key={step.id} className="relative">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`absolute left-6 top-14 w-0.5 h-12 transition-all ${stepStatus === 'complete' ? 'bg-green-500' : 'bg-white/10'
                                        }`}
                                />
                            )}

                            {/* Step Card */}
                            <div
                                className={`relative flex items-start gap-4 p-4 rounded-lg border transition-all ${stepStatus === 'active'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : stepStatus === 'complete'
                                            ? 'border-green-500/50 bg-green-500/5'
                                            : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${stepStatus === 'active'
                                            ? 'bg-blue-500 text-white'
                                            : stepStatus === 'complete'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    {stepStatus === 'complete' ? (
                                        <CheckCircle size={24} />
                                    ) : stepStatus === 'active' ? (
                                        <Loader size={24} className="animate-spin" />
                                    ) : (
                                        <Icon size={24} />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={`font-medium mb-1 ${stepStatus === 'active'
                                                ? 'text-white'
                                                : stepStatus === 'complete'
                                                    ? 'text-green-400'
                                                    : 'text-white/40'
                                            }`}
                                    >
                                        {step.label}
                                    </h3>
                                    <p
                                        className={`text-sm ${stepStatus === 'active'
                                                ? 'text-blue-300'
                                                : stepStatus === 'complete'
                                                    ? 'text-green-300/60'
                                                    : 'text-white/30'
                                            }`}
                                    >
                                        {step.description}
                                    </p>

                                    {/* Progress Bar for Analysis Step */}
                                    {step.id === 'analysis' && stepStatus === 'active' && (
                                        <div className="mt-3">
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Estimated Time */}
            {status === 'analyzing' && (
                <div className="mt-6 text-center">
                    <p className="text-white/40 text-sm">
                        예상 소요 시간: {Math.max(1, Math.ceil((totalSteps - currentStep) * 3))}초
                    </p>
                </div>
            )}
        </div>
    );
};

export default AnalysisProgress;
