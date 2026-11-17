import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

/**
 * ISOKO's original multicolour hollow-centre sun mark. Preserve its many coloured beads and open centre.
 */
const SUN_BEADS = [
  [20,3.2,2.15,'#E8A33D'], [28.4,5.6,2.15,'#0B6E4F'], [34.4,11.6,2.15,'#C0392B'],
  [36.8,20,2.15,'#2F80ED'], [34.4,28.4,2.15,'#8B5CF6'], [28.4,34.4,2.15,'#E8A33D'],
  [20,36.8,2.15,'#0B6E4F'], [11.6,34.4,2.15,'#EC4899'], [5.6,28.4,2.15,'#F97316'],
  [3.2,20,2.15,'#C0392B'], [5.6,11.6,2.15,'#14B8A6'], [11.6,5.6,2.15,'#2F80ED'],
] as const;


/**
 * ISOKO original sun mark: multicolour beads surrounding a deliberately open centre.
 * Preserve the colours and open centre at every size and on every surface.
 */
export const IsokoMark: React.FC<LogoProps> = ({
  className = 'h-6 w-6',
  variant: _variant = 'default',
}) => {
  void _variant;
  return (
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
      {/* Keep the centre open; the larger outer beads stay legible at the 24px header size. */}
      <path d="M20 13.7A6.3 6.3 0 0 1 26.3 20" stroke="#0B6E4F" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <path d="M20 26.3A6.3 6.3 0 0 1 13.7 20" stroke="#C0392B" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
};

/**
 * Option A (Amategeko §9): Custom hand-drawn wordmark "isoko" with red Imigongo diamond nested inside the final "o".
 */
export const IsokoWordmarkOptionA: React.FC<{
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: 'default' | 'white';
}> = ({
  markClassName = 'h-6 w-6',
  wordmarkClassName = 'h-[17px] w-auto',
  variant = 'default',
}) => {
  const ink = variant === 'white' ? '#FFFFFF' : '#0B6E4F';
  const red = variant === 'white' ? '#FBEAE8' : '#C0392B';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <IsokoMark className={markClassName} variant={variant} />
      <svg
        viewBox="0 0 78 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="isoko"
        role="img"
        className={wordmarkClassName}
      >
        {/* i red diamond dot + stem */}
        <path d="M4.5 1.8L6.9 4.2L4.5 6.6L2.1 4.2L4.5 1.8Z" fill={red} />
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
        {/* final o with red Imigongo diamond centered inside */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.6 8C56.7 8 54 10.7 54 14.5C54 18.3 56.7 21 60.6 21C64.5 21 67.2 18.3 67.2 14.5C67.2 10.7 64.5 8 60.6 8ZM60.6 10.8C58.6 10.8 57.4 12.3 57.4 14.5C57.4 16.7 58.6 18.2 60.6 18.2C62.6 18.2 63.8 16.7 63.8 14.5C63.8 12.3 62.6 10.8 60.6 10.8Z"
          fill={ink}
        />
        <path d="M60.6 12.2L62.8 14.5L60.6 16.8L58.4 14.5L60.6 12.2Z" fill={red} />
      </svg>
    </span>
  );
};

/**
 * Option B (Amategeko §9): Custom wordmark "isoko" with a Rwandan market stall roof crowning "k".
 */
export const IsokoWordmarkOptionB: React.FC<{
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: 'default' | 'white';
}> = ({
  markClassName = 'h-6 w-6',
  wordmarkClassName = 'h-[19px] w-auto',
  variant = 'default',
}) => {
  const ink = variant === 'white' ? '#FFFFFF' : '#0B6E4F';
  const red = variant === 'white' ? '#FBEAE8' : '#C0392B';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <IsokoMark className={markClassName} variant={variant} />
      <svg
        viewBox="0 0 78 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="isoko"
        role="img"
        className={wordmarkClassName}
      >
        {/* Market gable roof over k */}
        <path
          d="M36.5 6.4L44.6 1.6L52.7 6.4"
          stroke={red}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M44.6 1.6L46.4 3.4L44.6 5.2L42.8 3.4L44.6 1.6Z" fill={red} />
        {/* i */}
        <circle cx="4.5" cy="7.2" r="2.1" fill={red} />
        <rect x="2.6" y="11.2" width="3.8" height="12.6" rx="1.6" fill={ink} />
        {/* s */}
        <path
          d="M19.8 13.6C19.8 12.2 18.2 11 15.3 11C12.2 11 10.2 12.5 10.2 14.7C10.2 16.7 11.7 17.7 14.5 18.3L15.9 18.6C17.2 18.9 17.7 19.3 17.7 20C17.7 20.9 16.7 21.4 15.1 21.4C13.5 21.4 12.5 20.8 12.2 19.9L9.6 20.6C10.1 22.6 12.1 24 15.2 24C18.6 24 20.6 22.3 20.6 19.9C20.6 17.7 19.1 16.6 16.2 16L14.8 15.7C13.6 15.4 13.1 15 13.1 14.4C13.1 13.7 14 13.3 15.2 13.3C16.6 13.3 17.3 13.8 17.5 14.5L19.8 13.6Z"
          fill={ink}
        />
        {/* o */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M29.4 11C25.5 11 22.8 13.7 22.8 17.5C22.8 21.3 25.5 24 29.4 24C33.3 24 36 21.3 36 17.5C36 13.7 33.3 11 29.4 11ZM29.4 13.9C27.5 13.9 26.3 15.4 26.3 17.5C26.3 19.6 27.5 21.1 29.4 21.1C31.3 21.1 32.5 19.6 32.5 17.5C32.5 15.4 31.3 13.9 29.4 13.9Z"
          fill={ink}
        />
        {/* k */}
        <path
          d="M38.8 7.6H42.5V16.4L47.3 11.2H51.6L46.1 16.9L52.1 23.8H47.6L43.5 18.8L42.5 19.8V23.8H38.8V7.6Z"
          fill={ink}
        />
        {/* o */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.6 11C56.7 11 54 13.7 54 17.5C54 21.3 56.7 24 60.6 24C64.5 24 67.2 21.3 67.2 17.5C67.2 13.7 64.5 11 60.6 11ZM60.6 13.9C58.7 13.9 57.5 15.4 57.5 17.5C57.5 19.6 58.7 21.1 60.6 21.1C62.5 21.1 63.7 19.6 63.7 17.5C63.7 15.4 62.5 13.9 60.6 13.9Z"
          fill={ink}
        />
      </svg>
    </span>
  );
};

/**
 * Option C (Amategeko §9): Custom wordmark "isoko" grounded on a geometric Imigongo stepped underline ribbon.
 */
export const IsokoWordmarkOptionC: React.FC<{
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: 'default' | 'white';
}> = ({
  markClassName = 'h-6 w-6',
  wordmarkClassName = 'h-[19px] w-auto',
  variant = 'default',
}) => {
  const ink = variant === 'white' ? '#FFFFFF' : '#0B6E4F';
  const red = variant === 'white' ? '#FBEAE8' : '#C0392B';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <IsokoMark className={markClassName} variant={variant} />
      <svg
        viewBox="0 0 78 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="isoko"
        role="img"
        className={wordmarkClassName}
      >
        <circle cx="4.5" cy="4.2" r="2.2" fill={red} />
        <rect x="2.6" y="8.2" width="3.8" height="12.2" rx="1.6" fill={ink} />
        <path
          d="M19.8 10.4C19.8 9 18.2 7.8 15.3 7.8C12.2 7.8 10.2 9.3 10.2 11.5C10.2 13.5 11.7 14.5 14.5 15.1L15.9 15.4C17.2 15.7 17.7 16.1 17.7 16.8C17.7 17.7 16.7 18.2 15.1 18.2C13.5 18.2 12.5 17.6 12.2 16.7L9.6 17.4C10.1 19.4 12.1 20.6 15.2 20.6C18.6 20.6 20.6 19 20.6 16.7C20.6 14.5 19.1 13.4 16.2 12.8L14.8 12.5C13.6 12.2 13.1 11.8 13.1 11.2C13.1 10.5 14 10.1 15.2 10.1C16.6 10.1 17.3 10.6 17.5 11.3L19.8 10.4Z"
          fill={ink}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M29.4 7.8C25.5 7.8 22.8 10.5 22.8 14.2C22.8 17.9 25.5 20.6 29.4 20.6C33.3 20.6 36 17.9 36 14.2C36 10.5 33.3 7.8 29.4 7.8ZM29.4 10.7C27.5 10.7 26.3 12.2 26.3 14.2C26.3 16.2 27.5 17.7 29.4 17.7C31.3 17.7 32.5 16.2 32.5 14.2C32.5 12.2 31.3 10.7 29.4 10.7Z"
          fill={ink}
        />
        <path
          d="M38.8 3.6H42.5V13.1L47.3 8H51.6L46.1 13.6L52.1 20.4H47.6L43.5 15.5L42.5 16.5V20.4H38.8V3.6Z"
          fill={ink}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.6 7.8C56.7 7.8 54 10.5 54 14.2C54 17.9 56.7 20.6 60.6 20.6C64.5 20.6 67.2 17.9 67.2 14.2C67.2 10.5 64.5 7.8 60.6 7.8ZM60.6 10.7C58.7 10.7 57.5 12.2 57.5 14.2C57.5 16.2 58.7 17.7 60.6 17.7C62.5 17.7 63.7 16.2 63.7 14.2C63.7 12.2 62.5 10.7 60.6 10.7Z"
          fill={ink}
        />
        {/* Crisp Imigongo stepped underline */}
        <path
          d="M2.5 25L7 22.3L11.5 25L16 22.3L20.5 25L25 22.3L29.5 25L34 22.3L38.5 25L43 22.3L47.5 25L52 22.3L56.5 25L61 22.3L66 25"
          stroke={red}
          strokeWidth="1.9"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </span>
  );
};

// Active header/footer wordmark uses Option A (clean, sharp diamond inside final "o")
export const IsokoWordmark = IsokoWordmarkOptionA;

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
 * Imigongo 8px Header Strip / 12px Footer Strip using crisp 48x12px repeating SVG tiles.
 */
export const RwandanGeometricPattern: React.FC<{
  className?: string;
  size?: 'header' | 'footer';
}> = ({ className, size = 'header' }) => (
  <div
    aria-hidden="true"
    className={className ?? (size === 'footer' ? 'imigongo-footer-strip' : 'imigongo-header-strip')}
  />
);

/**
 * 120px Corner Imigongo SVG artwork rendered on the right edge of the compact Home Hero at 14% opacity.
 */
export const ImigongoHeroCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`h-[120px] w-[120px] pointer-events-none select-none opacity-15 ${className}`}
  >
    <defs>
      <pattern id="imigongo-hero-pattern" width="48" height="24" patternUnits="userSpaceOnUse">
        <polygon points="12,2 22,12 12,22 2,12" stroke="#0B6E4F" strokeWidth="2" fill="none" />
        <polygon points="12,6 18,12 12,18 6,12" fill="#C0392B" />
        <path
          d="M26 3H45V21H29V7H41V17H33"
          stroke="#1B1F23"
          strokeWidth="2"
          fill="none"
          strokeLinecap="square"
        />
      </pattern>
    </defs>
    <path d="M120 0V120H0L120 0Z" fill="url(#imigongo-hero-pattern)" />
  </svg>
);

/**
 * Quiet editorial auth header: original full-colour ISOKO sun, warm paper
 * surface, charcoal typography and a restrained Imigongo line signature.
 */
export const AuthBrandHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => (
  <div className="relative overflow-hidden rounded-xl border border-[#E3E0D8] bg-[#FFFEFB] text-[#202724]">
    <div className="relative z-10 flex min-h-[104px] flex-col justify-center px-5 py-4 sm:min-h-[116px] sm:px-7">
      <div className="flex items-center justify-between gap-4">
        <IsokoWordmark markClassName="h-7 w-7" wordmarkClassName="h-[18px] w-auto" />
        <span className="text-[10px] font-medium tracking-[0.12em] text-[#8F493F]">RWANDA MARKETPLACE</span>
      </div>
      <h1 className="mt-2 text-[18px] font-semibold leading-tight text-[#202724] sm:text-[20px]">
        {title}
      </h1>
      {subtitle && <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#68716D]">{subtitle}</p>}
    </div>
    <svg
      viewBox="0 0 120 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-full w-28 opacity-25"
    >
      <path d="M120 0 64 56 120 112" stroke="#214E43" strokeWidth="1.4" />
      <path d="M120 18 82 56 120 94" stroke="#BD594A" strokeWidth="1.1" />
      <path d="M120 36 100 56 120 76" stroke="#C99A4B" strokeWidth="1.1" />
      <path d="M88 0 32 56 88 112" stroke="#214E43" strokeWidth="1" opacity=".7" />
    </svg>
    <div aria-hidden="true" className="h-2 w-full imigongo-header-strip" />
  </div>
);