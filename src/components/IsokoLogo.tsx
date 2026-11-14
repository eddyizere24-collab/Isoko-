import React from 'react';

interface LogoProps {
  className?: string;
}

const SUN_BEADS = [
  [20,3.8,1.45,'#E8A33D'], [24.15,4.55,1.05,'#0B6E4F'], [28,6.15,1.55,'#C0392B'],
  [31.3,8.7,1.05,'#2F80ED'], [33.85,12,1.5,'#8B5CF6'], [35.45,15.85,1.05,'#E8A33D'],
  [36.2,20,1.5,'#0B6E4F'], [35.45,24.15,1.05,'#EC4899'], [33.85,28,1.5,'#F97316'],
  [31.3,31.3,1.05,'#C0392B'], [28,33.85,1.5,'#14B8A6'], [24.15,35.45,1.05,'#8B5CF6'],
  [20,36.2,1.5,'#E8A33D'], [15.85,35.45,1.05,'#0B6E4F'], [12,33.85,1.5,'#EC4899'],
  [8.7,31.3,1.05,'#2F80ED'], [6.15,28,1.5,'#C0392B'], [4.55,24.15,1.05,'#E8A33D'],
  [3.8,20,1.5,'#8B5CF6'], [4.55,15.85,1.05,'#0B6E4F'], [6.15,12,1.5,'#14B8A6'],
  [8.7,8.7,1.05,'#F97316'], [12,6.15,1.5,'#2F80ED'], [15.85,4.55,1.05,'#C0392B'],
] as const;

const INNER_BEADS = [
  [31,20,0.85,'#C0392B'], [29.53,25.5,0.8,'#E8A33D'], [25.5,29.53,0.85,'#0B6E4F'],
  [20,31,0.8,'#2F80ED'], [14.5,29.53,0.85,'#8B5CF6'], [10.47,25.5,0.8,'#F97316'],
  [9,20,0.85,'#14B8A6'], [10.47,14.5,0.8,'#C0392B'], [14.5,10.47,0.85,'#E8A33D'],
  [20,9,0.8,'#0B6E4F'], [25.5,10.47,0.85,'#EC4899'], [29.53,14.5,0.8,'#2F80ED'],
] as const;

/**
 * ISOKO sun mark: coloured beads around a deliberately open centre.
 * The open centre represents the meeting point of buyers and sellers.
 */
export const IsokoMark: React.FC<LogoProps> = ({ className = 'h-8 w-8' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <g>
      {SUN_BEADS.map(([cx, cy, radius, color], index) => (
        <circle key={index} cx={cx} cy={cy} r={radius} fill={color} />
      ))}
    </g>
    <g opacity="0.95">
      {INNER_BEADS.map(([cx, cy, radius, color], index) => (
        <circle key={index} cx={cx} cy={cy} r={radius} fill={color} />
      ))}
    </g>
    <path d="M20 13.7A6.3 6.3 0 0 1 26.3 20" stroke="#0B6E4F" strokeWidth="0.8" strokeLinecap="round" opacity="0.55" />
    <path d="M20 26.3A6.3 6.3 0 0 1 13.7 20" stroke="#C0392B" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
  </svg>
);

/**
 * ISOKO wordmark: the multicolour sun stays small enough for narrow mobile headers.
 */
export const IsokoWordmark: React.FC<{ markClassName?: string; textClassName?: string }> = ({
  markClassName = 'h-8 w-8',
  textClassName = 'text-xl font-extrabold tracking-tight text-[#0B6E4F]',
}) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
    <IsokoMark className={markClassName} />
    <span className={`font-display ${textClassName}`}>Isoko</span>
  </span>
);

/**
 * Verified merchant seal is shown only when identity_status is actually verified.
 */
export const IsokoVerifiedSeal: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <circle cx="10" cy="10" r="8.5" fill="#0B6E4F" />
    <path
      d="M6.5 10.2L8.9 12.6L13.7 7.6"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * A restrained Imigongo-inspired band in Isoko green and red.
 * Each rendered SVG receives its own pattern ID, so repeated bands never clash.
 */
export const RwandanGeometricPattern: React.FC<{ className?: string }> = ({
  className = 'h-2.5 w-full opacity-75',
}) => {
  const patternId = `isoko-imigongo-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 160 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width="32" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8L8 0L16 8L24 16L32 8" stroke="#0B6E4F" strokeWidth="1.1" strokeLinecap="square" />
          <path d="M0 8L8 16L16 8L24 0L32 8" stroke="#C0392B" strokeWidth="0.9" strokeLinecap="square" opacity="0.7" />
          <path d="M8 8L16 2.5L24 8L16 13.5L8 8Z" stroke="#0B6E4F" strokeWidth="0.7" opacity="0.42" />
        </pattern>
      </defs>
      <rect width="160" height="16" fill={`url(#${patternId})`} />
    </svg>
  );
};
