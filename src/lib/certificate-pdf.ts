import { jsPDF } from 'jspdf';
import type { CertificateRequest } from '@/lib/training-types';

const BRAND = 'Peer Academy';
const ACCENT: [number, number, number] = [79, 70, 229];

function slugId(type: string, id: string): string {
  return `${type}-${id}`.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 48);
}

export function buildCertificatePdf(data: CertificateRequest): Uint8Array {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const issued = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, w - 24, h - 24);
  doc.setLineWidth(0.4);
  doc.rect(16, 16, w - 32, h - 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 110);
  doc.text(BRAND, w / 2, 32, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 40);
  doc.text('Certificate of Completion', w / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  doc.text('This is to certify that', w / 2, 62, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...ACCENT);
  const nameLines = doc.splitTextToSize(data.recipientName, w - 60);
  doc.text(nameLines, w / 2, 76, { align: 'center' });

  const nameOffset = (nameLines.length - 1) * 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  const typeLabel = data.type === 'course' ? 'course' : 'professional training program';
  doc.text(`has successfully completed the ${typeLabel}`, w / 2, 88 + nameOffset, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 40);
  const titleLines = doc.splitTextToSize(data.title, w - 50);
  doc.text(titleLines, w / 2, 100 + nameOffset, { align: 'center' });

  const titleOffset = (titleLines.length - 1) * 7;
  let y = 112 + nameOffset + titleOffset;

  if (data.completionSummary) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 100);
    const summaryLines = doc.splitTextToSize(data.completionSummary, w - 70);
    doc.text(summaryLines, w / 2, y, { align: 'center' });
    y += summaryLines.length * 5 + 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 110);
  doc.text(`Issued on ${issued}`, w / 2, Math.min(y + 6, h - 38), { align: 'center' });

  doc.setDrawColor(200, 200, 210);
  doc.line(w / 2 - 45, h - 42, w / 2 - 8, h - 42);
  doc.line(w / 2 + 8, h - 42, w / 2 + 45, h - 42);
  doc.setFontSize(9);
  doc.text('Program Director', w / 2 - 26, h - 36, { align: 'center' });
  doc.text(BRAND, w / 2 + 26, h - 36, { align: 'center' });

  const certId = slugId(data.type, data.skillOrCourseId);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text(`Certificate ID: ${certId}`, w / 2, h - 18, { align: 'center' });

  return new Uint8Array(doc.output('arraybuffer'));
}

export function certificateFilename(data: CertificateRequest): string {
  const safe = data.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `peer-academy-certificate-${safe || 'completion'}.pdf`;
}
