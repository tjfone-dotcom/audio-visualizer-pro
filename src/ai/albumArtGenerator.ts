/**
 * albumArtGenerator.ts - Generate album art using Google Gemini Flash Image API.
 *
 * Calls the gemini-3.1-flash-image-preview model via generateContent endpoint.
 * Returns a data URL (base64) to avoid CORS issues with object URLs.
 * Default output resolution: 1024x1024 (1K).
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Generate album art from a text prompt using Gemini Flash Image Generation API.
 * @returns data:image/png;base64,... URL string
 */
export async function generateAlbumArt(
  prompt: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('API key is required. Please enter your Google AI Studio API key.');
  }

  if (!prompt.trim()) {
    throw new Error('Prompt is required. Please analyze music or enter a prompt.');
  }

  const url = `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey.trim())}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt.trim() }],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Network error while calling Gemini API. Check your internet connection. (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  if (!response.ok) {
    let errorMessage = `API returned status ${response.status}`;
    try {
      const errorData = (await response.json()) as GeminiResponse;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Could not parse error response
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Invalid or expired API key. ${errorMessage}`);
    }
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Please wait a moment and try again. ${errorMessage}`);
    }
    throw new Error(`Image generation failed: ${errorMessage}`);
  }

  const data = (await response.json()) as GeminiResponse;

  // Extract image from Gemini response: candidates[0].content.parts[] -> find inlineData
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No image was generated. The API returned an empty response.');
  }

  const parts = data.candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No image was generated. The response contained no parts.');
  }

  // Find the first part with image data
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart || !imagePart.inlineData) {
    throw new Error('No image data found in the response.');
  }

  const { mimeType, data: base64 } = imagePart.inlineData;

  return `data:${mimeType};base64,${base64}`;
}
