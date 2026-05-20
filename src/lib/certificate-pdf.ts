import { jsPDF } from 'jspdf';
import type { CertificateRequest } from '@/lib/training-types';
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  type CertificateTemplateId,
  isCertificateTemplateId,
} from '@/lib/certificate-templates';
import { getCertificateLogoDataUrl } from '@/lib/certificate-logo';
import {
  resolveCertificateFields,
  type ResolvedCertificateFields,
} from '@/lib/certificate-customization';
import {
  drawCornerBrackets,
  drawDoubleFrame,
  drawImageDataUrl,
  drawLaurelArcs,
  drawLogo,
  drawLogoWatermark,
  drawOrnamentalDivider,
  drawRecipientNameFrame,
  drawSectionRule,
  drawSideAccentStripe,
  drawTopRibbon,
  drawVerificationSeal,
  type PdfGraphicsContext,
} from '@/lib/certificate-pdf-graphics';

const BRAND_ACADEMY = 'Peer Academy';
const BRAND_PORTAL = 'Peer Portal';

const ROYAL: [number, number, number] = [0, 19, 158];
const ROYAL_LIGHT: [number, number, number] = [29, 47, 181];
const MIDNIGHT: [number, number, number] = [0, 11, 88];
const FLARE: [number, number, number] = [255, 20, 20];
const MUTED: [number, number, number] = [114, 132, 157];
const SLATE: [number, number, number] = [162, 181, 203];
const WHITE: [number, number, number] = [255, 255, 255];
const GOLD: [number, number, number] = [168, 140, 52];
const GOLD_LIGHT: [number, number, number] = [212, 185, 95];
const PARCHMENT: [number, number, number] = [247, 244, 237];
const PLATINUM: [number, number, number] = [90, 108, 130];
const BURGUNDY: [number, number, number] = [110, 24, 48];
const TEAL: [number, number, number] = [0, 120, 140];
const FOREST: [number, number, number] = [24, 82, 58];
const CORAL: [number, number, number] = [230, 95, 60];
const CHARCOAL: [number, number, number] = [52, 58, 68];
const IVORY: [number, number, number] = [252, 250, 245];

type Rgb = [number, number, number];

type LayoutContext = PdfGraphicsContext & {
  data: CertificateRequest;
  certId: string;
  fields: ResolvedCertificateFields;
};

function slugId(type: string, id: string): string {
  return `${type}-${id}`.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 48);
}

function drawBrandFooter(ctx: LayoutContext, y: number, textColor: Rgb = MUTED) {
  const { doc, w, fields } = ctx;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(fields.organizationLine, w / 2, y, { align: 'center' });
}

function drawCertificateHeadline(
  ctx: LayoutContext,
  y: number,
  options: { fontSize?: number; color?: Rgb; centerX?: number } = {}
) {
  const { doc, w, fields } = ctx;
  const cx = options.centerX ?? w / 2;
  const fontSize = options.fontSize ?? 26;
  const color = options.color ?? MIDNIGHT;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(fields.headline, w - 36);
  doc.text(lines, cx, y, { align: 'center' });
  let endY = y + 8 + (lines.length - 1) * 7;

  if (fields.subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...(options.color === WHITE ? SLATE : MUTED));
    const subLines = doc.splitTextToSize(fields.subtitle, w - 50);
    doc.text(subLines, cx, endY + 4, { align: 'center' });
    endY += 6 + (subLines.length - 1) * 5;
  }

  return endY;
}

/** Peer Portal logo + optional partner logo in header placements */
function drawCertificateBranding(
  ctx: LayoutContext,
  topY: number,
  options: { peerWidth?: number; centerX?: number } = {}
): number {
  const { doc, w, fields } = ctx;
  const cx = options.centerX ?? w / 2;
  const peerW = options.peerWidth ?? 42;
  const partnerW = 30;
  const partnerAspect = 0.45;
  const isFooterPlacement =
    fields.partnerLogoPlacement === 'footer-left' ||
    fields.partnerLogoPlacement === 'footer-right';

  if (isFooterPlacement || !fields.showPartnerLogo || !fields.partnerLogoDataUrl) {
    if (fields.showPeerPortalLogo) {
      return drawLogo(ctx, cx, topY, peerW);
    }
    return topY;
  }

  if (fields.partnerLogoPlacement === 'beside-peer' && fields.showPeerPortalLogo) {
    const gap = 10;
    const totalW = peerW + gap + partnerW;
    const peerCx = cx - totalW / 2 + peerW / 2;
    const partnerCx = cx + totalW / 2 - partnerW / 2;
    let y = drawLogo(ctx, peerCx, topY, peerW);
    if (fields.partnerLogoLabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(fields.partnerLogoLabel, partnerCx, topY - 1, { align: 'center' });
    }
    const py = drawImageDataUrl(
      doc,
      fields.partnerLogoDataUrl,
      partnerCx,
      topY,
      partnerW,
      partnerAspect
    );
    return Math.max(y, py) + 2;
  }

  let y = topY;
  if (fields.showPeerPortalLogo) {
    y = drawLogo(ctx, cx, topY, peerW);
  }
  if (fields.partnerLogoLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(fields.partnerLogoLabel, cx, y + 3, { align: 'center' });
    y += 5;
  }
  return drawImageDataUrl(doc, fields.partnerLogoDataUrl, cx, y + 1, partnerW, partnerAspect) + 2;
}

function drawFooterPartnerLogo(ctx: LayoutContext) {
  const { doc, w, h, fields } = ctx;
  if (
    !fields.showPartnerLogo ||
    !fields.partnerLogoDataUrl ||
    (fields.partnerLogoPlacement !== 'footer-left' &&
      fields.partnerLogoPlacement !== 'footer-right')
  ) {
    return;
  }

  const logoW = 24;
  const y = h - 28;
  const cx =
    fields.partnerLogoPlacement === 'footer-left' ? 14 + logoW / 2 : w - 14 - logoW / 2;

  if (fields.partnerLogoLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(fields.partnerLogoLabel, cx, y - 2, {
      align: fields.partnerLogoPlacement === 'footer-left' ? 'left' : 'right',
    });
  }
  drawImageDataUrl(doc, fields.partnerLogoDataUrl, cx, y, logoW, 0.4);
}

function drawRecipientCore(
  ctx: LayoutContext,
  startY: number,
  options: {
    nameColor?: Rgb;
    titleColor?: Rgb;
    bodyColor?: Rgb;
    nameSize?: number;
    titleSize?: number;
    ruleColor?: Rgb;
  } = {}
) {
  const { doc, w, data, fields } = ctx;
  const nameColor = options.nameColor ?? ROYAL;
  const titleColor = options.titleColor ?? MIDNIGHT;
  const bodyColor = options.bodyColor ?? MUTED;
  const ruleColor = options.ruleColor ?? SLATE;
  const nameSize = options.nameSize ?? 22;
  const titleSize = options.titleSize ?? 17;

  drawSectionRule(doc, w, startY - 3, 55, ruleColor);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...bodyColor);
  doc.text(fields.certifyText, w / 2, startY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameSize);
  doc.setTextColor(...nameColor);
  const nameLines = doc.splitTextToSize(fields.recipientName, w - 60);
  const nameY = startY + 14;
  const nameBlockHeight = 6 + (nameLines.length - 1) * 8;
  drawRecipientNameFrame(doc, w, nameY + nameBlockHeight / 2 - 2, 52, ruleColor, 8);
  doc.text(nameLines, w / 2, nameY, { align: 'center' });

  const nameOffset = (nameLines.length - 1) * 8;
  drawSectionRule(doc, w, nameY + 12 + nameOffset, 48, ruleColor);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...bodyColor);
  doc.text(fields.completionPhrase, w / 2, nameY + 18 + nameOffset, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.setTextColor(...titleColor);
  const titleLines = doc.splitTextToSize(fields.title, w - 50);
  const titleY = nameY + 30 + nameOffset;
  doc.text(titleLines, w / 2, titleY, { align: 'center' });

  let y = titleY + 10 + (titleLines.length - 1) * 7;
  drawSectionRule(doc, w, y + 2, 40, ruleColor, 0.2);

  if (fields.completionSummary) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...bodyColor);
    const summaryLines = doc.splitTextToSize(fields.completionSummary, w - 70);
    doc.text(summaryLines, w / 2, y + 8, { align: 'center' });
    y += summaryLines.length * 5 + 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Issued on ${fields.issued}`, w / 2, y + 6, { align: 'center' });

  return y + 14;
}

function drawSignatures(
  ctx: LayoutContext,
  y: number,
  options: { lineColor?: Rgb; labelColor?: Rgb; nameColor?: Rgb } = {}
) {
  const { doc, w, h, fields } = ctx;
  if (!fields.showSignatures) return y;

  const lineColor = options.lineColor ?? SLATE;
  const labelColor = options.labelColor ?? MUTED;
  const nameColor = options.nameColor ?? MIDNIGHT;
  const sigY = Math.min(y + 10, h - 44);
  const lineHalf = 38;
  const centers = [w / 2 - 28, w / 2 + 28];

  drawSectionRule(doc, w, sigY - 6, 62, lineColor, 0.2);

  fields.signatures.slice(0, 2).forEach((sig, i) => {
    const cx = centers[i];
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.45);
    doc.line(cx - lineHalf / 2, sigY, cx + lineHalf / 2, sigY);

    if (sig.signerName) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(...nameColor);
      const nameLines = doc.splitTextToSize(sig.signerName, lineHalf + 4);
      doc.text(nameLines, cx, sigY - 3, { align: 'center' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    doc.text(sig.signerTitle || 'Authorized Signatory', cx, sigY + 6, { align: 'center' });
  });

  return sigY + 14;
}

function drawVerificationSealOptional(
  ctx: LayoutContext,
  cx: number,
  cy: number,
  radius: number,
  options: Parameters<typeof drawVerificationSeal>[4] = {}
) {
  if (!ctx.fields.showVerificationSeal) return;
  drawVerificationSeal(ctx, cx, cy, radius, options);
}

/** Standard footer: seal, signatures, cert id, brand line */
function finishCertificateLayout(
  ctx: LayoutContext,
  contentEndY: number,
  options: {
    seal?: {
      cx: number;
      cy: number;
      r: number;
      opts?: Parameters<typeof drawVerificationSeal>[4];
    };
    signatures?: Parameters<typeof drawSignatures>[2];
    certIdColor?: Rgb;
    footerColor?: Rgb;
  } = {}
) {
  const { w, h } = ctx;
  if (options.seal) {
    drawVerificationSealOptional(
      ctx,
      options.seal.cx,
      options.seal.cy,
      options.seal.r,
      options.seal.opts
    );
  }
  drawSignatures(ctx, contentEndY, options.signatures);
  drawCertId(ctx, options.certIdColor);
  drawBrandFooter(ctx, h - 8, options.footerColor);
}

function drawCertId(ctx: LayoutContext, textColor: Rgb = SLATE) {
  const { doc, w, h, certId, fields } = ctx;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  let y = h - 14;
  if (fields.customReference) {
    doc.text(`Reference: ${fields.customReference}`, w / 2, y - 5, { align: 'center' });
  }
  doc.text(`Certificate ID: ${certId}`, w / 2, y, { align: 'center' });
  drawFooterPartnerLogo(ctx);
}

function renderPeerPortalClassic(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  drawLogoWatermark(ctx, { widthMm: 100, opacity: 0.05 });
  drawDoubleFrame(doc, w, h, 10, 14, ROYAL, ROYAL_LIGHT);
  drawCornerBrackets(doc, w, h, 16, 14, ROYAL_LIGHT);

  doc.setFillColor(...ROYAL);
  doc.circle(w - 22, 22, 4, 'F');
  doc.setFillColor(...FLARE);
  doc.circle(22, h - 22, 3, 'F');

  const logoBottom = drawCertificateBranding(ctx, 20, { peerWidth: 46 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ROYAL_LIGHT);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 18);
  drawOrnamentalDivider(doc, w, headlineEnd + 2, ROYAL, 56);

  const endY = drawRecipientCore(ctx, headlineEnd + 10, { ruleColor: ROYAL_LIGHT });
  drawVerificationSealOptional(ctx, w - 32, h - 38, 11, {
    ringColor: ROYAL,
    textColor: ROYAL,
    showLogo: true,
    logoWidth: 14,
  });
  drawSignatures(ctx, endY);
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderRoyalGradient(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, w, 42, 'F');
  doc.setFillColor(...ROYAL_LIGHT);
  doc.rect(0, 40, w, 5, 'F');

  drawCertificateBranding(ctx, 9, { peerWidth: 40 });

  drawCertificateHeadline(ctx, 54, { fontSize: 22, color: WHITE });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 225, 245);
  doc.text(BRAND_PORTAL, w / 2, 62, { align: 'center' });

  drawLogoWatermark(ctx, { widthMm: 88, opacity: 0.04 });
  drawDoubleFrame(doc, w, h, 12, 16, ROYAL, SLATE);

  const endY = drawRecipientCore(ctx, 82, { ruleColor: ROYAL_LIGHT });
  drawVerificationSealOptional(ctx, w / 2, h - 48, 12, {
    ringColor: FLARE,
    fillColor: WHITE,
    textColor: ROYAL,
    label: 'CERTIFIED',
    sublabel: BRAND_PORTAL,
  });
  drawSignatures(ctx, endY, { lineColor: ROYAL, labelColor: MUTED });
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderMidnightPremium(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  doc.setFillColor(...MIDNIGHT);
  doc.rect(0, 0, w, h, 'F');

  drawLogoWatermark(ctx, { widthMm: 110, opacity: 0.08 });

  doc.setDrawColor(...ROYAL_LIGHT);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, w - 24, h - 24);
  drawCornerBrackets(doc, w, h, 14, 12, ROYAL_LIGHT, 0.5);

  const logoBottom = drawCertificateBranding(ctx, 18, { peerWidth: 44 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 18, {
    color: WHITE,
  });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, ROYAL_LIGHT, 48);

  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: WHITE,
    titleColor: WHITE,
    bodyColor: SLATE,
    nameSize: 24,
    titleSize: 18,
    ruleColor: ROYAL_LIGHT,
  });

  drawVerificationSealOptional(ctx, w / 2, h - 52, 13, {
    ringColor: FLARE,
    fillColor: FLARE,
    textColor: WHITE,
    label: 'VERIFIED',
    sublabel: BRAND_PORTAL,
    showLogo: true,
    logoWidth: 16,
  });

  drawSignatures(ctx, endY, { lineColor: ROYAL_LIGHT, labelColor: SLATE });
  drawCertId(ctx, SLATE);
  drawBrandFooter(ctx, h - 8, SLATE);
}

function renderMinimalElegance(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  doc.setFillColor(240, 243, 250);
  doc.rect(0, 0, w, h, 'F');

  drawLogoWatermark(ctx, { widthMm: 90, opacity: 0.05 });

  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.25);
  doc.line(20, 24, w - 20, 24);
  doc.line(20, h - 24, w - 20, h - 24);

  const logoBottom = drawCertificateBranding(ctx, 28, { peerWidth: 40 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 4, { align: 'center' });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 16, { fontSize: 24 });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, ROYAL, 44);

  const endY = drawRecipientCore(ctx, headlineEnd + 8, { nameSize: 20, titleSize: 16 });
  drawVerificationSealOptional(ctx, 28, h - 36, 9, {
    ringColor: ROYAL,
    textColor: ROYAL,
    label: 'PEER',
    sublabel: 'PORTAL',
  });
  drawSignatures(ctx, endY, { lineColor: SLATE });
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderFlareAchievement(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  drawTopRibbon(doc, w, 0, 16, FLARE, 'ACHIEVEMENT AWARD');

  doc.setDrawColor(...FLARE);
  doc.setLineWidth(1.2);
  doc.rect(10, 18, w - 20, h - 28);
  drawCornerBrackets(doc, w, h, 12, 10, FLARE, 0.9);

  doc.setFillColor(...FLARE);
  doc.rect(10, 18, 10, 10, 'F');
  doc.rect(w - 20, h - 20, 10, 10, 'F');

  const logoBottom = drawCertificateBranding(ctx, 34, { peerWidth: 42 });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 14, { fontSize: 24 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...FLARE);
  doc.text(BRAND_PORTAL, w / 2, headlineEnd + 4, { align: 'center' });

  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: FLARE,
    titleSize: 16,
    ruleColor: FLARE,
  });
  drawVerificationSealOptional(ctx, w - 30, h - 40, 11, {
    ringColor: FLARE,
    fillColor: WHITE,
    textColor: FLARE,
    showLogo: true,
    logoWidth: 13,
  });
  drawSignatures(ctx, endY, { lineColor: FLARE, labelColor: MUTED });
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderExecutiveDiploma(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  doc.setFillColor(...PARCHMENT);
  doc.rect(0, 0, w, h, 'F');

  drawLogoWatermark(ctx, { widthMm: 95, opacity: 0.05 });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.6);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.4);
  doc.setDrawColor(...GOLD_LIGHT);
  doc.rect(12, 12, w - 24, h - 24);
  drawCornerBrackets(doc, w, h, 14, 16, GOLD, 0.7);

  const logoBottom = drawCertificateBranding(ctx, 22, { peerWidth: 48 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 6, { align: 'center' });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 20, { fontSize: 28 });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, GOLD, 60);

  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: MIDNIGHT,
    titleColor: ROYAL,
    bodyColor: MUTED,
    nameSize: 23,
    ruleColor: GOLD,
  });

  drawVerificationSealOptional(ctx, w / 2, h - 50, 14, {
    ringColor: GOLD,
    fillColor: PARCHMENT,
    textColor: MIDNIGHT,
    label: 'OFFICIAL',
    sublabel: BRAND_PORTAL,
    showLogo: true,
    logoWidth: 18,
  });

  drawSignatures(ctx, endY, { lineColor: GOLD, labelColor: MUTED });
  drawCertId(ctx, GOLD);
  drawBrandFooter(ctx, h - 8, MUTED);
}

function renderInnovationEdge(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  drawSideAccentStripe(doc, h, 22, MIDNIGHT, ROYAL);
  drawLogoWatermark(ctx, { widthMm: 85, opacity: 0.04 });

  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.3);
  doc.rect(26, 12, w - 38, h - 24);

  const logoBottom = drawCertificateBranding(ctx, 18, { peerWidth: 44, centerX: w / 2 + 8 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ROYAL);
  doc.text('INNOVATION · LEARNING · GROWTH', w / 2 + 8, logoBottom + 6, {
    align: 'center',
  });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 18, { fontSize: 24 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...FLARE);
  doc.text(BRAND_PORTAL, w / 2 + 8, headlineEnd + 4, { align: 'center' });

  doc.setFillColor(...FLARE);
  doc.rect(w - 48, 14, 36, 3, 'F');

  const endY = drawRecipientCore(ctx, headlineEnd + 12, {
    nameColor: ROYAL,
    titleSize: 17,
    ruleColor: ROYAL_LIGHT,
  });
  drawVerificationSealOptional(ctx, w - 36, h - 38, 10, {
    ringColor: ROYAL,
    textColor: ROYAL,
    showLogo: true,
    logoWidth: 12,
  });
  drawSignatures(ctx, endY, { lineColor: ROYAL_LIGHT });
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderLaurelHonors(ctx: LayoutContext) {
  const { doc, w, h } = ctx;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');

  drawDoubleFrame(doc, w, h, 10, 14, ROYAL, SLATE);
  drawLogoWatermark(ctx, { widthMm: 92, opacity: 0.04 });

  const logoBottom = drawCertificateBranding(ctx, 24, { peerWidth: 42 });
  drawLaurelArcs(doc, w / 2, logoBottom + 8, 38, ROYAL_LIGHT);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ROYAL_LIGHT);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 6, { align: 'center' });

  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 18, { fontSize: 25 });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text('With distinction for outstanding completion', w / 2, headlineEnd + 4, {
    align: 'center',
  });

  const endY = drawRecipientCore(ctx, headlineEnd + 12, {
    nameColor: MIDNIGHT,
    titleColor: ROYAL,
    nameSize: 23,
  });

  drawVerificationSealOptional(ctx, w / 2, h - 48, 13, {
    ringColor: ROYAL,
    fillColor: WHITE,
    textColor: ROYAL,
    label: 'HONORS',
    sublabel: BRAND_ACADEMY,
    showLogo: true,
    logoWidth: 15,
  });

  drawSignatures(ctx, endY, { lineColor: ROYAL });
  drawCertId(ctx);
  drawBrandFooter(ctx, h - 8);
}

function renderPlatinumElite(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(248, 249, 252);
  doc.rect(0, 0, w, h, 'F');
  drawLogoWatermark(ctx, { widthMm: 90, opacity: 0.04 });
  doc.setDrawColor(...PLATINUM);
  doc.setLineWidth(1.5);
  doc.rect(9, 9, w - 18, h - 18);
  doc.setLineWidth(0.35);
  doc.rect(13, 13, w - 26, h - 26);
  drawCornerBrackets(doc, w, h, 15, 12, PLATINUM, 0.5);
  const logoBottom = drawCertificateBranding(ctx, 22, { peerWidth: 44 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PLATINUM);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 16, { fontSize: 25, color: CHARCOAL });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, PLATINUM, 52);
  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: CHARCOAL,
    titleColor: ROYAL,
    ruleColor: PLATINUM,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w - 32, cy: h - 40, r: 11, opts: { ringColor: PLATINUM, textColor: ROYAL } },
    signatures: { lineColor: PLATINUM },
    certIdColor: PLATINUM,
  });
}

function renderCorporatePro(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...MIDNIGHT);
  doc.rect(0, 0, w, 14, 'F');
  doc.rect(0, h - 12, w, 12, 'F');
  drawLogoWatermark(ctx, { widthMm: 88, opacity: 0.04 });
  const logoBottom = drawCertificateBranding(ctx, 20, { peerWidth: 42 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ROYAL_LIGHT);
  doc.text('PROFESSIONAL CREDENTIAL', w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 14, { fontSize: 24 });
  drawSectionRule(doc, w, headlineEnd + 4, 50, MIDNIGHT, 0.35);
  const endY = drawRecipientCore(ctx, headlineEnd + 12, { ruleColor: SLATE });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 50, r: 12, opts: { ringColor: MIDNIGHT, label: 'CERTIFIED' } },
    signatures: { lineColor: MIDNIGHT, labelColor: MUTED },
  });
}

function renderBurgundyClassic(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...BURGUNDY);
  doc.rect(0, 0, w, 6, 'F');
  doc.rect(0, h - 6, w, 6, 'F');
  drawDoubleFrame(doc, w, h, 11, 15, BURGUNDY, SLATE);
  const logoBottom = drawCertificateBranding(ctx, 24, { peerWidth: 40 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BURGUNDY);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 16, { color: MIDNIGHT });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, BURGUNDY, 48);
  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: BURGUNDY,
    titleColor: MIDNIGHT,
    ruleColor: BURGUNDY,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 48, r: 12, opts: { ringColor: BURGUNDY, fillColor: WHITE, textColor: BURGUNDY } },
    signatures: { lineColor: BURGUNDY },
  });
}

function renderOceanTeal(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(245, 252, 252);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, w, 32, 'F');
  const logoBottom = drawCertificateBranding(ctx, 10, { peerWidth: 36 });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 10, { fontSize: 22, color: WHITE });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 235, 238);
  doc.text(BRAND_PORTAL, w / 2, headlineEnd + 4, { align: 'center' });
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.rect(14, 38, w - 28, h - 50);
  const endY = drawRecipientCore(ctx, 58, { nameColor: TEAL, titleColor: MIDNIGHT, ruleColor: TEAL });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w - 30, cy: h - 40, r: 10, opts: { ringColor: TEAL, textColor: TEAL } },
    signatures: { lineColor: TEAL },
  });
}

function renderForestScholar(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(248, 252, 248);
  doc.rect(0, 0, w, h, 'F');
  drawLogoWatermark(ctx, { widthMm: 85, opacity: 0.05 });
  drawCornerBrackets(doc, w, h, 14, 14, FOREST);
  drawLaurelArcs(doc, w / 2, 36, 32, FOREST);
  const logoBottom = drawCertificateBranding(ctx, 22, { peerWidth: 40 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...FOREST);
  doc.text('ACADEMIC EXCELLENCE', w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 14, { color: FOREST });
  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: FOREST,
    titleColor: MIDNIGHT,
    ruleColor: FOREST,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 48, r: 12, opts: { ringColor: FOREST, label: 'SCHOLAR' } },
    signatures: { lineColor: FOREST },
  });
}

function renderSunriseCelebrate(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...CORAL);
  doc.rect(0, 0, w, 28, 'F');
  doc.setFillColor(255, 180, 120);
  doc.rect(0, 26, w, 4, 'F');
  const logoBottom = drawCertificateBranding(ctx, 10, { peerWidth: 38 });
  const headlineEnd = drawCertificateHeadline(ctx, 46, { fontSize: 22, color: WHITE });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 240, 230);
  doc.text(BRAND_PORTAL, w / 2, headlineEnd + 4, { align: 'center' });
  const endY = drawRecipientCore(ctx, 58, {
    nameColor: CORAL,
    titleColor: MIDNIGHT,
    ruleColor: CORAL,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 48, r: 12, opts: { ringColor: CORAL, fillColor: CORAL, textColor: WHITE, label: 'CELEBRATE' } },
    signatures: { lineColor: CORAL },
  });
}

function renderCharcoalExecutive(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...CHARCOAL);
  doc.rect(0, 0, w, h, 'F');
  drawLogoWatermark(ctx, { widthMm: 100, opacity: 0.06 });
  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, w - 24, h - 24);
  const logoBottom = drawCertificateBranding(ctx, 20, { peerWidth: 42 });
  doc.setTextColor(...SLATE);
  doc.setFontSize(9);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 16, { fontSize: 24, color: WHITE });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, SLATE, 44);
  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: WHITE,
    titleColor: WHITE,
    bodyColor: SLATE,
    ruleColor: SLATE,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 52, r: 13, opts: { ringColor: ROYAL_LIGHT, fillColor: ROYAL, textColor: WHITE } },
    signatures: { lineColor: SLATE, labelColor: SLATE },
    certIdColor: SLATE,
    footerColor: SLATE,
  });
}

function renderIvoryGold(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...IVORY);
  doc.rect(0, 0, w, h, 'F');
  drawDoubleFrame(doc, w, h, 10, 14, GOLD, GOLD_LIGHT);
  drawCornerBrackets(doc, w, h, 16, 12, GOLD, 0.45);
  const logoBottom = drawCertificateBranding(ctx, 24, { peerWidth: 44 });
  doc.setTextColor(...GOLD);
  doc.setFontSize(9);
  doc.text(BRAND_PORTAL, w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 16, { fontSize: 26, color: MIDNIGHT });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, GOLD, 58);
  const endY = drawRecipientCore(ctx, headlineEnd + 10, {
    nameColor: MIDNIGHT,
    titleColor: ROYAL,
    ruleColor: GOLD,
  });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 50, r: 13, opts: { ringColor: GOLD, fillColor: IVORY, textColor: MIDNIGHT, label: 'LUXURY' } },
    signatures: { lineColor: GOLD, labelColor: MUTED },
    certIdColor: GOLD,
  });
}

function renderGeometricBold(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...ROYAL);
  doc.triangle(10, 10, 28, 10, 10, 28, 'F');
  doc.triangle(w - 10, h - 10, w - 28, h - 10, w - 10, h - 28, 'F');
  doc.setFillColor(...FLARE);
  doc.triangle(w - 10, 10, w - 10, 28, w - 28, 10, 'F');
  doc.triangle(10, h - 10, 28, h - 10, 10, h - 28, 'F');
  const logoBottom = drawCertificateBranding(ctx, 26, { peerWidth: 42 });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 14, { fontSize: 24 });
  drawSectionRule(doc, w, headlineEnd + 4, 55, ROYAL, 0.5);
  const endY = drawRecipientCore(ctx, headlineEnd + 12, { nameColor: ROYAL, ruleColor: ROYAL_LIGHT });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w - 32, cy: h - 38, r: 10, opts: { ringColor: FLARE, textColor: FLARE } },
    signatures: { lineColor: ROYAL },
  });
}

function renderGlobalPartner(ctx: LayoutContext) {
  const { doc, w, h } = ctx;
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...MIDNIGHT);
  doc.rect(0, 0, w, 5, 'F');
  doc.setFillColor(...ROYAL);
  doc.rect(0, 5, w, 3, 'F');
  doc.setFillColor(...ROYAL_LIGHT);
  doc.rect(0, h - 8, w, 3, 'F');
  doc.setFillColor(...MIDNIGHT);
  doc.rect(0, h - 5, w, 5, 'F');
  drawLogoWatermark(ctx, { widthMm: 92, opacity: 0.04 });
  const logoBottom = drawCertificateBranding(ctx, 22, { peerWidth: 44 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ROYAL);
  doc.text('GLOBAL LEARNING CREDENTIAL', w / 2, logoBottom + 5, { align: 'center' });
  const headlineEnd = drawCertificateHeadline(ctx, logoBottom + 14, { fontSize: 24 });
  drawOrnamentalDivider(doc, w, headlineEnd + 2, ROYAL, 50);
  const endY = drawRecipientCore(ctx, headlineEnd + 10, { titleColor: ROYAL });
  finishCertificateLayout(ctx, endY, {
    seal: { cx: w / 2, cy: h - 48, r: 12, opts: { ringColor: ROYAL, label: 'GLOBAL', sublabel: BRAND_PORTAL } },
    signatures: { lineColor: ROYAL_LIGHT },
  });
}

const RENDERERS: Record<CertificateTemplateId, (ctx: LayoutContext) => void> = {
  'peer-portal-classic': renderPeerPortalClassic,
  'royal-gradient': renderRoyalGradient,
  'midnight-premium': renderMidnightPremium,
  'minimal-elegance': renderMinimalElegance,
  'flare-achievement': renderFlareAchievement,
  'executive-diploma': renderExecutiveDiploma,
  'innovation-edge': renderInnovationEdge,
  'laurel-honors': renderLaurelHonors,
  'platinum-elite': renderPlatinumElite,
  'corporate-pro': renderCorporatePro,
  'burgundy-classic': renderBurgundyClassic,
  'ocean-teal': renderOceanTeal,
  'forest-scholar': renderForestScholar,
  'sunrise-celebrate': renderSunriseCelebrate,
  'charcoal-executive': renderCharcoalExecutive,
  'ivory-gold': renderIvoryGold,
  'geometric-bold': renderGeometricBold,
  'global-partner': renderGlobalPartner,
};

export function buildCertificatePdf(data: CertificateRequest): Uint8Array {
  const templateId = isCertificateTemplateId(data.templateId)
    ? data.templateId
    : DEFAULT_CERTIFICATE_TEMPLATE;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const certId = slugId(data.type, data.skillOrCourseId);
  const logoDataUrl = getCertificateLogoDataUrl();
  const fields = resolveCertificateFields(data, templateId);

  const ctx: LayoutContext = {
    doc,
    w,
    h,
    data,
    certId,
    logoDataUrl,
    fields,
  };

  RENDERERS[templateId](ctx);

  return new Uint8Array(doc.output('arraybuffer'));
}

export function certificateFilename(data: CertificateRequest): string {
  const safe = data.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40);
  const template = data.templateId || DEFAULT_CERTIFICATE_TEMPLATE;
  return `peer-portal-certificate-${template}-${safe || 'completion'}.pdf`;
}
