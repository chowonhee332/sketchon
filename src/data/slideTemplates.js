/**
 * 8-Slide Presentation Template
 * Professional proposal structure for SI/ITO projects
 */

export const slideTemplates = {
    // Slide 1: Cover
    cover: {
        title: "프로젝트 제안서",
        sections: [
            { key: "projectName", label: "프로젝트명" },
            { key: "date", label: "제안일" },
            { key: "company", label: "제안사" }
        ]
    },

    // Slide 2: Executive Summary
    executiveSummary: {
        title: "Executive Summary",
        subtitle: "프로젝트 개요 및 핵심 가치",
        dataSource: "strategicContext",
        sections: [
            { key: "projectBackground", label: "사업 배경", type: "paragraph" },
            { key: "visionGoals", label: "핵심 목표", type: "bullets" },
            { key: "coreRequirements", label: "주요 요구사항", type: "bullets" }
        ]
    },

    // Slide 3: Market Intelligence
    marketIntelligence: {
        title: "Market Intelligence",
        subtitle: "시장 분석 및 기술 트렌드",
        dataSource: "intelligence",
        sections: [
            { key: "marketDynamics", label: "시장 동향", type: "paragraph" },
            { key: "techStack", label: "기술 스택 제안", type: "bullets" },
            { key: "trendInsight", label: "시사점", type: "paragraph" }
        ]
    },

    // Slide 4: Competitive Analysis
    competitiveAnalysis: {
        title: "Competitive Analysis",
        subtitle: "경쟁 분석 및 차별화 전략",
        dataSource: "benchmark",
        sections: [
            { key: "comparativeAnalysis", label: "경쟁사 분석", type: "comparison" },
            { key: "gapAnalysis", label: "차별화 포인트 (USP)", type: "bullets" },
            { key: "benchmarkReference", label: "핵심 성공 요인 (KSF)", type: "bullets" }
        ]
    },

    // Slide 5: User Experience Strategy
    userExperience: {
        title: "User Experience Strategy",
        subtitle: "사용자 중심 설계 전략",
        dataSource: "userStrategy",
        sections: [
            { key: "personaNeeds", label: "페르소나 및 Pain Points", type: "personas" },
            { key: "experienceJourney", label: "사용자 여정", type: "journey" },
            { key: "logicPrinciple", label: "UX 원칙", type: "bullets" }
        ]
    },

    // Slide 6: UI Concept
    uiConcept: {
        title: "UI Design Concept",
        subtitle: "비주얼 디자인 컨셉 및 시안",
        dataSource: "implementation",
        sections: [
            { key: "uiConcept.visualMetaphor", label: "비주얼 메타포", type: "paragraph" },
            { key: "uiConcept.colorScheme", label: "컬러 시스템", type: "colorPalette" },
            { key: "uiConcept.designTheme", label: "디자인 테마", type: "paragraph" },
            { key: "generatedUI", label: "UI 시안", type: "image" }
        ]
    },

    // Slide 7: Implementation Plan
    implementationPlan: {
        title: "Implementation Plan",
        subtitle: "기술 아키텍처 및 수행 방안",
        dataSource: "implementation",
        sections: [
            { key: "informationArchitecture", label: "정보 구조 (IA)", type: "architecture" },
            { key: "techExecutionPlan.methodology", label: "수행 방법론", type: "paragraph" },
            { key: "techExecutionPlan.techStack", label: "기술 스택", type: "bullets" },
            { key: "techExecutionPlan.operationStrategy", label: "운영 전략", type: "paragraph" }
        ]
    },

    // Slide 8: Closing
    closing: {
        title: "Thank You",
        subtitle: "제안을 마치며",
        sections: [
            { key: "summary", label: "제안 요약", type: "paragraph" },
            { key: "nextSteps", label: "향후 일정", type: "bullets" },
            { key: "contact", label: "연락처", type: "contact" }
        ]
    }
};

/**
 * Generate presentation data from analysis modules
 * @param {Object} analysisData - Full analysis data
 * @param {Array} selectedModules - Selected module IDs
 * @param {String} generatedUIUrl - URL of generated UI screenshot
 * @returns {Array} - Array of slide data
 */
export function generatePresentationData(analysisData, selectedModules, generatedUIUrl = null) {
    const slides = [];
    const metadata = analysisData.metadata || {};

    // Slide 1: Cover
    slides.push({
        ...slideTemplates.cover,
        data: {
            projectName: metadata.keyword || "프로젝트명",
            date: new Date().toLocaleDateString('ko-KR'),
            company: "Sketchon AI"
        }
    });

    // Slide 2: Executive Summary (if strategicContext selected)
    if (selectedModules.includes('strategicContext') && analysisData.strategicContext) {
        slides.push({
            ...slideTemplates.executiveSummary,
            data: analysisData.strategicContext
        });
    }

    // Slide 3: Market Intelligence (if intelligence selected)
    if (selectedModules.includes('intelligence') && analysisData.intelligence) {
        slides.push({
            ...slideTemplates.marketIntelligence,
            data: analysisData.intelligence
        });
    }

    // Slide 4: Competitive Analysis (if benchmark selected)
    if (selectedModules.includes('benchmark') && analysisData.benchmark) {
        slides.push({
            ...slideTemplates.competitiveAnalysis,
            data: analysisData.benchmark
        });
    }

    // Slide 5: User Experience (if userStrategy selected)
    if (selectedModules.includes('userStrategy') && analysisData.userStrategy) {
        slides.push({
            ...slideTemplates.userExperience,
            data: analysisData.userStrategy
        });
    }

    // Slide 6: UI Concept (if implementation selected)
    if (selectedModules.includes('implementation') && analysisData.implementation) {
        slides.push({
            ...slideTemplates.uiConcept,
            data: {
                ...analysisData.implementation,
                generatedUI: generatedUIUrl
            }
        });
    }

    // Slide 7: Implementation Plan (if implementation selected)
    if (selectedModules.includes('implementation') && analysisData.implementation) {
        slides.push({
            ...slideTemplates.implementationPlan,
            data: analysisData.implementation
        });
    }

    // Slide 8: Closing
    slides.push({
        ...slideTemplates.closing,
        data: {
            summary: `${metadata.keyword} 프로젝트를 위한 전략적 제안을 완료했습니다.`,
            nextSteps: [
                "제안서 검토 및 피드백",
                "상세 기획 및 디자인 작업",
                "개발 착수 및 1차 프로토타입",
                "테스트 및 최종 배포"
            ],
            contact: {
                email: "contact@sketchon.ai",
                phone: "+82-2-1234-5678"
            }
        }
    });

    return slides;
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {String} path - Dot notation path (e.g., "uiConcept.colorScheme")
 * @returns {*} - Value at path
 */
export function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
