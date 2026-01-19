import { AnalysisResult } from '@/types/analysis';

// Generic/default messages that indicate empty results
const GENERIC_MESSAGES = [
  'Image analysis completed.',
  'Message clarity evaluation completed.',
  'No issues identified.',
  'No suggestions available.',
  'No headlines generated.',
  'No CTAs generated.',
  'Copy Variations', // Placeholder text
  'copy variations', // Placeholder text (lowercase)
  'Copy variations', // Placeholder text (mixed case)
];

// Phrases that indicate the AI cannot see the image
const CANNOT_SEE_IMAGE_PHRASES = [
  'i cannot see',
  'i don\'t have the ability to view',
  'i do not have access to',
  'without the image',
  'without any visual',
  'i cannot directly analyze',
  'i don\'t have the capability to',
  'unfortunately, i cannot',
  'i am unable to see',
  'i am not able to view',
  'no image provided',
  'image is not available',
];

// Patterns that indicate incomplete/cut-off text
const INCOMPLETE_PATTERNS = [
  /\([^)]*$/, // Unclosed parentheses (e.g., "There are no clear calls to action (")
  /\[[^\]]*$/, // Unclosed brackets
  /"[^"]*$/, // Unclosed quotes
  /'[^']*$/, // Unclosed single quotes
  /,\s*$/, // Ends with comma (likely cut off)
  /and\s+$/, // Ends with "and" (likely cut off)
  /or\s+$/, // Ends with "or" (likely cut off)
  /the\s+$/, // Ends with "the" (likely cut off)
  /a\s+$/, // Ends with "a" (likely cut off)
  /an\s+$/, // Ends with "an" (likely cut off)
  /to\s+$/, // Ends with "to" (likely cut off)
  /for\s+$/, // Ends with "for" (likely cut off)
  /with\s+$/, // Ends with "with" (likely cut off)
  /Add\s+clear\.\s*$/, // Specific pattern: "Add clear." (incomplete)
  /Add\s+[a-z]+\s*\.\s*$/, // Ends with "Add [word]." (likely incomplete suggestion)
  /Add\s+a\s+clear\s+and\s+prominent\s*$/, // "Add a clear and prominent" (incomplete)
  /Add\s+a\s+[a-z]+\s+and\s+[a-z]+\s*$/, // "Add a [word] and [word]" without completion
  /\b(prominent|clear|effective|strong|better|improved|enhanced)\s*$/, // Ends with adjective (likely incomplete)
  /\b(button|cta|call|action|element|feature|section)\s*$/, // Ends with noun without verb (likely incomplete)
];

/**
 * Check if text appears to be incomplete or cut off
 */
function isTextIncomplete(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return true;
  }

  const trimmed = text.trim();
  
  // Check for incomplete patterns
  for (const pattern of INCOMPLETE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true; // If any incomplete pattern matches, it's incomplete
    }
  }

  // Check for very short text that might be incomplete (unless it's a complete short sentence)
  if (trimmed.length < 10 && !trimmed.match(/^[A-Z][^.!?]*[.!?]\s*$/)) {
    return true;
  }

  // Check if text ends without proper punctuation and seems incomplete
  // If it doesn't end with . ! ? and is longer than 10 chars, it might be cut off
  if (!trimmed.match(/[.!?]\s*$/) && trimmed.length > 10) {
    // Check if it ends with words that suggest incompleteness
    const lastWords = trimmed.split(/\s+/).slice(-3).join(' ').toLowerCase();
    const incompleteEndings = [
      'clear and prominent',
      'and prominent',
      'a clear',
      'add a',
      'add clear',
      'to improve',
      'for better',
      'with better',
    ];
    
    if (incompleteEndings.some(ending => lastWords.includes(ending))) {
      return true;
    }
  }

  // Check if the last sentence appears incomplete (no ending punctuation)
  const sentences = trimmed.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 1]?.trim();
  if (lastSentence && lastSentence.length > 0 && !trimmed.match(/[.!?]\s*$/)) {
    // If there's content after the last punctuation, it might be incomplete
    // But allow if it's a list item that doesn't need ending punctuation
    if (!lastSentence.match(/^[-*•]\s/) && lastSentence.length > 5) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text indicates the AI cannot see the image
 */
function indicatesCannotSeeImage(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const textLower = text.toLowerCase();
  return CANNOT_SEE_IMAGE_PHRASES.some(phrase => textLower.includes(phrase));
}

/**
 * Check if a field value is empty or contains only generic/default values
 */
function isFieldEmpty(value: string): boolean {
  if (!value || value.trim().length === 0) {
    return true;
  }
  const valueLower = value.toLowerCase().trim();
  return GENERIC_MESSAGES.some(msg => valueLower.includes(msg.toLowerCase()));
}

/**
 * Check if an array is empty or contains only generic/default values
 */
function isArrayEmpty(arr: string[]): boolean {
  if (!arr || arr.length === 0) {
    return true;
  }
  return arr.every(item => 
    !item || 
    item.trim().length === 0 ||
    GENERIC_MESSAGES.some(msg => item.toLowerCase().includes(msg.toLowerCase())) ||
    isTextIncomplete(item) || // Also check if items are incomplete
    indicatesCannotSeeImage(item) // Or indicate cannot see image
  );
}

/**
 * Check if the analysis result has any empty required fields
 * Required fields: description, clarity, issues, suggestions
 * Also checks for incomplete responses and "cannot see image" responses
 * Optimized for performance - early returns
 */
export function hasEmptyRequiredFields(result: AnalysisResult): boolean {
  // Quick check: description must exist and be meaningful
  if (!result.description || 
      result.description.trim().length < 20 ||
      isFieldEmpty(result.description) || 
      isTextIncomplete(result.description) ||
      indicatesCannotSeeImage(result.description)) {
    return true;
  }

  // Quick check: clarity must exist and be meaningful
  if (!result.clarity || 
      result.clarity.trim().length < 20 ||
      isFieldEmpty(result.clarity) || 
      isTextIncomplete(result.clarity) ||
      indicatesCannotSeeImage(result.clarity)) {
    return true;
  }

  // Quick check: issues array must have at least 1 valid item
  if (!result.issues || result.issues.length === 0 || isArrayEmpty(result.issues)) {
    return true;
  }
  
  // Only check first few issues for performance (if first ones are bad, likely all are)
  const issuesToCheck = Math.min(result.issues.length, 3);
  for (let i = 0; i < issuesToCheck; i++) {
    if (isTextIncomplete(result.issues[i]) || indicatesCannotSeeImage(result.issues[i])) {
      return true;
    }
  }

  // Quick check: suggestions array must have at least 1 valid item
  if (!result.suggestions || result.suggestions.length === 0 || isArrayEmpty(result.suggestions)) {
    return true;
  }
  
  // Only check first few suggestions for performance
  const suggestionsToCheck = Math.min(result.suggestions.length, 3);
  for (let i = 0; i < suggestionsToCheck; i++) {
    if (isTextIncomplete(result.suggestions[i]) || indicatesCannotSeeImage(result.suggestions[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the analysis result is empty or contains only generic/default values
 * @deprecated Use hasEmptyRequiredFields instead for more specific checking
 */
export function isResultEmpty(result: AnalysisResult): boolean {
  return hasEmptyRequiredFields(result);
}
