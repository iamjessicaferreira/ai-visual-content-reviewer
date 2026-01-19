import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult, AnalysisMode, AnalysisError } from '@/types/analysis';
import { fileToBase64, validateImageFile } from '@/lib/utils/image';
import { analyzeImageWithHF } from '@/lib/ai/huggingface';
import { analyzeImageWithGemini } from '@/lib/ai/gemini';
import { getImageCaptionWithBLIP, generateFeedbackWithGroq } from '@/lib/ai/groq';
import { getPromptForMode } from '@/lib/ai/prompts';
import { parseAIResponse } from '@/lib/utils/parser';
import { hasEmptyRequiredFields } from '@/lib/utils/result-checker';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan allows up to 60s

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const mode = formData.get('mode') as string;
    const customPrompt = formData.get('customPrompt') as string | null;

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

    // Convert image to base64 for fallback, but pass File directly to HF
    const imageBase64 = await fileToBase64(imageFile);
    const prompt = getPromptForMode(
      mode as AnalysisMode,
      mode === 'custom' ? customPrompt || undefined : undefined
    );

    let analysisText: string;

    try {
      // Try Gemini Vision API first (true VLM that accepts custom prompts)
      if (process.env.GEMINI_API_KEY) {
        console.log('Trying Gemini Vision API (primary)...');
        analysisText = await analyzeImageWithGemini(imageBase64, prompt, 20000); // Reduced timeout
      } else {
        throw new Error('GEMINI_API_KEY not set, trying Hugging Face');
      }
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);

      // Fallback 1: Try Hugging Face (captioning models, limited prompt support)
      try {
        console.log('Trying Hugging Face API...');
        analysisText = await analyzeImageWithHF(imageFile, prompt, 15000); // Reduced timeout
      } catch (hfError: any) {
        console.error('HF API error:', hfError);

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
            // Try to get image caption with BLIP
            caption = await getImageCaptionWithBLIP(imageBase64, 10000); // Reduced timeout
            console.log('BLIP caption:', caption);
          } catch (blipError: any) {
            console.error('BLIP failed, using generic description:', blipError);
            // If BLIP fails, use a generic description
            caption = `An image file (${imageFile.type}, ${(imageFile.size / 1024).toFixed(0)}KB). Please analyze this visual content based on the analysis mode selected.`;
          }

          // Generate structured feedback with Groq
          analysisText = await generateFeedbackWithGroq(
            caption,
            mode,
            prompt,
            10000 // Reduced timeout
          );
        } catch (fallbackError: any) {
          console.error('Fallback error:', fallbackError);
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

    // Auto-retry if any required field is empty (max 2 retries for speed)
    const maxRetries = 2;
    let retryCount = 0;
    
    while (hasEmptyRequiredFields(result) && retryCount < maxRetries) {
      console.log(`Result has empty/incomplete required fields, retrying analysis (attempt ${retryCount + 1}/${maxRetries})...`);
      console.log(`Validation check - Description: "${result.description?.substring(0, 100)}...", Clarity: "${result.clarity?.substring(0, 100)}...", Issues: ${result.issues.length}, Suggestions: ${result.suggestions.length}`);
      console.log(`Issues: ${JSON.stringify(result.issues)}, Suggestions: ${JSON.stringify(result.suggestions)}`);
      retryCount++;

      try {
        // Retry with the same strategy (prioritize Gemini)
        try {
          if (process.env.GEMINI_API_KEY) {
            analysisText = await analyzeImageWithGemini(imageBase64, prompt, 20000); // Reduced timeout
          } else {
            throw new Error('GEMINI_API_KEY not set, trying Hugging Face');
          }
        } catch (geminiError: any) {
          try {
            analysisText = await analyzeImageWithHF(imageFile, prompt, 15000); // Reduced timeout
          } catch (hfError: any) {
            if (process.env.GROQ_API_KEY) {
              let caption: string;
              try {
                caption = await getImageCaptionWithBLIP(imageBase64, 10000); // Reduced timeout
              } catch {
                caption = `An image file (${imageFile.type}, ${(imageFile.size / 1024).toFixed(0)}KB). Please analyze this visual content based on the analysis mode selected.`;
              }
              analysisText = await generateFeedbackWithGroq(caption, mode, prompt, 10000); // Reduced timeout
            } else {
              throw new Error('No API keys available for retry');
            }
          }
        }

        result = parseAIResponse(analysisText);
        result.mode = mode as AnalysisMode;
        
        // Log the result after retry to help debug
        console.log(`After retry ${retryCount}: Description length: ${result.description.length}, Clarity length: ${result.clarity.length}, Issues: ${result.issues.length}, Suggestions: ${result.suggestions.length}`);
        
        // If still has empty fields after retry, continue to next retry
        if (hasEmptyRequiredFields(result) && retryCount < maxRetries) {
          console.log(`Still has empty fields after retry ${retryCount}, will retry again...`);
        }
      } catch (retryError: any) {
        console.error('Retry failed:', retryError);
        // If retry fails, continue to next retry attempt (don't break immediately)
        if (retryCount >= maxRetries) {
          console.log('Max retries reached, returning current result');
          break;
        }
      }
    }
    
    // Final validation log
    if (hasEmptyRequiredFields(result)) {
      console.warn('WARNING: Result still has empty/incomplete fields after all retries:', {
        description: result.description.substring(0, 50),
        clarity: result.clarity.substring(0, 50),
        issuesCount: result.issues.length,
        suggestionsCount: result.suggestions.length,
      });
    } else {
      console.log('SUCCESS: All required fields are complete after retries');
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
