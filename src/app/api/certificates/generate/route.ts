import { NextRequest, NextResponse } from 'next/server';
import { buildCertificatePdf, certificateFilename } from '@/lib/certificate-pdf';
import { isCertificateTemplateId } from '@/lib/certificate-templates';
import type { CertificateRequest } from '@/lib/training-types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CertificateRequest;

    const title = String(body?.title || '').trim();
    const recipientName = String(body?.recipientName || '').trim();
    const skillOrCourseId = String(body?.skillOrCourseId || '').trim();
    const type = body?.type;

    if (!title || !recipientName || !skillOrCourseId) {
      return NextResponse.json(
        { error: 'title, recipientName, and skillOrCourseId are required.' },
        { status: 400 }
      );
    }

    if (type !== 'course' && type !== 'training') {
      return NextResponse.json({ error: 'type must be course or training.' }, { status: 400 });
    }

    const templateId = isCertificateTemplateId(body.templateId) ? body.templateId : undefined;

    const payload: CertificateRequest = {
      type,
      title,
      skillOrCourseId,
      recipientName,
      recipientEmail: body.recipientEmail,
      completionSummary: body.completionSummary,
      issuedAt: body.issuedAt || new Date().toISOString(),
      templateId,
      customization: body.customization,
    };

    const pdfBytes = buildCertificatePdf(payload);
    const filename = certificateFilename(payload);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Certificate generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF.' },
      { status: 500 }
    );
  }
}
