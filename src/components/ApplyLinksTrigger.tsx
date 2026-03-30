"use client";
import { useState } from "react";

export default function ApplyLinksTrigger({ portfolios }: { portfolios: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = (id: string | number) => {
    const link = `${window.location.origin}/apply?portfolioId=${id}`;
    navigator.clipboard.writeText(link);
    alert("Link Copied!");
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col items-center justify-center p-4 cursor-pointer text-center w-full h-full"
      >
        <span className="text-2xl mb-1">🔗</span>
        <span className="text-sm font-bold text-white tracking-wide">Copy Apply Links</span>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md relative z-[10000]">
            <h2 className="text-xl font-bold text-white mb-4">Application Links</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {portfolios.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row justify-between items-center bg-gray-800 p-3 rounded gap-3">
                  <span className="text-white font-medium">{p.name}</span>
                  <button
                    onClick={() => handleCopy(p.id)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold touch-manipulation"
                  >
                    Copy Link
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
