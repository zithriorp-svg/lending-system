"use client";

import { useState } from "react";
import { fastForwardTime, reverseTime } from "./timeTravelActions";

export default function TimeTravelDebug() {
  const [loading, setLoading] = useState(false);

  const handleFastForward = async () => {
    setLoading(true);
    await fastForwardTime();
    setLoading(false);
  };

  const handleReverse = async () => {
    setLoading(true);
    await reverseTime();
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          ⏳ DEBUG: TIME CONTROL
        </h2>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded">TEMPORARY DEBUG TOOL</span>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={handleFastForward}
          disabled={loading}
          className="flex-1 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-400 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "..." : "⏩ FAST-FORWARD (7 Days)"}
        </button>

        <button 
          onClick={handleReverse}
          disabled={loading}
          className="flex-1 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "..." : "⏪ REVERSE (Back to Normal)"}
        </button>
      </div>
      
      <p className="text-xs text-zinc-500 mt-4 text-center">
        Warning: Fast-Forward pushes all pending due dates 7 days into the past to trigger overdue warnings. Reverse restores them.
      </p>
    </div>
  );
}
