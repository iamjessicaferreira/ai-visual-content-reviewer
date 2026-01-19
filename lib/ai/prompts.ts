import { AnalysisMode } from '@/types/analysis';

export function getPromptForMode(mode: AnalysisMode, customPrompt?: string, feedbackContext?: string): string {
  // Use provided feedback context (from client) or empty string
  const context = feedbackContext || '';
  // If custom mode with custom prompt, use it and add structure instructions
  if (mode === 'custom' && customPrompt) {
    return `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze what you ACTUALLY see:

${customPrompt}

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you ACTUALLY see in the image in 1-2 sentences. Be SPECIFIC: mention actual colors, text content, layout positions, buttons, images, or other concrete visual elements you can see. Do NOT use vague or hypothetical language.]

2. Message Clarity: [Evaluate the clarity of the message or content. Write 1-2 sentences.]

3. Issues:
- [First issue or problem you identify]
- [Second issue if applicable]
- [Third issue if applicable]

4. Suggestions:
- [First actionable suggestion for improvement]
- [Second actionable suggestion if applicable]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline if applicable]
- [Second alternative headline if applicable]
- [Third alternative headline if applicable]

CTAs:
- [First alternative CTA phrase if applicable]
- [Second alternative CTA phrase if applicable]
- [Third alternative CTA phrase if applicable]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`;
  }

  const prompts: Record<Exclude<AnalysisMode, 'custom'>, string> = {
    marketing: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses. DO NOT invent or assume content that is not visible in the image.

STEP 1: FIRST, carefully observe the image and describe EXACTLY what you see. Look at every element: text, colors, images, buttons, layout, spacing, fonts, etc. Write down what is ACTUALLY visible.

STEP 2: THEN, analyze what you described from a marketing perspective.

ABSOLUTE REQUIREMENTS - READ CAREFULLY:
- You MUST describe ONLY what is ACTUALLY visible in the image - nothing more, nothing less
- DO NOT invent text content, headlines, or messages that you cannot see
- DO NOT assume what the marketing message "should be" or "might be" - only describe what IS there
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "probably shows" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention SPECIFIC colors (e.g., "blue background", not "colored background"), SPECIFIC text content (quote what you see), SPECIFIC layout positions
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe their EXACT appearance and any text on them.
- DO NOT make up headlines, CTAs, or marketing messages that are not visible in the image
- If you cannot see a clear headline or CTA, say so - do not invent one
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [FIRST describe what you ACTUALLY see in the image. Be EXTREMELY SPECIFIC: quote any text you see word-for-word, name exact colors, describe exact layout positions, mention exact buttons and their labels, describe any images or graphics you see. Example: "The image shows a white background with blue text that says 'Get Started' in the center. There is a red button below it labeled 'Sign Up Now'. The layout is centered with..." Do NOT use vague or hypothetical language. Do NOT invent content.]

2. Message Clarity: [Based ONLY on what you actually see in the image, evaluate how clear the visible message is. If you see text, analyze that text. If you don't see clear messaging, say so. Write 1-2 sentences based on what is ACTUALLY visible.]

3. Issues:
- [First specific issue based on what you ACTUALLY see - not what you assume should be there]
- [Second specific issue based on visible elements]
- [Third specific issue if applicable]

4. Suggestions:
- [First actionable suggestion based on what you ACTUALLY see in the image]
- [Second actionable suggestion]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [ONLY if you see a headline in the image, provide variations. If you don't see a headline, say "No headline visible in the image"]
- [Alternative headline based on visible content]
- [Third alternative headline if applicable]

CTAs:
- [ONLY if you see a CTA button or text in the image, provide variations. If you don't see a CTA, say "No CTA visible in the image"]
- [Alternative CTA phrase based on visible content]
- [Third alternative CTA phrase if applicable]

REMEMBER: Describe ONLY what you see. Do NOT invent content. Do NOT assume. Do NOT use vague language.

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    ux: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it as a UX/UI designer focusing on landing page or interface design. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you ACTUALLY see in the image in 1-2 sentences. Be SPECIFIC: mention actual colors, text content, layout positions, buttons, images, or other concrete visual elements you can see. Do NOT use vague or hypothetical language.]

2. Message Clarity: [Evaluate how clear the user's path and primary action are. Is the interface intuitive? Write 1-2 sentences.]

3. Issues:
- [First specific UX/UI issue]
- [Second specific UX/UI issue]
- [Third specific UX/UI issue if applicable]

4. Suggestions:
- [First actionable UX/UI improvement suggestion]
- [Second actionable UX/UI improvement suggestion]
- [Third actionable UX/UI improvement suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    accessibility: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it for accessibility and readability. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you actually see in the image in 1-2 sentences. Be specific about the content and layout.]

2. Message Clarity: [Evaluate readability and how accessible the content is to users with different abilities. Write 1-2 sentences.]

3. Issues:
- [First specific accessibility or readability issue]
- [Second specific accessibility or readability issue]
- [Third specific accessibility or readability issue if applicable]

4. Suggestions:
- [First actionable suggestion to improve accessibility]
- [Second actionable suggestion to improve accessibility]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    brand: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it from a brand identity and consistency perspective. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you actually see in the image in 1-2 sentences. Be specific about brand elements, logos, colors, and visual identity visible.]

2. Message Clarity: [Evaluate how clear and consistent the brand message and visual identity are. Does it align with brand guidelines? Write 1-2 sentences.]

3. Issues:
- [First specific brand consistency or identity issue]
- [Second specific brand issue]
- [Third specific brand issue if applicable]

4. Suggestions:
- [First actionable suggestion to improve brand consistency and identity]
- [Second actionable suggestion]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline that better reflects the brand]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase aligned with brand voice]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    'color-typography': `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it from a color and typography perspective. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you actually see in the image in 1-2 sentences. Be specific about color choices, typography, and visual hierarchy visible.]

2. Message Clarity: [Evaluate how effectively colors and typography communicate the message. Do they create the right emotional impact? Write 1-2 sentences.]

3. Issues:
- [First specific color or typography issue (e.g., poor contrast, font readability, color psychology)]
- [Second specific color or typography issue]
- [Third specific color or typography issue if applicable]

4. Suggestions:
- [First actionable suggestion to improve color and typography choices]
- [Second actionable suggestion]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline with better typography considerations]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase with better color/typography emphasis]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    'social-media': `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it for social media optimization. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you actually see in the image in 1-2 sentences. Be specific about social media elements, format, and content visible.]

2. Message Clarity: [Evaluate how clear and engaging the content is for social media. Will it capture attention and encourage sharing? Write 1-2 sentences.]

3. Issues:
- [First specific social media optimization issue (e.g., format, engagement, shareability)]
- [Second specific social media issue]
- [Third specific social media issue if applicable]

4. Suggestions:
- [First actionable suggestion to improve social media engagement and shareability]
- [Second actionable suggestion]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline optimized for social media]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase optimized for social engagement]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    conversion: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

Look at the image carefully and analyze it for conversion optimization. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains" - describe what you ACTUALLY see
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- If you see text, mention what it says. If you see colors, name them. If you see buttons, describe them.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [Describe what you actually see in the image in 1-2 sentences. Be specific about conversion elements, CTAs, and persuasive design visible.]

2. Message Clarity: [Evaluate how clear the path to conversion is. Is the call-to-action obvious and compelling? Write 1-2 sentences.]

3. Issues:
- [First specific conversion optimization issue (e.g., weak CTA, unclear value proposition, friction points)]
- [Second specific conversion issue]
- [Third specific conversion issue if applicable]

4. Suggestions:
- [First actionable suggestion to improve conversion rates and reduce friction]
- [Second actionable suggestion]
- [Third actionable suggestion if applicable]

5. Copy Variations:
Headlines:
- [First alternative headline optimized for conversion]
- [Second alternative headline]
- [Third alternative headline]

CTAs:
- [First alternative CTA phrase optimized for higher conversion]
- [Second alternative CTA phrase]
- [Third alternative CTA phrase]

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,
  };

  return prompts[mode as Exclude<AnalysisMode, 'custom'>];
}
