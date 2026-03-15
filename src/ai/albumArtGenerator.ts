/**
 * albumArtGenerator.ts - Generate album art using Google Gemini Imagen API.
 *
 * Calls the Imagen 3.0 model to generate a 1024x1024 image from a text prompt.
 * Returns a data URL (base64) to avoid CORS issues with object URLs.
 */

const IMAGEN_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

export interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded: string;
    mimeType?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Generate album art from a text prompt using Google Imagen API.
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

  const url = `${IMAGEN_API_URL}?key=${encodeURIComponent(apiKey.trim())}`;

  const body = {
    instances: [{ prompt: prompt.trim() }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
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
      `Network error while calling Imagen API. Check your internet connection. (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  if (!response.ok) {
    let errorMessage = `API returned status ${response.status}`;
    try {
      const errorData = (await response.json()) as ImagenResponse;
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

  const data = (await response.json()) as ImagenResponse;

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No image was generated. The API returned an empty response.');
  }

  const prediction = data.predictions[0];
  const mimeType = prediction.mimeType || 'image/png';
  const base64 = prediction.bytesBase64Encoded;

  if (!base64) {
    throw new Error('Generated image data was empty.');
  }

  return `data:${mimeType};base64,${base64}`;
}
