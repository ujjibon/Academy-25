import { jsPDF } from 'jspdf';
import {
  type ClassroomExportMeta,
  type ClassroomExportSlide,
  getSlideImageDataUrl,
  slugFilename,
  stripMarkdown,
} from '@/lib/classroom-slides-export-types';

const BRAND = 'Peer Academy';
const ROYAL: [number, number, number] = [0, 19, 158];
const MUTED: [number, number, number] = [90, 108, 130];
const DARK: [number, number, number] = [30, 41, 59];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function addFooter(doc: jsPDF, page: number, total: number, w: number, h: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(BRAND, 14, h - 8);
  doc.text(`Page ${page} of ${total}`, w - 14, h - 8, { align: 'right' });
}

function drawTitleSlide(
  doc: jsPDF,
  meta: ClassroomExportMeta,
  w: number,
  h: number
) {
  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, w, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(BRAND, 14, 18);

  doc.setTextColor(...DARK);
  doc.setFontSize(24);
  doc.text(meta.lessonTitle, 14, 55, { maxWidth: w - 28 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(meta.courseTitle, 14, 70, { maxWidth: w - 28 });

  if (meta.learningObjectives?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text('Learning objectives', 14, 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let y = 108;
    for (const obj of meta.learningObjectives.slice(0, 6)) {
      const lines = doc.splitTextToSize(`• ${obj}`, w - 28);
      doc.text(lines, 14, y);
      y += lines.length * 6 + 4;
      if (y > h - 30) break;
    }
  }
}

function drawContentSlide(
  doc: jsPDF,
  slide: ClassroomExportSlide,
  index: number,
  total: number,
  w: number,
  h: number
) {
  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, w, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${index}. ${slide.title}`, 14, 12, { maxWidth: w - 40 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(slide.type, w - 14, 12, { align: 'right' });

  let y = 32;
  const body = stripMarkdown(slide.content || '');
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(body, w - 28);
  const maxBodyLines = 14;
  doc.text(bodyLines.slice(0, maxBodyLines), 14, y);
  y += Math.min(bodyLines.length, maxBodyLines) * 5.5 + 8;

  const keyPoints = slide.keyPoints?.length
    ? slide.keyPoints
    : (slide.notes || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

  if (keyPoints.length && y < h - 60) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Key points', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const point of keyPoints.slice(0, 5)) {
      const lines = doc.splitTextToSize(`• ${point}`, w - 28);
      if (y + lines.length * 5 > h - 50) break;
      doc.text(lines, 14, y);
      y += lines.length * 5.5 + 2;
    }
  }

  const imageDataUrl = getSlideImageDataUrl(slide);
  if (imageDataUrl && y < h - 55) {
    try {
      const imgW = 70;
      const imgH = 40;
      const imgX = w - imgW - 14;
      const imgY = Math.min(y, h - imgH - 20);
      const format = imageDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(imageDataUrl, format, imgX, imgY, imgW, imgH);
    } catch (err) {
      console.warn('Could not embed slide image in PDF:', err);
    }
  } else if (slide.visualData?.data?.svgContent && y < h - 40) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('(SVG visual available in classroom — see online view)', 14, h - 28);
  }

  addFooter(doc, index + 1, total + 1, w, h);
}

/**
 * Build and download a landscape PDF deck from classroom slides (client-side).
 */
export function downloadClassroomSlidesPdf(
  slides: ClassroomExportSlide[],
  meta: ClassroomExportMeta
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const totalContent = slides.length;

  drawTitleSlide(doc, meta, w, h);
  addFooter(doc, 1, totalContent + 1, w, h);

  slides.forEach((slide, i) => {
    doc.addPage();
    drawContentSlide(doc, slide, i + 1, totalContent, w, h);
  });

  const blob = doc.output('blob');
  triggerDownload(blob, `${slugFilename(meta.lessonTitle)}.pdf`);
}
