import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, X } from 'lucide-react';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  shopName: string;
  shopUrl: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ open, onClose, shopName, shopUrl }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(shopUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0B6E4F', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [open, shopUrl]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="flex items-center justify-between pb-2">
          <h2 id="qr-modal-title" className="text-base font-bold text-[#1B1F23]">
            QR Code y'iduka
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Funga"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm font-semibold text-[#0B6E4F]">{shopName}</p>
        <p className="mt-1 text-xs text-slate-600 break-all">{shopUrl}</p>

        <div className="my-4 flex justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code ya ${shopName}`}
              className="h-56 w-56 rounded-xl border border-slate-200 p-2"
            />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded-xl bg-[#F1F6F3]" />
          )}
        </div>

        {dataUrl && (
          <a
            href={dataUrl}
            download={`${shopName.toLowerCase().replace(/\s+/g, '-')}-qr.png`}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Kuramo ifoto ya QR</span>
          </a>
        )}
      </div>
    </div>
  );
};
