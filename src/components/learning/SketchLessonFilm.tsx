'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type CallbackListener, type PlayerRef } from '@remotion/player';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Check, Captions, Film, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { Course, Lesson } from '@/lib/data-provider';
import { buildSketchLessonStoryboard, SKETCH_FAMILY_NAMES, sketchViewingProgress, type SketchLessonStoryboard } from '@/lib/visual-lessons';

const INK = '#20242b';
const PAPER = '#fcfcfd';
const BLUE = '#335cff';
const CORAL = '#ed6b51';
const LIME = '#cee780';
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';
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

function Draw({ d, progress, color = INK, width = 4, dashed = false }: { d: string; progress: number; color?: string; width?: number; dashed?: boolean }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dashed ? '0.025 0.025' : 1} strokeDashoffset={dashed ? 0 : 1 - clamp(progress)} opacity={dashed ? clamp(progress) : 1} />;
}

function PaperCard({ x, y, w, h, color = '#ffffff', progress = 1, children }: { x: number; y: number; w: number; h: number; color?: string; progress?: number; children?: React.ReactNode }) {
  return <g opacity={clamp(progress * 2)}>
    <path d={`M ${x + 5} ${y + 7} L ${x + w + 5} ${y + 5} L ${x + w + 7} ${y + h + 7} L ${x + 3} ${y + h + 5} Z`} fill={INK} opacity="0.09" />
    <path d={`M ${x + 2} ${y + 1} L ${x + w} ${y - 1} L ${x + w + 2} ${y + h} L ${x - 1} ${y + h + 2} Z`} fill={color} />
    <Draw d={`M ${x + 2} ${y + 1} L ${x + w} ${y - 1} L ${x + w + 2} ${y + h} L ${x - 1} ${y + h + 2} Z`} progress={progress} width={3} />
    {children}
  </g>;
}

function Pencil({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y}) rotate(-28)`}><path d="M 0 0 L 8 -20 L 21 -20 L 25 0 L 12 25 Z" fill={CORAL} stroke={INK} strokeWidth="3" /><path d="M 0 0 L 12 25 L 25 0" fill="#f1d6aa" stroke={INK} strokeWidth="3" /><path d="M 8 17 L 12 25 L 17 17" fill={INK} /><path d="M 8 -20 L 8 0 M 18 -20 L 18 0" stroke={INK} strokeWidth="2" /></g>;
}

type DiagramProps = { film: SketchLessonStoryboard; phase: number; progress: number; seconds: number };

function PromptDiagram({ film, phase, progress }: DiagramProps) {
  const visible = phase === 0 ? 1 + Math.floor(progress * 4) : phase === 1 ? 1 + Math.floor(progress * 5) : 5;
  const assemble = phase >= 2 ? clamp(progress * 1.65) : 0;
  const colors = [LIME, '#dce5ff', '#ffe0d4', '#f1e2ff', '#ddf2e4'];
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
      return <g key={item.label} opacity={shown ? 1 : 0}>
        <Draw d={`M 370 ${y + 38} C 413 ${y + 38}, 424 ${y + 38}, 477 ${y + 38}`} color={BLUE} progress={shown ? clamp(progress * 4 - index * 0.2) : 0} />
        <PaperCard x={x} y={y} w={cardWidth} h={66} color={colors[index]}>
          <Words text={item.label.toUpperCase()} x={x + 17} y={y + 31} size={item.label.length > 10 ? 18 : 23} width={19} />
          <Words text={index === 0 ? short(film.project.title, 29) : short(item.detail, inline ? Math.floor((cardWidth - 185) / 13) : 30)} x={x + (inline ? 162 : 17)} y={y + (inline ? 31 : 57)} size={inline ? 25 : 20} width={inline ? Math.floor((cardWidth - 180) / 13) : 31} lines={1} weight={500} />
        </PaperCard>
      </g>;
    })}
    {phase === 3 && <><Draw d="M 1160 168 L 1176 182 L 1209 143" color={BLUE} progress={clamp(progress * 3)} width={7} /><Words text="Check the output against the goal" x={490} y={551} width={43} size={28} color={BLUE} /></>}
    <Pencil x={phase >= 2 ? 1148 : 380} y={90 + Math.min(4, Math.floor(progress * 5)) * 86} />
  </>;
}

function CodeDiagram({ film, phase, progress }: DiagramProps) {
  if (!film.code) {
    const positions = [{ x: 90, y: 190 }, { x: 410, y: 80 }, { x: 410, y: 335 }, { x: 805, y: 210 }];
    const labels = ['User story', 'Implementation', 'Tests', 'Reviewed change'];
    return <>
      <Draw d="M 320 239 Q 353 140 410 131 M 320 239 Q 349 383 410 385 M 694 131 Q 753 130 805 254 M 694 385 Q 741 382 805 254" progress={clamp(progress * 2)} color={BLUE} />
      {positions.map((position, index) => <PaperCard key={index} x={position.x} y={position.y} w={index === 3 ? 370 : 284} h={110} progress={phase >= 2 ? 1 : clamp(progress * 3 - index * .35)} color={index === 3 ? LIME : '#ffffff'}><Words text={labels[index]} x={position.x + 18} y={position.y + 35} width={23} size={27} /><Words text={short(film.labels[index].detail, 42)} x={position.x + 18} y={position.y + 69} width={25} size={20} weight={500} lines={2} /></PaperCard>)}
      <Words text="A change is ready when the behavior matches the brief." x={150} y={545} width={60} size={28} color={BLUE} />
      <circle cx={110 + progress * 1040} cy={297} r="12" fill={CORAL} stroke={INK} strokeWidth="3" />
    </>;
  }
  const code = film.code;
  const index = Math.min(code.trace.length - 1, Math.floor(progress * code.trace.length));
  const trace = code.trace[phase === 0 ? 0 : index];
  const lineHeight = code.lines.length > 6 ? 43 : 55;
  return <>
    <PaperCard x={55} y={45} w={725} h={480} color="#f9fbff"><Words text="WATCH THE EXECUTION" x={80} y={90} size={23} color={BLUE} width={29} />
      {code.lines.map((line, lineIndex) => <g key={lineIndex} opacity={phase === 0 && lineIndex > Math.floor(progress * code.lines.length) ? .16 : 1}>
        {lineIndex === trace.line && <path d={`M 81 ${119 + lineIndex * lineHeight} L 754 ${117 + lineIndex * lineHeight} L 756 ${151 + lineIndex * lineHeight} L 80 ${154 + lineIndex * lineHeight} Z`} fill={LIME} />}
        <text x={81} y={144 + lineIndex * lineHeight} fontFamily="ui-monospace, monospace" fontSize="22" fill="#6d7483">{lineIndex + 1}</text>
        <text x={125} y={144 + lineIndex * lineHeight} fontFamily="ui-monospace, monospace" fontSize={line.length > 34 ? 23 : 27} fill={INK} xmlSpace="preserve">{line}</text>
      </g>)}
    </PaperCard>
    <PaperCard x={840} y={65} w={355} h={165} color="#dce5ff"><Words text="MEMORY" x={868} y={103} size={22} color={BLUE} width={18} /><Words text={trace.state} x={868} y={148} width={22} size={27} lines={2} /></PaperCard>
    <Draw d={`M 780 ${140 + trace.line * lineHeight} Q 812 ${140 + trace.line * lineHeight}, 790 150, 834 150`} progress={1} color={BLUE} />
    <PaperCard x={840} y={275} w={355} h={250} color={phase >= 2 ? '#eff5df' : '#ffffff'}><Words text="VISIBLE OUTPUT" x={868} y={314} size={22} color={BLUE} width={20} />
      {(phase === 0 ? [] : trace.output.split('\n')).map((line, lineIndex) => <text key={lineIndex} x={868} y={359 + lineIndex * 37} fontFamily="ui-monospace, monospace" fill={INK} fontSize="27">{line}</text>)}
      {!trace.output && <Words text="No output yet…" x={868} y={363} width={21} size={25} color="#737780" weight={500} />}
    </PaperCard>
    <Pencil x={766} y={132 + trace.line * lineHeight} />
    {phase === 3 && <Words text="Predict before the highlighted line runs." x={90} y={566} size={29} width={57} color={BLUE} />}
  </>;
}

function EvidenceDiagram({ film, phase, progress }: DiagramProps) {
  const reveal = phase === 0 ? progress * 4 : phase === 1 ? progress * 6 : 6;
  const nodes = [
    { x: 65, y: 212, w: 270, h: 125, label: film.labels[0].label, fill: '#ffe0d4' },
    { x: 415, y: 52, w: 290, h: 152, label: film.labels[1].label, fill: '#ffffff' },
    { x: 415, y: 355, w: 290, h: 152, label: film.labels[3].label, fill: '#ffffff' },
    { x: 806, y: 150, w: 330, h: 125, label: film.labels[2].label, fill: '#dce5ff' },
    { x: 840, y: 395, w: 330, h: 125, label: film.labels[4].label, fill: LIME },
  ];
  const paths = ['M 335 257 Q 372 112 408 122', 'M 335 290 Q 363 428 408 431', 'M 705 124 Q 741 122 802 199', 'M 705 432 Q 757 431 802 235', 'M 971 275 Q 969 327 1004 389'];
  return <>
    {paths.map((path, index) => <Draw key={path} d={path} progress={clamp(reveal - index * .6)} color={index === 4 ? BLUE : INK} />)}
    {nodes.map((node, index) => <PaperCard key={node.label} {...node} color={node.fill} progress={clamp(reveal - index * .65)}>
      <Words text={node.label} x={node.x + 18} y={node.y + 35} width={21} size={27} />
      {index === 1 || index === 2 ? <><Draw d={`M ${node.x + 18} ${node.y + 77} L ${node.x + 220} ${node.y + 75} M ${node.x + 18} ${node.y + 98} L ${node.x + 252} ${node.y + 100} M ${node.x + 18} ${node.y + 122} L ${node.x + 183} ${node.y + 120}`} progress={clamp(reveal - index * .6)} color="#7c8797" width={3} /><circle cx={node.x + 250} cy={node.y + 38} r="14" stroke={INK} strokeWidth="3" fill={index === 2 ? LIME : '#dce5ff'} /></> : <Words text={short(index === 0 ? film.project.title : film.labels[index === 3 ? 2 : 4].detail, 39)} x={node.x + 18} y={node.y + 76} width={index === 0 ? 21 : 25} size={21} weight={500} lines={2} />}
    </PaperCard>)}
    <g transform={`translate(${340 + Math.sin(progress * Math.PI) * 425} ${120 + progress * 226})`}><circle r="37" fill="white" fillOpacity=".45" stroke={BLUE} strokeWidth="6" /><path d="M 25 25 L 57 57" stroke={BLUE} strokeWidth="9" strokeLinecap="round" /></g>
    {phase === 3 && <><Draw d="M 1169 133 L 1233 195 M 1233 133 L 1169 195" color={CORAL} width={6} progress={clamp(progress * 3)} /><Words text="A citation needs checking." x={60} y={562} size={28} width={51} color={BLUE} /></>}
  </>;
}

function DesignDiagram({ film, phase, progress }: DiagramProps) {
  const tidy = phase >= 2 ? clamp(progress * 1.7) : phase === 1 ? progress * .65 : 0;
  const responsive = film.variant === 'layout';
  const rightWidth = responsive ? 580 - Math.sin(progress * Math.PI) * 105 : 580;
  return <>
    <Words text="ROUGH IDEA" x={86} y={40} size={23} color={CORAL} width={19} />
    <Words text="A SYSTEM THAT SURVIVES CHANGE" x={585} y={40} size={23} color={BLUE} width={43} />
    <PaperCard x={80} y={72} w={335} h={455} color="#ffffff">
      <path d="M 106 115 L 382 130 L 368 203 L 111 188 Z" fill="#f8c2ac" stroke={INK} strokeWidth="3" />
      <Words text={short(film.project.title, 32)} x={124} y={148} width={17} size={28} />
      {[0, 1, 2].map(index => <path key={index} d={`M ${102 + index * 12} ${241 + index * 74} L ${370 - index * 15} ${221 + index * 74} L ${374 - index * 15} ${273 + index * 74} L ${106 + index * 12} ${295 + index * 74} Z`} fill={index === 1 ? '#dedbff' : '#e5e8e7'} stroke={INK} strokeWidth="3" />)}
    </PaperCard>
    <Draw d="M 445 281 Q 476 264 533 276 M 514 257 L 534 276 L 515 295" progress={clamp(progress * 3)} color={BLUE} width={5} />
    <PaperCard x={580} y={72} w={rightWidth} h={455} color="#ffffff">
      <rect x={602} y={94} width={rightWidth - 44} height="96" rx="8" fill={LIME} />
      <Words text={short(film.project.title, 42)} x={626} y={132} width={Math.floor((rightWidth - 80) / 23)} size={33 + tidy * 7} lines={2} />
      {[0, 1, 2].map(index => {
        const y = 225 + index * 87;
        const gap = 7 + tidy * 17;
        return <g key={index}>
          <rect x={608 + gap} y={y} width={rightWidth - 58 - gap * 2} height="64" rx={8 + tidy * 5} fill={index === 0 ? '#dce5ff' : '#f2ede3'} stroke={INK} strokeWidth="3" />
          <circle cx={637 + gap} cy={y + 31} r="13" fill={index === 0 ? BLUE : CORAL} />
          <Draw d={`M ${664 + gap} ${y + 23} L ${580 + rightWidth - 51 - gap} ${y + 23} M ${664 + gap} ${y + 41} L ${580 + rightWidth - 112 - gap} ${y + 41}`} progress={clamp(progress * 4 - index * .25)} width={3} />
        </g>;
      })}
      <Draw d={`M 601 209 L ${580 + rightWidth - 20} 209`} progress={clamp(progress * 4)} color={BLUE} width={2} dashed />
      <Draw d={`M 600 209 L 600 499 M ${580 + rightWidth - 20} 209 L ${580 + rightWidth - 20} 499`} progress={clamp(progress * 4)} color={BLUE} width={2} dashed />
    </PaperCard>
    {film.variant === 'tokens' && [BLUE, CORAL, LIME, INK].map((color, index) => <g key={color}><circle cx={630 + index * 120} cy={570} r="25" fill={color} stroke={INK} strokeWidth="3" /><Words text={['Primary', 'Accent', 'Highlight', 'Ink'][index]} x={597 + index * 120} y={620} width={10} size={20} /></g>)}
    {film.variant === 'components' && <Words text="One component → consistent instances" x={590} y={570} size={27} width={43} color={BLUE} />}
    {responsive && <><Draw d={`M 600 554 L ${580 + rightWidth - 10} 554 M 600 544 L 600 565 M ${580 + rightWidth - 10} 544 L ${580 + rightWidth - 10} 565`} progress={1} color={BLUE} width={3} /><Words text="Resize the frame. Keep the spacing rules." x={588} y={596} width={44} size={25} color={BLUE} /></>}
    {!responsive && film.variant !== 'tokens' && film.variant !== 'components' && <Words text="Hierarchy, spacing, and a clear next action." x={580} y={567} size={27} width={45} color={BLUE} />}
    <Pencil x={580 + rightWidth - 2} y={phase >= 2 ? 225 + progress * 250 : 140} />
  </>;
}

function TimelineDiagram({ film, phase, progress, seconds }: DiagramProps) {
  const x = 98 + progress * 1085;
  const sound = film.variant === 'sound';
  const captions = film.variant === 'captions';
  const exporting = film.variant === 'export';
  const previewX = 460 + Math.sin(seconds * .6) * (phase >= 2 ? 85 : 25);
  return <>
    <PaperCard x={61} y={40} w={660} h={240} color="#e6edf8">
      <path d="M 78 235 L 227 108 L 346 222 L 422 159 L 685 254 Z" fill="#abc8ad" stroke={INK} strokeWidth="3" />
      <circle cx="624" cy="96" r="27" fill={LIME} stroke={INK} strokeWidth="3" />
      <g transform={`translate(${previewX} 156)`}><circle r="31" fill={CORAL} stroke={INK} strokeWidth="4" /><path d="M -40 42 Q 0 73 40 42" fill="none" stroke={INK} strokeWidth="4" /></g>
      {captions && <><rect x="132" y="198" width="481" height="53" rx="8" fill={INK} /><Words text={short(film.project.title, 38)} x={150} y={233} size={25} color="white" width={40} lines={1} /><Draw d="M 108 67 L 673 67 L 673 258 L 108 258 Z" color={CORAL} progress={clamp(progress * 3)} dashed /></>}
      {!captions && <Draw d={`M ${previewX - 75} 67 L ${previewX + 75} 67 L ${previewX + 75} 254 L ${previewX - 75} 254 Z`} progress={clamp(progress * 3)} color={BLUE} dashed />}
    </PaperCard>
    <PaperCard x={772} y={40} w={425} h={240} color="#ffffff"><Words text={exporting ? 'DELIVERY CHECK' : sound ? 'VOICE ABOVE MUSIC' : 'EVERY SHOT HAS A JOB'} x={795} y={82} size={23} color={BLUE} width={29} />
      {sound ? <>
        <Words text="Voice" x={798} y={131} size={25} width={18} /><rect x="900" y="109" width="260" height="25" rx="10" fill="#e9e6dd" /><rect x="900" y="109" width={190 + progress * 15} height="25" rx="10" fill={BLUE} />
        <Words text="Music" x={798} y={183} size={25} width={18} /><rect x="900" y="161" width="260" height="25" rx="10" fill="#e9e6dd" /><rect x="900" y="161" width={150 - progress * 90} height="25" rx="10" fill={CORAL} /><Words text="Duck the bed under speech" x={798} y={240} width={31} size={23} color={BLUE} />
      </> : <Words text={short(exporting ? 'Aspect ratio • captions • clean start & end' : film.project.title, 64)} x={798} y={133} width={25} size={31} lines={3} />}
    </PaperCard>
    <Words text="PICTURE" x={60} y={327} size={22} color={BLUE} width={15} />
    {[0, 1, 2, 3].map(index => {
      const widths = [184, 240, 390, 254];
      const offset = widths.slice(0, index).reduce((sum, value) => sum + value + 12, 0);
      return <g key={index} opacity={phase === 0 ? clamp(progress * 5 - index * .6) : 1}><PaperCard x={95 + offset} y={348} w={widths[index]} h={100} color={['#ffe0d4', '#dce5ff', LIME, '#e7dcf8'][index]}><Words text={['Hook', 'Story', 'Show proof', 'Next step'][index]} x={110 + offset} y={393} size={28} width={19} /><Words text={['0–3s', '3–8s', '8–15s', '15–20s'][index]} x={110 + offset} y={425} size={20} width={20} weight={500} /></PaperCard></g>;
    })}
    <Words text="SOUND" x={60} y={489} size={22} color={BLUE} width={15} />
    <rect x="95" y="506" width="1116" height="70" fill="#ffffff" stroke={INK} strokeWidth="3" rx="5" />
    <path d={Array.from({ length: 90 }, (_, index) => { const amplitude = (12 + Math.sin(index * 3.4) * 10) * (sound && index > 25 && index < 70 ? .5 : 1); return `M ${109 + index * 12} ${540 - amplitude} L ${109 + index * 12} ${540 + amplitude}`; }).join(' ')} stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
    <Draw d={`M ${x} 315 L ${x} 590`} color={CORAL} width={5} progress={1} /><path d={`M ${x - 12} 306 L ${x + 12} 306 L ${x} 321 Z`} fill={CORAL} />
    <Words text={sound ? 'Listen for a clear voice; let the music support it.' : captions ? 'Keep captions inside the safe area and easy to read.' : exporting ? 'Watch the first and final frames before delivering.' : 'Illustrative 20-second edit: intention before decoration.'} x={96} y={620} size={26} width={70} color={BLUE} />
  </>;
}

function WorkflowDiagram({ film, phase, progress }: DiagramProps) {
  if (film.variant === 'spreadsheet') return <>
    <PaperCard x={78} y={50} w={630} h={465} color="#ffffff"><Words text="ILLUSTRATIVE DATA" x={109} y={95} size={23} color={BLUE} width={30} />
      {[0, 1, 2, 3].map(row => <g key={row}><rect x="110" y={119 + row * 80} width="552" height="80" fill={row === 0 ? '#dce5ff' : 'transparent'} stroke={INK} strokeWidth="2" /><path d={`M 380 ${119 + row * 80} L 380 ${199 + row * 80}`} stroke={INK} strokeWidth="2" /><Words text={['Task', 'Plan', 'Build', 'Review'][row]} x={132} y={169 + row * 80} width={17} size={29} /><Words text={['Minutes', '12', '18', '15'][row]} x={406} y={169 + row * 80} width={16} size={29} /></g>)}
      <rect x="384" y={202 + Math.min(2, Math.floor(progress * 3)) * 80} width="271" height="70" fill={LIME} fillOpacity=".45" stroke={BLUE} strokeWidth="4" />
    </PaperCard>
    <PaperCard x={793} y={69} w={399} h={190} color="#dce5ff"><Words text="= SUM(B2:B4)" x={822} y={122} size={34} width={23} /><Words text={progress > .4 || phase >= 2 ? '12 + 18 + 15 = 45' : 'Follow the selected cells'} x={822} y={184} size={29} width={26} /></PaperCard>
    {[12, 18, 15].map((value, index) => <g key={index}><rect x={826 + index * 116} y={494 - value * 10 * clamp(progress * 2)} width="68" height={value * 10 * clamp(progress * 2)} fill={[CORAL, BLUE, LIME][index]} stroke={INK} strokeWidth="3" /><Words text={['Plan', 'Build', 'Review'][index]} x={819 + index * 116} y={531} width={10} size={24} /></g>)}
    <Words text="Inputs → formula → a visible, checkable result" x={101} y={588} size={29} width={57} color={BLUE} />
  </>;
  if (film.variant === 'document' || film.variant === 'presentation') {
    const slide = film.variant === 'presentation';
    return <>
      {[0, 1, 2].map(index => <PaperCard key={index} x={85 + index * 395} y={slide ? 150 : 70} w={315} h={slide ? 290 : 455} progress={phase >= 2 ? 1 : clamp(progress * 4 - index * .65)} color={index === 2 ? '#eff5df' : '#ffffff'}>
        <Words text={['Outline', 'Draft', 'Edit & check'][index]} x={111 + index * 395} y={slide ? 200 : 118} width={18} size={29} color={BLUE} />
        <rect x={112 + index * 395} y={slide ? 224 : 158} width="258" height={index === 2 ? 76 : 44} rx="5" fill={index === 2 ? LIME : '#dce5ff'} />
        {Array.from({ length: slide ? 3 : 7 }, (_, line) => <Draw key={line} d={`M ${111 + index * 395} ${(slide ? 323 : 261) + line * 30} L ${(line % 3 === 1 ? 290 : 363) + index * 395} ${(slide ? 323 : 261) + line * 30}`} progress={clamp(progress * 5 - index * .2 - line * .06)} width={3} color={index === 1 && line === 2 ? CORAL : INK} />)}
        {index === 2 && <Draw d={`M ${318 + index * 395} ${slide ? 263 : 196} L ${332 + index * 395} ${slide ? 279 : 212} L ${355 + index * 395} ${slide ? 247 : 180}`} color={BLUE} width={5} progress={clamp(progress * 3)} />}
      </PaperCard>)}
      <Words text={slide ? 'One idea at a time. Give the audience a clear path.' : 'Structure first. Refine the message. Check before sharing.'} x={107} y={591} size={30} width={64} color={BLUE} />
      <Pencil x={125 + progress * 1040} y={slide ? 435 : 513} />
    </>;
  }
  return <>
    <Draw d="M 83 283 Q 295 281 492 284 T 1185 283" progress={clamp(progress * 2)} color={BLUE} width={5} />
    {film.labels.map((item, index) => {
      const x = 63 + index * 244;
      const y = index % 2 === 0 ? 87 : 350;
      return <g key={item.label}>
        <Draw d={`M ${x + 109} ${y < 300 ? y + 145 : y} L ${x + 109} 283`} progress={clamp(progress * 4 - index * .35)} color={BLUE} />
        <PaperCard x={x} y={y} w={218} h={145} color={index === 4 ? LIME : index === 0 ? '#ffe0d4' : '#ffffff'} progress={phase >= 2 ? 1 : clamp(progress * 5 - index * .55)}><Words text={item.label} x={x + 15} y={y + 36} width={15} size={28} /><Words text={short(item.detail, 46)} x={x + 15} y={y + 77} width={20} size={21} lines={3} weight={500} /></PaperCard>
        <circle cx={x + 109} cy={283} r="16" fill={phase >= 2 && progress * 5 > index ? LIME : '#ffffff'} stroke={INK} strokeWidth="4" />
      </g>;
    })}
    <g transform={`translate(${76 + progress * 1127} 283)`}><path d="M -20 -14 L 20 -14 L 20 14 L -20 14 Z" fill={CORAL} stroke={INK} strokeWidth="3" /><path d="M -20 -14 L 0 3 L 20 -14" fill="none" stroke={INK} strokeWidth="3" /></g>
    <Words text="Follow one piece of work through every handoff." x={160} y={579} width={60} size={30} color={BLUE} />
  </>;
}

/** A real frame-based composition. Every drawing follows the film timeline. */
export function SketchLessonComposition({ film, showCaptions = true }: { film: SketchLessonStoryboard; showCaptions?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = Math.max(0, film.chapters.findIndex(chapter => frame >= chapter.startFrame && frame < chapter.startFrame + chapter.durationInFrames));
  const chapter = film.chapters[phase];
  const local = frame - chapter.startFrame;
  const progress = local / Math.max(1, chapter.durationInFrames - 1);
  const caption = film.captions.find(item => frame / fps * 1000 >= item.startMs && frame / fps * 1000 < item.endMs);
  const Diagram = { prompt: PromptDiagram, code: CodeDiagram, evidence: EvidenceDiagram, design: DesignDiagram, timeline: TimelineDiagram, workflow: WorkflowDiagram }[film.family];
  return <div data-sketch-composition="true" style={{ position: 'absolute', inset: 0, width: 1280, height: 960, background: PAPER, color: INK, fontFamily: FONT, overflow: 'hidden' }}>
    <svg width="1280" height="960" viewBox="0 0 1280 960" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}><defs><pattern id="sketch-paper-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#adb7c7" opacity=".17" /></pattern></defs><rect width="1280" height="960" fill="url(#sketch-paper-dots)" /><path d="M 35 24 L 1247 27 L 1241 933 L 38 937 Z" fill="none" stroke="#e0e3e9" strokeWidth="2" /></svg>
    <div style={{ position: 'absolute', top: 42, left: 65, right: 65, display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 24, fontWeight: 700, color: BLUE }}><span>{SKETCH_FAMILY_NAMES[film.family].toUpperCase()}</span><span>CHAPTER {phase + 1} / {film.chapters.length}</span></div>
    <div style={{ position: 'absolute', top: 91, left: 65, right: 65, fontSize: film.title.length > 48 ? 40 : 47, fontWeight: 800, lineHeight: 1.12 }}>{film.title}</div>
    <svg width="1280" height="655" viewBox="0 0 1280 655" aria-label={`${chapter.title}: ${film.principle}`} role="img" style={{ position: 'absolute', top: 183, left: 0, opacity: interpolate(local, [0, .3 * fps], [.45, 1], { extrapolateRight: 'clamp' }) }}><Diagram film={film} phase={phase} progress={progress} seconds={local / fps} /></svg>
    {showCaptions ? <div style={{ position: 'absolute', left: 65, right: 65, bottom: 52, minHeight: 79, padding: '15px 23px', borderRadius: 12, background: INK, color: '#ffffff', display: 'flex', alignItems: 'center', fontSize: 27, lineHeight: 1.25, fontWeight: 600 }}>{caption?.text || chapter.title}</div> : <div style={{ position: 'absolute', left: 65, right: 65, bottom: 45, fontSize: 24, color: BLUE, fontWeight: 700 }}>{chapter.title}</div>}
    <div style={{ position: 'absolute', left: 65, bottom: 25, width: 1150, height: 5, background: '#e0e3e9' }}><div style={{ width: `${frame / film.durationInFrames * 100}%`, height: '100%', background: BLUE }} /></div>
  </div>;
}

type Props = { course: Course; lesson: Lesson; active?: boolean; onComplete?: () => void };

function SketchLessonFilmSession({ course, lesson, active = true, onComplete }: Props) {
  const film = useMemo(() => buildSketchLessonStoryboard(course, lesson), [course, lesson]);
  const playerRef = useRef<PlayerRef>(null);
  const callbackRef = useRef(onComplete);
  callbackRef.current = onComplete;
  const viewedRef = useRef(new Uint8Array(film.durationInFrames));
  const completedRef = useRef(false);
  const playingRef = useRef(false);
  const lastRef = useRef<{ frame: number; time: number } | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [readAloud, setReadAloud] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [coverage, setCoverage] = useState(() => sketchViewingProgress(film, viewedRef.current));
  const currentChapter = film.chapters.findIndex(chapter => frame >= chapter.startFrame && frame < chapter.startFrame + chapter.durationInFrames);
  const currentCaption = film.captions.find(caption => frame / film.fps * 1000 >= caption.startMs && frame / film.fps * 1000 < caption.endMs);

  useEffect(() => { setSpeechAvailable('speechSynthesis' in window); }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const resetSample = () => { lastRef.current = null; };
    const onPlay: CallbackListener<'play'> = () => { playingRef.current = true; setPlaying(true); resetSample(); };
    const onPause: CallbackListener<'pause'> = () => { playingRef.current = false; setPlaying(false); resetSample(); };
    const onSeek: CallbackListener<'seeked'> = () => { resetSample(); };
    const onFullscreen: CallbackListener<'fullscreenchange'> = event => { setFullscreen(event.detail.isFullscreen); };
    let lastUiTime = 0;
    const onFrame: CallbackListener<'frameupdate'> = event => {
      const next = event.detail.frame;
      const now = performance.now();
      const previous = lastRef.current;
      if (playingRef.current && active && !document.hidden && previous) {
        const delta = next - previous.frame;
        const elapsed = now - previous.time;
        // A seek, suspended tab, or stalled render cannot earn viewing credit.
        const allowed = Math.ceil(elapsed / 1000 * film.fps * speed) + 3;
        if (elapsed >= 0 && elapsed < 600 && delta > 0 && delta <= allowed && delta < film.fps * speed * .7) {
          for (let watched = previous.frame; watched <= next && watched < viewedRef.current.length; watched++) viewedRef.current[watched] = 1;
        }
      }
      lastRef.current = { frame: next, time: now };
      if (now - lastUiTime > 180 || next === film.durationInFrames - 1) {
        lastUiTime = now;
        setFrame(next);
        const status = sketchViewingProgress(film, viewedRef.current);
        setCoverage(status);
        if (status.complete && !completedRef.current) { completedRef.current = true; callbackRef.current?.(); }
      }
    };
    const visibility = () => { resetSample(); if (document.hidden) player.pause(); };
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('seeked', onSeek);
    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('seeked', onSeek);
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [film, active, speed]);

  useEffect(() => { if (!active) playerRef.current?.pause(); }, [active]);

  useEffect(() => {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    if (!readAloud || !playing || !active) return;
    const chapter = film.chapters[Math.max(0, currentChapter)];
    const time = frame / film.fps * 1000;
    const remaining = film.captions.filter(caption => caption.endMs > time && caption.startMs < (chapter.startFrame + chapter.durationInFrames) / film.fps * 1000).map(caption => caption.text).join(' ');
    const utterance = new SpeechSynthesisUtterance(remaining);
    utterance.rate = speed;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
    // Narration restarts at chapter boundaries or an explicit playback change.
    // Frame updates must not restart an utterance every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readAloud, playing, active, currentChapter, speechAvailable, speed, film]);

  function seek(next: number) {
    lastRef.current = null;
    playerRef.current?.seekTo(next);
    setFrame(next);
    if (readAloud && speechAvailable) {
      window.speechSynthesis.cancel();
      // A same-chapter scrub also resynchronizes the optional reading voice.
      if (playing) {
        const chapter = film.chapters.find(item => next >= item.startFrame && next < item.startFrame + item.durationInFrames)!;
        const remaining = film.captions.filter(item => item.endMs > next / film.fps * 1000 && item.startMs < (chapter.startFrame + chapter.durationInFrames) / film.fps * 1000).map(item => item.text).join(' ');
        const utterance = new SpeechSynthesisUtterance(remaining);
        utterance.rate = speed;
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  const timeLabel = (frames: number) => `${Math.floor(frames / film.fps / 60)}:${String(Math.floor(frames / film.fps) % 60).padStart(2, '0')}`;
  return <section aria-label={`Sketch film: ${lesson.title}`} className="overflow-hidden rounded-[1.25rem] border border-[#e0e3e9] bg-[#fcfcfd] text-[#20242b] shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e3e9] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#335cff] text-white"><Film className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#335cff]">Watch & learn</p><h3 className="text-lg font-bold">The sketch studio</h3></div></div><span className="rounded-full border border-[#e0e3e9] bg-white/70 px-3 py-1 text-xs font-semibold">{SKETCH_FAMILY_NAMES[film.family]} · {timeLabel(film.durationInFrames)}</span></div>
    <div className="relative bg-[#fcfcfd]"><Player ref={playerRef} component={SketchLessonComposition} inputProps={{ film, showCaptions: captions && fullscreen }} durationInFrames={film.durationInFrames} compositionWidth={1280} compositionHeight={960} fps={film.fps} playbackRate={speed} controls={fullscreen} showVolumeControls={false} moveToBeginningWhenEnded={false} showPlaybackRateControl={false} clickToPlay={fullscreen} style={{ width: '100%' }} errorFallback={() => <div className="flex h-full items-center justify-center p-8 text-center">The film could not start. Use the chapter transcript below, then reload to try playback again.</div>} /></div>
    <div className="space-y-4 border-t border-[#e0e3e9] px-5 py-4 sm:px-6">
      {captions && <p aria-live="off" className="min-h-12 rounded-xl bg-[#20242b] px-4 py-3 text-sm font-medium leading-relaxed text-[#ffffff] sm:text-base">{currentCaption?.text || film.chapters[Math.max(0, currentChapter)].title}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { if (frame >= film.durationInFrames - 1) seek(0); playerRef.current?.toggle(); }} disabled={!active} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#20242b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? 'Pause' : frame > 0 ? 'Resume film' : 'Play the sketch'}</button>
        <button type="button" aria-label="Replay this sketch film from the beginning" onClick={() => seek(0)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0e3e9] bg-white/70"><RotateCcw className="h-4 w-4" /></button>
        <button type="button" aria-pressed={captions} onClick={() => setCaptions(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm"><Captions className="h-4 w-4" />Captions {captions ? 'on' : 'off'}</button>
        {speechAvailable && <button type="button" aria-pressed={readAloud} onClick={() => setReadAloud(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm">{readAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}Read aloud {readAloud ? 'on' : 'off'}</button>}
        <button type="button" aria-label={fullscreen ? 'Exit fullscreen film' : 'View film fullscreen'} onClick={() => { if (fullscreen) playerRef.current?.exitFullscreen(); else playerRef.current?.requestFullscreen(); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e0e3e9] bg-white/70 px-3 text-sm">{fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}Fullscreen</button>
        <label className="ml-auto flex min-h-10 items-center gap-2 text-sm font-medium">Speed<select aria-label="Film playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))} className="rounded-lg border border-[#e0e3e9] bg-white px-2 py-1.5">{[.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
      </div>
      <label className="flex items-center gap-3"><span className="min-w-20 text-xs font-semibold tabular-nums">{timeLabel(frame)} / {timeLabel(film.durationInFrames)}</span><input type="range" min={0} max={film.durationInFrames - 1} value={frame} aria-label="Seek through the sketch film" aria-valuetext={`${timeLabel(frame)} of ${timeLabel(film.durationInFrames)}`} onChange={event => seek(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-[#335cff]" /></label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Film chapters">{film.chapters.map((chapter, index) => <button key={chapter.id} type="button" onClick={() => seek(chapter.startFrame)} aria-current={currentChapter === index ? 'step' : undefined} className={`min-h-16 rounded-xl border px-3 py-2 text-left transition-colors ${currentChapter === index ? 'border-[#335cff] bg-[#e1e9ff]' : 'border-[#e0e3e9] bg-white/60 hover:bg-white'}`}><span className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#596273]">{timeLabel(chapter.startFrame)}{coverage.chapterCoverage[index] >= .7 && <Check className="h-3 w-3 text-[#335cff]" />}</span><span className="block text-xs font-semibold leading-snug">{chapter.title}</span></button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><p className="text-[#596273]">Pause to predict. Replay a drawing. Then build your own version.</p><p role="status" className={`font-semibold ${coverage.complete ? 'text-[#335cff]' : 'text-[#596273]'}`}>{coverage.complete ? 'Film explored ✓' : `${Math.round(coverage.ratio * 100)}% watched`}</p></div>
      <details className="rounded-xl border border-[#e0e3e9] bg-white/60 p-4"><summary className="cursor-pointer text-sm font-semibold">Chapter transcript & project brief</summary><div className="mt-4 space-y-4">{film.chapters.map(chapter => <div key={chapter.id}><button type="button" onClick={() => seek(chapter.startFrame)} className="text-left text-sm font-bold text-[#335cff]">{timeLabel(chapter.startFrame)} · {chapter.title}</button><p className="mt-1 text-sm leading-relaxed text-[#454c58]">{chapter.narration}</p></div>)}<p className="border-t border-[#e0e3e9] pt-3 text-xs leading-relaxed text-[#596273]">The drawings explain this lesson’s teaching and project. Small data and code examples are illustrative. Reading aloud uses a voice available on your device.</p></div></details>
    </div>
  </section>;
}

export function SketchLessonFilm(props: Props) {
  return <SketchLessonFilmSession key={`${props.course.id}:${props.lesson.id}`} {...props} />;
}

export default SketchLessonFilm;
