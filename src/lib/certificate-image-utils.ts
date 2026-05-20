const MAX_DIMENSION = 400;
const MAX_BYTES = 900_000;

/** Resize and compress an image file for certificate PDF embedding (client-side). */
export async function fileToCertificateLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a PNG, JPG, or WebP image.');
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error('Image must be under 4 MB.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const resized = await resizeDataUrl(dataUrl, file.type);

  if (resized.length > MAX_BYTES) {
    throw new Error('Image is too large after processing. Try a smaller file.');
  }

  return resized;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const usePng = mimeType === 'image/png';
      const output = usePng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.88);
      resolve(output);
    };
    img.onerror = () => reject(new Error('Invalid image file.'));
    img.src = dataUrl;
  });
}

export function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'JPEG';
  }
  if (dataUrl.startsWith('data:image/webp')) {
    return 'WEBP';
  }
  return 'PNG';
}
