"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { sendFBNotification, generateOverdueNotice, generateDueTodayNotice, generatePaymentReminder } from "@/utils/notifications";

interface AlertBase {
  id: number;
  loanId: number;
  clientId: number;
  period: number;
  dueDate: Date | string;
  expectedAmount: number;
  clientName: string;
  firstName: string;
  phone: string;
  agentName: string | null;
  penaltyFee: number;
  fbProfileUrl: string | null;
  messengerId: string | null;
  loan: any; // Full ledger data
}

interface OverdueAlert extends AlertBase { daysLate: number; }
interface DueTodayAlert extends AlertBase {}
interface UpcomingAlert extends AlertBase {}

interface DelinquencyAlertsProps {
  overdue: OverdueAlert[];
  dueToday: DueTodayAlert[];
  upcoming: UpcomingAlert[];
}

const formatCurrency = (value: number): string => "₱" + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (date: Date | string): string => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatPhone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '63' + cleaned.substring(1);
  if (cleaned.length === 10 && !cleaned.startsWith('63')) cleaned = '63' + cleaned;
  return cleaned;
};

// SVG Icons
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>
);

// Unified Communication Buttons using Full Force Ledger
function CommunicationButtons({ alert, type }: { alert: any, type: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' }) {
  const [copied, setCopied] = useState(false);
  const formattedPhone = formatPhone(alert.phone);
  
  // Generate the Full Force Message based on the status
  let message = "";
  if (type === 'OVERDUE') {
    const baseAmount = alert.expectedAmount;
    const discountAmount = baseAmount * 0.04;
    const totalAmount = baseAmount + discountAmount + (alert.penaltyFee || 0);
    message = generateOverdueNotice({
      clientName: alert.clientName,
      periodNumber: alert.period,
      daysLate: alert.daysLate || 0,
      baseAmount,
      discountAmount,
      penaltyAmount: alert.penaltyFee || 0,
      totalAmount,
      dueDate: alert.dueDate,
      loan: alert.loan
    });
  } else if (type === 'DUE_TODAY') {
    message = generateDueTodayNotice({ clientName: alert.clientName, amount: alert.expectedAmount, periodNumber: alert.period, loan: alert.loan });
  } else {
    message = generatePaymentReminder({ clientName: alert.clientName, amount: alert.expectedAmount, periodNumber: alert.period, dueDate: alert.dueDate, loan: alert.loan });
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  const smsUrl = `sms:${formattedPhone}?body=${encodedMessage}`;

  const handleFBClick = () => {
    sendFBNotification({
      message,
      clientName: alert.clientName,
      fbProfileUrl: alert.fbProfileUrl,
      messengerId: alert.messengerId,
      onCopy: () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* FB Notify Button */}
      <button
        onClick={handleFBClick}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
          copied ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400'
        }`}
        title="Copy message & open Facebook profile"
      >
        <MessengerIcon className="w-3.5 h-3.5" />
        {copied ? '✓' : 'FB'}
      </button>

      {/* WhatsApp & SMS */}
      {alert.phone ? (
        <>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap" title="Send WhatsApp notice">
            <WhatsAppIcon className="w-3.5 h-3.5" /> WA
          </a>
          <a href={smsUrl} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 text-zinc-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap" title="Send SMS notice">
            <Phone className="w-3.5 h-3.5" /> SMS
          </a>
        </>
      ) : (
        <span className="text-xs text-zinc-500 italic px-2">No phone</span>
      )}
    </div>
  );
}

// Penalty Enforcement Button Component
function PenaltyButton({ installmentId, loanId, clientName, onPenaltyApplied }: { installmentId: number; loanId: number; clientName: string; onPenaltyApplied: () => void; }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApplyPenalty = async () => {
    if (applying || applied) return;
    if (!confirm(`Apply ₱500 late fee and REVOKE 4% Good Payer Discount for ${clientName}?\n\nThis action cannot be undone.`)) return;

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
    return <span className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-bold rounded-lg whitespace-nowrap cursor-not-allowed">✓ Penalty Applied</span>;
  }

  return (
    <button onClick={handleApplyPenalty} disabled={applying} className="flex items-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" title="Apply ₱500 late fee and revoke 4% Good Payer Discount">
      {applying ? <><span className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full"></span></> : <><span>⚠️</span> Apply Penalty</>}
    </button>
  );
}

export default function DelinquencyAlerts({ overdue, dueToday, upcoming }: DelinquencyAlertsProps) {
  const totalAlerts = overdue.length + dueToday.length + upcoming.length;
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePenaltyApplied = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">🎯</span> Proactive HUD
        </h2>
        {totalAlerts > 0 && <span className="bg-zinc-700 text-zinc-300 text-xs px-3 py-1 rounded-full font-bold">{totalAlerts} total</span>}
      </div>

      <div className="space-y-6">
        {/* 🔴 CRITICAL - OVERDUE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Critical — Overdue</h3>
            {overdue.length > 0 && <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold">{overdue.length}</span>}
          </div>

          {overdue.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3"><p className="text-emerald-400 text-sm font-medium flex items-center gap-2"><span>✓</span> No overdue accounts</p></div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overdue.map((item) => (
                <div key={`overdue-${item.id}`} className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group">
                  <Link href={`/payments?clientId=${item.clientId}`} className="flex-1 min-w-0">
                    <p className="font-bold text-rose-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}</p>
                  </Link>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-xs text-rose-400 font-medium">{item.daysLate} {item.daysLate === 1 ? 'day' : 'days'} late</p>
                    </div>
                    
                    <CommunicationButtons alert={item} type="OVERDUE" />
                    
                    <PenaltyButton installmentId={item.id} loanId={item.loanId} clientName={item.clientName} onPenaltyApplied={handlePenaltyApplied} />
                    <Link href={`/payments?clientId=${item.clientId}`} className="bg-rose-500 text-white text-xs px-3 py-2 rounded-lg font-bold group-hover:bg-rose-400 transition-colors whitespace-nowrap">Process</Link>
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
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Due Today</h3>
            {dueToday.length > 0 && <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold">{dueToday.length}</span>}
          </div>

          {dueToday.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3"><p className="text-emerald-400 text-sm font-medium flex items-center gap-2"><span>✓</span> No payments due today</p></div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dueToday.map((item) => (
                <div key={`duetoday-${item.id}`} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group">
                  <Link href={`/payments?clientId=${item.clientId}`} className="flex-1 min-w-0">
                    <p className="font-bold text-yellow-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}</p>
                  </Link>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                    </div>
                    
                    <CommunicationButtons alert={item} type="DUE_TODAY" />
                    
                    <Link href={`/payments?clientId=${item.clientId}`} className="bg-yellow-500 text-black text-xs px-3 py-2 rounded-lg font-bold group-hover:bg-yellow-400 transition-colors whitespace-nowrap">Process</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔵 UPCOMING RADAR */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Upcoming Radar — Next 7 Days</h3>
            {upcoming.length > 0 && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">{upcoming.length}</span>}
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3"><p className="text-emerald-400 text-sm font-medium flex items-center gap-2"><span>✓</span> No upcoming payments this week</p></div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcoming.map((item) => (
                <div key={`upcoming-${item.id}`} className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group">
                  <Link href={`/payments?clientId=${item.clientId}`} className="flex-1 min-w-0">
                    <p className="font-bold text-blue-400 truncate">{item.clientName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">TXN-{item.loanId.toString().padStart(4, '0')} · Period {item.period}</p>
                  </Link>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-xs text-blue-400">Due {formatDate(item.dueDate)}</p>
                    </div>

                    <CommunicationButtons alert={item} type="UPCOMING" />

                    <Link href={`/payments?clientId=${item.clientId}`} className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition-colors whitespace-nowrap">Process</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalAlerts === 0 && (
        <div className="text-center py-6 border-t border-zinc-800 mt-6">
          <p className="text-emerald-400 font-bold text-lg">✓ All Clear</p>
          <p className="text-xs text-zinc-500 mt-1">No pending payments require attention</p>
        </div>
      )}
    </div>
  );
}
