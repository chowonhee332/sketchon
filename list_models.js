import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key provided.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listAll() {
    try {
        // Technically listing models is a REST call
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("--- Available All Models via REST ---");
        data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (e) {
        console.error("Failed to list models via API:", e.message);
    }
}

listAll();
