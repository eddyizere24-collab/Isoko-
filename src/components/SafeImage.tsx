import React, { useEffect, useState } from 'react';

interface SafeImageProps { src?: string | null; alt: string; className?: string; fallback: React.ReactNode; loading?: 'eager' | 'lazy'; decoding?: 'async' | 'sync' | 'auto'; referrerPolicy?: React.HTMLAttributeReferrerPolicy; }

/** Displays a useful local fallback rather than a broken-image glyph. */
export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className, fallback, loading = 'lazy', decoding = 'async', referrerPolicy = 'no-referrer' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} loading={loading} decoding={decoding} referrerPolicy={referrerPolicy} onError={() => {
    if (import.meta.env.DEV) console.warn('[ISOKO] Shop image could not be loaded.', { alt, src });
    setFailed(true);
  }} />;
};
