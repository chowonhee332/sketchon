import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_SYSTEM_PROMPT } from "../constants/prompts";

const MODEL_MAPPING = {
    'gemini-3-flash': 'gemini-3-flash-preview',
    'gemini-3-pro': 'gemini-3-pro-preview',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash'
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

const REFINEMENT_SYSTEM_PROMPT = (deviceType, targetHtml) => `
You are a World-Class UI Designer. You are EDITING a specific section of an existing HTML design.
The design style is Toss (Smart, Simple, Bold).

[TARGET ELEMENTS TO REVISE]:
${targetHtml}

[YOUR MISSION]:
1. You MUST only modify the HTML snippet provided above. 
2. Maintain the exact same Tailwind classes, colors, and design language as the rest of the site.
3. If the user asks for a text change, change the text. If they ask for a color change, change the classes.
4. Output ONLY the refined HTML block. Do NOT include #canvas-root or headers unless they were part of the target.
5. Provide a brief explanation of what you changed (max 2 sentences).

The response MUST be a valid JSON object: { "explanation": "...", "code": "..." }.
The "code" field should contain ONLY the modified HTML snippet for the targeted section.
`;

const MAIN_SYSTEM_PROMPT = (deviceType) => `
${SYSTEM_PROMPT(deviceType)}
`;

export const v0 = async (prompt, history = [], modelId = 'gemini-2.0-flash', deviceType = 'mobile', attachments = [], isRefinement = false, targetHtml = null) => {
    const key = getGeminiKey();
    if (!key) throw new Error("API Key가 설정되지 않았습니다. 설정에서 등록해주세요.");

    const modelMapping = {
        'gemini-3-flash': 'gemini-3-flash-preview',
        'gemini-3-pro': 'gemini-3-pro-preview',
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'gemini-2.0-flash': 'gemini-2.0-flash'
    };

    const targetModel = modelMapping[modelId] || modelId || 'gemini-3-pro-preview';

    const instance = getGenAI();

    const runGeneration = async (modelName) => {
        const model = instance.getGenerativeModel({
            model: modelName,
            systemInstruction: isRefinement ? REFINEMENT_SYSTEM_PROMPT(deviceType, targetHtml) : MAIN_SYSTEM_PROMPT(deviceType),
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

        if (targetModel !== 'gemini-3-pro-preview') {
            try {
                console.log("Attempting automatic fallback to gemini-3-pro-preview...");
                const text = await runGeneration('gemini-3-pro-preview');
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

export const analyzePrompt = async (prompt, modelId = 'gemini-3-pro-preview') => {
    // Standard model mapping for guaranteed availability
    const modelMapping = {
        'gemini-3-flash': 'gemini-3-flash-preview',
        'gemini-3-pro': 'gemini-3-pro-preview',
        'Gemini 3 Flash': 'gemini-3-flash-preview',
        'Gemini 3 Pro': 'gemini-3-pro-preview',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'Gemini 2.0 Flash': 'gemini-2.0-flash'
    };

    const targetModel = modelMapping[modelId] || modelId || 'gemini-3-pro-preview';
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
        smartRecommendations: [],
        assetSubject: "",
        explanation: "AI 기반 프로젝트 설계가 완료되었습니다."
    };

    try {
        const instance = getGenAI();
        const model = instance.getGenerativeModel({
            model: targetModel,
            systemInstruction: ANALYSIS_SYSTEM_PROMPT
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
                    explanation: data.explanation || defaults.explanation,
                    smartRecommendations: data.smartRecommendations || defaults.smartRecommendations,
                    assetSubject: data.assetSubject || defaults.assetSubject
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
