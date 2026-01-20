const HF_API_TOKEN = process.env.HF_API_TOKEN;

export async function analyzeImageWithHF(
  imageData: File | Blob | string,
  prompt: string,
  timeoutMs: number = 10000 // Optimized default timeout
): Promise<string> {
  // Try multiple vision-language models in order (with active inference providers)
  // Note: Many models may not be available via public Inference API
  const models = [
    'nlpconnect/vit-gpt2-image-captioning', // More reliable captioning model
    'Salesforce/blip2-opt-2.7b', // BLIP-2
  ];

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Convert image to ArrayBuffer for FormData (Blob compatibility)
    let imageArrayBuffer: ArrayBuffer;
    let base64Image: string;
    
    if (imageData instanceof File || imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      // Create a copy to ensure we have a real ArrayBuffer (not SharedArrayBuffer)
      imageArrayBuffer = arrayBuffer.slice(0);
      // Convert to base64 for fallback JSON format
      const imageBuffer = Buffer.from(arrayBuffer);
      base64Image = imageBuffer.toString('base64');
    } else if (typeof imageData === 'string') {
      // Base64 string - convert to Buffer first, then to ArrayBuffer
      const imageBuffer = Buffer.from(imageData, 'base64');
      // Create a new ArrayBuffer with a copy of the data
      imageArrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength);
      base64Image = imageData; // Already base64
    } else {
      throw new Error('Unsupported image data type');
    }

    let lastError: Error | null = null;

    // Try multiple models
    for (const model of models) {
      try {
        // Try FormData first (standard format)
        const formData = new FormData();
        formData.append('inputs', new Blob([imageArrayBuffer], { type: 'image/jpeg' }));

        let response = await fetch(
          `https://router.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              ...(HF_API_TOKEN && {
                Authorization: `Bearer ${HF_API_TOKEN}`,
              }),
            },
            body: formData,
            signal: controller.signal,
          }
        );

        // If FormData fails with 404/415, try JSON format with base64
        if (response.status === 404 || response.status === 415) {
          response = await fetch(
            `https://router.huggingface.co/models/${model}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(HF_API_TOKEN && {
                  Authorization: `Bearer ${HF_API_TOKEN}`,
                }),
              },
              body: JSON.stringify({
                inputs: base64Image,
              }),
              signal: controller.signal,
            }
          );
        }

        if (response.status === 404 || response.status === 410) {
          // Model not available, try next one
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          // If it's a 404/410, try next model
          if (response.status === 404 || response.status === 410) {
            continue;
          }
          throw new Error(`HF API error (${model}): ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }

        clearTimeout(timeoutId);

        const data = await response.json();
        
        // Handle error response from HF (model loading)
        if (data.error) {
          throw new Error(`Model error: ${data.error}`);
        }

        // Extract text from response
        let responseText: string | undefined;
        
        if (typeof data === 'string') {
          responseText = data;
        } else if (data && typeof data === 'object') {
          if ('generated_text' in data) {
            responseText = data.generated_text as string;
          } else if ('text' in data) {
            responseText = data.text as string;
          } else if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (typeof firstItem === 'string') {
              responseText = firstItem;
            } else if (firstItem && typeof firstItem === 'object') {
              responseText = firstItem.generated_text || firstItem.text;
            }
          }
        }

        if (!responseText) {
          throw new Error('Unexpected response format from Hugging Face API');
        }

        return responseText;
      } catch (error: any) {
        lastError = error;
        
        // If it's a 404/410, try next model
        if (
          error.message?.includes('404') || 
          error.message?.includes('410') ||
          error.message?.includes('Not Found') ||
          error.message?.includes('Gone')
        ) {
          if (models.indexOf(model) < models.length - 1) {
            continue;
          }
        }
        
        // For other errors on last model, throw
        if (models.indexOf(model) === models.length - 1) {
          throw error;
        }
        
        // Otherwise try next model
        continue;
      }
    }

    clearTimeout(timeoutId);
    
    // If all models failed
    throw lastError || new Error('All Hugging Face vision models failed. Please try again later or use a different analysis mode.');
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timeout: Hugging Face API took too long to respond');
    }
    if (error.message) {
      throw new Error(`Hugging Face API error: ${error.message}`);
    }
    throw new Error('Failed to analyze image with Hugging Face API');
  }
}
