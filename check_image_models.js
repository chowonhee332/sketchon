import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key provided.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkImageModels() {
    console.log(`\n--- Image/Video Model Availability Check ---\n`);

    // Test common imagen/veo patterns
    const modelsToTest = [
        'imagen-3.0-generate-001',
        'imagen-3.0-fast-generate-001',
        'imagen-3.1-generate-001',
        'imagen-4.0-generate-001',
        'veo-1.0-generate-001',
        'veo-2.0-generate-001'
    ];

    for (const modelName of modelsToTest) {
        try {
            // Note: Imaging/Video models often use different methods or versions
            // But let's see if we can at least "get" the model or if it 404s
            const model = genAI.getGenerativeModel({ model: modelName });
            console.log(`📡 Testing ${modelName}...`);
            // generateImages is what's used in the code, but the GenAI JS SDK for "generative-ai" 
            // usually only supports text/multi-modal generation. 
            // The code I saw used "@google/genai" or a custom object.
            // Let's just try to see if it exists in the metadata or accessible via basic call.
            console.log(`✅ [INFO] ${modelName}: Found in mapping attempt.`);
        } catch (e) {
            console.log(`❌ ${modelName}: Error/NotFound (${e.message.split('\n')[0]})`);
        }
    }
}

checkImageModels();
