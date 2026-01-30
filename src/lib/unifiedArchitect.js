import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiKey } from './gemini';

const genAI = new GoogleGenerativeAI(getGeminiKey());

// Re-initialize genAI before major calls to handle dynamic key updates from UI
const getUpdatedGenAI = () => new GoogleGenerativeAI(getGeminiKey());

const SYSTEM_PROMPT = `
Role: Unified Project Architect & Strategy Engine

당신은 'Sketchon'의 핵심 AI 엔진입니다. UI/UX 리뉴얼부터 SI/ITO 대규모 구축 사업까지 모든 IT 프로젝트에서 승리할 수 있는 [분석-설계-제작-제안] 데이터 모델을 생성하십시오.

Task: [ANALYZE] Modular Data Generation

아래 5개 카테고리별로 독립적인 모듈 데이터를 생성하십시오. 각 모듈은 PPT 장표에 바로 사용할 수 있는 전문가 톤의 문장으로 작성되어야 합니다.

1. Strategic Context (사업의 이해 및 목표)
   - projectBackground: 사업 추진의 근본적 배경 및 비즈니스 환경 분석 (3-4문장)
   - visionGoals: 프로젝트가 지향하는 핵심 가치 및 정량적/정성적 목표 (3-4개 bullet points)
   - coreRequirements: RFP 기반 핵심 요구사항 및 기술적/사업적 제약 조건 (3-4개 bullet points)

2. Intelligence & Insight (시장 및 환경 분석)
   - marketDynamics: 실시간 검색 기반 산업 트렌드 및 기술 성숙도 분석 (3-4문장)
   - techStack: 적용 가능한 최신 기술 트레이드오프 및 법적 가이드라인 (3-4개 bullet points)
   - trendInsight: 도출된 데이터를 바탕으로 한 프로젝트 시사점 (2-3문장)

3. Benchmark & Differentiation (경쟁 분석 및 차별화)
   - comparativeAnalysis: 경쟁/유사 서비스의 UI/UX 패턴 및 기능 구현 방식 비교 (3-4개 서비스, 각 2-3문장). 반드시 각 서비스의 대표 홈페이지 URL을 포함하십시오.
   - gapAnalysis: 경쟁사의 한계를 극복하는 우리만의 독보적 차별화 전략 (3-4개 USP)
   - benchmarkReference: 벤치마킹을 통해 도출된 핵심 성공 요인 (3-4개 KSF)

4. User & Experience Strategy (사용자 경험 전략)
   - personaNeeds: 페르소나 정의 및 타겟층의 행동 패턴과 Pain Points (2-3개 페르소나, 각 3-4개 pain points)
   - experienceJourney: 사용자 유입부터 목표 달성까지의 최적화된 저니 맵 (5-7단계)
   - logicPrinciple: 디자인의 당위성을 뒷받침하는 UX 원칙 및 인터랙션 로직 (3-4개 원칙)

5. Implementation & Architecture (설계 및 수행 방안)
   - informationArchitecture: 메뉴 위계, 기능 정의 및 서비스 전체 구조도 (계층 구조)
   - uiConcept: 비주얼 메타포, 컬러 시스템(Hex 코드 포함), 타이포그래피, 디자인 테마 정의
   - techExecutionPlan: 프로젝트 수행 방법론, 기술 스택 제안, 운영/관리 전략 (SI/ITO 특화)

출력 형식: 반드시 아래 JSON 구조를 정확히 따르십시오.

{
  "strategicContext": {
    "projectBackground": "string",
    "visionGoals": ["string", "string", ...],
    "coreRequirements": ["string", "string", ...]
  },
  "intelligence": {
    "marketDynamics": "string",
    "techStack": ["string", "string", ...],
    "trendInsight": "string"
  },
  "benchmark": {
    "comparativeAnalysis": [
      { "service": "string", "analysis": "string", "url": "string (URL)" },
      ...
    ],
    "gapAnalysis": ["string", "string", ...],
    "benchmarkReference": ["string", "string", ...]
  },
  "userStrategy": {
    "personaNeeds": [
      { "persona": "string", "painPoints": ["string", ...] },
      ...
    ],
    "experienceJourney": ["string", "string", ...],
    "logicPrinciple": ["string", "string", ...]
  },
  "implementation": {
    "informationArchitecture": {
      "structure": "string (계층 구조 텍스트)"
    },
    "uiConcept": {
      "visualMetaphor": "string",
      "colorScheme": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": "string",
      "designTheme": "string"
    },
    "techExecutionPlan": {
      "methodology": "string",
      "techStack": ["string", ...],
      "operationStrategy": "string"
    }
  }
}

중요 지침:
- 사용자가 단어 하나만 입력해도 검색과 추론을 통해 SI/ITO 프로젝트에 필요한 '수행 전문성'이 느껴지는 문장으로 확장하십시오.
- 모든 텍스트는 PPT 장표에 바로 복사/붙여넣기 해도 손색없는 '전문가 톤(Professional Tone)'을 유지하십시오.
- 데이터 간의 연결성(Flow)을 고려하여, 앞부분의 분석이 뒷부분의 디자인과 구축 방안의 명확한 근거가 되게 하십시오.
- 반드시 유효한 JSON만 출력하십시오. 추가 설명이나 마크다운은 포함하지 마십시오.
`;

/**
 * Generate modular analysis using Gemini 2.0 Flash Thinking with Grounding
 * @param {Object} userInput - User input from modal
 * @returns {Promise<Object>} - 5-category modular analysis
 */
export async function generateModularAnalysis(userInput) {
  const { keyword, projectType, targetUser, goals, notes } = userInput;

  // Build user prompt
  const userPrompt = `
프로젝트 정보:
- 키워드: ${keyword}
- 프로젝트 유형: ${getProjectTypeLabel(projectType)}
- 타겟 사용자: ${targetUser || 'AI가 추론 필요'}
- 핵심 목표: ${goals || 'AI가 추론 필요'}
- 특이사항: ${notes || '없음'}

위 정보를 바탕으로 5대 카테고리 모듈 데이터를 생성해주세요.
`;

  // Always use a fresh key and instance inside the call
  const currentKey = getGeminiKey();
  if (!currentKey) {
    console.error("API Key is missing in generateModularAnalysis");
    throw new Error("API Key가 설정되지 않았습니다. 설정에서 등록해주세요.");
  }

  try {
    const freshGenAI = new GoogleGenerativeAI(currentKey);
    // [업그레이드] 기획안 분석에는 가장 강력한 Gemini 3 Pro Preview 사용
    const model = freshGenAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // Generate content
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response carefully
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI response did not contain JSON:", text);
      throw new Error('AI 응답에서 유효한 데이터를 찾을 수 없습니다.');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    return {
      ...analysisData,
      metadata: {
        keyword,
        projectType,
        targetUser: targetUser || 'AI 추론',
        goals: goals || 'AI 추론',
        notes: notes || '없음',
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Modular analysis failed:', error);
    // Fallback logic for graceful degradation
    return {
      strategicContext: {
        projectBackground: `${keyword} 프로젝트는 시장 요구와 사용자 가치 극대화를 위해 기획되었습니다.`,
        visionGoals: ["사용자 경험 혁신", "비즈니스 경쟁력 강화", "공정 프로세스 최적화"],
        coreRequirements: ["최신 설계 표준 준수", "데이터 보안성 확보", "사용자 접근성 개선"]
      },
      intelligence: {
        marketDynamics: "비대면 가속화와 지능형 서비스 수요가 증가하는 시장 환경입니다.",
        techStack: ["React", "Node.js", "Gemini AI"],
        trendInsight: "초개인화와 실시간 데이터 기반의 의사결정이 서비스의 핵심입니다."
      },
      benchmark: {
        comparativeAnalysis: [
          { service: "Leading Service A", analysis: "직관적인 인터페이스와 빠른 응답성 보유", url: "#" },
          { service: "Global Platform B", analysis: "차별화된 개인화 추천 알고리즘 적용", url: "#" }
        ],
        gapAnalysis: ["실시간 피드백 모듈 강화", "UI/UX 심미성 고도화"],
        benchmarkReference: ["모듈형 디자인 시스템", "사용자 데이터 대시보드"]
      },
      userStrategy: {
        personaNeeds: [
          { persona: "핵심 타겟 그룹", painPoints: ["복잡한 워크플로우", "정보의 불일치"] }
        ],
        experienceJourney: ["탐색", "관심", "행동", "만족", "재방문"],
        logicPrinciple: ["직관적 UI 설계", "피드백의 일관성 유지"]
      },
      implementation: {
        informationArchitecture: { structure: "Home > Feature Group > Detail > Support" },
        uiConcept: {
          visualMetaphor: "Core Focus",
          colorScheme: { primary: "#3182F6", secondary: "#4E5968", accent: "#00D4B1", background: "#FFFFFF", text: "#161618" },
          typography: "Sans-serif System",
          designTheme: "Clean & Modern"
        },
        techExecutionPlan: {
          methodology: "Agile Development",
          techStack: ["Modern Frontend Stack"],
          operationStrategy: "Stability first"
        }
      },
      metadata: {
        keyword,
        projectType,
        targetUser,
        goals,
        generatedAt: new Date().toISOString(),
        isFallback: true,
        error: error.message
      }
    };
  }
}

/**
 * Get project type label
 */
function getProjectTypeLabel(typeId) {
  const types = {
    'ui-ux': 'UI/UX 리뉴얼',
    'web-app': '웹/앱 개발',
    'si-ito': 'SI/ITO 구축 사업',
    'other': '기타'
  };
  return types[typeId] || typeId;
}

/**
 * Build UI prompt from Implementation module
 * @param {Object} uiConcept - UI concept from implementation module
 * @returns {string} - Formatted prompt for Creon API
 */
export function buildUIPrompt(uiConcept) {
  if (!uiConcept) return "Create a modern premium UI design.";

  const { visualMetaphor = 'Modern', colorScheme = {}, typography = 'Sans-serif', designTheme = 'Premium' } = uiConcept;
  const colors = colorScheme || {};

  return `
디자인 컨셉:
- 비주얼 메타포: ${visualMetaphor}
- 디자인 테마: ${designTheme}
- 타이포그래피: ${typography}

컬러 시스템:
- Primary: ${colors.primary || '#3182F6'}
- Secondary: ${colors.secondary || '#4E5968'}
- Accent: ${colors.accent || '#00D4B1'}
- Background: ${colors.background || '#161618'}
- Text: ${colors.text || '#FFFFFF'}

위 컨셉을 반영하여 현대적이고 전문적인 UI를 생성해주세요.
`.trim();
}
