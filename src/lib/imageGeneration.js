import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Image Generation Module for Sketchon
 * Handles automatic image generation using Gemini API with reference images
 */

// Creon 3D Icon Style Configuration (from user's JSON prompt)
const CREON_STYLE_CONFIG = {
    task: "generate isometric 3D icon",
    style_lock: true,
    guidance: {
        aspect_ratio: "16:9",
        instruction_strength: "strict",
        priority_order: ["subject", "style_consistency", "color_palette", "material_spec"],
        consistency_reference: "Match Creon 3D icon sheet: smooth glossy plastic, floating subject, uniform lighting."
    },
    output: {
        format: "png",
        background: "#FFFFFF",
        alpha: true,
        safety_settings: {
            allowed_content: ["stylized_character"],
            disallowed_content: ["photographic_realism", "text"]
        }
    },
    render: {
        engine: "flash-3d",
        quality: "ultra-high",
        sampling: "deterministic",
        postprocess: "clean"
    },
    camera: {
        type: "isometric",
        lens: "orthographic",
        tilt: "35deg",
        pan: "35deg",
        distance: "medium shot",
        focus: "global sharp"
    },
    lighting: {
        mode: "soft global illumination",
        source: "dual top-front softboxes with faint rim light",
        highlights: "broad glossy bloom, no hard speculars",
        shadows: "internal occlusion only, no ground shadow"
    },
    materials: {
        primary: "smooth high-gloss plastic",
        secondary: "matte pastel plastic",
        accents: "translucent frosted plastic",
        surface_detail: "no noise, no texture, no scratches"
    },
    colors: {
        palette_name: "Creon Blue System",
        dominant_blue: "#2962ff",
        secondary_blue: "#4FC3F7",
        neutral_white: "#FFFFFF",
        warm_accent: "#FFD45A"
    },
    form: {
        shapes: "pillowy, inflated, soft-volume forms",
        edges: "rounded with 85% fillet, zero sharp corners",
        proportions: "chibi/stylized, simplified anatomy"
    },
    composition: {
        elements: "single hero subject floating; only props essential to subject",
        density: "minimal, generous negative space",
        framing: "subject centered with equal top/bottom margins, fully contained"
    },
    background: {
        type: "solid",
        color: "#ffffff",
        environment: "studio cyclorama",
        ground_contact: "none (floating)"
    },
    negative_prompt: "photographic realism, fabric texture, gritty, noise, grain, metallic reflections, text, watermark, drop shadow, harsh contrast, oversaturated colors"
};

// Reference image paths
const REFERENCE_IMAGES = [
    '/src/assets/reference/reference_1.png', // Icon set
    '/src/assets/reference/reference_2.png', // Character
    '/src/assets/reference/reference_3.png'  // Vehicle
];

/**
 * Analyze user prompt to determine if images are needed
 * @param {string} userPrompt - The user's input prompt
 * @returns {Object} { needsImages: boolean, subjects: string[] }
 */
export function analyzePromptForImageNeeds(userPrompt) {
    const imageKeywords = [
        'icon', 'illustration', 'character', 'logo', 'graphic', 'image',
        'picture', 'photo', 'avatar', 'mascot', 'symbol', 'badge',
        'emoji', 'sticker', '3d', 'isometric', 'render'
    ];

    const lowerPrompt = userPrompt.toLowerCase();

    // Check if any image keywords are present
    const hasImageKeyword = imageKeywords.some(keyword => lowerPrompt.includes(keyword));

    if (!hasImageKeyword) {
        return { needsImages: false, subjects: [] };
    }

    // Extract subjects (simple heuristic: words after "icon of", "illustration of", etc.)
    const subjects = [];
    const patterns = [
        /(?:icon|illustration|character|logo|graphic|image)\s+(?:of|for|showing)\s+([a-z\s]+?)(?:\s+and|\s+with|,|\.|$)/gi,
        /(?:create|generate|make|design)\s+(?:a|an)\s+([a-z\s]+?)\s+(?:icon|illustration|character)/gi
    ];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(lowerPrompt)) !== null) {
            subjects.push(match[1].trim());
        }
    });

    // If no specific subjects found, use generic subject
    if (subjects.length === 0 && hasImageKeyword) {
        subjects.push('app icon');
    }

    return {
        needsImages: true,
        subjects: [...new Set(subjects)] // Remove duplicates
    };
}

/**
 * Load reference images as base64
 * @returns {Promise<string[]>} Array of base64 image data
 */
export async function loadReferenceImages() {
    try {
        // In browser environment, we'll fetch the images
        const imagePromises = REFERENCE_IMAGES.map(async (path) => {
            const response = await fetch(path);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        });

        return await Promise.all(imagePromises);
    } catch (error) {
        console.error('Error loading reference images:', error);
        return [];
    }
}

/**
 * Build Gemini image generation prompt
 * @param {string} subject - The subject to generate (e.g., "running icon")
 * @param {Object} styleConfig - Creon style configuration
 * @returns {string} Formatted prompt for Gemini
 */
export function buildImagePrompt(subject, styleConfig = CREON_STYLE_CONFIG) {
    return `
Generate an isometric 3D icon of: ${subject}

Style Requirements:
- Camera: ${styleConfig.camera.type} view, ${styleConfig.camera.tilt} tilt, ${styleConfig.camera.pan} pan
- Materials: ${styleConfig.materials.primary}, ${styleConfig.materials.secondary}
- Colors: ${styleConfig.colors.dominant_blue} (primary), ${styleConfig.colors.secondary_blue} (secondary), ${styleConfig.colors.neutral_white} (white)
- Lighting: ${styleConfig.lighting.mode}, ${styleConfig.lighting.source}
- Form: ${styleConfig.form.shapes}, ${styleConfig.form.edges}
- Composition: ${styleConfig.composition.elements}, ${styleConfig.composition.density}
- Background: ${styleConfig.background.color} solid color, ${styleConfig.background.ground_contact}

Visual Style:
- Smooth, glossy plastic material with soft highlights
- Floating subject with no ground shadow
- Pillowy, inflated forms with rounded edges
- Chibi/stylized proportions
- Clean, minimal negative space
- Vibrant blue color scheme (#2962ff, #4FC3F7)

Negative Prompt (avoid these):
${styleConfig.negative_prompt}

Output: High-quality PNG with transparent background, 1024x576px, 16:9 aspect ratio.
`.trim();
}

/**
 * Generate image using Gemini API
 * @param {string} subject - The subject to generate
 * @param {string[]} referenceImages - Base64 reference images
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} Base64 image data URL
 */
export async function generateImage(subject, referenceImages, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = buildImagePrompt(subject);

        // TODO: Gemini doesn't support image generation yet in the official SDK
        // This is a placeholder for when the feature becomes available
        // For now, we'll return a placeholder or use an alternative approach

        console.log('Image generation requested for:', subject);
        console.log('Prompt:', prompt);
        console.log('Reference images:', referenceImages.length);

        // Placeholder: Return null for now
        return null;

    } catch (error) {
        console.error('Error generating image:', error);
        return null;
    }
}

/**
 * Cache generated images in localStorage
 * @param {Object[]} images - Array of { subject, dataUrl }
 */
export function cacheGeneratedImages(images) {
    try {
        const cache = JSON.parse(localStorage.getItem('sketchon_image_cache') || '{}');
        images.forEach(({ subject, dataUrl }) => {
            cache[subject] = {
                dataUrl,
                timestamp: Date.now()
            };
        });
        localStorage.setItem('sketchon_image_cache', JSON.stringify(cache));
    } catch (error) {
        console.error('Error caching images:', error);
    }
}

/**
 * Get cached image
 * @param {string} subject - The subject to retrieve
 * @returns {string|null} Base64 data URL or null
 */
export function getCachedImage(subject) {
    try {
        const cache = JSON.parse(localStorage.getItem('sketchon_image_cache') || '{}');
        const cached = cache[subject];

        if (!cached) return null;

        // Cache expires after 7 days
        const isExpired = Date.now() - cached.timestamp > 7 * 24 * 60 * 60 * 1000;
        if (isExpired) {
            delete cache[subject];
            localStorage.setItem('sketchon_image_cache', JSON.stringify(cache));
            return null;
        }

        return cached.dataUrl;
    } catch (error) {
        console.error('Error retrieving cached image:', error);
        return null;
    }
}

/**
 * Clear image cache
 */
export function clearImageCache() {
    localStorage.removeItem('sketchon_image_cache');
}
