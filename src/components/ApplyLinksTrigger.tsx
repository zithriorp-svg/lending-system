"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ApplyLinksTrigger({ portfolios = [] }: { portfolios: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (id: string | number) => {
    const link = `${window.location.origin}/apply?portfolioId=${id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(link);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
    
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const modalContent = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', zIndex: 1000000, color: 'white' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '16px' }}>Application Links</h2>
        
        <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {portfolios && portfolios.length > 0 ? (
            portfolios.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272a', border: '1px solid #3f3f46', padding: '16px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <button
                  onClick={() => handleCopy(p.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: copiedId === p.id ? '#059669' : '#2563eb',
                    color: 'white'
                  }}
                >
                  {copiedId === p.id ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No portfolios available.</p>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(false)}
          style={{ marginTop: '24px', width: '100%', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );

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

      {isModalOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
