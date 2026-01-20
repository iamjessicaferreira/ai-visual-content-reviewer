import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult, AnalysisMode, AnalysisError } from '@/types/analysis';
import { fileToBase64, validateImageFile } from '@/lib/utils/image';
import { analyzeImageWithHF } from '@/lib/ai/huggingface';
import { analyzeImageWithGemini } from '@/lib/ai/gemini';
import { analyzeImageWithClaude } from '@/lib/ai/claude';
import { analyzeImageWithOpenAI } from '@/lib/ai/openai';
import { getImageCaptionWithBLIP, generateFeedbackWithGroq } from '@/lib/ai/groq';
import { generalizeFeedbackWithAI } from '@/lib/ai/feedback-generalizer';
import { getPromptForMode } from '@/lib/ai/prompts';
import { parseAIResponse } from '@/lib/utils/parser';
import { hasEmptyRequiredFields } from '@/lib/utils/result-checker';
import { isHallucinating } from '@/lib/utils/hallucination-detector';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan allows up to 60s
export const dynamic = 'force-dynamic'; // Prevent caching of this route

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
    // Use AI to generalize specific feedback into generic methodology feedback
    let feedbackContext = '';
    if (feedbackContextStr) {
      try {
        const feedbacks = JSON.parse(feedbackContextStr);
        if (Array.isArray(feedbacks) && feedbacks.length > 0) {
          // Extract all negative feedback reasons
          const reasons = feedbacks
            .filter((f: any) => f.feedback === 'negative' && f.reason)
            .map((f: any) => f.reason)
            .slice(0, 5); // Limit to last 5 feedbacks
          
          if (reasons.length > 0) {
            // Use AI to generalize specific feedbacks into generic methodology lessons
            // This transforms "There's a dog in the image" -> "I need to identify all visible elements"
            let generalizedReasons: string[];
            try {
              generalizedReasons = await generalizeFeedbackWithAI(reasons, 5000);
            } catch (e) {
              // If AI generalization fails, use original feedbacks (fallback)
              console.error('Failed to generalize feedback with AI:', e);
              generalizedReasons = reasons;
            }
            
            if (generalizedReasons.length > 0) {
              feedbackContext = `

IMPORTANT CONTEXT FROM PREVIOUS USER FEEDBACK (GENERALIZED METHODOLOGY LESSONS):
The user has provided feedback on previous analyses in this mode. These feedbacks have been generalized into methodology principles that apply to ALL image analyses, not specific images:

${generalizedReasons.slice(0, 3).map((issue: string, idx: number) => `${idx + 1}. ${issue}`).join('\n')}

CRITICAL: These are GENERAL methodology principles learned from previous feedback. Apply these lessons to the CURRENT image you are analyzing, but do NOT reference or assume content from previous images. Analyze ONLY what you see in the CURRENT image provided to you.

ABSOLUTELY CRITICAL - CONTENT ISOLATION:
- If previous feedback mentioned specific content (text, brand names, objects, colors) from a previous image, IGNORE those specific references completely
- DO NOT assume any text, brand, or element exists in the current image unless you can CLEARLY see it
- For example: If feedback says "You mentioned 'Vestov' but it wasn't in the image", the lesson is ONLY: "Read text exactly as it appears, don't invent text"
- DO NOT assume "Vestov" or any other specific content exists in the current image
- DO NOT mention any text, brand name, or element unless you can CLEARLY see it in the CURRENT image you are analyzing RIGHT NOW

Based on these generalized lessons, ensure your analysis:
- Follows the methodology principles mentioned above
- Applies these general principles to the CURRENT image only
- Does NOT reference or assume content from previous images
- Does NOT mention any specific text, brand names, or elements unless you can CLEARLY see them in the CURRENT image
- Provides accurate and relevant insights based ONLY on what is visible in the current image`;
            }
          }
        }
      } catch (e) {
        // Ignore errors parsing feedback context
        console.error('Error processing feedback context:', e);
      }
    }
    
    const prompt = getPromptForMode(
      mode as AnalysisMode,
      mode === 'custom' ? customPrompt || undefined : undefined,
      feedbackContext
    );

    let analysisText: string;
    let imageBase64: string | null = null; // Lazy load base64 only when needed

    // Determine which model to use based on VISION_MODEL env var
    // Options: 'gemini', 'claude', 'openai', 'auto' (default: 'auto')
    const visionModel = (process.env.VISION_MODEL || 'auto').toLowerCase();
    
    // Track which model was actually used
    let usedModel: string | null = null;

    // Helper function to try a specific model
    const tryModel = async (modelName: string): Promise<string> => {
      if (!imageBase64) imageBase64 = await fileToBase64(imageFile);

      usedModel = modelName;

      switch (modelName) {
        case 'claude':
          if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not set');
          }
          // Get image MIME type (default to jpeg if not detected)
          const imageMimeType = imageFile.type || 'image/jpeg';
          return await analyzeImageWithClaude(imageBase64, prompt, 15000, mode, imageMimeType);
        
        case 'openai':
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not set');
          }
          return await analyzeImageWithOpenAI(imageBase64, prompt, 15000, mode);
        
        case 'gemini':
          if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not set');
          }
          return await analyzeImageWithGemini(imageBase64, prompt, 15000, mode);
        
        default:
          throw new Error(`Unknown model: ${modelName}`);
      }
    };

    try {
      // If specific model is requested, try only that one
      if (visionModel !== 'auto') {
        analysisText = await tryModel(visionModel);
      } else {
        // Auto mode: try models in order of preference
        // 1. Claude (best at following instructions, less hallucinations)
        // 2. OpenAI GPT-4o (good OCR, accurate)
        // 3. Gemini (free tier, good fallback)
        
        let lastError: Error | null = null;
        
        // Try Claude first
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            analysisText = await tryModel('claude');
          } catch (claudeError: any) {
            lastError = claudeError;
            // Try next model
          }
        }
        
        // Try OpenAI if Claude failed or not available
        if (!analysisText && process.env.OPENAI_API_KEY) {
          try {
            analysisText = await tryModel('openai');
          } catch (openaiError: any) {
            lastError = openaiError;
            // Try next model
          }
        }
        
        // Try Gemini if others failed or not available
        if (!analysisText && process.env.GEMINI_API_KEY) {
          try {
            analysisText = await tryModel('gemini');
          } catch (geminiError: any) {
            lastError = geminiError;
            // Will fall through to fallback
          }
        }
        
        // If all failed, throw error
        if (!analysisText) {
          throw lastError || new Error('No vision model API keys configured. Please set at least one: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY');
        }
      }
    } catch (visionError: any) {
      // Fallback 1: Try Hugging Face (captioning models, limited prompt support)
      // HF accepts File directly, no base64 conversion needed
      try {
        analysisText = await analyzeImageWithHF(imageFile, prompt, 10000); // Reduced timeout
        usedModel = 'huggingface';
      } catch (hfError: any) {
        // Fallback 2: Use BLIP for captioning, then Groq for structured feedback
        // If BLIP also fails, use Groq with a generic image description
        try {
          if (!process.env.GROQ_API_KEY) {
            throw new Error(
              'All vision APIs failed. Please set at least one: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY for fallback functionality.'
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
          usedModel = 'groq';
        } catch (fallbackError: any) {
          return NextResponse.json<AnalysisError>(
            {
              error:
                fallbackError.message ||
                'Failed to analyze image. Please set at least one API key: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY.',
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
    const hasEmpty = hasEmptyRequiredFields(result);
    const isHalluc = isHallucinating(result, mode);
    
    if (hasEmpty || isHalluc) {
      try {
        // Retry with the same model selection strategy
        if (visionModel !== 'auto') {
          // Retry with same model
          if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
          analysisText = await tryModel(visionModel);
        } else {
          // Try in order: Claude -> OpenAI -> Gemini (same as initial attempt)
          let retryLastError: Error | null = null;
          
          if (process.env.ANTHROPIC_API_KEY) {
            try {
              if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
              analysisText = await tryModel('claude');
            } catch (e: any) {
              retryLastError = e;
            }
          }
          
          if (!analysisText && process.env.OPENAI_API_KEY) {
            try {
              if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
              analysisText = await tryModel('openai');
            } catch (e: any) {
              retryLastError = e;
            }
          }
          
          if (!analysisText && process.env.GEMINI_API_KEY) {
            try {
              if (!imageBase64) imageBase64 = await fileToBase64(imageFile);
              analysisText = await tryModel('gemini');
            } catch (e: any) {
              retryLastError = e;
            }
          }
          
          if (!analysisText && process.env.GROQ_API_KEY) {
            // Fallback to Groq
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
        }

        result = parseAIResponse(analysisText);
        result.mode = mode as AnalysisMode;
      } catch (retryError: any) {
        // If retry fails, return current result (better than nothing)
      }
    }

    // Add header to indicate which model was used (for debugging)
    const headers = new Headers();
    headers.set('X-Vision-Model-Used', usedModel || 'unknown');
    headers.set('X-Vision-Model-Requested', visionModel);

    return NextResponse.json<AnalysisResult>(result, { headers });
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
