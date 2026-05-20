import fs from 'fs';
import path from 'path';

let cachedLogoDataUrl: string | null = null;

/** Peer Portal / Peer Academy logo from public/logo.png for PDF embedding. */
export function getCertificateLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const buffer = fs.readFileSync(logoPath);
  cachedLogoDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return cachedLogoDataUrl;
}
