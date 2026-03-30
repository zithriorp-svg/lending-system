"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

interface OverdueAlert {
  id: number;
  loanId: number;
  clientId: number;
  period: number;
  dueDate: Date;
  expectedAmount: number;
  clientName: string;
  firstName: string;
  phone: string;
  agentName: string | null;
  daysLate: number;
}

interface DueTodayAlert {
  id: number;
  loanId: number;
  clientId: number;
  period: number;
  dueDate: Date;
  expectedAmount: number;
  clientName: string;
  firstName: string;
  phone: string;
  agentName: string | null;
}

interface UpcomingAlert {
  id: number;
  loanId: number;
  clientId: number;
  period: number;
  dueDate: Date;
  expectedAmount: number;
  clientName: string;
}

interface DelinquencyAlertsProps {
  overdue: OverdueAlert[];
  dueToday: DueTodayAlert[];
  upcoming: UpcomingAlert[];
}

// Format currency
const formatCurrency = (value: number): string => {
  return "₱" + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format date
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format phone number for WhatsApp/SMS - strip non-numeric, handle country code
const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Strip all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0, replace with 63 (Philippines country code)
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.substring(1);
  }
  // If doesn't start with country code, assume Philippines
  if (cleaned.length === 10 && !cleaned.startsWith('63')) {
    cleaned = '63' + cleaned;
  }
  return cleaned;
};

// Generate message templates
const generateDueTodayMessage = (firstName: string, amount: number, period: number, agentName: string | null): string => {
  let message = `Hello ${firstName}, this is a formal reminder from FinTech Vault. Your payment of ${formatCurrency(amount)} for Installment ${period} is DUE TODAY. Please settle your account to maintain your Excellent risk rating.`;
  if (agentName) {
    message += ` (Assigned Officer: ${agentName})`;
  }
  return message;
};

const generateOverdueMessage = (firstName: string, amount: number, daysLate: number, agentName: string | null): string => {
  let message = `URGENT: ${firstName}, your FinTech Vault payment of ${formatCurrency(amount)} is currently ${daysLate} DAYS OVERDUE. Immediate payment is required to prevent penalties. Please contact your agent immediately.`;
  if (agentName) {
    message += ` (Assigned Officer: ${agentName})`;
  }
  return message;
};

// WhatsApp Icon SVG component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Communication buttons component - Direct links
function CommunicationButtons({
  phone,
  firstName,
  amount,
  period,
  daysLate,
  agentName,
  isOverdue
}: {
  phone: string;
  firstName: string;
  amount: number;
  period: number;
  daysLate?: number;
  agentName: string | null;
  isOverdue: boolean;
}) {
  const formattedPhone = formatPhone(phone);
  const message = isOverdue
    ? generateOverdueMessage(firstName, amount, daysLate || 0, agentName)
    : generateDueTodayMessage(firstName, amount, period, agentName);
  const encodedMessage = encodeURIComponent(message);

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  const smsUrl = `sms:${formattedPhone}?body=${encodedMessage}`;

  if (!phone) {
    return <span className="text-xs text-zinc-500 italic px-3 py-2">No phone</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
        title="Send WhatsApp notice"
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        WhatsApp
      </a>
      <a
        href={smsUrl}
        className="flex items-center gap-1 px-2 py-2 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 text-zinc-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
        title="Send SMS notice"
      >
        <Phone className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// Penalty Enforcement Button Component
function PenaltyButton({
  installmentId,
  loanId,
  clientName,
  onPenaltyApplied
}: {
  installmentId: number;
  loanId: number;
  clientName: string;
  onPenaltyApplied: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApplyPenalty = async () => {
    if (applying || applied) return;
    
    // Confirm action
    if (!confirm(`Apply ₱500 late fee and REVOKE 4% Good Payer Discount for ${clientName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setApplying(true);

    try {
      const res = await fetch('/api/enforce-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installmentId, loanId })
      });

      const data = await res.json();

      if (data.success) {
        setApplied(true);
        onPenaltyApplied();
      } else {
        alert(data.error || 'Failed to apply penalty');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setApplying(false);
    }
  };

  if (applied) {
    return (
      <span className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-bold rounded-lg whitespace-nowrap cursor-not-allowed">
        ✓ Penalty Applied
      </span>
    );
  }

  return (
    <button
      onClick={handleApplyPenalty}
      disabled={applying}
      className="flex items-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      title="Apply ₱500 late fee and revoke 4% Good Payer Discount"
    >
      {applying ? (
        <>
          <span className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full"></span>
          Applying...
        </>
      ) : (
        <>
          <span>⚠️</span>
          Apply Penalty
        </>
      )}
    </button>
  );
}

export default function DelinquencyAlerts({ overdue, dueToday, upcoming }: DelinquencyAlertsProps) {
  const totalAlerts = overdue.length + dueToday.length + upcoming.length;
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback to refresh the parent component when penalty is applied
  const handlePenaltyApplied = () => {
    setRefreshKey(prev => prev + 1);
    // Trigger a page refresh to show updated data
    window.location.reload();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">🎯</span> Proactive HUD
        </h2>
        {totalAlerts > 0 && (
          <span className="bg-zinc-700 text-zinc-300 text-xs px-3 py-1 rounded-full font-bold">
            {totalAlerts} total
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* 🔴 CRITICAL - OVERDUE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Critical — Overdue
            </h3>
            {overdue.length > 0 && (
              <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {overdue.length}
              </span>
            )}
          </div>

          {overdue.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span>✓</span> No overdue accounts
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overdue.map((item) => (
                <div
                  key={`overdue-${item.id}`}
                  className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group"
                >
                  <Link
                    href={`/payments?clientId=${item.clientId}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-bold text-rose-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-xs text-rose-400 font-medium">
                        {item.daysLate} {item.daysLate === 1 ? 'day' : 'days'} late
                      </p>
                    </div>
                    <CommunicationButtons
                      phone={item.phone}
                      firstName={item.firstName}
                      amount={item.expectedAmount}
                      period={item.period}
                      daysLate={item.daysLate}
                      agentName={item.agentName}
                      isOverdue={true}
                    />
                    {/* ENFORCEMENT: Penalty Button */}
                    <PenaltyButton
                      installmentId={item.id}
                      loanId={item.loanId}
                      clientName={item.clientName}
                      onPenaltyApplied={handlePenaltyApplied}
                    />
                    <Link
                      href={`/payments?clientId=${item.clientId}`}
                      className="bg-rose-500 text-white text-xs px-3 py-2 rounded-lg font-bold group-hover:bg-rose-400 transition-colors whitespace-nowrap"
                    >
                      Process
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🟡 DUE TODAY */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Due Today
            </h3>
            {dueToday.length > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {dueToday.length}
              </span>
            )}
          </div>

          {dueToday.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span>✓</span> No payments due today
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dueToday.map((item) => (
                <div
                  key={`duetoday-${item.id}`}
                  className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group"
                >
                  <Link
                    href={`/payments?clientId=${item.clientId}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-bold text-yellow-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                    </div>
                    <CommunicationButtons
                      phone={item.phone}
                      firstName={item.firstName}
                      amount={item.expectedAmount}
                      period={item.period}
                      agentName={item.agentName}
                      isOverdue={false}
                    />
                    <Link
                      href={`/payments?clientId=${item.clientId}`}
                      className="bg-yellow-500 text-black text-xs px-3 py-2 rounded-lg font-bold group-hover:bg-yellow-400 transition-colors whitespace-nowrap"
                    >
                      Process
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔵 UPCOMING RADAR (Next 7 Days) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Upcoming Radar — Next 7 Days
            </h3>
            {upcoming.length > 0 && (
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {upcoming.length}
              </span>
            )}
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span>✓</span> No upcoming payments this week
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcoming.map((item) => (
                <div
                  key={`upcoming-${item.id}`}
                  className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                >
                  <Link
                    href={`/payments?clientId=${item.clientId}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-bold text-blue-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}
                    </p>
                  </Link>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-xs text-blue-400">
                        Due {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <Link
                      href={`/payments?clientId=${item.clientId}`}
                      className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition-colors whitespace-nowrap"
                    >
                      Process
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Clear State */}
      {totalAlerts === 0 && (
        <div className="text-center py-6 border-t border-zinc-800 mt-6">
          <p className="text-emerald-400 font-bold text-lg">✓ All Clear</p>
          <p className="text-xs text-zinc-500 mt-1">No pending payments require attention</p>
        </div>
      )}
    </div>
  );
}
