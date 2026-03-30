"use client";

import Link from "next/link";

interface Portfolio {
  id: number;
  name: string;
}

interface QuickActionsGridProps {
  isAdmin: boolean;
  portfolios: Portfolio[];
}

export default function QuickActionsGrid({ isAdmin, portfolios }: QuickActionsGridProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* RBAC: Admin-only actions */}
        {isAdmin && (
          <>
            <Link 
              href="/analytics" 
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 rounded-xl border border-blue-500/30 transition-all font-bold text-white tracking-wide cursor-pointer"
            >
              <span className="text-2xl mb-1">📈</span>
              <span>Analytics</span>
            </Link>
            <Link 
              href="/agents" 
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 rounded-xl border border-emerald-500/30 transition-all font-bold text-white tracking-wide cursor-pointer"
            >
              <span className="text-2xl mb-1">🤝</span>
              <span>Agents</span>
            </Link>
          </>
        )}
        
        {/* Actions visible to ALL users */}
        <Link 
          href="/apply" 
          className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer"
        >
          <span className="text-2xl mb-1">⊕</span>
          <span>New Application</span>
        </Link>
        
        {/* Scan to Apply Button - Dedicated */}
        <button
          type="button"
          onClick={() => {
            // Open the modal directly here
            const modal = document.getElementById('scan-to-apply-modal');
            if (modal) {
              modal.classList.remove('hidden');
            }
          }}
          className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer"
        >
          <span className="text-2xl mb-1">📱</span>
          <span>Scan to Apply</span>
        </button>
        
        <Link 
          href="/payments" 
          className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer"
        >
          <span className="text-2xl mb-1">💵</span>
          <span>Process Payment</span>
        </Link>
        <Link 
          href="/clients" 
          className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer"
        >
          <span className="text-2xl mb-1">👥</span>
          <span>Clients</span>
        </Link>
        
        {/* RBAC: Treasury - ADMIN ONLY */}
        {isAdmin && (
          <Link 
            href="/treasury" 
            className="flex flex-col items-center justify-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all font-bold text-white tracking-wide cursor-pointer"
          >
            <span className="text-2xl mb-1">🏦</span>
            <span>Treasury</span>
          </Link>
        )}
      </div>
      
      {/* Modal for Scan to Apply */}
      <div 
        id="scan-to-apply-modal" 
        className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
          }
        }}
      >
        <div 
          className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              const modal = document.getElementById('scan-to-apply-modal');
              if (modal) modal.classList.add('hidden');
            }}
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
              Copy the link for each portfolio
            </p>
          </div>

          {/* Portfolio List */}
          <div className="space-y-3">
            {portfolios.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No portfolios found</p>
            ) : (
              portfolios.map((portfolio) => (
                <div 
                  key={portfolio.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold">{portfolio.name}</span>
                      <span className="text-xs text-zinc-500">ID: {portfolio.id}</span>
                    </div>
                  </div>
                  
                  {/* Link Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-lg p-2 text-xs text-zinc-400 font-mono truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/apply?portfolioId=${portfolio.id}` : `/apply?portfolioId=${portfolio.id}`}
                    </div>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/apply?portfolioId=${portfolio.id}`;
                        navigator.clipboard.writeText(link).then(() => {
                          alert('Link copied!');
                        }).catch(() => {
                          // Fallback
                          const textArea = document.createElement("textarea");
                          textArea.value = link;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand("copy");
                          document.body.removeChild(textArea);
                          alert('Link copied!');
                        });
                      }}
                      className="px-4 py-2 rounded-lg border font-bold text-sm uppercase tracking-wider transition-all bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-zinc-600 mt-4">
            Send the link to clients to pre-route their application
          </p>
        </div>
      </div>
    </div>
  );
}
