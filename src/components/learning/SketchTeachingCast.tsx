'use client';

import { useId, type CSSProperties } from 'react';

export type TeachingCharacterName = 'maya' | 'leo' | 'pip';

const INK = '#20242b';
const BLUE = '#335cff';
const CORAL = '#ee916e';
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';
const CHARACTERS: Record<TeachingCharacterName, { name: string; role: string; color: string }> = {
  maya: { name: 'Maya', role: 'Guide', color: BLUE },
  leo: { name: 'Leo', role: 'Learner', color: '#ba623f' },
  pip: { name: 'Pip', role: 'Demo robot', color: BLUE },
};
const CAST: TeachingCharacterName[] = ['maya', 'leo', 'pip'];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Characters are illustrations, not media: every pose is a pure function of the video frame. */
export function TeachingCharacter({
  name,
  frame = 0,
  fps = 30,
  talking = false,
  style,
}: {
  name: TeachingCharacterName;
  frame?: number;
  fps?: number;
  talking?: boolean;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, '');
  const seconds = Math.max(0, frame) / Math.max(1, fps);
  const offset = name === 'maya' ? 0 : name === 'leo' ? 1.4 : 2.3;
  const beat = Math.sin((seconds + offset) * Math.PI * 5.5);
  const mouth = talking ? 1.5 + Math.max(0, beat) * 3 : 0;
  const blinkClock = (seconds + offset) % 4.6;
  const blink = talking ? 1 - Math.max(0, 1 - Math.abs(blinkClock - 4.28) / .075) * .92 : 1;
  const bob = talking ? Math.sin((seconds + offset) * Math.PI * 1.1) * 1.2 : 0;
  const gesture = talking ? Math.sin((seconds + offset) * Math.PI * .8) * 8 : 0;
  const meta = CHARACTERS[name];
  const warm = name === 'maya' ? '#e2a98b' : '#f0c0a0';

  return (
    <svg
      viewBox="0 0 100 104"
      role="img"
      aria-label={`${meta.name}, ${meta.role.toLowerCase()}${talking ? ', explaining' : ''}`}
      data-teaching-character={name}
      data-character-talking={talking ? 'true' : 'false'}
      style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible', ...style }}
    >
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={name === 'maya' ? '#f4cfb2' : '#ffe0c3'} />
          <stop offset="1" stopColor={warm} />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={name === 'leo' ? '#f6ad8d' : '#6381ff'} />
          <stop offset="1" stopColor={name === 'leo' ? '#df7b5b' : '#335cff'} />
        </linearGradient>
        <linearGradient id={`${id}-shell`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#d8e0ff" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="98" rx="33" ry="4" fill={INK} opacity=".08" />
      <g transform={`translate(0 ${bob})`} stroke={INK} strokeWidth="1.65" strokeLinejoin="round" strokeLinecap="round">
        {name === 'pip' ? (
          <>
            <path d="M27 75 34 68H66L74 77V94H27Z" fill={`url(#${id}-shell)`} />
            <path d="M63 69 74 77V94H64Z" fill="#b4c4ff" stroke="none" />
            <rect x="37" y="76" width="25" height="11" rx="3" fill="#fff" />
            <path d="m43 80-3 2 3 2m13-4 3 2-3 2m-7-5-2 6" stroke={BLUE} strokeWidth="1.5" fill="none" />
            <path d="M49 23V15" fill="none" />
            <circle cx="49" cy="12" r="4" fill={talking ? BLUE : '#bdcaff'} />
            <path d="M25 30 32 24H69L76 31V60L68 67H31L25 60Z" fill={`url(#${id}-shell)`} />
            <path d="M68 25 76 31V60L68 67Z" fill="#b4c4ff" stroke="none" />
            <rect x="30" y="32" width="38" height="24" rx="8" fill={INK} />
            <g transform={`translate(0 ${44 * (1 - blink)}) scale(1 ${blink})`} stroke="none">
              <rect x="37" y="40" width="5" height="7" rx="2.5" fill="#a9c0ff" />
              <rect x="56" y="40" width="5" height="7" rx="2.5" fill="#a9c0ff" />
            </g>
            <path d="M40 61H57" stroke="#9cafdd" strokeWidth="2" />
            {talking && <rect x="44" y={49 - mouth / 2} width="10" height={Math.max(1.5, mouth)} rx="1.5" fill="#a9c0ff" stroke="none" />}
            <g transform={`rotate(${-18 - gesture} 72 77)`}>
              <path d="M72 78 80 71 84 74 76 85" fill="#dce4ff" />
              <path d="M82 73 87 63" fill="none" strokeWidth="5" />
              <circle cx="87" cy="61" r="4" fill="#fff" />
            </g>
            <path d="M27 78 21 85 24 90 32 85" fill="#dce4ff" />
          </>
        ) : (
          <>
            {name === 'maya' && <path d="M26 51 23 77Q25 86 36 84H68Q80 83 78 72L72 43Z" fill={INK} />}
            <path d="M21 95 26 79Q30 70 43 69H57Q71 70 76 79L81 95Z" fill={`url(#${id}-shirt)`} />
            <path d="M61 73Q73 78 76 94H64Z" fill={name === 'leo' ? '#bb654d' : '#2649d2'} stroke="none" opacity=".32" />
            <path d="M43 61V73Q49 80 57 72V60" fill={`url(#${id}-skin)`} />
            <path d="M43 65Q50 70 57 65" fill={warm} stroke="none" />
            <ellipse cx="28" cy="46" rx="4" ry="7" fill={`url(#${id}-skin)`} />
            <ellipse cx="71" cy="46" rx="4" ry="7" fill={`url(#${id}-skin)`} />
            <path d="M28 36Q29 17 49 17Q70 18 71 36V49Q69 67 50 70Q30 67 28 49Z" fill={`url(#${id}-skin)`} />
            {name === 'maya' ? (
              <>
                <path d="M27 44Q21 31 29 23Q40 8 58 15Q73 19 73 42L64 31Q45 33 39 22Q36 38 27 44Z" fill={INK} />
                <path d="M39 22Q44 28 60 28" stroke="#4b515d" fill="none" strokeWidth="2" />
                <path d="M27 49V60" stroke={BLUE} strokeWidth="3" />
                <circle cx="27" cy="61" r="2" fill={BLUE} stroke="none" />
              </>
            ) : (
              <>
                <path d="M27 35Q21 26 29 23Q28 15 38 16Q45 8 54 16Q63 11 69 23Q76 24 71 35L62 31 52 32 42 28 34 35Z" fill="#484239" />
                <path d="M34 21Q43 14 50 20M54 22Q61 16 66 24" stroke="#716452" fill="none" strokeWidth="2" />
              </>
            )}
            <path d="m36 37 7-1m13 0 7 1" strokeWidth="1.4" />
            <g transform={`translate(0 ${43 * (1 - blink)}) scale(1 ${blink})`} stroke="none" fill={INK}>
              <ellipse cx="40" cy="44" rx="2.1" ry="3.1" />
              <ellipse cx="59" cy="44" rx="2.1" ry="3.1" />
            </g>
            {name === 'leo' && <g fill="none" stroke="#514b43" strokeWidth="1.35"><rect x="31" y="39" width="17" height="11" rx="5" /><rect x="52" y="39" width="17" height="11" rx="5" /><path d="M48 43H52M28 42H31M69 42H72" /></g>}
            <path d="m50 44-2 7 4 1" stroke={name === 'maya' ? '#b97c62' : '#cc9271'} strokeWidth="1.3" fill="none" />
            <ellipse cx="35" cy="53" rx="4" ry="2" fill={CORAL} opacity=".25" stroke="none" />
            <ellipse cx="64" cy="53" rx="4" ry="2" fill={CORAL} opacity=".25" stroke="none" />
            {talking ? <ellipse cx="50" cy="59" rx={3.5 + mouth * .2} ry={mouth} fill={INK} strokeWidth="1" /> : <path d="M45 58Q50 62 55 58" fill="none" strokeWidth="1.4" />}
            <path d="M43 74 48 81 56 73" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
            <g transform={`rotate(${-12 - gesture} 73 82)`}>
              <path d="M72 80 78 74 83 78 78 88" fill={`url(#${id}-shirt)`} />
              <path d="M79 75 81 64Q82 61 84 64L84 71Q87 68 89 71L88 78 82 80Z" fill={`url(#${id}-skin)`} />
              {name === 'maya' && <path d="m85 70 9-19" stroke={BLUE} strokeWidth="2.6" />}
            </g>
            <path d="M26 81 22 90" stroke={name === 'leo' ? '#c76e50' : '#2649d2'} strokeWidth="3" />
          </>
        )}
      </g>
    </svg>
  );
}

export type SketchTeachingCastProps = {
  frame: number;
  fps: number;
  phase: number;
  progress: number;
  speaker: TeachingCharacterName;
  text: string;
  compact?: boolean;
  /** False during the recorded chapter's silent lead and tail. */
  talking?: boolean;
};

/** Place this inside a 1160 × 105 composition band; it owns no absolute positioning. */
export function SketchTeachingCast({ frame, fps, phase, progress, speaker, text, compact = false, talking = true }: SketchTeachingCastProps) {
  const meta = CHARACTERS[speaker];
  const label = text.trim().replace(/\s+/g, ' ');
  const spoken = label.length > 120 ? `${label.slice(0, 117).replace(/\s+\S*$/, '').trimEnd()}…` : label;
  const currentPhase = Math.max(0, Math.min(4, Math.floor(phase)));

  return (
    <div
      data-teaching-cast="true"
      data-teaching-speaker={speaker}
      data-teaching-talking={talking && Boolean(spoken) ? 'true' : 'false'}
      style={{ display: 'flex', alignItems: 'center', gap: compact ? 20 : 28, width: '100%', height: '100%', fontFamily: FONT, color: INK }}
    >
      <div style={{ display: 'flex', flex: `0 0 ${compact ? 232 : 288}px`, gap: compact ? 8 : 12, height: '100%', alignItems: 'center' }}>
        {CAST.map(name => (
          <div key={name} style={{ width: compact ? 72 : 88, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: compact ? 62 : 72, height: compact ? 66 : 77, opacity: name === speaker ? 1 : .82 }}>
              <TeachingCharacter name={name} frame={frame} fps={fps} talking={talking && name === speaker && Boolean(spoken)} />
            </div>
            <div style={{ fontSize: compact ? 12 : 14, fontWeight: name === speaker ? 750 : 500, lineHeight: '18px', color: name === speaker ? CHARACTERS[name].color : '#626976' }}>{CHARACTERS[name].name}</div>
            <span style={{ position: 'absolute', bottom: 1, width: name === speaker ? 21 : 4, height: 3, borderRadius: 3, background: name === speaker ? CHARACTERS[name].color : '#d9dde6' }} />
          </div>
        ))}
      </div>
      <div style={{ flex: '1 1 0', minWidth: 0, borderLeft: '2px solid #e2e6ef', paddingLeft: compact ? 18 : 26 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: compact ? 13 : 15, letterSpacing: '.045em', fontWeight: 750, color: meta.color }}>{meta.name.toUpperCase()} <span style={{ fontWeight: 500, color: '#727986' }}>· {meta.role}</span></span>
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[0, 1, 2, 3, 4].map(index => <span key={index} style={{ display: 'block', width: 11, height: 3, background: index < currentPhase ? '#c0cafa' : '#e4e8f0', position: 'relative', borderRadius: 3, overflow: 'hidden' }}>{index === currentPhase && <span style={{ display: 'block', height: '100%', width: `${clamp(progress) * 100}%`, background: meta.color }} />}</span>)}
          </div>
        </div>
        <div style={{ fontSize: compact ? 20 : 24, fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={label}>{spoken || 'Watch the example, then try one change.'}</div>
      </div>
    </div>
  );
}
