import { GoogleGenerativeAI } from "@google/generative-ai";

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

const SYSTEM_PROMPT = (deviceType) => `
You are a World-Class Senior UI/UX Designer and Frontend Expert.
Your goal is to generate high-fidelity, professional UI designs for ${deviceType === 'mobile' ? 'Mobile Applications' : 'Web Applications'} in the style of **Toss (토스)** - Korea's leading fintech app.

### 🎨 Toss Design Philosophy:
**"Simple, Bold, and Friendly"** - Clean interfaces that make complex financial tasks feel effortless.

### UI Design Framework:
1. **Output Format**: Generate ONLY pure HTML with Tailwind CSS classes.
2. **NO REACT**: Do NOT use React components, JSX specific syntax, imports, or exports.
3. **Container**: Wrap everything in a single <div id="canvas-root">.
4. **Icons**: Use SVG paths or emojis for icons. Do not use lucide-react or any other library.

### 🚨 CRITICAL: Background Color Rules
- **NEVER** apply background colors to the root container (#canvas-root)
- **NEVER** use classes like: bg-black, bg-gray-900, bg-slate-900 on #canvas-root
- **ONLY** apply background colors to individual page sections (elements with data-screen-id)
- **Toss Style**: Use white or light gray backgrounds (bg-white, bg-gray-50, bg-[#F5F6F8])
- The canvas-root should remain transparent to blend with the canvas background

Example Structure:
\`\`\`html
<div id="canvas-root">
  <!-- ✅ CORRECT: Light background on page section -->
  <div data-screen-id="main" class="min-h-screen bg-white">
    <!-- content -->
  </div>
</div>
\`\`\`

### 🎨 Toss Color Palette (MANDATORY):
**Primary Colors**:
- **Toss Blue**: \`#0064FF\` (Primary CTA, Links, Active States)
  - Tailwind: \`bg-[#0064FF]\`, \`text-[#0064FF]\`, \`border-[#0064FF]\`
- **Success Green**: \`#00C73C\` (Success messages, positive numbers)
  - Tailwind: \`bg-[#00C73C]\`, \`text-[#00C73C]\`
- **Error Red**: \`#FF5A5F\` (Errors, warnings, negative numbers)
  - Tailwind: \`bg-[#FF5A5F]\`, \`text-[#FF5A5F]\`

**Neutral Colors**:
- **Background**: \`#FFFFFF\` (White), \`#F5F6F8\` (Light Gray)
- **Text Primary**: \`#191F28\` (Dark Gray)
- **Text Secondary**: \`#8B95A1\` (Medium Gray)
- **Divider**: \`#E5E8EB\` (Light Border)

**Usage Rules**:
- Main backgrounds: Always white (\`bg-white\`) or light gray (\`bg-[#F5F6F8]\`)
- Primary buttons: Toss Blue with white text
- Cards: White with subtle shadow (\`shadow-sm\` or \`shadow-md\`)
- Numbers/Amounts: Large, bold, dark text (\`text-[#191F28]\`)

### ✍️ Typography (Toss Style):
**Font Hierarchy**:
- **Display Numbers** (금액, 통계): \`text-4xl\` to \`text-6xl\`, \`font-bold\`, \`text-[#191F28]\`
- **Headings**: \`text-2xl\` to \`text-3xl\`, \`font-semibold\`, \`text-[#191F28]\`
- **Body**: \`text-base\`, \`font-normal\`, \`text-[#191F28]\`
- **Caption**: \`text-sm\`, \`font-normal\`, \`text-[#8B95A1]\`

**Font Families** (Use Google Fonts):
- Primary: \`'Inter'\` or \`'Pretendard'\` (Korean-optimized)
- Monospace for numbers: \`'JetBrains Mono'\` (optional)

**Typography Rules**:
- Use **bold, large numbers** for emphasis (e.g., account balance, statistics)
- Clear size contrast between headings and body text (minimum 2x difference)
- Generous line-height for readability (\`leading-relaxed\`)

### 📐 Layout Principles (Toss Style):
**Card-Based Design**:
- Use white cards (\`bg-white\`) with subtle shadows (\`shadow-sm\`, \`shadow-md\`)
- Rounded corners: \`rounded-xl\` (12px) or \`rounded-2xl\` (16px)
- Padding: \`p-6\` for cards, \`p-4\` for mobile
- Spacing: Generous gaps between elements (\`gap-4\`, \`gap-6\`)

**Layout Structure**:
- **White Space**: Ample padding and margins (don't crowd elements)
- **Grid/Flex**: Use \`grid\` or \`flex\` for organized layouts
- **Bottom CTA**: Fixed bottom buttons for primary actions (\`fixed bottom-0\`)
- **Sticky Headers**: Use \`sticky top-0\` for navigation

**Component Patterns**:
- **Buttons**: Large, rounded, full-width on mobile
  - Primary: \`bg-[#0064FF] text-white rounded-xl py-4 px-6 font-semibold\`
  - Secondary: \`bg-[#F5F6F8] text-[#191F28] rounded-xl py-4 px-6 font-semibold\`
- **Input Fields**: Clean, minimal borders
  - \`border border-[#E5E8EB] rounded-xl p-4 focus:border-[#0064FF]\`
- **Cards**: Subtle elevation
  - \`bg-white rounded-xl shadow-sm p-6\`

### 🎯 Responsive Design Requirements:
${deviceType === 'mobile'
        ? `**Mobile-First Design (375px base)**:
   - Use touch-friendly tap targets (minimum 44x44px)
   - Bottom-fixed CTA buttons (\`fixed bottom-0 left-0 right-0 p-4 bg-white\`)
   - Single-column layouts with generous spacing
   - Large, tappable buttons (full-width, \`py-4\`)
   - Include viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   - Optimize for vertical scrolling`
        : `**Desktop-First Design (1440px base)**:
   - Multi-column layouts (\`grid-cols-2\`, \`grid-cols-3\`)
   - Sidebar navigation on the left
   - Hover states for interactive elements
   - Include viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0">
   - Responsive breakpoints: sm: (640px), md: (768px), lg: (1024px), xl: (1280px)`
    }

### 🎯 Multi-Page Generation (IMPORTANT):
Generate **3 PAGES** by default for a complete ${deviceType === 'mobile' ? 'app' : 'website'} experience:

**Page Structure (Horizontal Layout):**
\`\`\`html
<div id="canvas-root">
  <!-- Page 1: Main/Home -->
  <div data-screen-id="main" class="w-full h-auto">
    <!-- Hero section, key features, CTA buttons -->
    <!-- Height should fit content naturally -->
  </div>
  
  <!-- Page 2: Features/Services -->
  <div data-screen-id="features" class="w-full h-auto">
    <!-- Detailed features, image gallery, benefits -->
  </div>
  
  <!-- Page 3: Contact/About -->
  <div data-screen-id="contact" class="w-full h-auto">
    <!-- Contact form, team info, or about section -->
  </div>
</div>
\`\`\`

**Page Requirements:**
- Each page MUST have a unique \`data-screen-id\` attribute
- Pages will be displayed **horizontally side-by-side** (handled by CSS)
- Each page should have **natural height** based on content (use h-auto, NOT min-h-screen)
- ${deviceType === 'mobile' ? 'Mobile pages: 375px width, variable height' : 'Desktop pages: Full width, variable height'}
- Each page should feel like a complete, independent screen
- Content should be vertically centered within each page when appropriate

### 🎨 Content & Image Generation:
**Real Content (NO Lorem Ipsum):**
- Generate meaningful, context-appropriate text based on the user's request
- Use realistic product names, feature descriptions, and benefits
- Include actual data in tables, charts, and statistics
- Write compelling CTAs and headlines

**Images & Visuals:**
- Use **SVG illustrations** for icons and graphics (inline SVG code)
- Create **gradient backgrounds** instead of placeholder images
- Use **emoji icons** (🚀, 💡, ✨) for quick visual elements
- For hero images: Use CSS gradients with mesh patterns
- Example hero background:
  \`\`\`html
  <div class="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
  \`\`\`

**Integration with Creon (if applicable):**
- User can drag 3D assets from Creon sidebar
- Leave space for user-generated images with clear placeholders
- Use \`data-image-slot="hero"\` attribute for droppable areas

The response MUST be a valid JSON object: { "explanation": "...", "code": "..." }.
The "code" field should contain the raw HTML string with proper viewport meta tag and 3 pages.
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
