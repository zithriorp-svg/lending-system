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
  loan: any; 
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

// SVG Icons - Ensured they render properly
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
  </svg>
);

function CommunicationButtons({ alert, type }: { alert: any, type: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' }) {
  const [copied, setCopied] = useState(false);
  const formattedPhone = formatPhone(alert.phone);
  
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
    <div className="flex items-center gap-2">
      <button onClick={handleFBClick} className={`flex items-center justify-center p-2.5 w-10 h-10 rounded-xl transition-all shadow-sm ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/40 hover:text-white'}`} title="FB Notify">
        <MessengerIcon className="w-5 h-5" />
      </button>

      {alert.phone && (
        <>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-2.5 w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm" title="WhatsApp">
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          <a href={smsUrl} className="flex items-center justify-center p-2.5 w-10 h-10 bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl transition-all shadow-sm" title="SMS">
            <Phone className="w-5 h-5" />
          </a>
        </>
      )}
    </div>
  );
}

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
    return <span className="flex items-center justify-center px-4 py-2 w-full md:w-auto bg-slate-800 border border-slate-700 text-slate-500 text-xs font-bold rounded-xl whitespace-nowrap cursor-not-allowed text-center">✓ Penalty Applied</span>;
  }

  return (
    <button onClick={handleApplyPenalty} disabled={applying} className="flex items-center justify-center px-4 py-2 w-full md:w-auto bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center" title="Apply ₱500 late fee and revoke discount">
      {applying ? <span className="animate-spin w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full mx-auto"></span> : <span>⚠️ ENFORCE PENALTY</span>}
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
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-2xl font-sans font-medium text-slate-200">
      <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-slate-800">
        <h2 className="text-base md:text-lg font-black text-white uppercase tracking-widest flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl drop-shadow-md">🎯</span> PROACTIVE HUD
        </h2>
        {totalAlerts > 0 && <span className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)]">{totalAlerts} PENDING</span>}
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* 🔴 CRITICAL - OVERDUE */}
        <div className="bg-gradient-to-br from-rose-950/20 to-transparent p-4 md:p-5 rounded-2xl border border-rose-900/30">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
            <div className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-rose-500"></span>
            </div>
            <h3 className="text-xs md:text-sm font-black text-rose-400 uppercase tracking-widest">Critical — Overdue</h3>
            {overdue.length > 0 && <span className="bg-rose-500 text-white text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full font-black shadow-md">{overdue.length}</span>}
          </div>

          {overdue.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3"><span className="text-emerald-400 text-lg md:text-xl">✓</span> <p className="text-slate-300 text-xs md:text-sm font-bold tracking-wide">No overdue accounts.</p></div>
          ) : (
            <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
              {overdue.map((item) => (
                <div key={`overdue-${item.id}`} className="flex flex-col p-4 bg-slate-950/50 hover:bg-slate-900 border-l-4 border-l-rose-500 border-t border-r border-b border-slate-800 rounded-xl transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link href={`/payments?clientId=${item.clientId}`} className="block hover:underline decoration-rose-500/50 decoration-2 underline-offset-4">
                        <p className="font-black text-rose-400 text-base md:text-lg tracking-tight">{item.clientName}</p>
                      </Link>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">TXN-{item.loanId.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Period {item.period}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white text-base md:text-lg tracking-tight">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">{item.daysLate} {item.daysLate === 1 ? 'day' : 'days'} late</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between md:items-center w-full border-t border-slate-800/50 pt-4 mt-2">
                    <CommunicationButtons alert={item} type="OVERDUE" />
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <PenaltyButton installmentId={item.id} loanId={item.loanId} clientName={item.clientName} onPenaltyApplied={handlePenaltyApplied} />
                      <Link href={`/payments?clientId=${item.clientId}`} className="bg-rose-600 text-white text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-rose-900/30 hover:bg-rose-500 hover:shadow-rose-900/50 transition-all flex items-center justify-center text-center w-full md:w-auto whitespace-nowrap">PROCESS</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🟡 DUE TODAY */}
        <div className="bg-gradient-to-br from-amber-950/20 to-transparent p-4 md:p-5 rounded-2xl border border-amber-900/30">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            <h3 className="text-xs md:text-sm font-black text-amber-400 uppercase tracking-widest">Due Today</h3>
            {dueToday.length > 0 && <span className="bg-amber-500 text-slate-900 text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full font-black shadow-md">{dueToday.length}</span>}
          </div>

          {dueToday.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3"><span className="text-emerald-400 text-lg md:text-xl">✓</span> <p className="text-slate-300 text-xs md:text-sm font-bold tracking-wide">No payments due today.</p></div>
          ) : (
            <div className="space-y-3 md:space-y-4 max-h-[300px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
              {dueToday.map((item) => (
                <div key={`duetoday-${item.id}`} className="flex flex-col p-4 bg-slate-950/50 hover:bg-slate-900 border-l-4 border-l-amber-500 border-t border-r border-b border-slate-800 rounded-xl transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link href={`/payments?clientId=${item.clientId}`} className="block hover:underline decoration-amber-500/50 decoration-2 underline-offset-4">
                        <p className="font-black text-amber-400 text-base md:text-lg tracking-tight">{item.clientName}</p>
                      </Link>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">TXN-{item.loanId.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Period {item.period}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white text-base md:text-lg tracking-tight">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">MIDNIGHT</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between md:items-center w-full border-t border-slate-800/50 pt-4 mt-2">
                    <CommunicationButtons alert={item} type="DUE_TODAY" />
                    <Link href={`/payments?clientId=${item.clientId}`} className="bg-amber-500 text-slate-900 text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-amber-900/30 hover:bg-amber-400 hover:shadow-amber-900/50 transition-all flex items-center justify-center text-center w-full md:w-auto whitespace-nowrap">PROCESS</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔵 UPCOMING RADAR */}
        <div className="bg-gradient-to-br from-blue-950/20 to-transparent p-4 md:p-5 rounded-2xl border border-blue-900/30">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-400"></span>
            <h3 className="text-xs md:text-sm font-black text-blue-400 uppercase tracking-widest">Upcoming Radar — Next 7 Days</h3>
            {upcoming.length > 0 && <span className="bg-blue-500 text-white text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full font-black shadow-md">{upcoming.length}</span>}
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3"><span className="text-emerald-400 text-lg md:text-xl">✓</span> <p className="text-slate-300 text-xs md:text-sm font-bold tracking-wide">No upcoming payments this week.</p></div>
          ) : (
            <div className="space-y-3 md:space-y-4 max-h-[300px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
              {upcoming.map((item) => (
                <div key={`upcoming-${item.id}`} className="flex flex-col p-4 bg-slate-950/50 hover:bg-slate-900 border-l-4 border-l-blue-500 border-t border-r border-b border-slate-800 rounded-xl transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link href={`/payments?clientId=${item.clientId}`} className="block hover:underline decoration-blue-500/50 decoration-2 underline-offset-4">
                        <p className="font-black text-blue-400 text-base md:text-lg tracking-tight">{item.clientName}</p>
                      </Link>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">TXN-{item.loanId.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Period {item.period}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white text-base md:text-lg tracking-tight">{formatCurrency(item.expectedAmount)}</p>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{formatDate(item.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between md:items-center w-full border-t border-slate-800/50 pt-4 mt-2">
                    <CommunicationButtons alert={item} type="UPCOMING" />
                    <Link href={`/payments?clientId=${item.clientId}`} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center text-center w-full md:w-auto whitespace-nowrap">PROCESS</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalAlerts === 0 && (
        <div className="text-center py-10 border-t border-slate-800 mt-8">
          <p className="text-emerald-400 font-black text-2xl tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">ALL CLEAR</p>
          <p className="text-xs md:text-sm font-bold tracking-wide text-slate-500 mt-2 uppercase">No pending actions required.</p>
        </div>
      )}
    </div>
  );
}

