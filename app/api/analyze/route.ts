import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult, AnalysisMode, AnalysisError } from '@/types/analysis';
import { fileToBase64, validateImageFile } from '@/lib/utils/image';
import { analyzeImageWithHF } from '@/lib/ai/huggingface';
import { analyzeImageWithGemini } from '@/lib/ai/gemini';
import { getImageCaptionWithBLIP, generateFeedbackWithGroq } from '@/lib/ai/groq';
import { getPromptForMode } from '@/lib/ai/prompts';
import { parseAIResponse } from '@/lib/utils/parser';
import { hasEmptyRequiredFields } from '@/lib/utils/result-checker';
import { isHallucinating } from '@/lib/utils/hallucination-detector';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan allows up to 60s

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const mode = formData.get('mode') as string;
    const customPrompt = formData.get('customPrompt') as string | null;
    const feedbackContextStr = formData.get('feedbackContext') as string | null;

    // Validate inputs
    if (!imageFile) {
      return NextResponse.json<AnalysisError>(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!mode || !['marketing', 'ux', 'accessibility', 'brand', 'color-typography', 'social-media', 'conversion', 'custom'].includes(mode)) {
      return NextResponse.json<AnalysisError>(
        { error: 'Invalid analysis mode' },
        { status: 400 }
      );
    }

    // Validate custom prompt if mode is custom
    if (mode === 'custom' && (!customPrompt || !customPrompt.trim())) {
      return NextResponse.json<AnalysisError>(
        { error: 'Custom prompt is required when using custom mode' },
        { status: 400 }
      );
    }

    // Validate image file
    const validation = validateImageFile(imageFile);
    if (!validation.valid) {
      return NextResponse.json<AnalysisError>(
        { error: validation.error || 'Invalid image file' },
        { status: 400 }
      );
    }

    // Get prompt first (synchronous, fast)
    // Include feedback context if provided by client
    let feedbackContext = '';
    if (feedbackContextStr) {
      try {
        const feedbacks = JSON.parse(feedbackContextStr);
        if (Array.isArray(feedbacks) && feedbacks.length > 0) {
          const reasons = feedbacks
            .filter((f: any) => f.feedback === 'negative' && f.reason)
            .map((f: any) => f.reason);
          
          if (reasons.length > 0) {
            feedbackContext = `

IMPORTANT CONTEXT FROM PREVIOUS USER FEEDBACK:
The user has provided negative feedback on previous analyses in this mode. Please learn from these issues and avoid repeating them:

${reasons.slice(0, 5).map((issue: string, idx: number) => `${idx + 1}. ${issue}`).join('\n')}

Based on this feedback, ensure your analysis:
- Addresses the specific issues mentioned above
- Avoids the mistakes identified in previous feedback
- Provides more accurate and relevant insights`;
          }
        }
      } catch (e) {
        // Ignore errors parsing feedback context
      }
    }
    
    const prompt = getPromptForMode(
      mode as AnalysisMode,
      mode === 'custom' ? customPrompt || undefined : undefined,
      feedbackContext
    );

    let analysisText: string;
    let imageBase64: string | null = null; // Lazy load base64 only when needed

    try {
      // Try Gemini Vision API first (true VLM that accepts custom prompts)
      if (process.env.GEMINI_API_KEY) {
        // Convert to base64 only for Gemini
        if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
        analysisText = await analyzeImageWithGemini(imageBase64, prompt, 15000, mode); // Pass mode for temperature adjustment
      } else {
        throw new Error('GEMINI_API_KEY not set, trying Hugging Face');
      }
    } catch (geminiError: any) {
      // Fallback 1: Try Hugging Face (captioning models, limited prompt support)
      // HF accepts File directly, no base64 conversion needed
      try {
        analysisText = await analyzeImageWithHF(imageFile, prompt, 10000); // Reduced timeout
      } catch (hfError: any) {
        // Fallback 2: Use BLIP for captioning, then Groq for structured feedback
        // If BLIP also fails, use Groq with a generic image description
        try {
          if (!process.env.GROQ_API_KEY) {
            throw new Error(
              'All vision APIs failed. Please set GEMINI_API_KEY (recommended) or GROQ_API_KEY for fallback functionality.'
            );
          }

          let caption: string;
          try {
            // Convert to base64 only for BLIP
            if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
            caption = await getImageCaptionWithBLIP(imageBase64, 8000); // Reduced timeout
          } catch (blipError: any) {
            // If BLIP fails, use a generic description
            caption = `An image file (${imageFile.type}, ${(imageFile.size / 1024).toFixed(0)}KB). Please analyze this visual content based on the analysis mode selected.`;
          }

          // Generate structured feedback with Groq
          analysisText = await generateFeedbackWithGroq(
            caption,
            mode,
            prompt,
            8000 // Reduced timeout
          );
        } catch (fallbackError: any) {
          return NextResponse.json<AnalysisError>(
            {
              error:
                fallbackError.message ||
                'Failed to analyze image. Please set GEMINI_API_KEY (recommended) or GROQ_API_KEY for fallback functionality.',
            },
            { status: 500 }
          );
        }
      }
    }

    // Parse and normalize the response
    let result: AnalysisResult = parseAIResponse(analysisText);
    result.mode = mode as AnalysisMode;
    // Generate unique ID for this result (for feedback tracking)
    result.id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Auto-retry if any required field is empty OR if AI is hallucinating (only 1 retry for speed)
    // Only retry if result is truly incomplete (not just generic messages) or hallucinating
    // Pass mode for stricter validation in marketing mode
    if (hasEmptyRequiredFields(result) || isHallucinating(result, mode)) {
      try {
        // Retry with the same strategy (prioritize Gemini)
        if (process.env.GEMINI_API_KEY) {
          if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
          analysisText = await analyzeImageWithGemini(imageBase64, prompt, 15000, mode);
        } else if (process.env.GROQ_API_KEY) {
          // If no Gemini, try Groq fallback
          if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
          let caption: string;
          try {
            caption = await getImageCaptionWithBLIP(imageBase64, 8000);
          } catch {
            caption = `An image file (${imageFile.type}, ${(imageFile.size / 1024).toFixed(0)}KB). Please analyze this visual content based on the analysis mode selected.`;
          }
          analysisText = await generateFeedbackWithGroq(caption, mode, prompt, 8000);
        } else {
          analysisText = await analyzeImageWithHF(imageFile, prompt, 10000);
        }

        result = parseAIResponse(analysisText);
        result.mode = mode as AnalysisMode;
      } catch (retryError: any) {
        // If retry fails, return current result (better than nothing)
      }
    }


    return NextResponse.json<AnalysisResult>(result);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json<AnalysisError>(
      {
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
