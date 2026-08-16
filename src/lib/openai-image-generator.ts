import { openAIConfig } from '@/ai/genkit';

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export type GeneratedImage = {
  imageDataUrl: string;
  revisedPrompt?: string;
  model: string;
};

const PRIMARY_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const FALLBACK_MODEL = 'dall-e-3';

function toDataUrl(b64: string, mime = 'image/png'): string {
  if (b64.startsWith('data:')) return b64;
  return `data:${mime};base64,${b64}`;
}

async function requestImage(
  model: string,
  prompt: string,
  size: ImageSize
): Promise<GeneratedImage> {
  const apiKey = openAIConfig.apiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY.');
  }

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: 1,
  };

  // dall-e-3 / gpt-image support different response formats
  if (model === 'dall-e-3') {
    body.response_format = 'b64_json';
    body.quality = 'standard';
  } else {
    body.output_format = 'png';
  }

  const response = await fetch(`${openAIConfig.apiUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `OpenAI Images API error (${model}): ${response.status} ${response.statusText}${errText ? ` — ${errText.slice(0, 200)}` : ''}`
    );
  }

  const data = await response.json();
  const item = data.data?.[0];
  const b64 = item?.b64_json;
  const url = item?.url;

  if (b64) {
    return {
      imageDataUrl: toDataUrl(b64),
      revisedPrompt: item?.revised_prompt,
      model,
    };
  }

  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      throw new Error('Failed to download generated image URL');
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return {
      imageDataUrl: toDataUrl(buffer.toString('base64')),
      revisedPrompt: item?.revised_prompt,
      model,
    };
  }

  throw new Error('No image data returned from OpenAI Images API');
}

/**
 * Generate an educational image via OpenAI Images API.
 * Tries gpt-image-1 (or OPENAI_IMAGE_MODEL), then falls back to dall-e-3.
 */
export async function generateEducationalImage(
  prompt: string,
  options?: { size?: ImageSize }
): Promise<GeneratedImage> {
  const size = options?.size ?? '1024x1024';
  const educationalPrompt = [
    'Educational illustration for a learning classroom slide.',
    'Clean, clear, professional, no text overlays unless essential.',
    'Suitable for corporate training and student learning materials.',
    `Subject: ${prompt}`,
  ].join(' ');

  try {
    return await requestImage(PRIMARY_MODEL, educationalPrompt, size);
  } catch (primaryError) {
    if (PRIMARY_MODEL === FALLBACK_MODEL) throw primaryError;
    console.warn('Primary image model failed, trying dall-e-3:', primaryError);
    return await requestImage(FALLBACK_MODEL, educationalPrompt, size);
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
