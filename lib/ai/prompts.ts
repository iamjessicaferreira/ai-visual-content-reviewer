import { AnalysisMode } from '@/types/analysis';

export function getPromptForMode(mode: AnalysisMode, customPrompt?: string, feedbackContext?: string): string {
  // Use provided feedback context (from client) or empty string
  const context = feedbackContext || '';
  // If custom mode with custom prompt, use it and add structure instructions
  if (mode === 'custom' && customPrompt) {
    return `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze what you ACTUALLY see:

${customPrompt}

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [FIRST, read ALL text in the image word-by-word and list it exactly as it appears. THEN describe what you ACTUALLY see in the image in 1-2 sentences. Be SPECIFIC: quote text EXACTLY as it appears (word-for-word), mention actual colors, layout positions, buttons, images, or other concrete visual elements you can see. Do NOT use vague or hypothetical language. CRITICAL: Verify all text you mention actually exists in the image.]

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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible. If you see "Vestov", say "Vestov" - do NOT say "EcoCycle" or any other name.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.
- If there is no text visible, say "No text visible in the image" - do NOT invent text.

MANDATORY CHECKLIST - YOU MUST COMPLETE THIS BEFORE WRITING YOUR RESPONSE:

STEP 1: TEXT INVENTORY
- Read the image carefully and list EVERY word of text you can see, exactly as it appears
- Write down each piece of text verbatim (word-for-word)
- If there is no text, write "NO TEXT VISIBLE"
- DO NOT add any text that is not clearly visible

STEP 2: VISUAL ELEMENT INVENTORY  
- List every visual element you can clearly see: buttons, icons, logos, images, shapes, colors
- For each element, describe ONLY what you can see - do NOT infer or assume
- If you see a button, describe its exact appearance and any text on it
- If you see a logo, describe what it looks like - do NOT invent what company it represents
- DO NOT mention elements that are blurry, unclear, or partially visible

STEP 3: VERIFICATION
- Review your inventory from Steps 1 and 2
- For EVERY element you plan to mention in your analysis, verify it exists in your inventory
- If an element is not in your inventory, DO NOT mention it in your analysis
- This is your FINAL CHECK before writing

STEP 4: ANALYSIS
- ONLY NOW, write your analysis based EXCLUSIVELY on what is in your inventory
- If you cannot see something clearly, do NOT mention it
- If you are unsure, do NOT mention it
- Every issue, suggestion, and description MUST be based on elements from your inventory

ABSOLUTE REQUIREMENTS - READ CAREFULLY:
- You MUST describe ONLY what is ACTUALLY visible in the image - nothing more, nothing less
- DO NOT invent text content, headlines, or messages that you cannot see
- DO NOT assume what the marketing message "should be" or "might be" - only describe what IS there
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "probably shows", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention SPECIFIC colors (e.g., "blue background", not "colored background"), SPECIFIC text content (quote what you see EXACTLY), SPECIFIC layout positions
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe their EXACT appearance and any text on them.
- DO NOT make up headlines, CTAs, company names, brand names, or marketing messages that are not visible in the image
- If you cannot see a clear headline or CTA, say "No headline visible" or "No CTA visible" - do NOT invent one
- DO NOT describe elements that are not in the image (e.g., if you see a logo but no gaming console, do NOT mention a gaming console)
- DO NOT reference things that "might be in the background" if you cannot clearly see them
- DO NOT mention images, graphics, or visual elements that you cannot clearly identify
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention "EcoCycle" but the image shows "Vestov", that is a critical error.
- FINAL VERIFICATION: Before submitting your response, read through it and verify that EVERY element you mentioned (text, buttons, images, colors) actually exists in the image. If you cannot verify it, REMOVE it from your response.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [FIRST, list ALL text in the image exactly as it appears (e.g., "Text visible: 'Vestov', 'Building AI that serves humanity'"). THEN describe what you ACTUALLY see in the image. Be EXTREMELY SPECIFIC and LITERAL: quote any text you see word-for-word EXACTLY (if you see "Vestov", write "Vestov" - do NOT write "EcoCycle" or any other name), name exact colors, describe exact layout positions, mention exact buttons and their labels, describe any images or graphics you can CLEARLY see. Example: "The image shows a black background. The text visible reads exactly: 'Vestov' and 'Building AI that serves humanity.' There is a stylized letter V in the center with a gradient..." Do NOT use vague or hypothetical language. Do NOT invent content. Do NOT mention anything you cannot clearly see. Do NOT mention background images, cityscapes, sunsets, or landscapes unless they are clearly and prominently visible. If you cannot see something, do not mention it. CRITICAL: Verify all text and elements you mention actually exist in the image. If you cannot verify an element exists, do NOT mention it.]

2. Message Clarity: [Based ONLY on what you actually see in the image, evaluate how clear the visible message is. If you see text, analyze that text. If you don't see clear messaging, say so. Write 1-2 sentences based on what is ACTUALLY visible.]

3. Issues:
- [First specific issue based ONLY on elements you verified in your inventory - do NOT mention elements that are not clearly visible]
- [Second specific issue based ONLY on visible elements from your inventory]
- [Third specific issue if applicable, but ONLY if based on verified visible elements]
- IMPORTANT: If you cannot identify specific issues based on what you actually see, say "No specific issues identified based on visible elements" - do NOT invent issues about elements that are not visible

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

REMEMBER: Describe ONLY what you see. Do NOT invent content. Do NOT assume. Do NOT use vague language. Do NOT mention elements that are not clearly visible. If you cannot see something, do not mention it. Be literal and factual about what is actually in the image.

CRITICAL TEXT READING REMINDER: Read every word in the image exactly as it appears. If you see "Vestov", write "Vestov". If you see "Building AI that serves humanity", write exactly that. Do NOT invent different text, company names, or brand names. Before writing any text in your response, verify it exists in the image by reading it again.

FINAL VERIFICATION CHECKLIST BEFORE SUBMITTING:
□ I have listed all text visible in the image exactly as it appears
□ I have verified that every text I mentioned actually exists in the image
□ I have verified that every visual element I mentioned (buttons, images, colors) actually exists in the image
□ I have NOT mentioned any elements that are blurry, unclear, or not clearly visible
□ I have NOT invented any company names, brand names, or text
□ I have NOT mentioned background elements (cityscapes, sunsets, landscapes) unless they are clearly and prominently visible
□ Every issue and suggestion I wrote is based ONLY on elements I verified in my inventory

Do NOT use JSON format. Do NOT include quotes around text. Write naturally and clearly.${feedbackContext}`,

    ux: `CRITICAL: You are a vision-language AI model. An image has been provided to you in this request. You CAN see and analyze the actual image content. DO NOT say you cannot see the image. DO NOT provide generic or hypothetical responses.

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible. If you see "Vestov", say "Vestov" - do NOT say "EcoCycle" or any other name.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.
- If there is no text visible, say "No text visible in the image" - do NOT invent text.

Look at the image carefully and analyze it as a UX/UI designer focusing on landing page or interface design. FIRST, read ALL text in the image exactly as it appears. THEN describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
- Provide your response as plain text, NOT as JSON. Use clear section headers and bullet points.
- Complete ALL sentences fully - do not cut off mid-sentence
- Ensure all bullet points are complete thoughts

Format your response exactly like this:

1. Description: [FIRST, read ALL text in the image word-by-word and list it exactly as it appears. THEN describe what you ACTUALLY see in the image in 1-2 sentences. Be SPECIFIC: quote text EXACTLY as it appears (word-for-word), mention actual colors, layout positions, buttons, images, or other concrete visual elements you can see. Do NOT use vague or hypothetical language. CRITICAL: Verify all text you mention actually exists in the image.]

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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

MANDATORY PROCESS: 
1. FIRST, read ALL text in the image word-by-word and list it exactly as it appears
2. THEN, list all visual elements you can clearly see (buttons, icons, colors, layout)
3. FINALLY, write your analysis based ONLY on what you listed

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze it for accessibility and readability. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible. If you see "Vestov", say "Vestov" - do NOT say "EcoCycle" or any other name.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze it from a brand identity and consistency perspective. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze it from a color and typography perspective. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze it for social media optimization. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
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

MOST IMPORTANT RULE: You MUST ONLY describe what you can ACTUALLY SEE in the image. If you cannot see something clearly, DO NOT mention it. If you are unsure about something, DO NOT guess or assume. DO NOT invent any content, text, or elements that are not clearly visible.

CRITICAL TEXT READING RULES:
- Read ALL text in the image word-by-word, letter-by-letter. Quote text EXACTLY as it appears.
- If you see text, you MUST quote it EXACTLY. Do NOT paraphrase, summarize, or change the words.
- If you cannot read text clearly, say "Text is not clearly readable" - DO NOT guess what it says.
- DO NOT invent company names, brand names, or text that is not visible.
- DO NOT assume text content based on context. Only mention text you can ACTUALLY read.
- Before mentioning any text in your analysis, verify it exists in the image by reading it again.

Look at the image carefully. FIRST, read ALL text in the image exactly as it appears. THEN analyze it for conversion optimization. Describe what you ACTUALLY see in the image.

STRICT REQUIREMENTS:
- You MUST analyze the actual image that was provided to you
- You CAN see the image - describe what is actually visible with SPECIFIC DETAILS
- DO NOT say "I cannot see the image" or "without the image" - the image IS provided
- DO NOT use vague phrases like "appears to be", "seems to be", "likely contains", "might be", "could be" - describe what you ACTUALLY see with certainty
- DO NOT provide generic descriptions - mention specific colors, text content, layout, buttons, images, or other visual elements you can see
- TEXT READING IS CRITICAL: Read every word in the image. Quote text EXACTLY as it appears - word-for-word, letter-for-letter. Do NOT change, paraphrase, or summarize text.
- If you see text, quote it EXACTLY as it appears. If you see colors, name them PRECISELY. If you see buttons, describe them EXACTLY.
- DO NOT mention elements that are not clearly visible in the image
- DO NOT mention "cityscape", "sunset", "landscape", or any background elements unless they are clearly and prominently visible
- DOUBLE-CHECK: Before mentioning any text, verify it exists in the image. If you mention text that doesn't exist (e.g., saying "EcoCycle" when the image shows "Vestov"), that is a critical error.
- FINAL VERIFICATION: Before submitting, verify that EVERY element you mentioned actually exists in the image. If you cannot verify it, REMOVE it.
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
