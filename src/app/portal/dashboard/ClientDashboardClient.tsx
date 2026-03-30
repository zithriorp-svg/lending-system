"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InstallmentData {
  period: number;
  dueDate: string;
  expectedAmount: number;
  principal: number;
  interest: number;
  penaltyFee: number;
  status: string;
  paymentDate: string | null;
  amountPaid: number;
}

interface PaymentData {
  id: number;
  amount: number;
  paymentDate: string;
  periodNumber: number;
  paymentType: string;
}

interface LoanData {
  id: number;
  principal: number;
  interestRate: number;
  termDuration: number;
  termType: string;
  totalRepayment: number;
  totalPaid: number;
  remainingBalance: number;
  startDate: string;
  endDate: string;
  status: string;
  installments: InstallmentData[];
  payments: PaymentData[];
}

interface DashboardData {
  clientName: string;
  clientId: number;
  totalBorrowed: number;
  totalPaid: number;
  remainingBalance: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  nextDuePeriod: number;
  activeLoanId: number;
  trustScore: number;
  trustTier: string;
  trustColor: string;
  trustBg: string;
  paymentStats: {
    totalInstallments: number;
    paidOnTime: number;
    paidLate: number;
    pending: number;
    overdue: number;
  };
  loans: LoanData[];
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

const getCountdown = (dueDate: string | null): string => {
  if (!dueDate) return "No upcoming payment";
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} OVERDUE`;
  } else if (diffDays === 0) {
    return "DUE TODAY";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else {
    return `Due in ${diffDays} days`;
  }
};

const getCountdownColor = (dueDate: string | null): string => {
  if (!dueDate) return "text-zinc-400";
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "text-rose-400";
  if (diffDays === 0) return "text-amber-400";
  if (diffDays <= 3) return "text-yellow-400";
  return "text-emerald-400";
};

export default function ClientDashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'history'>('overview');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/client-auth/logout', { method: 'POST' });
      router.push('/portal');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-300 uppercase tracking-wider">Welcome back,</p>
              <h1 className="text-2xl font-bold text-white">{data.clientName}</h1>
              <p className="text-sm text-blue-200 mt-1">Client ID: {data.clientId}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {loggingOut ? "Logging out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4 -mt-4">
        
        {/* Account Health Card */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Account Health</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Borrowed</p>
              <p className="text-xl font-bold text-white">{formatCurrency(data.totalBorrowed)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(data.totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Remaining</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(data.remainingBalance)}</p>
            </div>
          </div>

          {/* Trust Score */}
          <div className={`rounded-xl p-4 ${data.trustBg}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Borrower Status</p>
                <p className={`text-2xl font-bold ${data.trustColor}`}>{data.trustTier}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Trust Score</p>
                <p className={`text-3xl font-bold ${data.trustColor}`}>{data.trustScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Payment Due - LARGE CARD */}
        {data.nextDueDate && (
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Next Payment Due
            </h2>
            
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-white mb-2">{formatCurrency(data.nextDueAmount)}</p>
              <p className={`text-lg font-bold ${getCountdownColor(data.nextDueDate)}`}>
                {getCountdown(data.nextDueDate)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Due Date</p>
                <p className="text-lg font-bold text-white">{formatDate(data.nextDueDate)}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-zinc-400">Installment</p>
                <p className="text-lg font-bold text-white">#{data.nextDuePeriod}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {(['overview', 'schedule', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Payment Progress */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Payment Progress</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Paid</span>
                  <span>{Math.round((data.totalPaid / data.totalBorrowed) * 100)}%</span>
                </div>
                <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${(data.totalPaid / data.totalBorrowed) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-lg font-bold text-white">{data.paymentStats.totalInstallments}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-emerald-400">On Time</p>
                  <p className="text-lg font-bold text-emerald-400">{data.paymentStats.paidOnTime}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-amber-400">Late</p>
                  <p className="text-lg font-bold text-amber-400">{data.paymentStats.paidLate}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-zinc-400">Pending</p>
                  <p className="text-lg font-bold text-zinc-400">{data.paymentStats.pending + data.paymentStats.overdue}</p>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Active Loans ({data.loans.length})</h3>
              
              {data.loans.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">No active loans</p>
              ) : (
                <div className="space-y-3">
                  {data.loans.map(loan => (
                    <div key={loan.id} className="bg-zinc-900 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">TXN-{loan.id.toString().padStart(4, '0')}</p>
                          <p className="text-xs text-zinc-500">{loan.termDuration} {loan.termType.toLowerCase()} term</p>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                          {loan.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">Principal</p>
                          <p className="font-bold text-white">{formatCurrency(loan.principal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Remaining</p>
                          <p className="font-bold text-blue-400">{formatCurrency(loan.remainingBalance)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Installment Schedule</h3>
            
            <div className="space-y-2">
              {data.loans.flatMap(loan => 
                loan.installments.map(inst => (
                  <div
                    key={`${loan.id}-${inst.period}`}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      inst.status === 'PAID'
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : inst.status === 'LATE'
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : new Date(inst.dueDate) < new Date()
                        ? 'bg-rose-500/10 border border-rose-500/20'
                        : 'bg-zinc-900 border border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        inst.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : inst.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-400'
                          : new Date(inst.dueDate) < new Date()
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {inst.period}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{formatCurrency(inst.expectedAmount)}</p>
                        <p className="text-xs text-zinc-500">{formatDate(inst.dueDate)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${
                      inst.status === 'PAID'
                        ? 'text-emerald-400'
                        : inst.status === 'LATE'
                        ? 'text-amber-400'
                        : new Date(inst.dueDate) < new Date()
                        ? 'text-rose-400'
                        : 'text-zinc-400'
                    }`}>
                      {inst.status === 'PAID' ? '✓ PAID' : inst.status === 'LATE' ? 'LATE' : new Date(inst.dueDate) < new Date() ? 'OVERDUE' : 'PENDING'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Payment History</h3>
            
            {data.loans.every(l => l.payments.length === 0) ? (
              <p className="text-center text-zinc-500 py-4">No payment history yet</p>
            ) : (
              <div className="space-y-2">
                {data.loans.flatMap(loan =>
                  loan.payments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-400">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(payment.paymentDate)} • Installment #{payment.periodNumber}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        payment.paymentType === 'FULL'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : payment.paymentType === 'INTEREST'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {payment.paymentType || 'FULL'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-xs text-zinc-600">
            This is a read-only view of your account.
            <br />
            For assistance, please contact your assigned agent.
          </p>
        </div>
      </div>
    </div>
  );
}
