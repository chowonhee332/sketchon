import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get API Key with priority: localStorage > Env
export const getGeminiKey = () => {
    const savedKey = localStorage.getItem('VITE_GEMINI_API_KEY');
    return savedKey || import.meta.env.VITE_GEMINI_API_KEY;
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
You are a Senior UI/UX Strategy Consultant.
Your task is to analyze the user's request and build a "Project Blueprint" for a high-fidelity UI design.
Even if the user provides very little input, use your expert intuition to fill in the blanks with professional, high-conversion strategies.

Return ONLY valid JSON with the following fields:
- "serviceName": Name of the service (e.g., "Aegis Pay").
- "coreValue": The fundamental value proposition (e.g., "Frictionless Security").
- "coreTask": The main action users perform (e.g., "Real-time Fraud Monitoring").
- "targetUser": Specific persona (e.g., "Security-conscious Crypto Investors").
- "painPoint": Current user frustration (e.g., "High latency in transaction approval").
- "solution": How the UI solves the pain point (e.g., "One-tap biometric verification").
- "hierarchy": Key elements ranked by priority (e.g., "1st: Wealth Overview, 2nd: Safety Status").
- "visualStyle": Specific visual keywords (e.g., "Layered Depth, Glassmorphism, Neon Blue Accents").
- "techStack": Recommendations (e.g., "React, Tailwind, Framer Motion").
- "explanation": Professional rationale in Korean (Expert tone).
`;

export const v0 = async (prompt, history = [], modelId = 'gemini-1.5-flash', deviceType = 'mobile', attachments = []) => {
    const key = getGeminiKey();
    if (!key) throw new Error("API Key가 설정되지 않았습니다. 설정에서 등록해주세요.");

    // UI에서 넘어온 이름을 실제 API용 ID로 매핑 (안정성을 위해 1.5/2.0 위주로 강제 매핑)
    const modelMapping = {
        'Gemini 3 Pro': 'gemini-1.5-pro',
        'Gemini 3 Flash': 'gemini-1.5-flash-001',
        'gemini-3-pro': 'gemini-1.5-pro',
        'gemini-3-flash': 'gemini-1.5-flash-001',
        'Gemini 2.0 Flash': 'gemini-2.0-flash',
        'Gemini 1.5 Pro': 'gemini-1.5-pro',
        'Gemini 1.5 Flash': 'gemini-1.5-flash-001'
    };

    const targetModel = modelMapping[modelId] || modelId || 'gemini-1.5-flash-001';

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

export const analyzePrompt = async (prompt) => {
    const targetModel = 'gemini-1.5-flash-001'; // 분석용은 가장 빠르고 안정적인 모델 사용
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
