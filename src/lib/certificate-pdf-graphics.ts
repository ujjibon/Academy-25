import type { jsPDF } from 'jspdf';
import { imageFormatFromDataUrl } from '@/lib/certificate-image-utils';

type Rgb = [number, number, number];

export type PdfGraphicsContext = {
  doc: jsPDF;
  w: number;
  h: number;
  logoDataUrl: string;
};

const BRAND_PORTAL = 'Peer Portal';

/** Faded centered logo watermark */
export function drawLogoWatermark(
  ctx: PdfGraphicsContext,
  options: { widthMm?: number; opacity?: number } = {}
) {
  const { doc, w, h, logoDataUrl } = ctx;
  const widthMm = options.widthMm ?? 95;
  const opacity = options.opacity ?? 0.06;
  const aspect = 48 / 160;
  const heightMm = widthMm * aspect;
  const x = (w - widthMm) / 2;
  const y = (h - heightMm) / 2;

  try {
    // @ts-expect-error GState available in jsPDF 2.x
    doc.setGState(new doc.GState({ opacity }));
    doc.addImage(logoDataUrl, 'PNG', x, y, widthMm, heightMm, undefined, 'FAST');
    // @ts-expect-error GState available in jsPDF 2.x
    doc.setGState(new doc.GState({ opacity: 1 }));
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(230, 234, 242);
    doc.text(BRAND_PORTAL, w / 2, h / 2, { align: 'center' });
  }
}

/** L-shaped corner brackets */
export function drawCornerBrackets(
  doc: jsPDF,
  w: number,
  h: number,
  inset: number,
  arm: number,
  color: Rgb,
  lineWidth = 0.6
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);

  const corners: [number, number, number, number, number, number][] = [
    [inset, inset, inset + arm, inset, inset, inset + arm],
    [w - inset, inset, w - inset - arm, inset, w - inset, inset + arm],
    [inset, h - inset, inset + arm, h - inset, inset, h - inset - arm],
    [w - inset, h - inset, w - inset - arm, h - inset, w - inset, h - inset - arm],
  ];

  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    doc.line(x1, y1, x2, y2);
    doc.line(x1, y1, x3, y3);
  }
}

/** Double frame with optional inner gap */
export function drawDoubleFrame(
  doc: jsPDF,
  w: number,
  h: number,
  outer: number,
  inner: number,
  color: Rgb,
  innerColor?: Rgb
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(1.2);
  doc.rect(outer, outer, w - outer * 2, h - outer * 2);
  doc.setLineWidth(0.35);
  doc.setDrawColor(...(innerColor ?? color));
  doc.rect(inner, inner, w - inner * 2, h - inner * 2);
}

export function drawImageDataUrl(
  doc: jsPDF,
  dataUrl: string,
  centerX: number,
  topY: number,
  widthMm: number,
  aspectRatio = 48 / 160
): number {
  const heightMm = widthMm * aspectRatio;
  const format = imageFormatFromDataUrl(dataUrl);
  doc.addImage(
    dataUrl,
    format,
    centerX - widthMm / 2,
    topY,
    widthMm,
    heightMm,
    undefined,
    'FAST'
  );
  return topY + heightMm;
}

export function drawLogo(
  ctx: PdfGraphicsContext,
  centerX: number,
  topY: number,
  widthMm: number
): number {
  return drawImageDataUrl(ctx.doc, ctx.logoDataUrl, centerX, topY, widthMm, 48 / 160);
}

/** Circular verification seal with optional logo center */
export function drawVerificationSeal(
  ctx: PdfGraphicsContext,
  cx: number,
  cy: number,
  radius: number,
  options: {
    ringColor?: Rgb;
    fillColor?: Rgb;
    textColor?: Rgb;
    label?: string;
    sublabel?: string;
    showLogo?: boolean;
    logoWidth?: number;
  } = {}
) {
  const { doc } = ctx;
  const ringColor = options.ringColor ?? [0, 19, 158];
  const fillColor = options.fillColor ?? [255, 255, 255];
  const textColor = options.textColor ?? [0, 19, 158];
  const label = options.label ?? 'VERIFIED';
  const sublabel = options.sublabel ?? BRAND_PORTAL;

  doc.setDrawColor(...ringColor);
  doc.setLineWidth(0.5);
  doc.setFillColor(...fillColor);
  doc.circle(cx, cy, radius, 'FD');
  doc.setLineWidth(0.25);
  doc.circle(cx, cy, radius - 2, 'D');

  if (options.showLogo && options.logoWidth) {
    const lw = options.logoWidth;
    const aspect = 48 / 160;
    const lh = lw * aspect;
    doc.addImage(
      ctx.logoDataUrl,
      'PNG',
      cx - lw / 2,
      cy - lh / 2 - 2,
      lw,
      lh,
      undefined,
      'FAST'
    );
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(radius > 12 ? 7 : 6);
  doc.setTextColor(...textColor);
  const textY = options.showLogo ? cy + radius * 0.35 : cy - 1;
  doc.text(label, cx, textY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(sublabel, cx, textY + 4, { align: 'center' });
}

/** Top ribbon band */
export function drawTopRibbon(
  doc: jsPDF,
  w: number,
  y: number,
  height: number,
  color: Rgb,
  label: string,
  textColor: Rgb = [255, 255, 255]
) {
  doc.setFillColor(...color);
  doc.rect(0, y, w, height, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(label, w / 2, y + height / 2 + 1.5, { align: 'center' });
}

/** Horizontal rules framing the recipient name */
export function drawRecipientNameFrame(
  doc: jsPDF,
  w: number,
  centerY: number,
  halfWidth: number,
  color: [number, number, number],
  gap = 10
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.45);
  doc.line(w / 2 - halfWidth, centerY - gap, w / 2 + halfWidth, centerY - gap);
  doc.line(w / 2 - halfWidth, centerY + gap, w / 2 + halfWidth, centerY + gap);
}

/** Thin section rule across certificate body */
export function drawSectionRule(
  doc: jsPDF,
  w: number,
  y: number,
  halfWidth: number,
  color: [number, number, number],
  lineWidth = 0.25
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.line(w / 2 - halfWidth, y, w / 2 + halfWidth, y);
}

/** Decorative horizontal rule with center diamond */
export function drawOrnamentalDivider(
  doc: jsPDF,
  w: number,
  y: number,
  color: Rgb,
  width = 50
) {
  const cx = w / 2;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(cx - width / 2, y, cx - 4, y);
  doc.line(cx + 4, y, cx + width / 2, y);
  doc.setFillColor(...color);
  const s = 2.5;
  doc.triangle(cx, y - s, cx - s, y + s * 0.6, cx + s, y + s * 0.6, 'F');
}

/** Side accent stripe (gradient simulated with two rects) */
export function drawSideAccentStripe(
  doc: jsPDF,
  h: number,
  width: number,
  dark: Rgb,
  light: Rgb
) {
  doc.setFillColor(...dark);
  doc.rect(0, 0, width, h, 'F');
  doc.setFillColor(...light);
  doc.rect(width - 3, 0, 3, h, 'F');
}

/** Laurel-style arcs left and right of center */
export function drawLaurelArcs(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  color: Rgb
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 5) * Math.PI * 0.55 + Math.PI * 0.72;
    const x1 = cx - radius * Math.cos(angle);
    const y1 = cy - radius * Math.sin(angle) * 0.35;
    const x2 = cx - (radius - 4) * Math.cos(angle + 0.08);
    const y2 = cy - (radius - 4) * Math.sin(angle + 0.08) * 0.35;
    doc.line(x1, y1, x2, y2);

    const angleR = Math.PI - angle;
    const x3 = cx + radius * Math.cos(angleR);
    const y3 = cy - radius * Math.sin(angleR) * 0.35;
    const x4 = cx + (radius - 4) * Math.cos(angleR - 0.08);
    const y4 = cy - (radius - 4) * Math.sin(angleR - 0.08) * 0.35;
    doc.line(x3, y3, x4, y4);
  }
}
