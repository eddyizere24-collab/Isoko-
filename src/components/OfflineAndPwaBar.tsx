import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { dismissPwaBanner, isPwaDismissed } from '../lib/storage';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { usePWAInstall } from '../lib/usePWAInstall';

export const OfflineAndPwaBar: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { visitCount } = useMarketplace();
  const [dismissed, setDismissed] = useState(() => isPwaDismissed());
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [swUpdateWaiting, setSwUpdateWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) setSwUpdateWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              setSwUpdateWaiting(nw);
            }
          });
        });
      })
      .catch(() => undefined);
  }, []);

  const handleUpdateReload = () => {
    if (swUpdateWaiting) {
      swUpdateWaiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  // Show PWA install banner after 2+ visits or if explicitly installable & not dismissed (A-05)
  const showInstallBanner = !isInstalled && !dismissed && visitCount >= 2 && (isInstallable || isIOS);

  return (
    <>
      {!isOnline && (
        <div
          role="status"
          className="border-b border-[#E8A33D]/40 bg-[#FEF3C7] px-4 py-2 text-center text-xs font-semibold text-[#92400E]"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <span>{RW.offline}</span>
          </span>
        </div>
      )}

      {swUpdateWaiting && (
        <div className="border-b border-[#0B6E4F]/20 bg-[#F1F6F3] px-4 py-2 text-center text-xs">
          <button
            type="button"
            onClick={handleUpdateReload}
            className="inline-flex items-center gap-2 font-semibold text-[#0B6E4F] hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{RW.new_version}</span>
          </button>
        </div>
      )}

      {showInstallBanner && (
        <div className="border-b border-slate-200 bg-white px-4 py-2">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#1B1F23]">
              <Download className="h-4 w-4 text-[#0B6E4F] shrink-0" aria-hidden="true" />
              <span className="font-medium">{RW.install_app}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="min-h-[36px] rounded-lg bg-[#0B6E4F] px-3 text-xs font-semibold text-white hover:bg-[#08553D]"
                >
                  Shyiraho
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(true)}
                  className="min-h-[36px] rounded-lg bg-[#0B6E4F] px-3 text-xs font-semibold text-white"
                >
                  Uko bikorwa (iOS)
                </button>
              )}
              <button
                type="button"
                aria-label="Funga itangazo"
                onClick={() => {
                  dismissPwaBanner();
                  setDismissed(true);
                }}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#1B1F23]">{RW.install_app}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              1. Kanda akamenyetso ka <strong>Share</strong> hasi muri Safari.<br />
              2. Hitamo <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 min-h-[44px] w-full rounded-xl bg-[#0B6E4F] text-sm font-semibold text-white"
            >
              Nasobanukiwe
            </button>
          </div>
        </div>
      )}
    </>
  );
};
