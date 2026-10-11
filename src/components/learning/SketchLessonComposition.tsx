'use client';

import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SKETCH_FAMILY_NAMES, type SketchLessonStoryboard } from '@/lib/visual-lessons';

const INK = '#20242b';
const PAPER = '#fcfcfd';
const BLUE = '#335cff';
const CORAL = '#f08b43';
const LIME = '#e3eaff';
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';
const NOTE_FONT = '"Segoe Print", "Comic Sans MS", cursive';
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const short = (text: string, limit = 42) => text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;

function wrapped(text: string, max = 24, lines = 3) {
  const result: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (`${line} ${word}`.trim().length > max && line) { result.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) result.push(line);
  if (result.length > lines) return [...result.slice(0, lines - 1), short(result.slice(lines - 1).join(' '), max)];
  return result;
}

function Words({ text, x, y, width = 26, size = 27, color = INK, weight = 600, lines = 3 }: { text: string; x: number; y: number; width?: number; size?: number; color?: string; weight?: number; lines?: number }) {
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} fontFamily={FONT}>{wrapped(text, width, lines).map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : size * 1.25}>{line}</tspan>)}</text>;
}

type Point = { x: number; y: number };
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Pure SVG sampling: the nib follows the visible stroke without DOM measurements. */
function strokePoint(d: string, progress: number): Point {
  const tokens = d.match(/[MLHVQCTSZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) || [];
  const segments: Point[][] = [];
  let cursor: Point = { x: 0, y: 0 };
  let start = cursor;
  let previousControl = cursor;
  let command = 'M';
  let index = 0;
  const point = (): Point => ({ x: Number(tokens[index++]), y: Number(tokens[index++]) });
  while (index < tokens.length) {
    if (/^[a-z]$/i.test(tokens[index])) command = tokens[index++].toUpperCase();
    if (command === 'Z') {
      segments.push([cursor, start]); cursor = start; command = 'M'; continue;
    }
    if (command === 'M') { cursor = point(); start = cursor; previousControl = cursor; command = 'L'; continue; }
    const from = cursor;
    let control1 = from;
    let control2 = from;
    let to = from;
    if (command === 'H') to = { x: Number(tokens[index++]), y: from.y };
    else if (command === 'V') to = { x: from.x, y: Number(tokens[index++]) };
    else if (command === 'L') to = point();
    else if (command === 'Q') { control1 = point(); to = point(); }
    else if (command === 'T') { control1 = { x: 2 * from.x - previousControl.x, y: 2 * from.y - previousControl.y }; to = point(); }
    else if (command === 'C') { control1 = point(); control2 = point(); to = point(); }
    else if (command === 'S') { control1 = { x: 2 * from.x - previousControl.x, y: 2 * from.y - previousControl.y }; control2 = point(); to = point(); }
    else break;
    const curve = command === 'Q' || command === 'T' || command === 'C' || command === 'S';
    const samples = Array.from({ length: curve ? 21 : 2 }, (_, sample) => {
      const t = sample / (curve ? 20 : 1);
      if (command === 'Q' || command === 'T') return mix(mix(from, control1, t), mix(control1, to, t), t);
      if (command === 'C' || command === 'S') return mix(mix(mix(from, control1, t), mix(control1, control2, t), t), mix(mix(control1, control2, t), mix(control2, to, t), t), t);
      return mix(from, to, t);
    });
    segments.push(samples);
    cursor = to;
    previousControl = command === 'C' || command === 'S' ? control2 : command === 'Q' || command === 'T' ? control1 : to;
  }
  const lengths = segments.map(points => points.slice(1).reduce((total, item, sample) => total + Math.hypot(item.x - points[sample].x, item.y - points[sample].y), 0));
  let remaining = lengths.reduce((total, value) => total + value, 0) * clamp(progress);
  for (let segment = 0; segment < segments.length; segment++) {
    if (remaining > lengths[segment] && segment < segments.length - 1) { remaining -= lengths[segment]; continue; }
    const points = segments[segment];
    for (let sample = 1; sample < points.length; sample++) {
      const length = Math.hypot(points[sample].x - points[sample - 1].x, points[sample].y - points[sample - 1].y);
      if (remaining <= length || sample === points.length - 1) return mix(points[sample - 1], points[sample], length ? clamp(remaining / length) : 1);
      remaining -= length;
    }
  }
  return cursor;
}

function Draw({ d, progress, color = INK, width = 4, dashed = false, nib = false }: { d: string; progress: number; color?: string; width?: number; dashed?: boolean; nib?: boolean }) {
  const visible = clamp(progress);
  const tip = nib ? strokePoint(d, visible) : null;
  return <g data-pencil-stroke={nib ? 'tracked' : undefined}>
    <path d={d} fill="none" stroke={color} strokeWidth={width * .37} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dashed ? '0.025 0.025' : 1} strokeDashoffset={dashed ? 0 : 1 - visible} opacity={dashed ? visible * .2 : .16} transform="translate(1.1 .8)" />
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dashed ? '0.025 0.025' : 1} strokeDashoffset={dashed ? 0 : 1 - visible} opacity={dashed ? visible : 1} />
    {tip && visible > 0 && visible < 1 && <Pencil x={tip.x} y={tip.y} />}
  </g>;
}

function PaperCard({ x, y, w, h, color = '#ffffff', progress = 1, nib = false, children }: { x: number; y: number; w: number; h: number; color?: string; progress?: number; nib?: boolean; children?: React.ReactNode }) {
  return <g opacity={clamp(progress * 2)}>
    <path d={`M ${x + 5} ${y + 7} L ${x + w + 5} ${y + 5} L ${x + w + 7} ${y + h + 7} L ${x + 3} ${y + h + 5} Z`} fill={INK} opacity="0.09" />
    <path d={`M ${x + 2} ${y + 1} L ${x + w} ${y - 1} L ${x + w + 2} ${y + h} L ${x - 1} ${y + h + 2} Z`} fill={color} />
    <Draw d={`M ${x + 2} ${y + 1} L ${x + w} ${y - 1} L ${x + w + 2} ${y + h} L ${x - 1} ${y + h + 2} Z`} progress={progress} width={3} nib={nib} />
    {children}
  </g>;
}

function Pencil({ x, y }: { x: number; y: number }) {
  return <g data-pencil-nib="true" transform={`translate(${x} ${y}) rotate(25)`}>
    <path d="M-7-54H7V-17L0 0-7-17Z" fill={BLUE} stroke={INK} strokeWidth="2.2" />
    <path d="M-7-17 0 0 7-17Z" fill="#e9d4b6" stroke={INK} strokeWidth="2" />
    <path d="m-2.7-6 2.7 6 2.7-6Z" fill={INK} />
    <path d="M-3-50V-21" stroke="#ffffff" strokeOpacity=".65" strokeWidth="2" />
    <path d="M-7-51H7" stroke={CORAL} strokeWidth="5" />
  </g>;
}

function Annotation({ text, x, y, progress, color = BLUE, width = 41, size = 23 }: { text: string; x: number; y: number; progress: number; color?: string; width?: number; size?: number }) {
  return <g opacity={clamp(progress * 3)}><text x={x} y={y} fontFamily={NOTE_FONT} fontWeight="600" fontSize={size} fill={color}>{wrapped(text, width, 2).map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : size * 1.25}>{line}</tspan>)}</text><Draw d={`M${x} ${y + 10}Q${x + 110} ${y + 15} ${x + Math.min(330, text.length * 9)} ${y + 9}`} progress={clamp(progress * 2 - .2)} color={color} width={1.8} /></g>;
}

type DiagramProps = { film: SketchLessonStoryboard; phase: number; progress: number; seconds: number };

function PromptDiagram({ film, phase, progress }: DiagramProps) {
  const visible = phase < 2 ? 1 + Math.floor(progress * 5) : 5;
  const assemble = phase === 2 ? clamp(progress * 1.65) : phase > 2 ? 1 : 0;
  const colors = ['#ffffff', '#f5f7ff', '#ffffff', '#f5f7ff', '#ffffff'];
  return <>
    <PaperCard x={480} y={40} w={720} h={475} color="#ffffff" progress={phase >= 2 ? 1 : clamp(progress * 4)}>
      <Words text="A brief you can inspect" x={515} y={91} size={32} width={34} />
      <Draw d="M 514 113 Q 780 105 1160 113" progress={clamp(progress * 4)} color={BLUE} />
    </PaperCard>
    {film.labels.map((item, index) => {
      const startX = 65;
      const targetX = 520;
      const shift = clamp(assemble * 1.6 - index * 0.12);
      // Both sides share aligned rows, so cards never pass over each other or
      // the document heading while the brief is assembled.
      const y = 139 + index * 73;
      const x = startX + (targetX - startX) * shift;
      const cardWidth = 305 + 320 * shift;
      const inline = cardWidth > 430;
      const shown = index < visible;
      const stroke = phase < 2 ? clamp(progress * 5 - index) : 1;
      return <g key={item.label} opacity={shown ? 1 : 0}>
        <Draw d={`M 370 ${y + 38} C 413 ${y + 38}, 424 ${y + 38}, 477 ${y + 38}`} color={BLUE} progress={shown ? clamp(progress * 4 - index * 0.2) : 0} />
        <PaperCard x={x} y={y} w={cardWidth} h={66} color={colors[index]} progress={stroke} nib={phase < 2 && stroke > 0 && stroke < 1}>
          <Words text={item.label.toUpperCase()} x={x + 17} y={y + 31} size={item.label.length > 10 ? 18 : 23} width={19} />
          <Words text={index === 0 ? short(film.project.title, 29) : short(item.detail, inline ? Math.floor((cardWidth - 185) / 13) : 30)} x={x + (inline ? 162 : 17)} y={y + (inline ? 31 : 57)} size={inline ? 25 : 20} width={inline ? Math.floor((cardWidth - 180) / 13) : 31} lines={1} weight={500} />
        </PaperCard>
      </g>;
    })}
    {phase === 3 && <><Draw d="M1125 433C1187 415 1221 438 1215 470C1209 497 1133 505 1112 480C1095 458 1109 439 1125 433" color={CORAL} progress={clamp(progress * 1.8)} width={4} nib /><Draw d="M 1160 168 L 1176 182 L 1209 143" color={BLUE} progress={clamp(progress * 2 - .5)} width={7} /></>}
    <Annotation text={phase === 2 ? 'Every layer earns its place in the brief.' : phase === 3 ? 'Compare the result with the original job.' : phase === 4 ? short(film.project.title, 58) : short(film.labels[Math.min(4, Math.floor(progress * 5))].detail, 58)} x={490} y={568} width={47} progress={clamp(progress * 3)} />
  </>;
}

function CodeDiagram({ film, phase, progress }: DiagramProps) {
  if (!film.code) {
    const positions = [{ x: 90, y: 190 }, { x: 410, y: 80 }, { x: 410, y: 335 }, { x: 805, y: 210 }];
    const labels = ['User story', 'Implementation', 'Tests', 'Reviewed change'];
    return <>
      <Draw d="M 320 239 Q 353 140 410 131 M 320 239 Q 349 383 410 385 M 694 131 Q 753 130 805 254 M 694 385 Q 741 382 805 254" progress={progress} color={BLUE} nib />
      {positions.map((position, index) => <PaperCard key={index} x={position.x} y={position.y} w={index === 3 ? 370 : 284} h={110} progress={phase >= 2 ? 1 : clamp(progress * 3 - index * .35)} color={index === 3 ? LIME : '#ffffff'}><Words text={labels[index]} x={position.x + 18} y={position.y + 35} width={23} size={27} /><Words text={short(film.labels[index].detail, 42)} x={position.x + 18} y={position.y + 69} width={25} size={20} weight={500} lines={2} /></PaperCard>)}
      {phase === 3 && <Draw d="M416 336C445 312 654 314 693 336C721 377 719 421 681 447C621 460 474 453 418 432C400 403 399 363 416 336" progress={clamp(progress * 1.6)} color={CORAL} width={3} />}
      <Annotation text={phase === 4 ? short(film.project.title, 62) : short(film.labels[phase === 3 ? 3 : Math.min(4, Math.floor(progress * 5))].detail, 65)} x={150} y={560} width={65} size={25} progress={clamp(progress * 3)} />
    </>;
  }
  const code = film.code;
  const index = Math.min(code.trace.length - 1, Math.floor(progress * code.trace.length));
  const trace = code.trace[phase === 0 ? 0 : index];
  const stepProgress = clamp(progress * code.trace.length - index);
  const lineHeight = code.lines.length > 6 ? 43 : 55;
  return <>
    <PaperCard x={55} y={45} w={725} h={480} color="#f9fbff"><Words text="WATCH THE EXECUTION" x={80} y={90} size={23} color={BLUE} width={29} />
      {code.lines.map((line, lineIndex) => <g key={lineIndex} opacity={phase === 0 && lineIndex > Math.floor(progress * code.lines.length) ? .16 : 1}>
        {lineIndex === trace.line && <path d={`M 81 ${119 + lineIndex * lineHeight} L 754 ${117 + lineIndex * lineHeight} L 756 ${151 + lineIndex * lineHeight} L 80 ${154 + lineIndex * lineHeight} Z`} fill={LIME} />}
        <text x={81} y={144 + lineIndex * lineHeight} fontFamily="ui-monospace, monospace" fontSize="22" fill="#6d7483">{lineIndex + 1}</text>
        <text x={125} y={144 + lineIndex * lineHeight} fontFamily="ui-monospace, monospace" fontSize={line.length > 34 ? 23 : 27} fill={INK} xmlSpace="preserve">{line}</text>
        {lineIndex === trace.line && <Draw d={`M125 ${155 + lineIndex * lineHeight}Q${Math.min(741, 130 + line.length * 6)} ${159 + lineIndex * lineHeight} ${Math.min(748, 125 + line.length * 13)} ${155 + lineIndex * lineHeight}`} progress={phase === 0 ? clamp(progress * 2) : stepProgress} color={BLUE} width={2} nib />}
      </g>)}
    </PaperCard>
    <PaperCard x={840} y={65} w={355} h={165} color="#f1f4ff"><Words text="MEMORY" x={868} y={103} size={22} color={BLUE} width={18} /><Words text={trace.state} x={868} y={148} width={22} size={27} lines={2} /></PaperCard>
    <Draw d={`M 780 ${140 + trace.line * lineHeight} C 812 ${140 + trace.line * lineHeight}, 790 150, 834 150`} progress={phase === 0 ? progress : clamp(stepProgress * 2)} color={BLUE} />
    <PaperCard x={840} y={275} w={355} h={250} color={phase >= 2 ? '#f3f6ff' : '#ffffff'}><Words text="VISIBLE OUTPUT" x={868} y={314} size={22} color={BLUE} width={20} />
      {(phase === 0 ? [] : trace.output.split('\n')).map((line, lineIndex) => <text key={lineIndex} x={868} y={359 + lineIndex * 37} fontFamily="ui-monospace, monospace" fill={INK} fontSize="27">{line}</text>)}
      {!trace.output && <Words text="No output yet…" x={868} y={363} width={21} size={25} color="#737780" weight={500} />}
    </PaperCard>
    <Annotation text={phase === 3 ? 'Predict the state before this line runs.' : phase === 4 ? short(film.project.title, 61) : `Trace ${phase === 0 ? 1 : index + 1}/${code.trace.length}: ${trace.state}`} x={90} y={575} size={25} width={66} progress={clamp(progress * 4)} />
  </>;
}

function EvidenceDiagram({ film, phase, progress }: DiagramProps) {
  const reveal = phase === 0 ? progress * 4 : phase === 1 ? progress * 6 : 6;
  const nodes = [
    { x: 65, y: 212, w: 270, h: 125, label: film.labels[0].label, fill: '#fff5ec' },
    { x: 415, y: 52, w: 290, h: 152, label: film.labels[1].label, fill: '#ffffff' },
    { x: 415, y: 355, w: 290, h: 152, label: film.labels[3].label, fill: '#ffffff' },
    { x: 806, y: 150, w: 330, h: 125, label: film.labels[2].label, fill: '#f1f4ff' },
    { x: 840, y: 395, w: 330, h: 125, label: film.labels[4].label, fill: LIME },
  ];
  const paths = ['M 335 257 Q 372 112 408 122', 'M 335 290 Q 363 428 408 431', 'M 705 124 Q 741 122 802 199', 'M 705 432 Q 757 431 802 235', 'M 971 275 Q 969 327 1004 389'];
  const inspect = Math.min(nodes.length - 1, Math.floor(progress * nodes.length));
  const previous = nodes[Math.max(0, inspect - 1)];
  const inspected = nodes[inspect];
  const move = clamp((progress * nodes.length - inspect) * 3);
  const lens = mix({ x: previous.x + previous.w - 4, y: previous.y + previous.h + 2 }, { x: inspected.x + inspected.w - 4, y: inspected.y + inspected.h + 2 }, move);
  return <>
    {paths.map((path, index) => <Draw key={path} d={path} progress={clamp(progress * 5 - index)} color={index === 4 ? BLUE : INK} nib={index === inspect} />)}
    {nodes.map((node, index) => <PaperCard key={node.label} {...node} color={node.fill} progress={clamp(reveal - index * .65)}>
      <Words text={node.label} x={node.x + 18} y={node.y + 35} width={21} size={27} />
      {index === 1 || index === 2 ? <><Draw d={`M ${node.x + 18} ${node.y + 77} L ${node.x + 220} ${node.y + 75} M ${node.x + 18} ${node.y + 98} L ${node.x + 252} ${node.y + 100} M ${node.x + 18} ${node.y + 122} L ${node.x + 183} ${node.y + 120}`} progress={clamp(reveal - index * .6)} color="#7c8797" width={3} /><circle cx={node.x + 250} cy={node.y + 38} r="14" stroke={INK} strokeWidth="3" fill={index === 2 ? LIME : '#f1f4ff'} /></> : <Words text={short(index === 0 ? film.project.title : film.labels[index === 3 ? 2 : 4].detail, 39)} x={node.x + 18} y={node.y + 76} width={index === 0 ? 21 : 25} size={21} weight={500} lines={2} />}
    </PaperCard>)}
    <g transform={`translate(${lens.x} ${lens.y})`}><circle r="24" fill="white" fillOpacity=".2" stroke={BLUE} strokeWidth="4" /><path d="M 17 17 L 34 34" stroke={BLUE} strokeWidth="6" strokeLinecap="round" /></g>
    {phase === 3 && <Draw d="M 1169 133 L 1233 195 M 1233 133 L 1169 195" color={CORAL} width={6} progress={clamp(progress * 3)} />}
    <Annotation text={phase === 3 ? 'Check the claim against the source, not the citation badge.' : phase === 4 ? short(film.project.title, 68) : short(film.labels[inspect].detail, 68)} x={60} y={588} size={24} width={70} progress={clamp(progress * 3)} />
  </>;
}

function DesignDiagram({ film, phase, progress }: DiagramProps) {
  const tidy = phase >= 2 ? clamp(progress * 1.7) : phase === 1 ? progress * .65 : 0;
  const responsive = film.variant === 'layout';
  const rightWidth = responsive ? 580 - Math.sin(progress * Math.PI) * 105 : 580;
  return <>
    <Words text="ROUGH IDEA" x={86} y={40} size={23} color={CORAL} width={19} />
    <Words text="A SYSTEM THAT SURVIVES CHANGE" x={585} y={40} size={23} color={BLUE} width={43} />
    <PaperCard x={80} y={72} w={335} h={455} color="#ffffff" progress={phase === 0 ? clamp(progress * 2) : 1} nib={phase === 0 && progress < .5}>
      <path d="M 106 115 L 382 130 L 368 203 L 111 188 Z" fill="#fff3e8" stroke={INK} strokeWidth="3" />
      <Words text={short(film.project.title, 32)} x={124} y={148} width={17} size={28} />
      {[0, 1, 2].map(index => <path key={index} d={`M ${102 + index * 12} ${241 + index * 74} L ${370 - index * 15} ${221 + index * 74} L ${374 - index * 15} ${273 + index * 74} L ${106 + index * 12} ${295 + index * 74} Z`} fill={index === 1 ? '#eff3ff' : '#f5f6f8'} stroke={INK} strokeWidth="3" />)}
    </PaperCard>
    <Draw d="M 445 281 Q 476 264 533 276 M 514 257 L 534 276 L 515 295" progress={clamp(progress * 3)} color={BLUE} width={5} />
    <PaperCard x={580} y={72} w={rightWidth} h={455} color="#ffffff" progress={phase === 0 ? clamp(progress * 2 - 1) : 1} nib={phase === 0 && progress >= .5}>
      <rect x={602} y={94} width={rightWidth - 44} height="96" rx="8" fill={LIME} />
      <Words text={short(film.project.title, 42)} x={626} y={132} width={Math.floor((rightWidth - 80) / 23)} size={33 + tidy * 7} lines={2} />
      {[0, 1, 2].map(index => {
        const y = 225 + index * 87;
        const gap = 7 + tidy * 17;
        return <g key={index}>
          <rect x={608 + gap} y={y} width={rightWidth - 58 - gap * 2} height="64" rx={8 + tidy * 5} fill={index === 0 ? '#f1f4ff' : '#f5f6f8'} stroke={INK} strokeWidth="3" />
          <circle cx={637 + gap} cy={y + 31} r="13" fill={index === 0 ? BLUE : CORAL} />
          <Draw d={`M ${664 + gap} ${y + 23} L ${580 + rightWidth - 51 - gap} ${y + 23} M ${664 + gap} ${y + 41} L ${580 + rightWidth - 112 - gap} ${y + 41}`} progress={clamp(progress * 4 - index * .25)} width={3} />
        </g>;
      })}
      <Draw d={`M 601 209 L ${580 + rightWidth - 20} 209`} progress={clamp(progress * 2)} color={BLUE} width={2} dashed />
      <Draw d={`M 600 209 L 600 499 M ${580 + rightWidth - 20} 209 L ${580 + rightWidth - 20} 499`} progress={progress} color={BLUE} width={2} nib={phase === 1 || phase === 2} />
    </PaperCard>
    {film.variant === 'tokens' && [BLUE, CORAL, LIME, INK].map((color, index) => <g key={color}><circle cx={630 + index * 120} cy={570} r="25" fill={color} stroke={INK} strokeWidth="3" /><Words text={['Primary', 'Accent', 'Highlight', 'Ink'][index]} x={597 + index * 120} y={620} width={10} size={20} /></g>)}
    {film.variant === 'components' && <Annotation text="One component → consistent instances" x={590} y={570} size={25} width={43} progress={clamp(progress * 3)} />}
    {responsive && <><Draw d={`M 600 554 L ${580 + rightWidth - 10} 554 M 600 544 L 600 565 M ${580 + rightWidth - 10} 544 L ${580 + rightWidth - 10} 565`} progress={progress} color={BLUE} width={3} nib={phase === 3} /><Annotation text="Resize the frame. Keep the spacing rules." x={588} y={596} width={44} size={24} progress={clamp(progress * 3)} /></>}
    {!responsive && film.variant !== 'tokens' && film.variant !== 'components' && <Annotation text="Hierarchy, spacing, and a clear next action." x={580} y={567} size={24} width={45} progress={clamp(progress * 3)} />}
    {phase === 4 && <Annotation text={short(film.project.title, 44)} x={85} y={576} width={33} size={22} progress={clamp(progress * 3)} />}
  </>;
}

function TimelineDiagram({ film, phase, progress, seconds }: DiagramProps) {
  const x = 98 + progress * 1085;
  const sound = film.variant === 'sound';
  const captions = film.variant === 'captions';
  const exporting = film.variant === 'export';
  const previewX = 420 + Math.sin(progress * Math.PI * 2) * (phase >= 2 ? 85 : 25);
  return <>
    <PaperCard x={61} y={40} w={660} h={240} color="#f5f7fc">
      <path d="M 78 235 L 227 108 L 346 222 L 422 159 L 685 254 Z" fill="#edf1fa" />
      <Draw d="M 78 235 L 227 108 L 346 222 L 422 159 L 685 254 Z" progress={phase === 0 ? clamp(progress * 2) : 1} width={3} nib={phase === 0} />
      <circle cx="624" cy="96" r="27" fill={LIME} stroke={INK} strokeWidth="3" />
      <g transform={`translate(${previewX} 156)`}><circle r="31" fill={CORAL} stroke={INK} strokeWidth="4" /><path d="M -40 42 Q 0 73 40 42" fill="none" stroke={INK} strokeWidth="4" /></g>
      {captions && <><rect x="132" y="198" width="481" height="53" rx="8" fill={INK} /><Words text={short(film.project.title, 38)} x={150} y={233} size={25} color="white" width={40} lines={1} /><Draw d="M 108 67 L 673 67 L 673 258 L 108 258 Z" color={CORAL} progress={progress} dashed nib={phase === 3} /></>}
      {!captions && <Draw d={`M ${previewX - 75} 67 L ${previewX + 75} 67 L ${previewX + 75} 254 L ${previewX - 75} 254 Z`} progress={clamp(progress * 3)} color={BLUE} dashed />}
    </PaperCard>
    <PaperCard x={772} y={40} w={425} h={240} color="#ffffff"><Words text={exporting ? 'DELIVERY CHECK' : sound ? 'VOICE ABOVE MUSIC' : 'EVERY SHOT HAS A JOB'} x={795} y={82} size={23} color={BLUE} width={29} />
      {sound ? <>
        <Words text="Voice" x={798} y={131} size={25} width={18} /><rect x="900" y="109" width="260" height="25" rx="10" fill="#e9edf3" /><rect x="900" y="109" width={190 + progress * 15} height="25" rx="10" fill={BLUE} />
        <Words text="Music" x={798} y={183} size={25} width={18} /><rect x="900" y="161" width="260" height="25" rx="10" fill="#e9edf3" /><rect x="900" y="161" width={150 - progress * 90} height="25" rx="10" fill={CORAL} /><Words text="Duck the bed under speech" x={798} y={240} width={31} size={23} color={BLUE} />
      </> : <Words text={short(exporting ? 'Aspect ratio • captions • clean start & end' : film.project.title, 64)} x={798} y={133} width={25} size={31} lines={3} />}
    </PaperCard>
    <Words text="PICTURE" x={60} y={327} size={22} color={BLUE} width={15} />
    {[0, 1, 2, 3].map(index => {
      const widths = [184, 240, 390, 254];
      const offset = widths.slice(0, index).reduce((sum, value) => sum + value + 12, 0);
      const stroke = phase === 1 ? clamp(progress * 4 - index) : 1;
      return <g key={index} opacity={phase === 0 ? clamp(progress * 5 - index * .6) : 1}><PaperCard x={95 + offset} y={348} w={widths[index]} h={100} color={['#fff5ec', '#f1f4ff', '#ffffff', '#f7f8fb'][index]} progress={stroke} nib={phase === 1 && stroke > 0 && stroke < 1}><Words text={['Hook', 'Story', 'Show proof', 'Next step'][index]} x={110 + offset} y={393} size={28} width={19} /><Words text={['0–3s', '3–8s', '8–15s', '15–20s'][index]} x={110 + offset} y={425} size={20} width={20} weight={500} /></PaperCard></g>;
    })}
    <Words text="SOUND" x={60} y={489} size={22} color={BLUE} width={15} />
    <rect x="95" y="506" width="1116" height="70" fill="#ffffff" stroke={INK} strokeWidth="3" rx="5" />
    <Draw d={Array.from({ length: 90 }, (_, index) => { const amplitude = (12 + Math.sin(index * 3.4) * 10) * (sound && index > 25 && index < 70 ? .5 : 1); return `M ${109 + index * 12} ${540 - amplitude} L ${109 + index * 12} ${540 + amplitude}`; }).join(' ')} progress={phase === 2 ? progress : phase === 0 ? clamp(progress * 2 - 1) : 1} color={BLUE} width={3} nib={phase === 2} />
    <Draw d={`M ${x} 315 L ${x} 590`} color={CORAL} width={5} progress={1} /><path d={`M ${x - 12} 306 L ${x + 12} 306 L ${x} 321 Z`} fill={CORAL} />
    <Annotation text={phase === 4 ? short(film.project.title, 69) : sound ? 'A clear voice leads; music supports it.' : captions ? 'Caption the meaning. Stay inside the safe area.' : exporting ? 'Check the first and final frames before delivery.' : 'A 20-second sketch: every shot has a teaching job.'} x={96} y={620} size={24} width={70} progress={clamp(progress * 3)} />
  </>;
}

function WorkflowDiagram({ film, phase, progress }: DiagramProps) {
  if (film.variant === 'spreadsheet') return <>
    <PaperCard x={78} y={50} w={630} h={465} color="#ffffff"><Words text="ILLUSTRATIVE DATA" x={109} y={95} size={23} color={BLUE} width={30} />
      {[0, 1, 2, 3].map(row => <g key={row}><rect x="110" y={119 + row * 80} width="552" height="80" fill={row === 0 ? '#f1f4ff' : 'transparent'} /><Draw d={`M110 ${119 + row * 80}H662V${199 + row * 80}H110Z M380 ${119 + row * 80}V${199 + row * 80}`} progress={phase < 2 ? clamp(progress * 4 - row) : 1} width={2} nib={phase === 1 && Math.floor(progress * 4) === row} /><Words text={['Task', 'Plan', 'Build', 'Review'][row]} x={132} y={169 + row * 80} width={17} size={29} /><Words text={['Minutes', '12', '18', '15'][row]} x={406} y={169 + row * 80} width={16} size={29} /></g>)}
      <rect x="384" y={202 + Math.min(2, Math.floor(progress * 3)) * 80} width="271" height="70" fill={LIME} fillOpacity=".45" stroke={BLUE} strokeWidth="4" />
    </PaperCard>
    <PaperCard x={793} y={69} w={399} h={190} color="#f1f4ff"><Words text="= SUM(B2:B4)" x={822} y={122} size={34} width={23} /><Words text={progress > .4 || phase >= 2 ? '12 + 18 + 15 = 45' : 'Follow the selected cells'} x={822} y={184} size={29} width={26} /></PaperCard>
    {[12, 18, 15].map((value, index) => <g key={index}><rect x={826 + index * 116} y={494 - value * 10 * clamp(progress * 2)} width="68" height={value * 10 * clamp(progress * 2)} fill={[CORAL, BLUE, LIME][index]} stroke={INK} strokeWidth="3" /><Words text={['Plan', 'Build', 'Review'][index]} x={819 + index * 116} y={531} width={10} size={24} /></g>)}
    <Draw d="M655 357C731 360 749 196 793 179" progress={progress} color={BLUE} width={3} nib={phase === 2 || phase === 3} />
    <Annotation text={phase === 4 ? short(film.project.title, 65) : 'Follow the inputs. Check the formula. Then trust the result.'} x={101} y={588} size={25} width={65} progress={clamp(progress * 3)} />
  </>;
  if (film.variant === 'document' || film.variant === 'presentation') {
    const slide = film.variant === 'presentation';
    return <>
      {[0, 1, 2].map(index => <PaperCard key={index} x={85 + index * 395} y={slide ? 150 : 70} w={315} h={slide ? 290 : 455} progress={phase >= 2 ? 1 : clamp(progress * 4 - index * .65)} color={index === 2 ? '#f3f6ff' : '#ffffff'}>
        <Words text={['Outline', 'Draft', 'Edit & check'][index]} x={111 + index * 395} y={slide ? 200 : 118} width={18} size={29} color={BLUE} />
        <rect x={112 + index * 395} y={slide ? 224 : 158} width="258" height={index === 2 ? 76 : 44} rx="5" fill={index === 2 ? LIME : '#f1f4ff'} />
        {Array.from({ length: slide ? 3 : 7 }, (_, line) => {
          const count = slide ? 3 : 7;
          const stroke = clamp(progress * count * 3 - index * count - line);
          return <Draw key={line} d={`M ${111 + index * 395} ${(slide ? 323 : 261) + line * 30} L ${(line % 3 === 1 ? 290 : 363) + index * 395} ${(slide ? 323 : 261) + line * 30}`} progress={stroke} width={3} color={index === 1 && line === 2 ? CORAL : INK} nib={stroke > 0 && stroke < 1} />;
        })}
        {index === 2 && <Draw d={`M ${318 + index * 395} ${slide ? 263 : 196} L ${332 + index * 395} ${slide ? 279 : 212} L ${355 + index * 395} ${slide ? 247 : 180}`} color={BLUE} width={5} progress={clamp(progress * 3)} />}
      </PaperCard>)}
      <Annotation text={phase === 4 ? short(film.project.title, 64) : slide ? 'One idea at a time. Give the audience a clear path.' : 'Structure first. Refine the message. Check before sharing.'} x={107} y={591} size={25} width={64} progress={clamp(progress * 3)} />
    </>;
  }
  return <>
    <Draw d="M 83 283 Q 295 281 492 284 T 1185 283" progress={progress} color={BLUE} width={5} nib />
    {film.labels.map((item, index) => {
      const x = 63 + index * 244;
      const y = index % 2 === 0 ? 87 : 350;
      return <g key={item.label}>
        <Draw d={`M ${x + 109} ${y < 300 ? y + 145 : y} L ${x + 109} 283`} progress={clamp(progress * 4 - index * .35)} color={BLUE} />
        <PaperCard x={x} y={y} w={218} h={145} color={index === 4 ? LIME : index === 0 ? '#fff5ec' : '#ffffff'} progress={phase >= 2 ? 1 : clamp(progress * 5 - index * .55)}><Words text={item.label} x={x + 15} y={y + 36} width={15} size={28} /><Words text={short(item.detail, 46)} x={x + 15} y={y + 77} width={18} size={20} lines={3} weight={500} /></PaperCard>
        <circle cx={x + 109} cy={283} r="16" fill={phase >= 2 && progress * 5 > index ? LIME : '#ffffff'} stroke={INK} strokeWidth="4" />
      </g>;
    })}
    <g transform={`translate(${76 + progress * 1127} 283)`}><path d="M -20 -14 L 20 -14 L 20 14 L -20 14 Z" fill="#ffffff" stroke={BLUE} strokeWidth="3" /><path d="M -20 -14 L 0 3 L 20 -14" fill="none" stroke={BLUE} strokeWidth="3" /></g>
    <Annotation text={phase === 4 ? short(film.project.title, 62) : short(film.labels[Math.min(4, Math.floor(progress * 5))].detail, 65)} x={160} y={579} width={65} size={25} progress={clamp(progress * 3)} />
  </>;
}

/** A real frame-based composition. Every drawing follows the film timeline. */
export function SketchLessonComposition({ film, showCaptions }: { film: SketchLessonStoryboard; showCaptions: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const found = film.chapters.findIndex(chapter => frame >= chapter.startFrame && frame < chapter.startFrame + chapter.durationInFrames);
  const phase = found < 0 ? frame <= 0 ? 0 : film.chapters.length - 1 : found;
  const chapter = film.chapters[phase];
  const local = frame - chapter.startFrame;
  const progress = clamp(local / Math.max(1, chapter.durationInFrames - 1));
  const caption = film.captions.find(item => frame / fps * 1000 >= item.startMs && frame / fps * 1000 < item.endMs);
  const Diagram = { prompt: PromptDiagram, code: CodeDiagram, evidence: EvidenceDiagram, design: DesignDiagram, timeline: TimelineDiagram, workflow: WorkflowDiagram }[film.family];
  const focus = film.family === 'prompt' ? { x: phase >= 2 ? 880 : 390, y: 300 } : film.family === 'code' ? { x: phase >= 2 ? 860 : 500, y: 285 } : film.family === 'design' ? { x: phase >= 2 ? 865 : 520, y: 285 } : film.family === 'evidence' ? { x: 660, y: phase === 3 ? 400 : 260 } : film.family === 'timeline' ? { x: 650, y: phase >= 2 ? 450 : 290 } : { x: 640, y: 280 };
  const zoom = 1 + (phase === 2 || phase === 3 ? .022 : .009) * Math.sin(progress * Math.PI);
  return <div data-sketch-composition="true" data-sketch-family={film.family} data-sketch-chapter={chapter.id} data-sketch-progress={progress.toFixed(3)} style={{ position: 'absolute', inset: 0, width: 1280, height: 960, background: PAPER, color: INK, fontFamily: FONT, overflow: 'hidden' }}>
    <svg width="1280" height="960" viewBox="0 0 1280 960" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}><defs><pattern id="sketch-paper-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".75" fill="#adb7c7" opacity=".13" /><path d="M17 8l3 .4M10 23l2-.3" stroke="#aab3c2" strokeWidth=".7" opacity=".07" /></pattern></defs><rect width="1280" height="960" fill="url(#sketch-paper-dots)" /><path d="M 35 24 L 1247 27 L 1241 933 L 38 937 Z" fill="none" stroke="#e0e3e9" strokeWidth="2" /></svg>
    <div style={{ position: 'absolute', top: 42, left: 65, right: 65, display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 24, fontWeight: 700, color: BLUE }}><span>{SKETCH_FAMILY_NAMES[film.family].toUpperCase()}</span><span>CHAPTER {phase + 1} / {film.chapters.length}</span></div>
    <div style={{ position: 'absolute', top: 91, left: 65, right: 65, fontSize: film.title.length > 72 ? 35 : film.title.length > 48 ? 40 : 47, fontWeight: 800, lineHeight: 1.12 }}>{film.title}</div>
    <svg width="1280" height="655" viewBox="0 0 1280 655" aria-label={`${chapter.title}: ${film.principle}`} role="img" style={{ position: 'absolute', top: 183, left: 0, opacity: interpolate(local, [0, .3 * fps], [.45, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}><g transform={`translate(${focus.x} ${focus.y}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}><Diagram film={film} phase={phase} progress={progress} seconds={local / fps} /></g></svg>
    {showCaptions ? <div data-sketch-caption="true" style={{ position: 'absolute', left: 65, right: 65, bottom: 52, minHeight: 79, padding: '15px 23px', borderRadius: 12, background: INK, color: '#ffffff', display: 'flex', alignItems: 'center', fontSize: 27, lineHeight: 1.25, fontWeight: 600 }}>{caption?.text || chapter.title}</div> : <div style={{ position: 'absolute', left: 65, right: 65, bottom: 45, fontSize: 24, color: BLUE, fontWeight: 700 }}>{chapter.title}</div>}
    <div style={{ position: 'absolute', left: 65, bottom: 25, width: 1150, height: 5, background: '#e0e3e9' }}><div style={{ width: `${frame / film.durationInFrames * 100}%`, height: '100%', background: BLUE }} /></div>
  </div>;
}
