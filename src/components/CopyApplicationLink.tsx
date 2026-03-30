"use client";

import { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Portfolio {
  id: number;
  name: string;
}

interface CopyApplicationLinkProps {
  portfolios: Portfolio[];
}

export default function CopyApplicationLink({ portfolios }: CopyApplicationLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showQRForId, setShowQRForId] = useState<number | null>(null);

  // Generate application link for a specific portfolio
  const generateLink = (portfolioId: number): string => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/apply?portfolioId=${portfolioId}`;
    }
    return "";
  };

  const handleCopy = async (portfolioId: number) => {
    const link = generateLink(portfolioId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(portfolioId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(portfolioId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide w-full cursor-pointer"
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
            className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto"
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
                📱 Portfolio Application Links
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Copy or scan the link for each portfolio
              </p>
            </div>

            {/* Portfolio List */}
            <div className="space-y-3">
              {portfolios.map((portfolio) => (
                <div 
                  key={portfolio.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold">{portfolio.name}</span>
                      <span className="text-xs text-zinc-500">ID: {portfolio.id}</span>
                    </div>
                    <button
                      onClick={() => setShowQRForId(showQRForId === portfolio.id ? null : portfolio.id)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Show QR Code"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                      </svg>
                    </button>
                  </div>
                  
                  {/* QR Code (collapsible) */}
                  {showQRForId === portfolio.id && (
                    <div className="flex justify-center mb-3 py-3 bg-white rounded-lg">
                      <QRCodeSVG 
                        value={generateLink(portfolio.id)}
                        size={150}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  )}
                  
                  {/* Link Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-lg p-2 text-xs text-zinc-400 font-mono truncate">
                      {generateLink(portfolio.id)}
                    </div>
                    <button
                      onClick={() => handleCopy(portfolio.id)}
                      className={`px-4 py-2 rounded-lg border font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-1 ${
                        copiedId === portfolio.id
                          ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600'
                      }`}
                    >
                      {copiedId === portfolio.id ? (
                        <>
                          <span>✓</span>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <span>📋</span>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <p className="text-center text-xs text-zinc-600 mt-4">
              Send the link to clients to pre-route their application
            </p>
          </div>
        </div>
      )}
    </>
  );
}
