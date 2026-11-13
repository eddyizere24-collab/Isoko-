import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * Isoko Primary Emblem: architectural Kigali market arch framing a Rwandan diamond weave.
 */
export const IsokoMark: React.FC<LogoProps> = ({ className = 'h-7 w-7' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <rect width="36" height="36" rx="10" fill="#0B6E4F" />
    <path
      d="M11 13.5C11 9.91015 13.9101 7 17.5 7H18.5C22.0899 7 25 9.91015 25 13.5V15H22.2V13.5C22.2 11.4565 20.5435 9.8 18.5 9.8H17.5C15.4565 9.8 13.8 11.4565 13.8 13.5V15H11V13.5Z"
      fill="#F1F6F3"
    />
    <rect x="8.5" y="14.5" width="19" height="14.5" rx="3.5" fill="#FFFFFF" />
    <path
      d="M18 17.5L22.5 21.75L18 26L13.5 21.75L18 17.5Z"
      fill="#E8A33D"
    />
    <path
      d="M18 19.6L20.3 21.75L18 23.9L15.7 21.75L18 19.6Z"
      fill="#0B6E4F"
    />
  </svg>
);

/**
 * Isoko Horizontal Wordmark: single-line mark + display brand title for headers & footers.
 */
export const IsokoWordmark: React.FC<{ markClassName?: string; textClassName?: string }> = ({
  markClassName = 'h-7 w-7',
  textClassName = 'text-xl font-extrabold tracking-tight text-[#0B6E4F]',
}) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
    <IsokoMark className={markClassName} />
    <span className={`font-display ${textClassName}`}>Isoko</span>
  </span>
);

/**
 * Verified Merchant Seal: trust badge paired explicitly with text on shop cards and storefronts.
 */
export const IsokoVerifiedSeal: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M10 1.5L12.3 3.2L15.1 2.9L16 5.6L18.4 7.1L17.8 9.9L19.1 12.4L17 14.3L16.7 17.1L13.9 17.5L11.9 19.4L9.2 18.2L6.5 19.4L4.5 17.5L1.7 17.1L1.4 14.3L-0.7 12.4"
      opacity="0"
    />
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
 * Subtle Imigongo-inspired geometric SVG accent stripe for storefront dividers & section framing.
 */
export const RwandanGeometricPattern: React.FC<{ className?: string }> = ({
  className = 'h-3 w-full text-[#0B6E4F]/15',
}) => (
  <svg
    aria-hidden="true"
    className={className}
    preserveAspectRatio="none"
    viewBox="0 0 120 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <pattern id="imigongo-stripe" width="24" height="12" patternUnits="userSpaceOnUse">
      <path
        d="M0 6L6 1L12 6L18 11L24 6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      <path
        d="M0 11L6 6L12 11M12 1L18 6L24 1"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.55"
      />
    </pattern>
    <rect width="120" height="12" fill="url(#imigongo-stripe)" />
  </svg>
);
