import { AnalysisResult } from '@/types/analysis';

/**
 * Generic phrases that indicate the AI is hallucinating or not describing the actual image
 */
const HALLUCINATION_PHRASES = [
  'appears to be',
  'seems to be',
  'likely contains',
  'probably shows',
  'might be',
  'could be',
  'may contain',
  'typical',
  'common',
  'usually',
  'generally',
  'often',
  'typically',
  'standard',
  'typical example',
  'common design',
  'usual layout',
];

/**
 * Generic descriptions that don't reference specific visual elements
 */
const GENERIC_DESCRIPTIONS = [
  'marketing material',
  'visual content',
  'design element',
  'user interface',
  'landing page',
  'web page',
  'graphic design',
  'digital content',
  'visual design',
  'interface design',
  'marketing design',
  'brand design',
];

/**
 * Check if a description is too generic and doesn't reference specific visual elements
 */
function isDescriptionTooGeneric(description: string): boolean {
  if (!description || description.trim().length < 30) {
    return true;
  }

  const descLower = description.toLowerCase();
  
  // Check for hallucination phrases
  const hasHallucinationPhrase = HALLUCINATION_PHRASES.some(phrase => 
    descLower.includes(phrase)
  );
  
  // Check if description only contains generic terms without specifics
  const genericCount = GENERIC_DESCRIPTIONS.filter(term => 
    descLower.includes(term)
  ).length;
  
  // If it has many generic terms and hallucination phrases, it's likely generic
  if (hasHallucinationPhrase && genericCount >= 2) {
    return true;
  }
  
  // Check if description doesn't mention specific visual elements
  // Good descriptions should mention: colors, text, images, buttons, layout, etc.
  const specificVisualElements = [
    'text',
    'image',
    'button',
    'color',
    'background',
    'layout',
    'heading',
    'title',
    'logo',
    'icon',
    'photo',
    'picture',
    'graphic',
    'element',
    'section',
    'area',
    'box',
    'card',
    'menu',
    'navigation',
    'header',
    'footer',
    'content',
    'white',
    'black',
    'blue',
    'red',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
  ];
  
  const hasSpecificElements = specificVisualElements.some(element => 
    descLower.includes(element)
  );
  
  // If no specific visual elements mentioned, it's too generic
  if (!hasSpecificElements && description.length < 100) {
    return true;
  }
  
  // Check if description is just a template/placeholder
  if (descLower.match(/^(this|the|a|an)\s+(image|design|content|material|element)/) && 
      !descLower.match(/contains|shows|displays|features|includes/)) {
    return true;
  }
  
  return false;
}

/**
 * Check if description mentions specific visual details that indicate it's analyzing the actual image
 */
function hasSpecificVisualDetails(description: string): boolean {
  if (!description || description.trim().length < 20) {
    return false;
  }

  const descLower = description.toLowerCase();
  
  // Good indicators that it's describing the actual image:
  // - Mentions specific colors
  // - Mentions specific text content
  // - Mentions layout specifics
  // - Mentions specific elements
  
  const goodIndicators = [
    /(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)\s+(background|text|button|element|area)/i,
    /(centered|left|right|top|bottom|above|below)\s+(text|image|button|element)/i,
    /(large|small|big|tiny|huge|smaller|larger)\s+(text|image|button|element)/i,
    /(bold|italic|underlined|highlighted)\s+(text|heading|title)/i,
    /contains\s+(the|a|an)\s+(word|phrase|text|heading|title|button|image)/i,
    /shows\s+(a|an|the)\s+(specific|particular|actual|visible)/i,
    /displays\s+(a|an|the)\s+(specific|particular|actual|visible)/i,
    /features\s+(a|an|the)\s+(specific|particular|actual|visible)/i,
  ];
  
  return goodIndicators.some(pattern => pattern.test(description));
}

/**
 * Check if the analysis result appears to be hallucinating (not describing the actual image)
 */
export function isHallucinating(result: AnalysisResult, mode?: string): boolean {
  // Marketing mode gets stricter validation
  const isMarketingMode = mode === 'marketing';
  
  // Check description
  if (!result.description || isDescriptionTooGeneric(result.description)) {
    // If too generic, check if it has specific visual details
    if (!hasSpecificVisualDetails(result.description)) {
      return true;
    }
  }
  
  // Check if description uses too many uncertain phrases
  const descLower = result.description?.toLowerCase() || '';
  const uncertainPhraseCount = HALLUCINATION_PHRASES.filter(phrase => 
    descLower.includes(phrase)
  ).length;
  
  // Marketing mode: stricter threshold (1 instead of 2)
  const maxUncertainPhrases = isMarketingMode ? 1 : 2;
  if (uncertainPhraseCount > maxUncertainPhrases) {
    return true;
  }
  
  // Marketing mode: check for invented content indicators
  if (isMarketingMode) {
    // Check if description mentions marketing concepts without describing visible elements
    const marketingConcepts = ['value proposition', 'target audience', 'brand identity', 'marketing strategy'];
    const hasMarketingConcepts = marketingConcepts.some(concept => descLower.includes(concept));
    const hasVisibleElements = descLower.match(/(text|button|color|image|layout|heading|title|logo)/);
    
    // If mentions marketing concepts but doesn't describe visible elements, likely hallucinating
    if (hasMarketingConcepts && !hasVisibleElements) {
      return true;
    }
    
    // Check if description is very short and generic (stricter for marketing)
    if (result.description && 
        result.description.length < 80 && // Longer minimum for marketing
        isDescriptionTooGeneric(result.description)) {
      return true;
    }
  } else {
    // Other modes: original threshold
    if (result.description && 
        result.description.length < 50 && 
        isDescriptionTooGeneric(result.description)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get a confidence score for how well the description matches the actual image
 * Returns a value between 0 and 1, where 1 is high confidence
 */
export function getDescriptionConfidence(description: string): number {
  if (!description || description.trim().length < 30) {
    return 0;
  }
  
  let score = 0.5; // Start with neutral score
  
  const descLower = description.toLowerCase();
  
  // Positive indicators
  if (hasSpecificVisualDetails(description)) {
    score += 0.3;
  }
  
  // Check for specific colors mentioned
  const colorCount = (descLower.match(/(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|cyan|magenta)/g) || []).length;
  if (colorCount >= 2) {
    score += 0.1;
  }
  
  // Check for specific layout/position mentions
  if (descLower.match(/(centered|left|right|top|bottom|above|below|side|corner)/)) {
    score += 0.1;
  }
  
  // Negative indicators
  const hallucinationCount = HALLUCINATION_PHRASES.filter(phrase => 
    descLower.includes(phrase)
  ).length;
  score -= hallucinationCount * 0.1;
  
  const genericCount = GENERIC_DESCRIPTIONS.filter(term => 
    descLower.includes(term)
  ).length;
  if (genericCount >= 3) {
    score -= 0.2;
  }
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}
