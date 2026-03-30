"use client";
import { useState } from "react";

export default function ApplyLinksTrigger({ portfolios }: { portfolios: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = (id: string | number) => {
    // Read window safely ONLY inside the click event
    const link = `${window.location.origin}/apply?portfolioId=${id}`;
    navigator.clipboard.writeText(link);
    alert("Link Copied!");
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
        className="w-full h-full relative z-10 flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation focus:outline-none"
      >
        <span className="text-2xl mb-1">🔗</span>
        <span className="text-sm font-semibold text-gray-300">Copy Apply Links</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md relative z-[10000]">
            <h2 className="text-xl font-bold text-white mb-4">Application Links</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {portfolios.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                  <span className="text-white font-medium">{p.name}</span>
                  <button
                    onClick={() => handleCopy(p.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
