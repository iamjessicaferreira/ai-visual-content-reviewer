const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function analyzeImageWithGemini(
  imageBase64: string,
  prompt: string,
  timeoutMs: number = 15000, // Optimized default timeout
  mode?: string // Optional mode for temperature adjustment
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Gemini Vision API - send image as base64 in inline_data
    // Use only gemini-1.5-flash (most reliable, free tier, confirmed working)
    // Note: gemini-1.5-pro may not be available in free tier
    const models = [
      'gemini-1.5-flash', // Most reliable, free tier, confirmed working
    ];
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        // Try v1 API first (more stable), fallback to v1beta if needed
        // gemini-3 uses v1, gemini-1.5 uses v1, older models use v1beta
        const apiVersion = model.includes('3') || model.includes('1.5') ? 'v1' : 'v1beta';
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                // Lower temperature for all modes to reduce hallucinations and improve accuracy
                temperature: 0.3,
                maxOutputTokens: 8192, // Increased to prevent truncation
                topP: 0.8,
                topK: 20,
              },
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // If 404, try next model
          if (response.status === 404 && models.indexOf(model) < models.length - 1) {
            lastError = new Error(`Model ${model} not found, trying next...`);
            continue;
          }
          throw new Error(`Gemini API error (${model}): ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }

        clearTimeout(timeoutId);

        const data = await response.json();

        // Extract text from Gemini response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('No text in Gemini response');
        }

        return text;
      } catch (error: any) {
        lastError = error;
        // If it's the last model, throw the error
        if (models.indexOf(model) === models.length - 1) {
          throw error;
        }
        // Otherwise try next model
        continue;
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('All Gemini models failed');
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timeout: Gemini API took too long to respond');
    }
    if (error.message) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error('Failed to analyze image with Gemini API');
  }
}
