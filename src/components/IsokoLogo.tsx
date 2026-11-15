import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

/**
 * Isoko 2-color Imigongo Diamond Mark (#0B6E4F + #C0392B, or white-on-green variant).
 */
export const IsokoMark: React.FC<LogoProps> = ({
  className = 'h-6 w-6',
  variant = 'default',
}) => {
  const outer = variant === 'white' ? '#FFFFFF' : '#0B6E4F';
  const inner = variant === 'white' ? '#064E3B' : '#FFFFFF';
  const core = '#C0392B';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="36" height="36" rx="9" fill={outer} />
      <path d="M18 7L29 18L18 29L7 18L18 7Z" fill={inner} />
      <path d="M18 11.2L24.8 18L18 24.8L11.2 18L18 11.2Z" fill={outer} />
      <path d="M18 14.5L21.5 18L18 21.5L14.5 18L18 14.5Z" fill={core} />
    </svg>
  );
};

/**
 * Compact custom-drawn ISOKO horizontal logo (mark + crisp SVG wordmark "isoko" with red dot on "i").
 */
export const IsokoWordmark: React.FC<{
  markClassName?: string;
  wordmarkClassName?: string;
  textClassName?: string;
  variant?: 'default' | 'white';
}> = ({
  markClassName = 'h-6 w-6',
  wordmarkClassName = 'h-[17px] w-auto',
  variant = 'default',
}) => {
  const ink = variant === 'white' ? '#FFFFFF' : '#0B6E4F';
  const dot = variant === 'white' ? '#FBEAE8' : '#C0392B';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <IsokoMark className={markClassName} variant={variant} />
      <svg
        viewBox="0 0 82 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="isoko"
        role="img"
        className={wordmarkClassName}
      >
        {/* i dot */}
        <circle cx="4.5" cy="4.2" r="2.2" fill={dot} />
        {/* i stem */}
        <rect x="2.6" y="8.2" width="3.8" height="12.6" rx="1.6" fill={ink} />
        {/* s */}
        <path
          d="M19.8 10.6C19.8 9.2 18.2 8 15.3 8C12.2 8 10.2 9.5 10.2 11.7C10.2 13.7 11.7 14.7 14.5 15.3L15.9 15.6C17.2 15.9 17.7 16.3 17.7 17C17.7 17.9 16.7 18.4 15.1 18.4C13.5 18.4 12.5 17.8 12.2 16.9L9.6 17.6C10.1 19.6 12.1 21 15.2 21C18.6 21 20.6 19.3 20.6 16.9C20.6 14.7 19.1 13.6 16.2 13L14.8 12.7C13.6 12.4 13.1 12 13.1 11.4C13.1 10.7 14 10.3 15.2 10.3C16.6 10.3 17.3 10.8 17.5 11.5L19.8 10.6Z"
          fill={ink}
        />
        {/* o */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M29.4 8C25.5 8 22.8 10.7 22.8 14.5C22.8 18.3 25.5 21 29.4 21C33.3 21 36 18.3 36 14.5C36 10.7 33.3 8 29.4 8ZM29.4 10.9C27.5 10.9 26.3 12.4 26.3 14.5C26.3 16.6 27.5 18.1 29.4 18.1C31.3 18.1 32.5 16.6 32.5 14.5C32.5 12.4 31.3 10.9 29.4 10.9Z"
          fill={ink}
        />
        {/* k */}
        <path
          d="M38.8 3.6H42.5V13.4L47.3 8.2H51.6L46.1 13.9L52.1 20.8H47.6L43.5 15.8L42.5 16.8V20.8H38.8V3.6Z"
          fill={ink}
        />
        {/* o */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.2 8C56.3 8 53.6 10.7 53.6 14.5C53.6 18.3 56.3 21 60.2 21C64.1 21 66.8 18.3 66.8 14.5C66.8 10.7 64.1 8 60.2 8ZM60.2 10.9C58.3 10.9 57.1 12.4 57.1 14.5C57.1 16.6 58.3 18.1 60.2 18.1C62.1 18.1 63.3 16.6 63.3 14.5C63.3 12.4 62.1 10.9 60.2 10.9Z"
          fill={ink}
        />
      </svg>
    </span>
  );
};

/**
 * Verified Merchant Seal: compact green trust badge paired explicitly with text on shop cards and storefronts.
 */
export const IsokoVerifiedSeal: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
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
 * Subtle Imigongo geometric accent bar (Green + Red).
 */
export const RwandanGeometricPattern: React.FC<{ className?: string }> = ({
  className = 'imigongo-band',
}) => <div aria-hidden="true" className={className} />;
