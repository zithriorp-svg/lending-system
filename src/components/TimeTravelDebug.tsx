"use client";

import { useState } from "react";

export default function TimeTravelDebug() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    installmentsUpdated?: number;
  } | null>(null);

  const handleFastForward = async () => {
    if (loading) return;

    // Confirm action
    if (!confirm(
      "⏳ DEBUG: Fast-Forward Time\n\n" +
      "This will set ALL pending installment due dates to 7 days in the past.\n\n" +
      "This is for TESTING purposes only. Continue?"
    )) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/debug/fast-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e) {
      setResult({ success: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-zinc-800 pt-6">
      <button
        onClick={handleFastForward}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 
                   bg-zinc-900/50 hover:bg-zinc-800/50 
                   border border-zinc-700/50 hover:border-zinc-600/50 
                   rounded-lg text-zinc-500 hover:text-zinc-400 
                   text-xs font-mono tracking-wide uppercase
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border border-zinc-500 border-t-transparent rounded-full"></span>
            <span>Fast-forwarding...</span>
          </>
        ) : (
          <>
            <span>⏳</span>
            <span>DEBUG: Fast-Forward Time</span>
          </>
        )}
      </button>

      {/* Result Display */}
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${
          result.success 
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {result.success ? (
            <div>
              <p className="font-bold">✓ {result.message}</p>
              {result.installmentsUpdated && (
                <p className="mt-1 text-amber-400/70">
                  {result.installmentsUpdated} installment(s) now overdue
                </p>
              )}
              <p className="mt-1 text-amber-400/50">Refreshing dashboard...</p>
            </div>
          ) : (
            <p className="font-bold">✗ {result.error}</p>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-[10px] text-zinc-600 font-mono">
        TEMPORARY DEBUG TOOL — Set pending installments 7 days overdue
      </p>
    </div>
  );
}
