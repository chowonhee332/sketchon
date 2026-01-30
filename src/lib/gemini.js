import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_MAPPING = {
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash'
};

// MASTER_KEY removed for security. Please set VITE_GEMINI_API_KEY in your deployment environment (Vercel, Netlify, etc.)
const MASTER_KEY = "";

export const getGeminiKey = () => {
    // Priority: LocalStorage (User customized) > .env > Hardcoded Master
    const savedKey = localStorage.getItem('VITE_GEMINI_API_KEY');
    return savedKey || import.meta.env.VITE_GEMINI_API_KEY || MASTER_KEY;
};

// genAI will be created fresh inside functions to ensure the latest key is used
let genAIInstance = null;
const getGenAI = () => {
    const key = getGeminiKey();
    if (!key) throw new Error("API Key가 설정되지 않았습니다. 설정에서 등록해주세요.");
    return new GoogleGenerativeAI(key);
};


export const updateGenAIContent = (newKey) => {
    localStorage.setItem('VITE_GEMINI_API_KEY', newKey);
    // Future calls will use the new key via getGenAI()
};

const SYSTEM_PROMPT = (deviceType) => `
You are a World-Class Senior UI/UX Designer and Frontend Expert.
Your goal is to generate high-fidelity, professional UI designs for ${deviceType === 'mobile' ? 'Mobile Applications' : 'Web Applications'}.

### UI Design Framework:
1. **Output Format**: Generate ONLY pure HTML with Tailwind CSS classes.
2. **NO REACT**: Do NOT use React components, JSX specific syntax, imports, or exports.
3. **Container**: Wrap everything in a single <div id="canvas-root">.
4. **Icons**: Use SVG paths or emojis for icons. Do not use lucide-react or any other library.
5. **Aesthetics**: Apply 2026 trends like 'Layered Depth', 'Bento Grid', and 'Glassmorphism'. Use premium dark modes and sophisticated gradients.
6. **Responsiveness**: Ensure the design is highly responsive using Tailwind's layout utilities.

The response MUST be a valid JSON object: { "explanation": "...", "code": "..." }.
The "code" field should contain the raw HTML string.
`;

const ANALYSIS_PROMPT = `
당신은 세계 최고 수준의 UI/UX 전략 컨설턴트입니다.
사용자의 요청을 분석하여 고품질 UI 디자인을 위한 "프로젝트 블루프린트"를 생성하는 것이 당신의 임무입니다.
사용자가 아주 짧은 입력을 제공하더라도, 당신의 전문가적 직관을 사용하여 비즈니스 로직, 사용자의 페인포인트, 시각적 계층 구조를 전문적으로 추론하세요.

응답은 반드시 다음 필드를 포함하는 유효한 JSON 객체여야 합니다:
- "serviceName": 서비스 이름 (예: "Aegis Pay").
- "coreValue": 핵심 가치 제안 (예: "마찰 없는 보안").
- "coreTask": 사용자가 수행하는 주요 작업 (예: "실시간 부정 거래 모니터링").
- "targetUser": 구체적인 사용자 페르소나 (예: "보안에 민감한 암호화폐 투자자").
- "painPoint": 현재 사용자의 불만 사항 (예: "거래 승인의 높은 지연 시간").
- "solution": UI가 이 페인포인트를 해결하는 방법 (예: "원탭 생체 인증").
- "hierarchy": 우선순위별 주요 요소 (예: "1순위: 자산 개요, 2순위: 안전 상태").
- "visualStyle": 구체적인 시각적 키워드 (예: "레이어드 뎁스, 글래스모피즘, 네온 블루 엑센트").
- "techStack": 권장 기술 (예: "React, Tailwind, Framer Motion").
- "explanation": 한국어로 된 전문적인 분석 근거 (전문가 톤으로 상세히 작성).
`;

export const v0 = async (prompt, history = [], modelId = 'gemini-2.0-flash', deviceType = 'mobile', attachments = []) => {
    const key = getGeminiKey();
    if (!key) throw new Error("API Key가 설정되지 않았습니다. 설정에서 등록해주세요.");

    const modelMapping = {
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'gemini-2.5-flash': 'gemini-2.5-flash',
        'gemini-2.0-pro': 'gemini-2.0-pro-exp-02-05',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro',
        'gemini-1.5-flash': 'gemini-1.5-flash'
    };

    const targetModel = modelMapping[modelId] || modelId || 'gemini-2.0-flash';

    const instance = getGenAI();

    const runGeneration = async (modelName) => {
        const model = instance.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT(deviceType),
            generationConfig: {
                maxOutputTokens: 8192,
            }
        });
        const chat = model.startChat({
            history: history,
        });

        // Construct the message parts
        let messageParts = [{ text: prompt }];

        // Check for attachments and add them
        if (attachments && attachments.length > 0) {
            const attachmentParts = attachments.map(att => ({
                inlineData: {
                    data: att.base64, // Expecting base64 string without prefix
                    mimeType: att.type
                }
            }));
            messageParts = [...messageParts, ...attachmentParts];
        }

        const result = await chat.sendMessage(messageParts);
        const response = await result.response;
        return response.text();
    };

    try {
        console.log(`Generating with model: ${targetModel}, Device: ${deviceType}, Attachments: ${attachments?.length || 0}`);
        const text = await runGeneration(targetModel);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);

            // Sanitization: Strip markdown backticks from code if AI included them
            if (result.code) {
                result.code = result.code.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
                // Also handle cases where imports might have sneaked in
                if (result.code.includes('import ') || result.code.includes('export default')) {
                    console.warn("AI generated React code. Attempting to strip boilerplate...");
                    result.code = result.code.replace(/import[\s\S]*?from[\s\S]*?;/g, '');
                    result.code = result.code.replace(/export default[\s\S]*?;/g, '');
                }
            }

            return result;
        }
        return { explanation: text || "AI가 답변을 생성했습니다.", code: "" };
    } catch (error) {
        console.error(`Model generation failed(${targetModel}): `, error);

        if (targetModel !== 'gemini-1.5-flash') {
            try {
                console.log("Attempting automatic fallback to gemini-1.5-flash...");
                const text = await runGeneration('gemini-1.5-flash');
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
            } catch (innerError) {
                console.error("Fallback also failed.");
            }
        }

        return {
            explanation: "AI 서비스 응답 오류",
            code: `<div style="padding: 40px; color: #ef4444; background: #fef2f2; border-radius: 20px; border: 1px solid #fee2e2; text-align: center; font-family: sans-serif;">
                <h2 style="font-weight: bold; font-size: 20px; margin-bottom: 16px;">UI 생성 중 오류가 발생했습니다</h2>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 24px;">${error.message}</p>
                <div style="font-size: 12px; background: white; padding: 12px; border-radius: 8px; display: inline-block;">
                    사용 시도 모델: <b>${targetModel}</b>
                </div>
            </div>`
        };
    }
};

export const analyzePrompt = async (prompt, modelId = 'gemini-2.0-flash') => {
    // 2026.01.30 기준 최신 모델 매핑 시스템 (Tier 1 & Preview 대응)
    const modelMapping = {
        'Gemini 3 Pro': 'gemini-3-pro-preview',
        'Gemini 3 Flash': 'gemini-3-flash-preview',
        'gemini-3-pro': 'gemini-3-pro-preview',
        'gemini-3-flash': 'gemini-3-flash-preview',
        'Gemini 2.0 Pro': 'gemini-2.0-pro-exp-02-05',
        'Gemini 2.0 Flash': 'gemini-2.0-flash',
        'Gemini 2.5 Pro': 'gemini-2.5-pro',
        'Gemini 2.5 Flash': 'gemini-2.5-flash'
    };

    const targetModel = modelMapping[modelId] || modelId || 'gemini-2.0-flash';
    const defaults = {
        serviceName: "New Project",
        coreValue: "Premium Experience",
        coreTask: "Core User Mission",
        targetUser: "Strategic Target",
        painPoint: "Inefficiency & Complexity",
        solution: "Intuitive & Logical UI",
        hierarchy: "1st: Primary Action, 2nd: Status",
        visualStyle: "Layered Depth, Glassmorphism",
        techStack: "React, Tailwind CSS",
        explanation: "AI 기반 프로젝트 설계가 완료되었습니다."
    };

    try {
        const instance = getGenAI();
        const model = instance.getGenerativeModel({
            model: targetModel,
            systemInstruction: ANALYSIS_PROMPT
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    ...defaults,
                    ...data,
                    painPoint: data.painPoint || defaults.painPoint,
                    solution: data.solution || defaults.solution,
                    coreValue: data.coreValue || defaults.coreValue,
                    explanation: data.explanation || defaults.explanation
                };
            } catch (e) {
                console.error("JSON parse inside analyzePrompt failed");
            }
        }

        return {
            ...defaults,
            explanation: "분석 데이터를 파싱할 수 없어 기본 템플릿을 생성했습니다."
        };
    } catch (error) {
        console.error("analyzePrompt error:", error);
        return {
            ...defaults,
            explanation: "분석 서비스 장애로 임시 설계를 작성했습니다."
        };
    }
};
