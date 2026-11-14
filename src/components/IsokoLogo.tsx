import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * ISOKO sun mark: a ring of many coloured beads around a deliberately open centre.
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
      <circle cx="20" cy="3.8" r="1.45" fill="#E8A33D" />
      <circle cx="24.15" cy="4.55" r="1.05" fill="#0B6E4F" />
      <circle cx="28" cy="6.15" r="1.55" fill="#C0392B" />
      <circle cx="31.3" cy="8.7" r="1.05" fill="#2F80ED" />
      <circle cx="33.85" cy="12" r="1.5" fill="#8B5CF6" />
      <circle cx="35.45" cy="15.85" r="1.05" fill="#E8A33D" />
      <circle cx="36.2" cy="20" r="1.5" fill="#0B6E4F" />
      <circle cx="35.45" cy="24.15" r="1.05" fill="#EC4899" />
      <circle cx="33.85" cy="28" r="1.5" fill="#F97316" />
      <circle cx="31.3" cy="31.3" r="1.05" fill="#C0392B" />
      <circle cx="28" cy="33.85" r="1.5" fill="#14B8A6" />
      <circle cx="24.15" cy="35.45" r="1.05" fill="#8B5CF6" />
      <circle cx="20" cy="36.2" r="1.5" fill="#E8A33D" />
      <circle cx="15.85" cy="35.45" r="1.05" fill="#0B6E4F" />
      <circle cx="12" cy="33.85" r="1.5" fill="#EC4899" />
      <circle cx="8.7" cy="31.3" r="1.05" fill="#2F80ED" />
      <circle cx="6.15" cy="28" r="1.5" fill="#C0392B" />
      <circle cx="4.55" cy="24.15" r="1.05" fill="#E8A33D" />
      <circle cx="3.8" cy="20" r="1.5" fill="#8B5CF6" />
      <circle cx="4.55" cy="15.85" r="1.05" fill="#0B6E4F" />
      <circle cx="6.15" cy="12" r="1.5" fill="#14B8A6" />
      <circle cx="8.7" cy="8.7" r="1.05" fill="#F97316" />
      <circle cx="12" cy="6.15" r="1.5" fill="#2F80ED" />
      <circle cx="15.85" cy="4.55" r="1.05" fill="#C0392B" />
    </g>

    <g opacity="0.95">
      <circle cx="31" cy="20" r="0.85" fill="#C0392B" />
      <circle cx="29.53" cy="25.5" r="0.8" fill="#E8A33D" />
      <circle cx="25.5" cy="29.53" r="0.85" fill="#0B6E4F" />
      <circle cx="20" cy="31" r="0.8" fill="#2F80ED" />
      <circle cx="14.5" cy="29.53" r="0.85" fill="#8B5CF6" />
      <circle cx="10.47" cy="25.5" r="0.8" fill="#F97316" />
      <circle cx="9" cy="20" r="0.85" fill="#14B8A6" />
      <circle cx="10.47" cy="14.5" r="0.8" fill="#C0392B" />
      <circle cx="14.5" cy="10.47" r="0.85" fill="#E8A33D" />
      <circle cx="20" cy="9" r="0.8" fill="#0B6E4F" />
      <circle cx="25.5" cy="10.47" r="0.85" fill="#EC4899" />
      <circle cx="29.53" cy="14.5" r="0.8" fill="#2F80ED" />
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
          <path
            d="M0 8L8 0L16 8L24 16L32 8"
            stroke="#0B6E4F"
            strokeWidth="1.1"
            strokeLinecap="square"
          />
          <path
            d="M0 8L8 16L16 8L24 0L32 8"
            stroke="#C0392B"
            strokeWidth="0.9"
            strokeLinecap="square"
            opacity="0.7"
          />
          <path
            d="M8 8L16 2.5L24 8L16 13.5L8 8Z"
            stroke="#0B6E4F"
            strokeWidth="0.7"
            opacity="0.42"
          />
        </pattern>
      </defs>
      <rect width="160" height="16" fill={`url(#${patternId})`} />
    </svg>
  );
};
