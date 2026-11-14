import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { RW } from '../i18n/rw';
import { submitReport } from '../lib/api';
import { getSessionId } from '../lib/storage';
import { validateReportForm } from '../lib/validation';
import type { ReportType } from '../types/marketplace';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'product' | 'shop';
  targetId: string;
  targetName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
}) => {
  const [type, setType] = useState<ReportType>('fake_price');
  const [details, setDetails] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validateReportForm({ type, details, reporterPhone });
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetId,
        type,
        details,
        reporterPhone: reporterPhone.trim() || undefined,
        sessionId: getSessionId(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Habaye ikibazo mu kohereza ikirego.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-[#C0392B]" aria-hidden="true" />
            <h2 id="report-modal-title" className="text-lg font-bold text-[#1B1F23]">
              {RW.report}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Funga"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-[#1B1F23]">
              Murakoze! Ikibazo cyawe ku bijyanye na <strong>{targetName}</strong> cyakiriwe.
              Ikipe yacu iragisuzuma mu masaha 24.
            </p>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setDetails('');
                onClose();
              }}
              className="min-h-[44px] w-full rounded-xl bg-[#0B6E4F] text-sm font-semibold text-white"
            >
              Funga
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-slate-600">
              Ikirego kuri: <strong className="text-[#1B1F23]">{targetName}</strong>
            </p>

            <div>
              <label htmlFor="report-type" className="block text-sm font-semibold text-[#1B1F23]">
                Ubwoko bw'ikibazo
              </label>
              <select
                id="report-type"
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                {Object.entries(RW.report_types).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-details" className="block text-sm font-semibold text-[#1B1F23]">
                Sobanura ikibazo (inyuguti 10–500)
              </label>
              <textarea
                id="report-details"
                rows={3}
                maxLength={500}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Andika ibyo wabonye..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="report-phone" className="block text-sm font-semibold text-[#1B1F23]">
                Nimero yawe (si itegeko, yo gusubizwa)
              </label>
              <input
                id="report-phone"
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="0788123456"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-[#C0392B]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full rounded-xl bg-[#C0392B] px-5 text-sm font-semibold text-white hover:bg-[#a32f20] disabled:opacity-60"
            >
              {submitting ? 'Birimo koherezwa...' : 'Ohereza ikibazo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
