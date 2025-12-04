// Types
export interface Tip {
  id: string;
  icon: string;
  title: string;
  category: string;
  duration: string;
}

export interface TipDetail {
  description: string;
  steps: string[];
}

// Helper function to extract JSON from markdown code blocks
function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed.replace(/^```[a-zA-Z]*\s*/, '');
    const endIndex = withoutFence.lastIndexOf('```');
    return endIndex !== -1 ? withoutFence.slice(0, endIndex).trim() : withoutFence.trim();
  }
  return trimmed;
}

// Retry helper function - retries once on failure
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay);
    }
    throw error;
  }
}

/**
 * Fetches wellness tips from Gemini API based on goal and age
 * @param goalLabel - The wellness goal label (e.g., "weight loss", "better sleep")
 * @param age - User's age for age-appropriate recommendations
 * @returns Promise resolving to an array of 5 tips
 * @throws Error if API call fails or response is invalid
 */
export async function fetchGeminiTips(goalLabel: string, age: number): Promise<Tip[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const modelId = 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('API configuration error. Please check your environment settings.');
  }

  const prompt = [
    'You are a wellness coach.',
    `Generate exactly 5 concise wellness tips focused on the goal: "${goalLabel}" for a person who is ${age} years old.`,
    'Make the tips age-appropriate and relevant to their life stage.',
    'Return ONLY a valid JSON array (no markdown, no extra text) with 5 objects of this shape:',
    '{ "id": "kebab-case-id", "icon": "single emoji", "title": "short title <= 40 chars", "category": "1-2 word category", "duration": "very short duration label" }.',
  ].join(' ');

  const fetchTips = async (): Promise<Tip[]> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Server error: ${response.status} ${response.statusText}`;
      throw new Error(`Failed to generate tips: ${errorMessage}`);
    }

    const data = await response.json();

    // Check for API errors in response
    if (data?.error) {
      throw new Error(data.error.message || 'API returned an error');
    }

    if (!data?.candidates?.[0]?.content?.parts) {
      throw new Error('Invalid response format from API');
    }

    const rawText =
      data.candidates[0].content.parts.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Empty response from API');
    }

    const jsonText = extractJsonBlock(rawText);
    let parsed: Tip[];
    try {
      parsed = JSON.parse(jsonText) as Tip[];
    } catch (parseError) {
      throw new Error('Failed to parse API response. The response may not be valid JSON.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('API did not return any tips');
    }

    return parsed.slice(0, 5);
  };

  try {
    // Retry once on failure
    return await withRetry(fetchTips, 1, 1000);
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    // Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }
    // Handle unknown errors
    throw new Error('An unexpected error occurred while generating tips. Please try again.');
  }
}

/**
 * Fetches detailed explanation for a specific tip from Gemini API
 * @param goalLabel - The wellness goal label
 * @param tipTitle - The title of the tip to get details for
 * @param age - User's age for age-appropriate guidance
 * @returns Promise resolving to tip detail with description and steps
 * @throws Error if API call fails or response is invalid
 */
export async function fetchGeminiDetail(goalLabel: string, tipTitle: string, age: number): Promise<TipDetail> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const modelId = 'gemini-2.5-flash';
  
  if (!apiKey) {
    throw new Error('API configuration error. Please check your environment settings.');
  }

  const prompt = [
    'You are a practical wellness coach.',
    `The user is ${age} years old and selected the wellness goal "${goalLabel}" and the tip titled "${tipTitle}".`,
    'Provide age-appropriate guidance and step-by-step advice suitable for their age.',
    'Return ONLY a JSON object (no markdown, no extra text) with:',
    '{ "description": "1 short paragraph, max 120 words", "steps": ["5 concrete numbered steps, each <= 20 words"] }.',
  ].join(' ');

  const fetchDetail = async (): Promise<TipDetail> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Server error: ${response.status} ${response.statusText}`;
      throw new Error(`Failed to load tip details: ${errorMessage}`);
    }

    const data = await response.json();

    // Check for API errors in response
    if (data?.error) {
      throw new Error(data.error.message || 'API returned an error');
    }

    if (!data?.candidates?.[0]?.content?.parts) {
      throw new Error('Invalid response format from API');
    }

    const rawText =
      data.candidates[0].content.parts.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Empty response from API');
    }

    const jsonText = extractJsonBlock(rawText);
    let parsed: TipDetail;
    try {
      parsed = JSON.parse(jsonText) as TipDetail;
    } catch (parseError) {
      throw new Error('Failed to parse API response. The response may not be valid JSON.');
    }

    if (!parsed.description || !parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Invalid tip detail format received from API');
    }

    return parsed;
  };

  try {
    // Retry once on failure
    return await withRetry(fetchDetail, 1, 1000);
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    // Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }
    // Handle unknown errors
    throw new Error('An unexpected error occurred while loading tip details. Please try again.');
  }
}

