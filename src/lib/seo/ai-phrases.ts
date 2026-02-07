// AI-detected phrases to avoid in content
// Based on SEO Content Skill guidelines

export const AI_PHRASES_TO_AVOID = [
    // Overused AI words
    "delve",
    "delving",
    "leverage",
    "leveraging",
    "robust",
    "comprehensive",
    "pivotal",
    "utilize",
    "utilise",
    "facilitate",
    "facilitating",
    "commence",
    "commenced",

    // Formulaic openings
    "in today's fast-paced world",
    "in today's digital age",
    "in the ever-evolving landscape",
    "in the realm of",
    "it's worth noting that",
    "it is worth noting",
    "let's delve into",
    "let's explore",

    // Empty intensifiers
    "absolutely",
    "incredibly",
    "extremely",
    "truly",
    "remarkably",
];

export const AI_PHRASE_REPLACEMENTS: Record<string, string[]> = {
    delve: ["explore", "examine", "look into", "study"],
    leverage: ["use", "apply", "employ", "take advantage of"],
    robust: ["strong", "solid", "reliable", "powerful"],
    comprehensive: ["complete", "thorough", "full", "detailed"],
    pivotal: ["key", "important", "crucial", "critical"],
    utilize: ["use"],
    facilitate: ["help", "enable", "allow", "make easier"],
    commence: ["start", "begin"],
};

export function detectAIPhrases(text: string): string[] {
    const lowerText = text.toLowerCase();
    return AI_PHRASES_TO_AVOID.filter(phrase =>
        lowerText.includes(phrase.toLowerCase())
    );
}

export function hasFormulaicOpening(text: string): boolean {
    const lowerText = text.toLowerCase();
    const formulaicPatterns = [
        "in today's",
        "in the ever-evolving",
        "in the realm of",
        "it's worth noting",
        "let's delve",
    ];

    return formulaicPatterns.some(pattern => lowerText.startsWith(pattern));
}

export function countEmDashes(text: string): number {
    return (text.match(/—/g) || []).length;
}

export function calculateHumanScore(text: string): number {
    let score = 10;

    // Deduct for AI phrases (0.5 points each)
    const aiPhrases = detectAIPhrases(text);
    score -= aiPhrases.length * 0.5;

    // Deduct for em dash overuse (1 point per dash after 2)
    const emDashes = countEmDashes(text);
    if (emDashes > 2) {
        score -= (emDashes - 2);
    }

    // Deduct for formulaic opening (2 points)
    if (hasFormulaicOpening(text)) {
        score -= 2;
    }

    return Math.max(0, Math.min(10, score));
}
