'use client';

import type { CSSProperties } from 'react';

type Props = { language: string; lines: string[]; executedLine: number | null; output: string; compact?: boolean };

/** A deliberately small authored CSS vocabulary; declarations cannot request assets or inject markup. */
function illustratedNavigationStyle(lines: string[], executedLine: number): CSSProperties {
  const style: CSSProperties = {};
  const source = lines.slice(0, Math.min(lines.length, Math.max(0, Math.floor(executedLine) + 1))).join('\n').replace(/\/\*[\s\S]*?(?:\*\/|$)/g, '');
  for (const match of source.matchAll(/(?:^|[;\n{])\s*(display|flex-direction|justify-content|align-items|min-height|gap)\s*:\s*([^;{}\n]+)/g)) {
    const property = match[1];
    const value = match[2].trim().toLowerCase();
    if (property === 'display' && value === 'flex') style.display = 'flex';
    if (property === 'flex-direction' && (value === 'row' || value === 'column')) style.flexDirection = value;
    if (property === 'justify-content' && (value === 'space-between' || value === 'center' || value === 'start' || value === 'flex-start')) style.justifyContent = value;
    if (property === 'align-items' && (value === 'center' || value === 'start' || value === 'flex-start')) style.alignItems = value;
    if ((property === 'min-height' || property === 'gap') && /^\d+(?:\.\d+)?px$/.test(value)) {
      const pixels = Number.parseFloat(value);
      if (!Number.isFinite(pixels)) continue;
      if (property === 'min-height' && pixels >= 0 && pixels <= 240) style.minHeight = pixels;
      if (property === 'gap' && pixels >= 0 && pixels <= 48) style.gap = pixels;
    }
  }
  return style;
}

function illustratedElements(output: string): Array<{ tag: 'h1' | 'button'; text: string }> | null {
  const pattern = /<(h1|button)>([^<>]{1,180})<\/\1>/g;
  const matches = [...output.matchAll(pattern)];
  if (!matches.length || matches.length > 4 || output.replace(pattern, '').trim()) return null;
  return matches.map(match => ({ tag: match[1] as 'h1' | 'button', text: match[2] }));
}

/** Visualizes supplied, authored trace output. It does not evaluate source or run arbitrary JSX. */
export function LessonCodePreview({ language, lines, executedLine, output, compact = false }: Props) {
  const syntax = language.toLowerCase();
  if (syntax !== 'css' && syntax !== 'jsx' && syntax !== 'tsx') return null;
  const begun = executedLine !== null && Number.isInteger(executedLine) && executedLine >= 0 && executedLine < lines.length;
  const navigation = syntax === 'css' && begun ? illustratedNavigationStyle(lines, executedLine) : {};
  const elements = syntax !== 'css' && begun ? illustratedElements(output) : null;

  return (
    <section role="region" aria-label="Illustrated interface preview" data-lesson-code-preview={syntax} style={{ width: '100%', minWidth: 0, maxHeight: compact ? 172 : undefined, boxSizing: 'border-box', overflow: 'hidden', border: '1px solid #dce2ee', borderRadius: compact ? 10 : 14, background: '#f7f9ff', padding: compact ? 7 : 12, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', color: '#20242b' }}>
      <p style={{ margin: '0 0 7px', fontSize: compact ? 16 : 11, lineHeight: 1.25, fontWeight: 600, color: '#52617a', letterSpacing: '.025em' }}>Illustrated interface preview</p>
      {!begun ? <p style={{ margin: 0, padding: compact ? 5 : 12, fontSize: compact ? 20 : 13, lineHeight: 1.5, color: '#69768b' }}>Step forward to see the interface take shape.</p> : syntax === 'css' ? (
        <div data-preview-navigation="true" aria-label="Example navigation layout" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'auto', maxHeight: compact ? 122 : 240, padding: 6, border: '1px dashed #b9c7e8', borderRadius: 8, background: '#fff', ...navigation }}>
          {([{ label: 'Start', height: 28 }, { label: 'Learn', height: 44 }, { label: 'Build', height: 34 }]).map(item => <div key={item.label} data-preview-item={item.label} style={{ boxSizing: 'border-box', flexShrink: 0, width: compact ? 80 : 64, height: item.height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c5d2fa', borderRadius: 6, background: item.label === 'Learn' ? '#335cff' : '#eef2ff', color: item.label === 'Learn' ? '#fff' : '#2d4fb8', fontSize: compact ? 18 : 12, lineHeight: 1, fontWeight: 600 }}>{item.label}</div>)}
        </div>
      ) : elements ? (
        <div data-preview-elements="true" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minHeight: compact ? 35 : 54, padding: compact ? 4 : 8, borderRadius: 8, background: '#fff' }}>
          {elements.map((element, index) => element.tag === 'h1' ? <h1 key={index} style={{ margin: 0, maxWidth: '100%', overflowWrap: 'anywhere', fontSize: compact ? 30 : 23, lineHeight: 1.3, fontWeight: 700 }}>{element.text}</h1> : <button key={index} type="button" disabled style={{ maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere', border: '1px solid #b9c7e8', borderRadius: 7, background: '#fff', padding: compact ? '8px 16px' : '9px 16px', color: '#20242b', font: 'inherit', fontSize: compact ? 20 : 13, lineHeight: 1.2, cursor: 'default', opacity: 1 }}>{element.text}</button>)}
        </div>
      ) : <pre style={{ margin: 0, padding: compact ? 4 : 8, maxHeight: compact ? 120 : 160, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: compact ? 20 : 13, lineHeight: 1.5, fontFamily: 'ui-monospace, monospace', color: '#44516a' }}>{output || 'This step prepares the component. Nothing is displayed yet.'}</pre>}
    </section>
  );
}

export default LessonCodePreview;
