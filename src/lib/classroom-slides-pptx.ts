import {
  type ClassroomExportMeta,
  type ClassroomExportSlide,
  getSlideImageDataUrl,
  slugFilename,
  stripMarkdown,
} from '@/lib/classroom-slides-export-types';

const BRAND = 'Peer Academy';
const ROYAL = '00139E';
const MUTED = '5A6C82';
const DARK = '1E293B';

function dataUrlToPptxImage(dataUrl: string): {
  data: string;
  type?: 'png' | 'jpg';
} {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl);
  if (match) {
    const type = match[1].toLowerCase() === 'png' ? 'png' : 'jpg';
    return { data: match[2], type };
  }
  // Assume raw base64 png
  const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return { data: raw, type: 'png' };
}

/**
 * Build and download a PowerPoint deck from classroom slides (client-side).
 */
export async function downloadClassroomSlidesPptx(
  slides: ClassroomExportSlide[],
  meta: ClassroomExportMeta
): Promise<void> {
  // Dynamic import keeps pptxgenjs out of the initial client graph and lets
  // webpack apply node: fallbacks only when export is requested.
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.author = BRAND;
  pptx.title = meta.lessonTitle;
  pptx.subject = meta.courseTitle;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: ROYAL },
  });
  titleSlide.addText(BRAND, {
    x: 0.5,
    y: 0.28,
    w: 9,
    h: 0.4,
    color: 'FFFFFF',
    fontSize: 16,
    bold: true,
  });
  titleSlide.addText(meta.lessonTitle, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1,
    color: DARK,
    fontSize: 28,
    bold: true,
  });
  titleSlide.addText(meta.courseTitle, {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.4,
    color: MUTED,
    fontSize: 14,
  });

  if (meta.learningObjectives?.length) {
    titleSlide.addText('Learning objectives', {
      x: 0.5,
      y: 4.0,
      w: 9,
      h: 0.35,
      color: DARK,
      fontSize: 14,
      bold: true,
    });
    titleSlide.addText(
      meta.learningObjectives.slice(0, 6).map((o) => ({
        text: o,
        options: { bullet: true },
      })),
      {
        x: 0.5,
        y: 4.4,
        w: 9,
        h: 2,
        color: DARK,
        fontSize: 12,
      }
    );
  }

  slides.forEach((slide, index) => {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.7,
      fill: { color: ROYAL },
    });
    s.addText(`${index + 1}. ${slide.title}`, {
      x: 0.4,
      y: 0.18,
      w: 8.2,
      h: 0.4,
      color: 'FFFFFF',
      fontSize: 16,
      bold: true,
    });
    s.addText(slide.type, {
      x: 8.6,
      y: 0.22,
      w: 1.2,
      h: 0.35,
      color: 'FFFFFF',
      fontSize: 10,
      align: 'right',
    });

    const body = stripMarkdown(slide.content || '');
    const imageDataUrl = getSlideImageDataUrl(slide);
    const textWidth = imageDataUrl ? 5.8 : 9.2;

    s.addText(body.slice(0, 1200), {
      x: 0.4,
      y: 1.0,
      w: textWidth,
      h: 3.2,
      color: DARK,
      fontSize: 13,
      valign: 'top',
    });

    const keyPoints = slide.keyPoints?.length
      ? slide.keyPoints
      : (slide.notes || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

    if (keyPoints.length) {
      s.addText('Key points', {
        x: 0.4,
        y: 4.3,
        w: textWidth,
        h: 0.3,
        color: DARK,
        fontSize: 12,
        bold: true,
      });
      s.addText(
        keyPoints.slice(0, 5).map((p) => ({
          text: p,
          options: { bullet: true },
        })),
        {
          x: 0.4,
          y: 4.6,
          w: textWidth,
          h: 1.6,
          color: DARK,
          fontSize: 12,
        }
      );
    }

    if (imageDataUrl) {
      try {
        const img = dataUrlToPptxImage(imageDataUrl);
        s.addImage({
          data: img.data,
          x: 6.5,
          y: 1.1,
          w: 3.3,
          h: 3.3,
        });
      } catch (err) {
        console.warn('Could not embed slide image in PPTX:', err);
      }
    }

    const notes = [
      ...(keyPoints || []),
      slide.visualDescription ? `Visual: ${slide.visualDescription}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    if (notes) {
      s.addNotes(notes);
    }

    s.addText(BRAND, {
      x: 0.4,
      y: 7.1,
      w: 4,
      h: 0.25,
      color: MUTED,
      fontSize: 9,
    });
  });

  await pptx.writeFile({
    fileName: `${slugFilename(meta.lessonTitle)}.pptx`,
  });
}
