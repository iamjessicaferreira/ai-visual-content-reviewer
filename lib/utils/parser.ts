import { AnalysisResult } from '@/types/analysis';

/**
 * Clean text by removing JSON artifacts and formatting issues
 */
function cleanText(text: string): string {
  // Remove JSON-like artifacts (quotes, colons at start, etc.)
  let cleaned = text
    // Remove leading/trailing quotes and colons
    .replace(/^["':\s]+|["':\s]+$/g, '')
    // Remove JSON property markers like ": " at the start
    .replace(/^["']?\w+["']?\s*:\s*["']?/g, '')
    // Remove trailing commas and quotes
    .replace(/["',]+$/g, '')
    .trim();
  
  return cleaned;
}

/**
 * Try to extract and parse JSON from text
 */
function tryParseJSON(text: string): AnalysisResult | null {
  // Try to find a complete JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate it has the expected structure
      if (parsed && typeof parsed === 'object') {
        return normalizeResult(parsed);
      }
    } catch (e) {
      // JSON is malformed, continue with text parsing
    }
  }
  return null;
}

export function parseAIResponse(text: string): AnalysisResult {
  // Clean the text first
  const cleanedText = cleanText(text);
  
  // Try to extract JSON if present
  const jsonResult = tryParseJSON(cleanedText);
  if (jsonResult) {
    return jsonResult;
  }

  // Parse structured text response
  const result: Partial<AnalysisResult> = {
    description: '',
    clarity: '',
    issues: [],
    suggestions: [],
    copy_variations: {
      headlines: [],
      ctas: [],
    },
  };

  // Extract description - more robust regex
  const descMatch = cleanedText.match(/description[:\-]?\s*["']?([^"'\n]+(?:\.[^"'\n]+)?)["']?/i);
  if (descMatch && descMatch[1]) {
    result.description = cleanText(descMatch[1]);
  } else {
    // Try alternative pattern
    const descAlt = cleanedText.match(/1\.\s*Description[:\-]?\s*(.+?)(?:\n\s*2\.|$)/is);
    if (descAlt && descAlt[1]) {
      result.description = cleanText(descAlt[1]);
    } else {
      // Try to get first meaningful sentence (not JSON-like)
      const sentences = cleanedText.split(/[.!?]+/)
        .map(s => cleanText(s))
        .filter(s => s.trim().length > 10 && !s.match(/^["':\s]+$/));
      result.description = sentences.slice(0, 2).join('. ').trim() || 'Image analysis completed.';
    }
  }

  // Extract clarity - more robust regex
  const clarityMatch = cleanedText.match(/clarity[:\-]?\s*["']?([^"'\n]+(?:\.[^"'\n]+)?)["']?/i);
  if (clarityMatch && clarityMatch[1]) {
    result.clarity = cleanText(clarityMatch[1]);
  } else {
    // Try alternative pattern
    const clarityAlt = cleanedText.match(/2\.\s*Message\s+Clarity[:\-]?\s*(.+?)(?:\n\s*3\.|$)/is);
    if (clarityAlt && clarityAlt[1]) {
      result.clarity = cleanText(clarityAlt[1]);
    } else {
      result.clarity = 'Message clarity evaluation completed.';
    }
  }

  // Extract issues (bullet points or numbered list) - more robust
  const issuesSection = cleanedText.match(/3\.\s*Issues?[:\-]?\s*([\s\S]*?)(?:\n\s*4\.|suggestions?|copy|headlines?|ctas?|$)/i);
  if (issuesSection && issuesSection[1]) {
    result.issues = extractListItems(issuesSection[1]);
  } else {
    // Try simpler pattern
    const issuesAlt = cleanedText.match(/issues?[:\-]?\s*([\s\S]*?)(?:\n\s*(?:4\.|suggestions?|copy|headlines?|ctas?)|$)/i);
    if (issuesAlt && issuesAlt[1]) {
      result.issues = extractListItems(issuesAlt[1]);
    }
  }

  // Extract suggestions - more robust, capture until end or next major section
  const suggestionsSection = cleanedText.match(/4\.\s*Suggestions?[:\-]?\s*([\s\S]*?)(?:\n\s*5\.\s*Copy|copy\s*Variations?|headlines?|ctas?|$)/i);
  if (suggestionsSection && suggestionsSection[1]) {
    result.suggestions = extractListItems(suggestionsSection[1]);
  } else {
    // Try simpler pattern - be more lenient with the end marker
    const suggestionsAlt = cleanedText.match(/suggestions?[:\-]?\s*([\s\S]*?)(?:\n\s*(?:5\.|Copy\s*Variations?|headlines?|ctas?)|$)/i);
    if (suggestionsAlt && suggestionsAlt[1]) {
      result.suggestions = extractListItems(suggestionsAlt[1]);
    } else {
      // Last resort: try to find suggestions section by looking for bullet points after "Suggestions"
      const suggestionsFallback = cleanedText.match(/suggestions?[:\-]?\s*([\s\S]*?)(?:\n\n|\n\s*[A-Z][a-z]+\s*:|$)/i);
      if (suggestionsFallback && suggestionsFallback[1]) {
        result.suggestions = extractListItems(suggestionsFallback[1]);
      }
    }
  }

  // Extract headlines - more robust
  const headlinesSection = cleanedText.match(/headlines?[:\-]?\s*([\s\S]*?)(?:\n\s*(?:ctas?|copy|CTA)|$)/i);
  if (headlinesSection && headlinesSection[1]) {
    result.copy_variations!.headlines = extractListItems(headlinesSection[1]);
  }

  // Extract CTAs - more robust
  const ctasSection = cleanedText.match(/ctas?[:\-]?\s*([\s\S]*?)$/i);
  if (ctasSection && ctasSection[1]) {
    result.copy_variations!.ctas = extractListItems(ctasSection[1]);
  }

  return normalizeResult(result);
}

function extractListItems(text: string): string[] {
  const items: string[] = [];
  
  // Clean the text first
  let cleaned = cleanText(text);
  
  // Remove section markers that might be confused with list items
  cleaned = cleaned
    .replace(/\*+[A-Za-z\s]+\*+:/g, '') // Remove markers like "*Headlines Variations:**"
    .replace(/^[:\-]\s*/gm, '') // Remove leading colons/dashes
    .trim();
  
  // Helper to check if an item is incomplete
  const isIncompleteItem = (item: string): boolean => {
    const trimmed = item.trim();
    
    // Check for generic placeholder messages
    const genericPlaceholders = [
      'copy variations',
      'copy variation',
      'headline variations',
      'cta variations',
      'no issues identified',
      'no suggestions available',
    ];
    if (genericPlaceholders.some(placeholder => trimmed.toLowerCase() === placeholder)) {
      return true;
    }
    
    // Check for incomplete patterns
    if (/\([^)]*$/.test(trimmed)) return true; // Unclosed parentheses
    if (/\[[^\]]*$/.test(trimmed)) return true; // Unclosed brackets
    if (/,\s*$/.test(trimmed)) return true; // Ends with comma
    if (/and\s+$/.test(trimmed)) return true; // Ends with "and"
    if (/or\s+$/.test(trimmed)) return true; // Ends with "or"
    if (/Add\s+clear\.\s*$/.test(trimmed)) return true; // "Add clear."
    if (/Add\s+[a-z]+\s*\.\s*$/.test(trimmed) && trimmed.length < 30) return true; // Short "Add [word]."
    if (/Add\s+a\s+clear\s+and\s+prominent\s*$/.test(trimmed)) return true; // "Add a clear and prominent"
    if (/Add\s+a\s+[a-z]+\s+and\s+[a-z]+\s*$/.test(trimmed)) return true; // "Add a [word] and [word]" without completion
    
    // Check if ends with adjective or noun without completion
    if (/\b(prominent|clear|effective|strong|better|improved|enhanced)\s*$/.test(trimmed)) return true;
    if (/\b(button|cta|call|action|element|feature|section)\s*$/.test(trimmed) && !trimmed.match(/[.!?]\s*$/)) return true;
    
    // Check if text doesn't end with punctuation and seems incomplete
    if (!trimmed.match(/[.!?]\s*$/) && trimmed.length > 10) {
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
    
    return false;
  };
  
  // Match bullet points (-, *, •) - capture full content including multi-line items
  // First, split by lines that start with bullets to identify item boundaries
  const lines = cleaned.split('\n');
  let currentItem = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line starts a new bullet item
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      // Save previous item if exists
      if (currentItem.trim().length > 0) {
        const cleanedItem = cleanText(currentItem.trim());
        if (cleanedItem.length > 2 && 
            !cleanedItem.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?)[:\-]?$/i) &&
            !cleanedItem.match(/^["':\s]+$/) &&
            !cleanedItem.startsWith('*') && !cleanedItem.endsWith('*') &&
            !isIncompleteItem(cleanedItem)) { // Filter out incomplete items
          items.push(cleanedItem);
        }
      }
      // Start new item
      currentItem = bulletMatch[1];
    } else if (currentItem && line.length > 0 && !line.match(/^\d+[.)]\s/) && !line.match(/^[-*•]\s/)) {
      // Continue current item if line doesn't start a new numbered/bullet item
      // This handles multi-line items
      currentItem += ' ' + line;
    } else if (currentItem && (line.match(/^\d+[.)]\s/) || line.match(/^[-*•]\s/) || line.match(/^[A-Z][a-z]+\s*:/))) {
      // Save current item when we hit a new section
      const cleanedItem = cleanText(currentItem.trim());
      if (cleanedItem.length > 2 && 
          !cleanedItem.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?)[:\-]?$/i) &&
          !cleanedItem.match(/^["':\s]+$/) &&
          !cleanedItem.startsWith('*') && !cleanedItem.endsWith('*') &&
          !isIncompleteItem(cleanedItem)) { // Filter out incomplete items
        items.push(cleanedItem);
      }
      currentItem = '';
    }
  }
  
  // Don't forget the last item
  if (currentItem.trim().length > 0) {
    const cleanedItem = cleanText(currentItem.trim());
    if (cleanedItem.length > 2 && 
        !cleanedItem.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?)[:\-]?$/i) &&
        !cleanedItem.match(/^["':\s]+$/) &&
        !cleanedItem.startsWith('*') && !cleanedItem.endsWith('*') &&
        !isIncompleteItem(cleanedItem)) { // Filter out incomplete items
      items.push(cleanedItem);
    }
  }
  
  // Fallback to simple regex if no items found
  if (items.length === 0) {
    const bulletMatches = cleaned.match(/^[\s]*[-*•]\s+(.+)$/gm);
    if (bulletMatches) {
      items.push(...bulletMatches
        .map(m => {
          const match = m.match(/^[\s]*[-*•]\s+(.+)$/);
          return match ? match[1].trim() : '';
        })
        .filter(item => item.length > 0)
        .map(item => cleanText(item))
        .filter(item => {
          return item.length > 2 && 
                 !item.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?)[:\-]?$/i) &&
                 !item.match(/^["':\s]+$/) &&
                 !item.startsWith('*') && !item.endsWith('*') &&
                 !isIncompleteItem(item); // Filter out incomplete items
        }));
    }
  }
  
  // Match numbered list (but not section numbers like "3. Issues:")
  const numberedMatches = cleaned.match(/^\s*(\d+)[.)]\s+(.+)$/gm);
  if (numberedMatches) {
    items.push(...numberedMatches
      .map(m => {
        const match = m.match(/^\s*\d+[.)]\s+(.+)$/);
        return match ? match[1].trim() : '';
      })
      .filter(item => item.length > 0)
      .map(item => cleanText(item))
      .filter(item => {
        // Filter out section headers, but allow shorter items
        return item.length > 2 && 
               !item.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?|description|clarity)[:\-]?$/i) &&
               !item.match(/^["':\s]+$/) &&
               !isIncompleteItem(item); // Filter out incomplete items
      }));
  }
  
  // If no list items found, try to split by newlines and filter
  if (items.length === 0) {
    const lines = cleaned
      .split('\n')
      .map(l => cleanText(l))
      .filter(l => {
        return l.length > 5 && 
               !l.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?|description|clarity)[:\-]?$/i) &&
               !l.match(/^["':\s]+$/) &&
               !l.startsWith('*') && !l.endsWith('*') &&
               !isIncompleteItem(l); // Filter out incomplete items
      });
    items.push(...lines.slice(0, 10)); // Limit to 10 items
  }

  return items
    .filter(item => item && item.trim().length > 0)
    .map(item => cleanText(item))
    .filter(item => item.length > 0); // Don't limit - return all valid items
}

function normalizeResult(result: Partial<AnalysisResult>): AnalysisResult {
  // Helper to ensure array items are strings
  const normalizeStringArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(item => {
        // If item is an object, try to extract text from common keys
        if (typeof item === 'object' && item !== null) {
          return item.issue || item.suggestion || item.headline || item.cta || item.text || item.title || JSON.stringify(item);
        }
        // Convert to string and clean
        return cleanText(String(item));
      })
      .filter(item => {
        // Filter out empty items and JSON artifacts
        return item && 
               item.trim().length > 0 && 
               !item.match(/^["':\s]+$/) &&
               !item.match(/^(headlines?|ctas?|variations?|copy|issues?|suggestions?)[:\-]?$/i);
      })
      .slice(0, 10);
  };

  // Clean description and clarity
  const description = result.description 
    ? cleanText(String(result.description))
    : 'Image analysis completed.';
  
  const clarity = result.clarity
    ? cleanText(String(result.clarity))
    : 'Message clarity evaluation completed.';

  return {
    description: description.length > 0 ? description : 'Image analysis completed.',
    clarity: clarity.length > 0 ? clarity : 'Message clarity evaluation completed.',
    issues: normalizeStringArray(result.issues || []),
    suggestions: normalizeStringArray(result.suggestions || []),
    copy_variations: {
      headlines: normalizeStringArray(result.copy_variations?.headlines || []).slice(0, 3),
      ctas: normalizeStringArray(result.copy_variations?.ctas || []).slice(0, 3),
    },
  };
}
