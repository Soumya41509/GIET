import { Intent } from './types';

interface IntentDefinition {
  intent: Intent;
  keywords: { word: string; weight: number }[];
}

const INTENT_MAP: IntentDefinition[] = [
  {
    intent: 'FILE',
    keywords: [
      { word: 'file', weight: 1.0 },
      { word: 'new', weight: 0.8 },
      { word: 'issue', weight: 0.9 },
      { word: 'grievance', weight: 1.0 },
      { word: 'complain', weight: 0.9 },
      { word: 'problem', weight: 0.7 },
      { word: 'submit', weight: 0.8 },
    ],
  },
  {
    intent: 'TRACK',
    keywords: [
      { word: 'status', weight: 1.0 },
      { word: 'track', weight: 1.0 },
      { word: 'check', weight: 0.7 },
      { word: 'progress', weight: 0.8 },
      { word: 'update', weight: 0.6 },
    ],
  },
  {
    intent: 'HELP',
    keywords: [
      { word: 'help', weight: 1.0 },
      { word: 'support', weight: 0.9 },
      { word: 'assistant', weight: 0.7 },
      { word: 'what', weight: 0.4 },
    ],
  },
  {
    intent: 'CANCEL',
    keywords: [
      { word: 'cancel', weight: 1.0 },
      { word: 'stop', weight: 0.9 },
      { word: 'reset', weight: 0.8 },
      { word: 'exit', weight: 0.9 },
      { word: 'back', weight: 0.7 },
      { word: 'menu', weight: 1.0 },
      { word: 'main', weight: 0.8 },
    ],
  },
];

/**
 * Basic String Similarity Ratio (Dice Coefficient)
 */
function getSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const b of bigrams1) {
    if (bigrams2.has(b)) intersection++;
  }

  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

export const detectIntent = (text: string): { intent: Intent; confidence: number } => {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  let bestIntent: Intent = 'NONE';
  let maxScore = 0;

  for (const group of INTENT_MAP) {
    let groupScore = 0;

    for (const kw of group.keywords) {
      // Direct whole-word match
      if (words.includes(kw.word)) {
        groupScore += kw.weight;
      } else {
        // Fuzzy match for each word in the input
        for (const inputWord of words) {
          const sim = getSimilarity(inputWord, kw.word);
          if (sim > 0.7) {
            groupScore += kw.weight * sim;
          }
        }
      }
    }

    // Normalize group score by word count to avoid bias towards long strings
    // But keep it weighted by intent importance
    if (groupScore > maxScore) {
      maxScore = groupScore;
      bestIntent = group.intent;
    }
  }

  // Confidence is a relative value
  const confidence = Math.min(maxScore, 1.0);

  return {
    intent: maxScore > 0.4 ? bestIntent : 'NONE',
    confidence,
  };
};
