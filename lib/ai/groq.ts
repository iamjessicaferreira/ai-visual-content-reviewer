import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;

export async function generateFeedbackWithGroq(
  imageCaption: string,
  mode: string,
  prompt: string,
  timeoutMs: number = 8000 // Optimized default timeout
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  const fullPrompt = `Image Caption: ${imageCaption}\n\n${prompt}\n\nBased on the image caption above, provide the structured feedback as requested.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const completion = await groq.chat.completions.create(
      {
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 4096, // Increased to prevent truncation
      },
      {
        signal: controller.signal as any,
      }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq response');
    }

    return content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Groq API took too long to respond');
    }
    if (error.message) {
      throw new Error(`Groq API error: ${error.message}`);
    }
    throw new Error('Failed to generate feedback with Groq API');
  }
}

export async function getImageCaptionWithBLIP(
  imageBase64: string,
  timeoutMs: number = 8000 // Optimized default timeout
): Promise<string> {
  // Convert base64 to Buffer
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Try multiple captioning models in order (prioritize models with active inference providers)
  const models = [
    'nlpconnect/vit-gpt2-image-captioning', // More reliable
    'Salesforce/blip-image-captioning-base',
    'Salesforce/blip-image-captioning-large',
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      // Use HTTP API directly with FormData (works in Node.js)
      const formData = new FormData();
      formData.append('inputs', new Blob([imageBuffer], { type: 'image/jpeg' }));

      const response = await fetch(
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

      if (response.status === 410 || response.status === 404) {
        // Model not available, try next one
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BLIP API error (${model}): ${response.status} ${response.statusText} - ${errorText}`);
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
        throw new Error('Unexpected response format from BLIP API');
      }

      return responseText;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a model availability error
      if (
        error.message?.includes('410') || 
        error.message?.includes('404') ||
        error.message?.includes('Gone') ||
        error.message?.includes('Not Found')
      ) {
        // Model not available, try next one
        continue;
      }
      
      // For other errors, also try next model (might be temporary)
      if (models.indexOf(model) < models.length - 1) {
        continue;
      }
      
      // Last model failed, throw the error
      throw error;
    }
  }

  clearTimeout(timeoutId);
  
  // If all models failed, throw the last error or a generic one
  throw lastError || new Error('All BLIP models failed. Please try again later or use a different analysis mode.');
}
