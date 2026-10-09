import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, X, ExternalLink, Check, Copy } from 'lucide-react';

interface QRCodeDisplayProps {
  pin: string;
  size?: number;
  showExpandModal?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ pin, size = 180 }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build join URL with pre-filled PIN
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?pin=${pin}`
    : `https://quizblast.io?pin=${pin}`;

  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [joinUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Inline QR Badge */}
      <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-xl border-4 border-purple-500/30 group relative">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`Scan QR code to join game ${pin}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setIsModalOpen(true)}
          />
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs"
          >
            Generating QR...
          </div>
        )}

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] font-extrabold text-purple-700 hover:text-purple-900 flex items-center justify-center space-x-1"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            <span>Scan with Phone Camera</span>
          </button>
        </div>
      </div>

      {/* Expanded QR Modal for big screen classrooms */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Instant Mobile Join</span>
            </div>

            <h3 className="text-2xl font-black font-fun text-white mb-1">Point Phone Camera Here</h3>
            <p className="text-xs text-slate-300 mb-6">
              Open your camera app to scan and join directly with PIN <strong className="text-amber-400 font-mono text-sm">{pin}</strong>
            </p>

            {/* Giant QR code */}
            <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block border-4 border-purple-400 mx-auto mb-6">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Scannable QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl"
                />
              )}
            </div>

            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Link Copied!' : 'Copy Direct URL'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
