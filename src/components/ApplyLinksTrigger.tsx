"use client";

import { useState } from "react";

export default function ApplyLinksTrigger({ portfolios }: { portfolios: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const handleCopy = (id: string | number) => {
    // Generate the exact link for this specific portfolio
    const link = `${window.location.origin}/apply?portfolioId=${id}`;
    navigator.clipboard.writeText(link);
    
    // Show a smooth "Copied!" state instead of an annoying alert
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer w-full h-full focus:outline-none"
      >
        <span className="text-2xl mb-1">🔗</span>
        <span>Copy Apply Links</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md relative z-[10000] shadow-2xl">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-wider mb-4">Application Links</h2>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {portfolios.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-zinc-800 border border-zinc-700 p-4 rounded-xl">
                  <span className="text-white font-bold">{p.name}</span>
                  <button
                    onClick={() => handleCopy(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      copiedId === p.id 
                        ? 'bg-emerald-600 text-white border border-emerald-500/50' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50'
                    }`}
                  >
                    {copiedId === p.id ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-3 rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
