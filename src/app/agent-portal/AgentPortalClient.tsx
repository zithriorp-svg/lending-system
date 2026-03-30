"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateLedgerSummary, type LoanData } from "@/utils/notifications";

interface InstallmentForLedger {
  period: number;
  dueDate: Date | string;
  expectedAmount: number;
  principal: number;
  interest: number;
  penaltyFee: number;
  status: string;
  paymentDate: Date | string | null;
  amountPaid: number;
}

interface LoanForLedger {
  id: number;
  principal: number;
  interestRate: number;
  termDuration: number;
  totalRepayment: number;
  totalPaid: number;
  remainingBalance: number;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  goodPayerDiscountRevoked: boolean;
  installments: InstallmentForLedger[];
}

interface ActiveClient {
  loanId: number;
  clientId: number;
  clientName: string;
  firstName: string;
  phone: string;
  originalPrincipal: number;
  remainingBalance: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  nextDuePeriod: number | null;
  status: 'OVERDUE' | 'ON_TRACK';
  daysLate: number;
  fbProfileUrl: string | null;
  messengerId: string | null;
  loan: LoanForLedger;
}

interface AgentData {
  id: number;
  name: string;
  phone: string;
  username?: string | null;
  createdAt: Date;
  activeClients: ActiveClient[];
  totalRiskLiability: number;
  pendingCommission: number;
  totalLifetimeEarnings: number;
  totalCollected: number;
  commissionsCount: number;
  overdueCount: number;
  onTrackCount: number;
  totalActiveLoans: number;
}

const formatCurrency = (value: number) => {
  return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatShortDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// ============================================================================
// NOTIFICATION MESSAGE GENERATORS
// ============================================================================

/**
 * Generate OVERDUE NOTICE with Ledger Summary
 */
const generateOverdueMessage = (
  clientName: string,
  period: number,
  dueDate: Date | string,
  daysLate: number,
  expectedAmount: number,
  loan: LoanForLedger
): string => {
  const baseAmount = expectedAmount;
  const goodPayerDiscount = baseAmount * 0.04;
  const penaltyFee = 500;
  const totalAmount = baseAmount + goodPayerDiscount + penaltyFee;

  const loanData: LoanData = {
    id: loan.id,
    principal: loan.principal,
    interestRate: loan.interestRate,
    termDuration: loan.termDuration,
    totalRepayment: loan.totalRepayment,
    totalPaid: loan.totalPaid,
    remainingBalance: loan.remainingBalance,
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    goodPayerDiscountRevoked: loan.goodPayerDiscountRevoked,
    installments: loan.installments.map(inst => ({
      period: inst.period,
      dueDate: inst.dueDate,
      expectedAmount: inst.expectedAmount,
      principal: inst.principal,
      interest: inst.interest,
      penaltyFee: inst.penaltyFee,
      status: inst.status,
      paymentDate: inst.paymentDate,
      amountPaid: inst.amountPaid
    }))
  };

  let message = `URGENT ACCOUNT NOTICE ⚠️

Hello ${clientName},

Our records indicate that your payment for Installment #${period} is currently OVERDUE.

🚨 PENALTY & DISCOUNT FORFEITURE:
Because this payment is late, your Good Payer Discount has been strictly REVOKED.
- Base Installment: ${formatCurrency(baseAmount)}
- Revoked Discount: + ${formatCurrency(goodPayerDiscount)}
- Applied Late Fees: + ${formatCurrency(penaltyFee)}
----------------------------------
📌 TOTAL OVERDUE FOR INST #${period}: ${formatCurrency(totalAmount)}

📅 MISSED DUE DATE: ${formatShortDate(dueDate)}`;

  message += generateLedgerSummary(loanData);
  message += `\nPlease settle your overdue balance immediately to prevent further penalties or account escalation.\n\n- Company Manager`;

  return message;
};

/**
 * Generate UPCOMING PAYMENT REMINDER with Ledger Summary
 */
const generateReminderMessage = (
  clientName: string,
  period: number,
  dueDate: Date | string,
  expectedAmount: number,
  loan: LoanForLedger
): string => {
  const loanData: LoanData = {
    id: loan.id,
    principal: loan.principal,
    interestRate: loan.interestRate,
    termDuration: loan.termDuration,
    totalRepayment: loan.totalRepayment,
    totalPaid: loan.totalPaid,
    remainingBalance: loan.remainingBalance,
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    goodPayerDiscountRevoked: loan.goodPayerDiscountRevoked,
    installments: loan.installments.map(inst => ({
      period: inst.period,
      dueDate: inst.dueDate,
      expectedAmount: inst.expectedAmount,
      principal: inst.principal,
      interest: inst.interest,
      penaltyFee: inst.penaltyFee,
      status: inst.status,
      paymentDate: inst.paymentDate,
      amountPaid: inst.amountPaid
    }))
  };

  let message = `UPCOMING PAYMENT REMINDER 🔔

Hello ${clientName},

This is a reminder that your next payment for Installment #${period} is due soon.

📌 AMOUNT DUE: ${formatCurrency(expectedAmount)} (Includes your 6% Good Payer rate)
📅 DUE DATE: ${formatShortDate(dueDate)}

🚨 IMPORTANT: If you pay late, the 4% discount is no longer applicable and you will be charged the standard 10% contract rate plus penalties.`;

  message += generateLedgerSummary(loanData);
  message += `\n- Company Manager`;

  return message;
};

// ============================================================================
// FB NOTIFY BUTTON COMPONENT
// ============================================================================

// Facebook Messenger Icon SVG component
const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
  </svg>
);

function FBNotifyButton({
  message,
  clientName,
  fbProfileUrl,
  messengerId,
}: {
  message: string;
  clientName: string;
  fbProfileUrl: string | null;
  messengerId: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    // Copy to clipboard
    navigator.clipboard.writeText(message);

    // Determine profile URL
    let profileUrl: string;
    if (fbProfileUrl) {
      if (fbProfileUrl.startsWith('http://') || fbProfileUrl.startsWith('https://')) {
        profileUrl = fbProfileUrl;
      } else {
        profileUrl = `https://${fbProfileUrl}`;
      }
    } else if (messengerId) {
      if (messengerId.startsWith('http://') || messengerId.startsWith('https://')) {
        profileUrl = messengerId;
      } else {
        profileUrl = `https://${messengerId}`;
      }
    } else {
      profileUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(clientName)}`;
    }

    // Open profile
    window.open(profileUrl, '_blank');

    // Show success
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
        copied
          ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
          : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400'
      }`}
      title="Copy message & open Facebook profile"
    >
      <MessengerIcon className="w-3.5 h-3.5" />
      {copied ? '✓ Copied!' : 'FB'}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AgentPortalClient({ agent }: { agent: AgentData }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Logout from Agent Portal?")) return;
    
    setLoggingOut(true);
    try {
      await fetch('/api/agent-auth/logout', { method: 'POST' });
      router.push('/agent-portal');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const overdueClients = agent.activeClients.filter(c => c.status === 'OVERDUE');
  const onTrackClients = agent.activeClients.filter(c => c.status === 'ON_TRACK');

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Portal</h1>
          <p className="text-sm text-zinc-500">
            Welcome, <span className="text-emerald-400 font-medium">{agent.name}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {/* Security Badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🔐</span>
          <span className="text-xs text-emerald-400">Session Active • Data Partitioned</span>
        </div>
        <span className="text-xs text-zinc-500">Agent ID: {agent.id}</span>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link 
            href="/agent-portal/clients" 
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 rounded-xl border border-emerald-500/30 transition-all font-bold text-white tracking-wide"
          >
            <span className="text-2xl mb-1">👥</span>
            <span>My Clients</span>
          </Link>
          
          <Link 
            href={overdueClients.length > 0 ? `/agent-portal/clients?filter=overdue` : `/agent-portal/clients`}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all font-bold tracking-wide ${
              overdueClients.length > 0 
                ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 border-red-500/30 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
            }`}
          >
            <span className="text-2xl mb-1">{overdueClients.length > 0 ? '🚨' : '📋'}</span>
            <span>Collection Queue</span>
            {overdueClients.length > 0 && (
              <span className="text-xs text-red-400 mt-1">{overdueClients.length} overdue</span>
            )}
          </Link>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-1">Active Clients</p>
          <p className="text-2xl font-bold text-white">{agent.totalActiveLoans}</p>
          <p className="text-xs text-zinc-600 mt-1">{agent.onTrackCount} on-track</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-1">Total Liability</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(agent.totalRiskLiability)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-1">Pending Commission</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(agent.pendingCommission)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-1">Overdue</p>
          <p className={`text-2xl font-bold ${agent.overdueCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {agent.overdueCount}
          </p>
        </div>
      </div>

      {/* PROACTIVE HUD - CRITICAL OVERDUE */}
      {overdueClients.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="text-lg font-bold text-red-400 uppercase tracking-wider">COLLECTION ALERT</h2>
              <p className="text-red-400/70 text-sm">{overdueClients.length} client(s) have overdue payments</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {overdueClients.map(client => (
              <div
                key={client.loanId}
                className="bg-zinc-900/50 hover:bg-zinc-800/50 rounded-xl p-4 border border-red-500/20 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{client.clientName}</p>
                    <p className="text-xs text-zinc-500">📞 {client.phone || 'No phone'} • TXN-{client.loanId.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase">
                      {client.daysLate} days late
                    </span>
                    {client.nextDueAmount && (
                      <p className="text-sm font-bold text-red-400 mt-1">{formatCurrency(client.nextDueAmount)}</p>
                    )}
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                  <Link
                    href={`/payments?clientId=${client.clientId}`}
                    className="flex-1 text-center bg-red-500 hover:bg-red-400 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Process
                  </Link>
                  <FBNotifyButton
                    message={generateOverdueMessage(
                      client.clientName,
                      client.nextDuePeriod || 1,
                      client.nextDueDate || new Date(),
                      client.daysLate,
                      client.nextDueAmount || 0,
                      client.loan
                    )}
                    clientName={client.clientName}
                    fbProfileUrl={client.fbProfileUrl}
                    messengerId={client.messengerId}
                  />
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROACTIVE HUD - ON TRACK CLIENTS */}
      {onTrackClients.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
              On-Track Clients ({onTrackClients.length})
            </h2>
            <Link href="/agent-portal/clients" className="text-xs text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {onTrackClients.slice(0, 5).map(client => (
              <div
                key={client.loanId}
                className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 border border-zinc-700 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{client.clientName}</p>
                    <p className="text-xs text-zinc-500">TXN-{client.loanId.toString().padStart(4, '0')} • Period {client.nextDuePeriod || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Next Due</p>
                    <p className="text-sm font-bold text-white">{formatDate(client.nextDueDate)}</p>
                    {client.nextDueAmount && (
                      <p className="text-xs text-emerald-400">{formatCurrency(client.nextDueAmount)}</p>
                    )}
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                  <Link
                    href={`/payments?clientId=${client.clientId}`}
                    className="flex-1 text-center bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Process
                  </Link>
                  {client.nextDueDate && client.nextDueAmount && (
                    <FBNotifyButton
                      message={generateReminderMessage(
                        client.clientName,
                        client.nextDuePeriod || 1,
                        client.nextDueDate,
                        client.nextDueAmount,
                        client.loan
                      )}
                      clientName={client.clientName}
                      fbProfileUrl={client.fbProfileUrl}
                      messengerId={client.messengerId}
                    />
                  )}
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Clients */}
      {agent.activeClients.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-lg">No active clients assigned</p>
          <p className="text-zinc-600 text-sm mt-2">Contact your administrator for client assignments</p>
        </div>
      )}

      {/* Commission Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Commission Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Pending Payout</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(agent.pendingCommission)}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase mb-1">Commission Rate</p>
            <p className="text-3xl font-bold text-white">40%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
