import { analyzeImageWithHF } from './huggingface';
import { analyzeImageWithGemini } from './gemini';
import { getImageCaptionWithBLIP, generateFeedbackWithGroq } from './groq';
import { fileToBase64 } from '@/lib/utils/image';

/**
 * Generate a code prompt directly from the image (not from analysis result)
 * This is used for code-generation mode
 */
export async function generateCodePromptFromImage(
  imageFile: File,
  imageBase64: string,
  suggestions: string[]
): Promise<string> {
  const codeGenerationPrompt = `You are analyzing an image of a user interface or design. Your task is to generate a detailed, actionable prompt that can be used with AI code generators (like GitHub Copilot, ChatGPT, Claude, etc.) to implement the design shown in the image.

IMPORTANT: 
- DO NOT mention specific programming languages, frameworks, libraries, or technologies (e.g., React, Vue, Angular, Tailwind, Bootstrap, HTML, CSS, JavaScript, etc.). Keep it technology-agnostic.
- Focus on WHAT needs to be implemented (the design elements, layout, functionality) rather than HOW (specific technologies).
- The user's technology stack is unknown, so the prompt should be general and adaptable to any technology.

Analyze the image and identify:
1. All visible UI components and elements
2. Layout structure and organization
3. Visual styling and design patterns
4. Interactive elements and their behavior
5. Content hierarchy and information architecture

${suggestions.length > 0 ? `\nAdditionally, incorporate these improvement suggestions:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n` : ''}

Generate a comprehensive, actionable code generation prompt that:
1. Describes all the UI components and elements visible in the image
2. Explains the layout structure and organization
3. Details the visual styling requirements (colors, spacing, typography, etc.)
4. Describes interactive behaviors and functionality
5. Includes accessibility considerations
6. Mentions responsive design requirements if applicable
7. Incorporates the improvement suggestions listed above
8. Uses general terms like "styling", "layout", "components", "interactions" instead of technology-specific terms

The prompt should be ready to copy and paste directly into an AI code generator. Make it clear, specific, and implementation-focused, but technology-agnostic.`;

  let analysisText: string;

  try {
    // Try Hugging Face VLM first
    analysisText = await analyzeImageWithHF(imageFile, codeGenerationPrompt, 30000);
  } catch (hfError: any) {
    console.error('HF API error for code prompt:', hfError);

    // Fallback 1: Try Gemini Vision API
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log('Trying Gemini Vision API for code prompt...');
        analysisText = await analyzeImageWithGemini(imageBase64, codeGenerationPrompt, 30000);
      } else {
        throw new Error('GEMINI_API_KEY not set, trying next fallback');
      }
    } catch (geminiError: any) {
      console.error('Gemini API error for code prompt:', geminiError);

      // Fallback 2: Use BLIP for captioning, then Groq
      try {
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY is not set for code prompt generation');
        }

        let caption: string;
        try {
          caption = await getImageCaptionWithBLIP(imageBase64, 15000);
          console.log('BLIP caption for code prompt:', caption);
        } catch (blipError: any) {
          console.error('BLIP failed for code prompt, using generic description:', blipError);
          caption = `A user interface or design image showing various UI components, layout, and styling.`;
        }

        // Generate code prompt with Groq
        analysisText = await generateFeedbackWithGroq(
          caption,
          'code-generation',
          codeGenerationPrompt,
          20000
        );
      } catch (fallbackError: any) {
        console.error('Fallback error for code prompt:', fallbackError);
        throw new Error('Failed to generate code prompt from image');
      }
    }
  }

  // Clean up the response - remove any JSON artifacts or formatting
  return analysisText.trim();
}
