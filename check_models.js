import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key provided.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log(`\n--- Gemini 3 Early Access & Availability Check ---\n`);

    const modelsToTest = [
        'gemini-3-flash-preview',
        'gemini-3-pro-preview',
        'gemini-3.0-flash',
        'gemini-3.0-pro',
        'gemini-3-flash',
        'gemini-3-pro',
        'gemini-2.0-flash',
        'gemini-1.5-pro'
    ];

    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'Respond with "Ready"' }] }],
                generationConfig: { maxOutputTokens: 5 }
            });
            const text = result.response.text();
            console.log(`✅ ${modelName.padEnd(25)}: ACCESSIBLE (Response: ${text.trim()})`);
        } catch (e) {
            let errorMsg = e.message.split('\n')[0];
            if (errorMsg.includes('404')) {
                console.log(`❌ ${modelName.padEnd(25)}: NOT RELEASED / 404`);
            } else if (errorMsg.includes('403')) {
                console.log(`⚠️ ${modelName.padEnd(25)}: PERMISSION DENIED (Key mismatch?)`);
            } else {
                console.log(`❌ ${modelName.padEnd(25)}: ERROR (${errorMsg})`);
            }
        }
    }
}

listModels();
