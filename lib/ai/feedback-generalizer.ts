import Groq from 'groq-sdk';

/**
 * Uses AI to generalize specific feedback into generic methodology feedback
 * Example: "There's a dog in the image and you didn't mention it" 
 * -> "I'm not reading the image correctly, missing visible elements"
 */
export async function generalizeFeedbackWithAI(
  feedbackReasons: string[],
  timeoutMs: number = 5000
): Promise<string[]> {
  if (!feedbackReasons || feedbackReasons.length === 0) {
    return [];
  }

  // If no Groq API key, return original feedbacks (fallback)
  if (!process.env.GROQ_API_KEY) {
    return feedbackReasons;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Create prompt to generalize all feedbacks at once
    const feedbacksText = feedbackReasons
      .map((reason, idx) => `${idx + 1}. "${reason}"`)
      .join('\n');

    const generalizationPrompt = `You are analyzing user feedback about image analysis quality. The user provided specific feedback about previous analyses. Your task is to generalize these specific feedbacks into generic methodology lessons that can be applied to ANY image analysis, not just the specific images mentioned.

CRITICAL INSTRUCTIONS:
- Remove ALL references to specific image content (objects, text, colors, elements mentioned)
- Extract the GENERAL methodology issue or principle
- Focus on HOW the analysis should be done, not WHAT was in a specific image
- Keep it concise (1 sentence per feedback)
- Return ONLY the generalized feedbacks, one per line, numbered

Examples:
- Input: "There's a dog in the image and you didn't mention it"
  Output: "I need to identify and describe all visible elements in the image, not miss obvious objects"

- Input: "The text says 'Vestov' but you said 'EcoCycle'"
  Output: "I need to read text exactly as it appears, without inventing or confusing content"

- Input: "You mentioned a cityscape in the background but there isn't one"
  Output: "I should not invent or assume background elements that are not clearly visible"

User feedbacks to generalize:
${feedbacksText}

Return the generalized feedbacks (one per line, numbered), focusing on methodology and analysis principles, not specific image content:`;

    const completion = await groq.chat.completions.create(
      {
        messages: [
          {
            role: 'user',
            content: generalizationPrompt,
          },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2, // Very low temperature for consistent generalization
        max_tokens: 512, // Short responses
      },
      {
        signal: controller.signal as any,
      }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      // Fallback: return original feedbacks if AI fails
      return feedbackReasons;
    }

    // Parse the generalized feedbacks (one per line, numbered)
    const generalized = content
      .split('\n')
      .map(line => {
        // Remove numbering (e.g., "1. ", "2. ")
        const cleaned = line.replace(/^\d+\.\s*/, '').trim();
        // Remove quotes if present
        return cleaned.replace(/^["']|["']$/g, '');
      })
      .filter(line => line.length > 10) // Filter out very short lines
      .slice(0, feedbackReasons.length); // Don't return more than input

    // If we got fewer generalized feedbacks than input, pad with originals
    if (generalized.length < feedbackReasons.length) {
      return [...generalized, ...feedbackReasons.slice(generalized.length)];
    }

    return generalized;
  } catch (error: any) {
    // If AI generalization fails, return original feedbacks
    console.error('Failed to generalize feedback with AI:', error);
    return feedbackReasons;
  }
}
