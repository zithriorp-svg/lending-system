"use client";

import { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

interface CopyApplicationLinkProps {
  portfolio: string;
}

export default function CopyApplicationLink({ portfolio }: CopyApplicationLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate the application link using useMemo
  const applicationLink = useMemo(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      const encodedPortfolio = encodeURIComponent(portfolio);
      return `${baseUrl}/apply?portfolio=${encodedPortfolio}`;
    }
    return "";
  }, [portfolio]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(applicationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = applicationLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide w-full"
      >
        <span className="text-2xl mb-1">📱</span>
        <span>Scan to Apply</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                📱 Instant Application
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Scan to apply for a loan
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG 
                  value={applicationLink}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            {/* Portfolio Badge */}
            <div className="text-center mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Portfolio:
              </span>
              <span className="ml-2 text-sm font-bold text-yellow-400">
                {portfolio}
              </span>
            </div>

            {/* Copy Link Fallback */}
            <button
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy Link to Clipboard</span>
                </>
              )}
            </button>

            {/* Footer hint */}
            <p className="text-center text-xs text-zinc-600 mt-4">
              Works with any QR scanner app
            </p>
          </div>
        </div>
      )}
    </>
  );
}
