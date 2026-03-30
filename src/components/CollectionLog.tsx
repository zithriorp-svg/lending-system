"use client";

import { useState, useEffect } from "react";

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
  expectedAmount?: number; // Optional - used for discount revocation calculation
  principalAmount?: number; // For calculating the revoked 4% discount
  onPenaltyApplied?: () => void;
}

export default function CollectionLog({ 
  installmentId, 
  penaltyFee, 
  status,
  expectedAmount = 0,
  principalAmount = 0,
  onPenaltyApplied 
}: CollectionLogProps) {
  const [notes, setNotes] = useState<CollectionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyingPenalty, setApplyingPenalty] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState(penaltyFee);

  // Fetch existing notes
  useEffect(() => {
    const controller = new AbortController();
    
    fetch(`/api/collection?installmentId=${installmentId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.notes) {
          setNotes(data.notes);
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
  }, [installmentId]);

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

  // REBATE TRAP: Calculate penalty as the revoked 4% Good Payer Discount
  // If principal is provided, use 4% of principal (the discount they lose)
  // Otherwise fall back to 6% of expected amount (simplified default penalty)
  const penaltyAmount = principalAmount > 0 
    ? Math.round(principalAmount * 0.04 * 100) / 100  // 4% of principal = revoked discount
    : Math.round(expectedAmount * 0.06 * 100) / 100;   // 6% fallback

  const handleApplyPenalty = async () => {
    setApplyingPenalty(true);
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'penalty',
          installmentId,
          penaltyAmount
        })
      });

      const data = await res.json();
      if (data.success && data.installment) {
        setCurrentPenalty(data.installment.penaltyFee);
        // Add the penalty log to notes
        setNotes(prev => [{
          id: Date.now(),
          note: `🚨 DISCOUNT REVOKED: 4% Good Payer Discount (₱${penaltyAmount.toLocaleString()}) forfeited. Total penalties: ₱${data.installment.penaltyFee}`,
          agentId: null,
          promisedDate: null,
          createdAt: new Date().toISOString()
        }, ...prev]);
        if (onPenaltyApplied) {
          onPenaltyApplied();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setApplyingPenalty(false);
  };

  // Only show for PENDING or LATE installments
  if (status === 'PAID') return null;

  return (
    <div className="mt-3 bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Collection Log</p>
        {currentPenalty > 0 && (
          <span className="text-xs text-rose-400 font-bold">
            Penalties: ₱{currentPenalty.toLocaleString()}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Log a note..."
          className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-sm p-2 rounded-lg outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={handleAddNote}
          disabled={saving || !noteText.trim()}
          className="px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "..." : "📝 Log"}
        </button>
        <button
          onClick={handleApplyPenalty}
          disabled={applyingPenalty}
          className="px-3 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {applyingPenalty ? "..." : "⚠️ Revoke Discount (Apply Penalty)"}
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <p className="text-xs text-zinc-500">Loading...</p>
      ) : notes.length > 0 ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {notes.slice(0, 5).map((note) => (
            <div key={note.id} className="text-xs bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
              <p className="text-zinc-300">{note.note}</p>
              <p className="text-zinc-600 mt-1">{formatDate(note.createdAt)}</p>
            </div>
          ))}
          {notes.length > 5 && (
            <p className="text-xs text-zinc-600 text-center">+{notes.length - 5} more notes</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">No collection notes yet</p>
      )}
    </div>
  );
}
