import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = (deviceType) => `
You are an expert UI/UX designer and frontend developer, equivalent to Google's "Stitch" AI.
Your goal is to generate high-fidelity, professional UI designs for ${deviceType === 'mobile' ? 'Mobile Applications' : 'Web Applications'}.

Follow these rules based on the platform:

${deviceType === 'mobile' ? `
1. MOBILE APP MODE:
   - Generate AT LEAST 2-3 logical mobile screens side-by-side in a horizontal flex container.
   - **CRITICAL**: Each screen MUST be a COMPLETELY SEPARATE separate DOM element wrapped in a distinct container.
   - **CRITICAL**: Use the attribute 'data-screen-id="screen-[N]"' for EACH screen container. (e.g., screen-1, screen-2).
   - Internally, each screen should be a 375x812 container with 'overflow-hidden rounded-xl border-[8px] border-slate-900 shadow-2xl bg-[#050505] relative'.
   - Include a "notch" and "status bar" for realism in every single screen.
   - Layout logic:
     <div class="flex gap-20 p-20 min-w-max items-start justify-center" id="canvas-root">
         <div data-screen-id="screen-1">...</div>
         <div data-screen-id="screen-2">...</div>
         <div data-screen-id="screen-3">...</div>
     </div>
` : `
1. WEB DESKTOP MODE:
   - Generate a single, full-width high-fidelity landing page or dashboard.
   - Use a modern, responsive layout with a navigation bar, hero section, and descriptive sections.
   - The design should be premium with deep blacks, glassmorphism, and elegant typography.
   - **CRITICAL**: Use the id "canvas-root" for the main wrapper.
   - Layout: <div class="w-full min-h-screen bg-[#050505] text-white" id="canvas-root">
`}

General Design Rules:
2. **STITCH AESTHETIC**: Use a dark-themed, premium aesthetic. Deep blacks (#050505), subtle borders (white/10), rounded corners (3xl), and vibrant accent colors.
3. **NO EXTERNAL NAVIGATION**: **NEVER** use <a> tags with real HREFs. Use <button> for interactions or <a href="#">. Clicking elements MUST NOT navigate the top-level page.
4. **CONTENT FOCUS**: Generate content based on the user's prompt (e.g., if they ask for a Hospital app, do NOT generate a landing page for "Sketchon").
5. PURE HTML / TAILWIND: Use only pure HTML and Tailwind CSS.
6. IMAGES: Use high-quality Unsplash URLs (e.g. https://images.unsplash.com/photo-...)
7. ICONS: Use simple emoji or Lucide-like SVG icons.
8. The response MUST be a valid JSON object: { "explanation": "...", "code": "..." }.
9. ALWAYS provide the "code" field with a full UI representation.
10. Be highly responsive to the latest user message.
`;

const ANALYSIS_PROMPT = `
You are a Design Project Manager.
Analyze the user's request and recommend the best settings for a UI design project.
Return ONLY valid JSON(no markdown) with the following key - value pairs:
- "domain": The recommended industry or category.
- "target": The recommended target audience.
- "style": The recommended visual style.
- "explanation": 1 sentence reason for these choices in Korean.
`;

export const v0 = async (prompt, history = [], modelId = 'gemini-3-pro-preview', deviceType = 'mobile', attachments = []) => {
    const targetModel = modelId || 'gemini-3-pro-preview';

    const runGeneration = async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT(deviceType)
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
            return JSON.parse(jsonMatch[0]);
        }
        return { explanation: text || "AI가 답변을 생성했습니다.", code: "" };
    } catch (error) {
        console.error(`Model generation failed(${targetModel}): `, error);

        if (targetModel !== 'gemini-2.0-flash') {
            try {
                console.log("Attempting automatic fallback to gemini-2.0-flash...");
                const text = await runGeneration('gemini-2.0-flash');
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
            } catch (innerError) {
                console.error("Fallback also failed.");
            }
        }

        return {
            explanation: "AI 서비스 응답 오류",
            code: `< div style = "padding: 40px; color: #ef4444; background: #fef2f2; border-radius: 20px; border: 1px solid #fee2e2; text-align: center; font-family: sans-serif;" >
                <h2 style="font-weight: bold; font-size: 20px; margin-bottom: 16px;">UI 생성 중 오류가 발생했습니다</h2>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 24px;">${error.message}</p>
                <div style="font-size: 12px; background: white; padding: 12px; border-radius: 8px; display: inline-block;">
                    사용 시도 모델: <b>${targetModel}</b>
                </div>
            </div > `
        };
    }
};

export const analyzePrompt = async (prompt) => {
    const targetModel = 'gemini-2.0-flash';
    try {
        const model = genAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: ANALYSIS_PROMPT
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return { domain: "Web App", target: "General", style: "Modern", explanation: "기본 설정값입니다." };
    } catch (error) {
        return { domain: "Web App", target: "General", style: "Modern", explanation: "분석 중 오류 발생." };
    }
};
