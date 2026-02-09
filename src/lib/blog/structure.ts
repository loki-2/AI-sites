// ===========================================
// Blog Structure Types and Validation
// ===========================================
// Defines the mandatory 3-section blog structure

export interface StructuredArticle {
    whyItMatters: string[];      // Exactly 5 one-sentence points
    whenToUse: string[];          // Exactly 10 use case points
    howToUse: string[];           // Exactly 10 actionable how-to points
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// -------------------------------------------
// Validation
// -------------------------------------------

export function validateStructure(article: StructuredArticle): ValidationResult {
    const errors: string[] = [];

    if (!article.whyItMatters || article.whyItMatters.length !== 5) {
        errors.push(`Why It Matters must have exactly 5 points, got ${article.whyItMatters?.length || 0}`);
    }

    if (!article.whenToUse || article.whenToUse.length !== 10) {
        errors.push(`When to Use must have exactly 10 points, got ${article.whenToUse?.length || 0}`);
    }

    if (!article.howToUse || article.howToUse.length !== 10) {
        errors.push(`How to Use must have exactly 10 points, got ${article.howToUse?.length || 0}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// -------------------------------------------
// Markdown Formatting
// -------------------------------------------

export function formatAsMarkdown(article: StructuredArticle): string {
    const sections: string[] = [];

    // Why It Matters section
    sections.push('## Why It Matters\n');
    sections.push(article.whyItMatters.map(point => `- ${point}`).join('\n'));

    // When to Use section
    sections.push('\n\n## When to Use\n');
    sections.push(article.whenToUse.map((point, i) => `${i + 1}. ${point}`).join('\n'));

    // How to Use section
    sections.push('\n\n## How to Use\n');
    sections.push(article.howToUse.map((point, i) => `${i + 1}. ${point}`).join('\n'));

    return sections.join('');
}

// -------------------------------------------
// Forbidden Words Detection
// -------------------------------------------

const FORBIDDEN_WORDS = [
    'delve',
    'leverage',
    'robust',
    'comprehensive',
    'facilitate',
    'revolutionary',
    'game-changing',
    'cutting-edge',
    'synergy',
    'paradigm',
    'holistic',
    'seamless'
];

export function detectForbiddenWords(text: string): string[] {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_WORDS.filter(word => lowerText.includes(word));
}

export function validateContent(article: StructuredArticle): {
    forbiddenWords: string[];
    hasSpecifics: boolean;
} {
    const allText = [
        ...article.whyItMatters,
        ...article.whenToUse,
        ...article.howToUse
    ].join(' ');

    const forbiddenWords = detectForbiddenWords(allText);

    // Check for specifics (numbers, percentages, versions)
    const hasNumbers = /\d+/.test(allText);
    const hasPercentages = /%/.test(allText);
    const hasVersions = /v?\d+\.\d+/.test(allText);
    const hasSpecifics = hasNumbers || hasPercentages || hasVersions;

    return {
        forbiddenWords,
        hasSpecifics
    };
}
