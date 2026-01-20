const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * List available Claude models from the API
 */
async function getAvailableClaudeModels(): Promise<string[]> {
  if (!ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    // Try to get a specific model to verify API access, or list all models if endpoint exists
    // Note: The /v1/models endpoint may not exist, so we'll try and fallback gracefully
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    // Handle different response formats
    const models = data.data || data.models || [];
    const modelIds = models
      .map((m: any) => m.id || m)
      .filter((id: string) => id && typeof id === 'string');
    
    return modelIds;
  } catch (error: any) {
    return [];
  }
}

export async function analyzeImageWithClaude(
  imageBase64: string,
  prompt: string,
  timeoutMs: number = 15000,
  mode?: string,
  imageMimeType: string = 'image/jpeg' // Default to JPEG, but should be passed from route
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  // Try to get available models from API, fallback to common models
  let availableModels = await getAvailableClaudeModels();
  
  // Filter to only models that support vision (typically Sonnet and Opus, not Haiku for vision)
  // Prioritize models that we know work (claude-sonnet-4-20250514 is confirmed working)
  let visionModels: string[] = [];
  
  // Known working model - prioritize this first
  const knownWorkingModel = 'claude-sonnet-4-20250514';
  
  if (availableModels.length > 0) {
    const filtered = availableModels.filter((m: string) => 
      // Prefer Sonnet and Opus models (better for vision)
      m.includes('sonnet') || m.includes('opus')
    );
    
    // Put known working model first if it's in the list
    if (filtered.includes(knownWorkingModel)) {
      visionModels = [knownWorkingModel, ...filtered.filter(m => m !== knownWorkingModel)];
    } else {
      visionModels = filtered;
    }
  } else {
    // Fallback to common vision models, with known working model first
    visionModels = [
      knownWorkingModel, // Try this first - we know it works!
      'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
    ];
  }
  
  // If no vision models found after filtering, use all available (will adjust max_tokens per model)
  const models = visionModels.length > 0 ? visionModels : availableModels;
  
  let lastError: Error | null = null;
  
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Adjust max_tokens based on model (Haiku has lower limits)
      // Claude 3 Haiku: 4096, Claude 3 Sonnet/Opus: 8192, Claude 4: 8192+
      const maxTokens = model.includes('haiku') ? 4096 : 8192;

      // Claude Vision API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          temperature: 0.1, // Very low temperature to reduce hallucinations
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: imageMimeType, // Use actual image type (png, jpeg, webp)
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If 404 and not the last model, try next one
        if (response.status === 404 && models.indexOf(model) < models.length - 1) {
          lastError = new Error(`Model ${model} not found, trying next...`);
          clearTimeout(timeoutId);
          continue;
        }
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      clearTimeout(timeoutId);

      const data = await response.json();

      // Extract text from Claude response
      const text = data.content?.[0]?.text;
      if (!text) {
        throw new Error('No text in Claude response');
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
  
  // If we get here, all models failed
  if (lastError) {
    if ((lastError as any).name === 'AbortError' || lastError.message?.includes('timeout')) {
      throw new Error('Request timeout: Claude API took too long to respond');
    }
    if (lastError.message) {
      throw new Error(`Claude API error: ${lastError.message}`);
    }
    throw lastError;
  }
  throw new Error('All Claude models failed');
}
