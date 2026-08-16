/**
 * Shared types for classroom slide export (PDF / PPTX) and UI mapping.
 */

export type ClassroomExportSlide = {
  id: string;
  title: string;
  content: string;
  type: string;
  keyPoints?: string[];
  notes?: string;
  visualDescription?: string;
  visualType?: string;
  imageDataUrl?: string;
  visualData?: {
    type?: string;
    url?: string;
    data?: {
      description?: string;
      svgContent?: string;
      mermaidCode?: string;
      cssVisual?: string;
      imageDataUrl?: string;
    };
  };
};

export type ClassroomExportMeta = {
  courseTitle: string;
  lessonTitle: string;
  learningObjectives?: string[];
};

/** Strip light markdown for plain-text PDF/PPTX bodies. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, (m) => m)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getSlideImageDataUrl(
  slide: ClassroomExportSlide
): string | undefined {
  return (
    slide.imageDataUrl ||
    slide.visualData?.data?.imageDataUrl ||
    (slide.visualData?.url?.startsWith('data:')
      ? slide.visualData.url
      : undefined)
  );
}

export function slugFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'classroom-slides'
  );
}
