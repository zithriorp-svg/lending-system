"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateLedgerSummary, type LoanData } from "@/utils/notifications";

interface InstallmentForLedger {
  period: number; dueDate: Date | string; expectedAmount: number;
  principal: number; interest: number; penaltyFee: number;
  status: string; paymentDate: Date | string | null; amountPaid: number;
}

interface LoanForLedger {
  id: number; principal: number; interestRate: number; termDuration: number;
  totalRepayment: number; totalPaid: number; remainingBalance: number;
  startDate: Date | string; endDate: Date | string; status: string;
  goodPayerDiscountRevoked: boolean; installments: InstallmentForLedger[];
}

interface ActiveClient {
  loanId: number; clientId: number; clientName: string; firstName: string;
  phone: string; originalPrincipal: number; remainingBalance: number;
  nextDueDate: string | null; nextDueAmount: number | null; nextDuePeriod: number | null;
  status: 'OVERDUE' | 'ON_TRACK'; daysLate: number; fbProfileUrl: string | null;
  messengerId: string | null; loan: LoanForLedger;
}

interface AgentData {
  id: number; name: string; phone: string; username?: string | null; createdAt: Date;
  activeClients: ActiveClient[]; totalRiskLiability: number; pendingCommission: number;
  totalLifetimeEarnings: number; totalCollected: number; commissionsCount: number;
  overdueCount: number; onTrackCount: number; totalActiveLoans: number;
}

const formatCurrency = (value: number | null) => `₱${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatShortDate = (dateStr: string | Date | null) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================================
// NOTIFICATION ENGINES
// ============================================================================
const generateOverdueMessage = (clientName: string, period: number, dueDate: Date | string, daysLate: number, expectedAmount: number, loan: LoanForLedger): string => {
  const baseAmount = expectedAmount; const goodPayerDiscount = baseAmount * 0.04;
  const penaltyFee = 500; const totalAmount = baseAmount + goodPayerDiscount + penaltyFee;
  let message = `URGENT ACCOUNT NOTICE ⚠️\n\nHello ${clientName},\n\nOur records indicate that your payment for Installment #${period} is currently OVERDUE.\n\n🚨 PENALTY & DISCOUNT FORFEITURE:\nBecause this payment is late, your Good Payer Discount has been strictly REVOKED.\n- Base Installment: ${formatCurrency(baseAmount)}\n- Revoked Discount: + ${formatCurrency(goodPayerDiscount)}\n- Applied Late Fees: + ${formatCurrency(penaltyFee)}\n----------------------------------\n📌 TOTAL OVERDUE FOR INST #${period}: ${formatCurrency(totalAmount)}\n\n📅 MISSED DUE DATE: ${formatShortDate(dueDate)}\n`;
  message += `\nPlease settle your overdue balance immediately to prevent further penalties or account escalation.\n\n- FinTech Vault Collections`;
  return message;
};

const generateReminderMessage = (clientName: string, period: number, dueDate: Date | string, expectedAmount: number, loan: LoanForLedger): string => {
  let message = `UPCOMING PAYMENT REMINDER 🔔\n\nHello ${clientName},\n\nThis is a reminder that your next payment for Installment #${period} is due soon.\n\n📌 AMOUNT DUE: ${formatCurrency(expectedAmount)} (Includes your 6% Good Payer rate)\n📅 DUE DATE: ${formatShortDate(dueDate)}\n\n🚨 IMPORTANT: If you pay late, the 4% discount is no longer applicable and you will be charged the standard 10% contract rate plus penalties.\n`;
  message += `\n- FinTech Vault Collections`;
  return message;
};

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>
);

function FBNotifyButton({ message, clientName, fbProfileUrl, messengerId }: { message: string; clientName: string; fbProfileUrl: string | null; messengerId: string | null; }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    navigator.clipboard.writeText(message);
    let profileUrl = fbProfileUrl ? (fbProfileUrl.startsWith('http') ? fbProfileUrl : `https://${fbProfileUrl}`) : (messengerId ? (messengerId.startsWith('http') ? messengerId : `https://${messengerId}`) : `https://www.facebook.com/search/people/?q=${encodeURIComponent(clientName)}`);
    window.open(profileUrl, '_blank');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleClick} className={`flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg ${copied ? 'bg-emerald-600 border border-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 border border-blue-500/50 text-white'}`}>
      <MessengerIcon className="w-4 h-4" /> {copied ? '✓ COPIED & OPENED' : 'ONE-CLICK STRIKE (FB)'}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AgentPortalClient({ agent }: { agent: AgentData }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    if (!confirm("Logout from Agent Portal?")) return;
    setLoggingOut(true);
    try { await fetch('/api/agent-auth/logout', { method: 'POST' }); router.push('/agent-portal'); } catch (e) {} finally { setLoggingOut(false); }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Booting Tactical HUD...</p>
      </div>
    );
  }

  const overdueClients = agent.activeClients.filter(c => c.status === 'OVERDUE');
  const onTrackClients = agent.activeClients.filter(c => c.status === 'ON_TRACK');

  // 📊 CALCULATING PORTFOLIO HEALTH
  let paidCount = 0; let partialCount = 0; let pendingCount = 0; let lateCount = 0;
  agent.activeClients.forEach(client => {
    client.loan.installments.forEach(inst => {
      const isLate = new Date(inst.dueDate) < new Date() && inst.status === "PENDING";
      if (inst.status === "PAID") paidCount++;
      else if (inst.status === "PARTIAL") partialCount++;
      else if (isLate) lateCount++;
      else pendingCount++;
    });
  });

  const totalInst = paidCount + partialCount + pendingCount + lateCount;
  const latePct = totalInst > 0 ? (lateCount / totalInst) * 100 : 0;
  const paidPct = totalInst > 0 ? (paidCount / totalInst) * 100 : 0;
  const partialPct = totalInst > 0 ? (partialCount / totalInst) * 100 : 0;
  const pendingPct = totalInst > 0 ? (pendingCount / totalInst) * 100 : 100; // Default pending if no loans

  // 📊 CASH FLOW VELOCITY MATRIX DATA
  const chartData = [
    { week: 'W1', capitalOut: agent.totalRiskLiability * 0.1, capitalIn: agent.totalCollected * 0.05 },
    { week: 'W3', capitalOut: agent.totalRiskLiability * 0.3, capitalIn: agent.totalCollected * 0.2 },
    { week: 'W5', capitalOut: agent.totalRiskLiability * 0.5, capitalIn: agent.totalCollected * 0.4 },
    { week: 'W7', capitalOut: agent.totalRiskLiability * 0.7, capitalIn: agent.totalCollected * 0.6 },
    { week: 'W9', capitalOut: agent.totalRiskLiability * 0.9, capitalIn: agent.totalCollected * 0.8 },
    { week: 'W12', capitalOut: agent.totalRiskLiability, capitalIn: agent.totalCollected }
  ];
  
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.capitalOut, d.capitalIn)), 1000);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 font-sans">
      
      {/* SECURITY HEADER */}
      <div className="flex justify-between items-center pt-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-900/50 border border-emerald-500/50 rounded-xl flex items-center justify-center text-xl">🛡️</div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">Agent HUD</h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-widest mt-1">SECURE UPLINK ESTABLISHED</p>
          </div>
        </div>
        <button onClick={handleLogout} disabled={loggingOut} className="text-[10px] font-bold uppercase tracking-widest bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 px-4 py-2 rounded-lg border border-rose-500/30 transition-colors">
          {loggingOut ? "DISCONNECTING..." : "DISCONNECT"}
        </button>
      </div>

      {/* AGENT IDENTITY STRIP */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-5 shadow-2xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
        <div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Operative Identity</p>
          <p className="text-2xl font-black text-white uppercase tracking-wide">{agent.name}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Clearance Level</p>
           <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/30">LEVEL 2 : FIELD AGENT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 🚀 IRONCLAD NATIVE CHART: CASH FLOW VELOCITY MATRIX */}
        <div className="md:col-span-2 bg-black border border-[#00ff00]/30 rounded-2xl p-6 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-[#00ff00] uppercase tracking-widest flex items-center gap-2">
                <span className="animate-pulse">●</span> Cash Flow Velocity
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded">90-DAY MATRIX</span>
           </div>
           
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4">
                 <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">Capital Deployed</p>
                 <p className="text-xl md:text-2xl font-black text-rose-500">{formatCurrency(agent.totalRiskLiability)}</p>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Capital Recovered</p>
                 <p className="text-xl md:text-2xl font-black text-emerald-500">{formatCurrency(agent.totalCollected)}</p>
              </div>
           </div>

           <div className="h-48 w-full flex items-end justify-between gap-1 md:gap-2 border-b border-zinc-800 pb-2 relative mt-12">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 bg-zinc-800 border border-zinc-700 text-white text-[10px] p-2 rounded-lg pointer-events-none transition-opacity z-10 whitespace-nowrap shadow-xl">
                    <p className="text-[#00ff00] font-bold">IN: {formatCurrency(d.capitalIn)}</p>
                    <p className="text-[#00bcd4] font-bold">OUT: {formatCurrency(d.capitalOut)}</p>
                  </div>
                  <div className="flex items-end justify-center gap-0.5 md:gap-1 w-full h-full">
                    <div className="w-1/3 max-w-[16px] bg-gradient-to-t from-[#00bcd4] to-[#008ba3] rounded-t-sm transition-all duration-500" style={{ height: `${Math.max((d.capitalOut / maxChartValue) * 100, 2)}%` }}></div>
                    <div className="w-1/3 max-w-[16px] bg-gradient-to-t from-[#00ff00] to-[#009900] rounded-t-sm transition-all duration-500" style={{ height: `${Math.max((d.capitalIn / maxChartValue) * 100, 2)}%` }}></div>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-mono text-zinc-500 mt-2">{d.week}</span>
                </div>
              ))}
           </div>
           <div className="flex justify-center gap-6 mt-4">
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00ff00] rounded-sm"></div><span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">◆ CAPITAL IN</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00bcd4] rounded-sm"></div><span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">◆ CAPITAL OUT</span></div>
           </div>
        </div>

        {/* 🚀 IRONCLAD NATIVE CHART: PORTFOLIO HEALTH (DONUT) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-8">
            Micro-Portfolio Health (Installments)
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            
            {/* CSS DONUT CHART */}
            <div className="relative w-48 h-48 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" style={{
                background: `conic-gradient(
                  #f43f5e 0% ${latePct}%,
                  #10b981 ${latePct}% ${latePct + paidPct}%,
                  #38bdf8 ${latePct + paidPct}% ${latePct + paidPct + partialPct}%,
                  #eab308 ${latePct + paidPct + partialPct}% 100%
                )`
              }}>
              <div className="absolute inset-4 bg-zinc-900 rounded-full flex flex-col items-center justify-center border border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <span className="text-3xl font-black text-white">{totalInst}</span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest">TOTAL</span>
              </div>
            </div>

            {/* LEGEND */}
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between w-32 border-b border-zinc-800 pb-2">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div><span className="text-xs text-zinc-400">Late</span></div>
                 <span className="font-mono text-xs font-bold text-rose-400">{lateCount}</span>
               </div>
               <div className="flex items-center justify-between w-32 border-b border-zinc-800 pb-2">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div><span className="text-xs text-zinc-400">Paid</span></div>
                 <span className="font-mono text-xs font-bold text-emerald-400">{paidCount}</span>
               </div>
               <div className="flex items-center justify-between w-32 border-b border-zinc-800 pb-2">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 rounded-sm"></div><span className="text-xs text-zinc-400">Partial</span></div>
                 <span className="font-mono text-xs font-bold text-sky-400">{partialCount}</span>
               </div>
               <div className="flex items-center justify-between w-32">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div><span className="text-xs text-zinc-400">Pending</span></div>
                 <span className="font-mono text-xs font-bold text-yellow-400">{pendingCount}</span>
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* COMMISSION FORECASTER */}
      <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-9xl opacity-5">💰</div>
        <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-4">Commission Forecaster (40% Cut)</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Unlocked Payout</p>
            <p className="text-3xl md:text-4xl font-black text-amber-500">{formatCurrency(agent.pendingCommission)}</p>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-2 font-medium">Ready for immediate withdrawal</p>
          </div>
          <div>
             <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Projected Week Pipeline</p>
             <p className="text-xl md:text-2xl font-black text-emerald-500">+{formatCurrency(agent.totalRiskLiability * 0.05 * 0.40)}</p>
             <p className="text-[10px] md:text-xs text-zinc-500 mt-2 font-medium">If all clients pay on time</p>
          </div>
        </div>
      </div>

      {/* TACTICAL COLLECTION QUEUE (OVERDUE) */}
      {overdueClients.length > 0 && (
        <div className="bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl p-1 shadow-2xl">
          <div className="bg-rose-900/50 p-4 rounded-t-xl flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="animate-pulse">🚨</span> Critical Strike Queue</h2>
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded">{overdueClients.length} TARGETS</span>
          </div>
          
          <div className="p-2 space-y-2">
            {overdueClients.map(client => (
              <div key={client.loanId} className="bg-zinc-950 border border-rose-900/50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-black text-white uppercase">{client.clientName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono tracking-widest mt-1">TXN-{client.loanId.toString().padStart(4, '0')} • {client.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{client.daysLate} DAYS DELINQUENT</p>
                    <p className="text-xl font-black text-rose-400">{formatCurrency(client.nextDueAmount || 0)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link href={`/payments?clientId=${client.clientId}`} className="flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-colors shadow-lg">
                    ⚡ Process Payment
                  </Link>
                  <FBNotifyButton message={generateOverdueMessage(client.clientName, client.nextDuePeriod || 1, client.nextDueDate || new Date(), client.daysLate, client.nextDueAmount || 0, client.loan)} clientName={client.clientName} fbProfileUrl={client.fbProfileUrl} messengerId={client.messengerId} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STANDARD MONITORING (ON-TRACK) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><span>📡</span> Standard Monitoring</h2>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{onTrackClients.length} ON TRACK</span>
         </div>

         {onTrackClients.length === 0 ? (
           <p className="text-center text-zinc-600 text-sm py-4">No active clients assigned to your sector.</p>
         ) : (
           <div className="space-y-3">
             {onTrackClients.slice(0, 5).map(client => (
               <div key={client.loanId} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-sm font-black text-white uppercase">{client.clientName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-1">DUE: {formatDate(client.nextDueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-emerald-400 mr-2">{formatCurrency(client.nextDueAmount || 0)}</p>
                    <Link href={`/payments?clientId=${client.clientId}`} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors border border-zinc-700">Process</Link>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>

    </div>
  );
}
