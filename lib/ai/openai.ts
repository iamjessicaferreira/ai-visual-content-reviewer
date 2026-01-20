const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function analyzeImageWithOpenAI(
  imageBase64: string,
  prompt: string,
  timeoutMs: number = 15000,
  mode?: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // GPT-4o Vision API (gpt-4o is the correct model for vision tasks)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4o is the correct vision model (example in docs shows gpt-5.2 which is generic)
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature to reduce hallucinations
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
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
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
    }

    clearTimeout(timeoutId);

    const data = await response.json();

    // Extract text from OpenAI response
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('No text in OpenAI response');
    }

    return text;
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timeout: OpenAI API took too long to respond');
    }
    if (error.message) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error('Failed to analyze image with OpenAI API');
  }
}
