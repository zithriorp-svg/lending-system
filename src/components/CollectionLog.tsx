"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🚀 INJECTED: Next.js Router for instant refresh

interface CollectionNote {
  id: number;
  note: string;
  agentId: number | null;
  promisedDate: string | null;
  createdAt: string;
}

interface CollectionLogProps {
  installmentId: number;
  penaltyFee: number;
  status: string;
  expectedAmount?: number; 
  principalAmount?: number; 
  loanId?: number; // 🚀 INJECTED: Needed for the new God-Mode Engine
  onPenaltyApplied?: () => void;
}

export default function CollectionLog({ 
  installmentId, 
  penaltyFee, 
  status,
  expectedAmount = 0,
  principalAmount = 0,
  loanId,
  onPenaltyApplied 
}: CollectionLogProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<CollectionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  
  // 🚀 INJECTED: State locks to prevent double-clicking
  const [applyingPenalty, setApplyingPenalty] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState(penaltyFee);

  // Fetch existing notes
  useEffect(() => {
    const controller = new AbortController();
    
    fetch(`/api/collection?installmentId=${installmentId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.notes) {
          setNotes(data.notes);
          // 🚀 Check if a penalty was already applied in the past to lock the button on load
          const hasPenaltyNote = data.notes.some((n: any) => n.note.includes("DISCOUNT REVOKED"));
          if (hasPenaltyNote || penaltyFee > 0) {
            setPenaltyApplied(true);
          }
        }
        setLoading(false);
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          console.error(e);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [installmentId, penaltyFee]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note',
          installmentId,
          note: noteText.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.note) {
        setNotes(prev => [data.note, ...prev]);
        setNoteText("");
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  // 🚀 REWIRED: Pointing to our God-Mode Engine
  const handleApplyPenalty = async () => {
    if (applyingPenalty || penaltyApplied) return;
    if (!loanId) {
      alert("Error: Loan ID missing. Cannot apply penalty from this view.");
      return;
    }
    
    if (!confirm("REVOKE the 4% Good Payer Discount?\n\nThis action cannot be undone.")) return;

    setApplyingPenalty(true);
    try {
      const res = await fetch('/api/enforce-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId,
          loanId
        })
      });

      const data = await res.json();
      if (data.success) {
        setPenaltyApplied(true); // 🚀 Lock the button permanently
        setCurrentPenalty(prev => prev + 40.00); // Visually update the penalty
        
        // Add the penalty log to notes instantly
        setNotes(prev => [{
          id: Date.now(),
          note: `🚨 DISCOUNT REVOKED: 4% Good Payer Discount (₱40.00) forfeited. \nTotal penalties: ₱${(currentPenalty + 40.00).toFixed(2)}`,
          agentId: null,
          promisedDate: null,
          createdAt: new Date().toISOString()
        }, ...prev]);

        if (onPenaltyApplied) {
          onPenaltyApplied();
        }
        
        // Force the page to refresh data
        router.refresh();
      } else {
        alert(data.error || "Failed to apply penalty.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error while applying penalty.");
    }
    setApplyingPenalty(false);
  };

  // Only show for PENDING, PARTIAL, or LATE installments
  if (status === 'PAID') return null;

  return (
    <div className="mt-3 bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Collection Log</p>
        {currentPenalty > 0 && (
          <span className="text-xs text-rose-400 font-bold">
            Penalties: ₱{currentPenalty.toFixed(2)}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Log a note..."
            className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-700 text-white text-sm p-2 rounded-lg outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={handleAddNote}
            disabled={saving || !noteText.trim()}
            className="px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "..." : "📝 Log"}
          </button>
        </div>
        
        {/* 🚀 UPGRADED PENALTY BUTTON */}
        <button
          onClick={handleApplyPenalty}
          disabled={applyingPenalty || penaltyApplied}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            penaltyApplied 
            ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed" 
            : "bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {applyingPenalty ? "..." : penaltyApplied ? "✓ Discount Revoked" : "⚠️ Revoke Discount (Apply Penalty)"}
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <p className="text-xs text-zinc-500">Loading...</p>
      ) : notes.length > 0 ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {notes.slice(0, 6).map((note) => {
            const isPenalty = note.note.includes("DISCOUNT REVOKED");
            return (
              <div key={note.id} className={`text-xs p-2 rounded-lg border ${isPenalty ? 'bg-rose-950/20 border-rose-900/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
                <p className={isPenalty ? 'text-rose-300 font-medium' : 'text-zinc-300'}>{note.note}</p>
                <p className={`${isPenalty ? 'text-rose-500/70' : 'text-zinc-600'} mt-1 flex items-center gap-1`}>
                  {isPenalty && <span>⚠️</span>} {formatDate(note.createdAt)}
                </p>
              </div>
            );
          })}
          {notes.length > 6 && (
            <p className="text-xs text-zinc-600 text-center">+{notes.length - 6} more notes</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">No collection notes yet</p>
      )}
    </div>
  );
}

