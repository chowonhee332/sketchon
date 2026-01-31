/**
 * Robust HTML Patching Utility
 * 
 * Safely replaces a target snippet in a codebase with a replacement snippet.
 * Handles whitespace normalization and finds the best match.
 */

export const applyPatch = (originalCode, targetHtml, replacementHtml) => {
    if (!originalCode || !targetHtml || !replacementHtml) return originalCode;

    const normalize = (str) => {
        return str
            .replace(/\s+/g, ' ')
            .trim();
    };

    const nOriginal = normalize(originalCode);
    const nTarget = normalize(targetHtml);

    // 1. Try exact match first
    if (originalCode.includes(targetHtml)) {
        return originalCode.replace(targetHtml, replacementHtml);
    }

    // 2. Try normalized match
    const startIndex = nOriginal.indexOf(nTarget);
    if (startIndex !== -1) {
        console.log("Found normalized match for patching");

        // We need to find the equivalent range in the ORIGINAL string.
        // This is tricky because of the normalization.
        // A simpler way is to use a more robust regex that ignores whitespace differences.

        const escapedTarget = targetHtml
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
            .replace(/\s+/g, '\\s+'); // Replace whitespace with \s+

        const regex = new RegExp(escapedTarget, 'm');
        const match = originalCode.match(regex);

        if (match) {
            return originalCode.replace(match[0], replacementHtml);
        }
    }

    // 3. Fallback: Fuzzy matching or partial matching if needed
    // For now, let's stick to the regex-based whitespace-agnostic replacement
    console.warn("Patching failed to find target snippet precisely. Falling back to simple replacement attempt.");

    // Last ditch: if targetHtml is small and unique enough, maybe it's partially changed?
    // In production, we might want to return originalCode and a warning.

    return originalCode.replace(targetHtml.trim(), replacementHtml.trim());
};
