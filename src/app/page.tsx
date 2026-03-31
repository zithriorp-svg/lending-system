import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import Link from "next/link";
import MatrixCopilot from "@/components/MatrixCopilot";
import LockVaultButton from "@/components/LockVaultButton";
import DelinquencyAlerts from "@/components/DelinquencyAlerts";
import CapitalRedeploymentQueue from "@/components/CapitalRedeploymentQueue";
import LiveClock from "@/components/LiveClock";
import QuickActionsGrid from "@/components/QuickActionsGrid";
import TimeTravelDebug from "@/components/TimeTravelDebug";
import { getActivePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

// Helper to serialize Decimal to Number for Client Components
const serializeLoan = (loan: any) => ({
  id: loan.id,
  principal: Number(loan.principal),
  interestRate: Number(loan.interestRate),
  termDuration: loan.termDuration,
  totalRepayment: Number(loan.totalRepayment),
  totalPaid: Number(loan.totalPaid),
  remainingBalance: Number(loan.remainingBalance),
  startDate: loan.startDate,
  endDate: loan.endDate,
  status: loan.status,
  goodPayerDiscountRevoked: loan.goodPayerDiscountRevoked,
  installments: loan.installments?.map((inst: any) => ({
    period: inst.period,
    dueDate: inst.dueDate,
    expectedAmount: Number(inst.expectedAmount),
    principal: Number(inst.principal),
    interest: Number(inst.interest),
    penaltyFee: Number(inst.penaltyFee),
    status: inst.status,
    paymentDate: inst.paymentDate,
    amountPaid: Number(inst.amountPaid)
  })) || []
});

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value || "AGENT";
  const isAdmin = userRole === "ADMIN";
  const userName = cookieStore.get("user_name")?.value || "User";

  const portfolio = await getActivePortfolio();

  const portfolioRecords = await prisma.systemPortfolio.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' }
  });
  
  const portfolios = portfolioRecords.map(p => ({
    id: p.id,
    name: p.name
  }));

  const ledgers = await prisma.ledger.findMany({ 
    where: { portfolio },
    orderBy: { createdAt: 'desc' },
    include: {
      loan: {
        include: {
          client: true
        }
      },
      payment: true
    }
  });
  
  const formatLedgerEntry = (ledger: typeof ledgers[0]) => {
    const amount = Number(ledger.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const clientName = ledger.loan?.client 
      ? `${ledger.loan.client.firstName} ${ledger.loan.client.lastName}`
      : null;
    
    switch (ledger.transactionType) {
      case 'LOAN_DISBURSEMENT':
      case 'DISBURSEMENT':
        return { icon: '💸', title: 'Loan Disbursed', description: clientName ? `Disbursed ₱${amount} to ${clientName}` : `Disbursed ₱${amount}`, color: 'text-blue-400' };
      case 'LOAN_REPAYMENT':
      case 'REPAYMENT':
        return { icon: '💵', title: 'Payment Received', description: clientName ? `${clientName} paid ₱${amount}` : `Payment of ₱${amount} received`, color: 'text-emerald-400' };
      case 'CAPITAL_DEPOSIT':
      case 'DEPOSIT':
        return { icon: '🏦', title: 'Capital Injected', description: `₱${amount} added to vault`, color: 'text-emerald-400' };
      case 'CAPITAL_WITHDRAWAL':
      case 'WITHDRAWAL':
        return { icon: '📤', title: 'Capital Withdrawn', description: `₱${amount} withdrawn from vault`, color: 'text-amber-400' };
      case 'INTEREST_COLLECTION':
        return { icon: '📈', title: 'Interest Collected', description: clientName ? `Interest of ₱${amount} from ${clientName}` : `Interest collection: ₱${amount}`, color: 'text-yellow-400' };
      case 'PENALTY':
        return { icon: '⚠️', title: 'Penalty Applied', description: clientName ? `Penalty of ₱${amount} to ${clientName}` : `Penalty: ₱${amount}`, color: 'text-rose-400' };
      default:
        return { icon: '📋', title: ledger.transactionType, description: `${ledger.debitAccount} → ${ledger.creditAccount}`, color: 'text-slate-400' };
    }
  };

  const preApprovedApps = await prisma.application.findMany({
    where: { portfolio, status: 'PRE-APPROVED' },
    orderBy: { id: 'desc' }
  });

  const pendingApps = await prisma.application.findMany({
    where: { portfolio, status: 'Pending' },
    orderBy: { id: 'desc' }
  });

  let vaultCash = 0;
  let outstandingLoans = 0;
  let deployableCapital = 0;
  let projectedRebates = 0; 

  if (isAdmin) {
    const capitalTransactions = await prisma.capitalTransaction.findMany({ where: { portfolio } });
    let totalCapitalDeposits = 0, totalCapitalWithdrawals = 0;
    capitalTransactions.forEach(tx => {
      if (tx.type === "DEPOSIT") totalCapitalDeposits += Number(tx.amount);
      else totalCapitalWithdrawals += Number(tx.amount);
    });

    const expenses = await prisma.expense.findMany({ where: { portfolio } });
    let totalExpenses = 0;
    expenses.forEach(exp => totalExpenses += Number(exp.amount));

    let totalDisbursements = 0;
    ledgers.forEach(entry => {
      if (entry.debitAccount === "Loans Receivable") totalDisbursements += Number(entry.amount);
    });

    const loansInPortfolio = await prisma.loan.findMany({
      where: { portfolio },
      select: { id: true }
    });
    const loanIds = loansInPortfolio.map(l => l.id);

    const payments = await prisma.payment.findMany({ 
      where: { loanId: { in: loanIds }, status: "Paid" } 
    });
    let totalPrincipalCollected = 0, totalInterestCollected = 0;
    payments.forEach(p => {
      totalPrincipalCollected += Number(p.principalPortion);
      totalInterestCollected += Number(p.interestPortion);
    });

    vaultCash = totalCapitalDeposits - totalCapitalWithdrawals - totalDisbursements + totalPrincipalCollected + totalInterestCollected - totalExpenses;
    outstandingLoans = totalDisbursements - totalPrincipalCollected;
    deployableCapital = Number(vaultCash) * 0.85;
    
    const activeLoans = await prisma.loan.findMany({
      where: { portfolio, status: 'ACTIVE' },
      select: { principal: true }
    });
    let totalActivePrincipal = 0;
    activeLoans.forEach(loan => { totalActivePrincipal += Number(loan.principal); });
    projectedRebates = totalActivePrincipal * 0.04; 
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const fullLoanInclude = {
    client: { include: { application: true } }, 
    agent: { select: { id: true, name: true, phone: true, portfolio: true } },
    installments: { orderBy: { period: 'asc' } as const }
  };

  const overdueInstallments = await prisma.loanInstallment.findMany({
    where: { status: "PENDING", dueDate: { lt: today }, loan: { portfolio } },
    include: { loan: { include: fullLoanInclude } },
    orderBy: { dueDate: 'asc' }
  });

  const dueTodayInstallments = await prisma.loanInstallment.findMany({
    where: { status: "PENDING", dueDate: { gte: today, lte: todayEnd }, loan: { portfolio } },
    include: { loan: { include: fullLoanInclude } },
    orderBy: { dueDate: 'asc' }
  });

  const upcomingInstallments = await prisma.loanInstallment.findMany({
    where: { status: "PENDING", dueDate: { gt: todayEnd, lte: nextWeek }, loan: { portfolio } },
    include: { loan: { include: fullLoanInclude } },
    orderBy: { dueDate: 'asc' }
  });

  const getDaysLate = (dueDate: Date): number => {
    const diffTime = today.getTime() - new Date(dueDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const overdueAlerts = overdueInstallments.map(i => ({
    id: i.id,
    loanId: i.loanId,
    clientId: i.loan.clientId,
    period: i.period,
    dueDate: i.dueDate,
    expectedAmount: Number(i.expectedAmount),
    clientName: `${i.loan.client.firstName} ${i.loan.client.lastName}`,
    firstName: i.loan.client.firstName,
    phone: i.loan.client.phone || '',
    agentName: i.loan.agent?.name || null,
    daysLate: getDaysLate(i.dueDate),
    penaltyFee: Number(i.penaltyFee) || 0,
    fbProfileUrl: i.loan.client.application?.fbProfileUrl || null,
    messengerId: i.loan.client.application?.messengerId || null,
    loan: serializeLoan(i.loan)
  }));

  const dueTodayAlerts = dueTodayInstallments.map(i => ({
    id: i.id,
    loanId: i.loanId,
    clientId: i.loan.clientId,
    period: i.period,
    dueDate: i.dueDate,
    expectedAmount: Number(i.expectedAmount),
    clientName: `${i.loan.client.firstName} ${i.loan.client.lastName}`,
    firstName: i.loan.client.firstName,
    phone: i.loan.client.phone || '',
    agentName: i.loan.agent?.name || null,
    penaltyFee: Number(i.penaltyFee) || 0,
    fbProfileUrl: i.loan.client.application?.fbProfileUrl || null,
    messengerId: i.loan.client.application?.messengerId || null,
    loan: serializeLoan(i.loan)
  }));

  const upcomingAlerts = upcomingInstallments.map(i => ({
    id: i.id,
    loanId: i.loanId,
    clientId: i.loan.clientId,
    period: i.period,
    dueDate: i.dueDate,
    expectedAmount: Number(i.expectedAmount),
    clientName: `${i.loan.client.firstName} ${i.loan.client.lastName}`,
    firstName: i.loan.client.firstName,
    phone: i.loan.client.phone || '',
    agentName: i.loan.agent?.name || null,
    penaltyFee: Number(i.penaltyFee) || 0,
    fbProfileUrl: i.loan.client.application?.fbProfileUrl || null,
    messengerId: i.loan.client.application?.messengerId || null,
    loan: serializeLoan(i.loan)
  }));

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto p-4 space-y-8 pb-24">
        {/* Sleek Header */}
        <div className="flex justify-between items-center pt-6 pb-2 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              {isAdmin ? "Executive Dashboard" : "Agent Dashboard"}
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Welcome, <span className="text-white">{userName}</span> • Portfolio: <span className="text-cyan-400">{portfolio}</span>
            </p>
          </div>
          <LockVaultButton />
        </div>

        <LiveClock />

        {/* Beautiful Glassmorphism Metric Cards */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/20 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 shadow-lg shadow-emerald-900/10 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">🏦</span>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Vault Cash</p>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-white">₱{vaultCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/80 to-cyan-900/20 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-lg shadow-cyan-900/10 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">⚡</span>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Deployable (85%)</p>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-white">₱{deployableCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-cyan-500/70 mt-1 uppercase font-bold">15% Safety Reserve</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/80 to-blue-900/20 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 shadow-lg shadow-blue-900/10 hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">📈</span>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Outstanding</p>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-white">₱{outstandingLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/80 to-amber-900/20 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-lg shadow-amber-900/10 hover:border-amber-500/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">⭐</span>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Rebates (4%)</p>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-white">₱{projectedRebates.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-amber-500/70 mt-1 uppercase font-bold">Incentive Pool</p>
            </div>
          </div>
        )}

        {/* The Alerts HUD */}
        <DelinquencyAlerts overdue={overdueAlerts as any} dueToday={dueTodayAlerts as any} upcoming={upcomingAlerts as any} />

        {isAdmin && <CapitalRedeploymentQueue />}

        <QuickActionsGrid isAdmin={isAdmin} portfolios={portfolios} />

        {isAdmin && <MatrixCopilot />}

        {/* Pre-Approved Apps - Shiny Emerald Theme */}
        {preApprovedApps.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="text-xl">⚡</span> PRE-APPROVED Applications
              </h2>
              <span className="text-[10px] text-emerald-950 font-black bg-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
                Fast-Track Ready
              </span>
            </div>
            <div className="space-y-3">
              {preApprovedApps.slice(0, 5).map(app => (
                <Link href={`/review/${app.id}`} key={app.id} className="flex justify-between items-center p-4 bg-emerald-950/30 hover:bg-emerald-900/40 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 transition-all group">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">{app.firstName} {app.lastName}</p>
                    </div>
                    <p className="text-xs text-emerald-400/70 truncate max-w-[250px] md:max-w-[400px] mt-1">{app.aiRiskSummary}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                    {app.credibilityScore || 10}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending Apps - Clean Slate Theme */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Pending Applications</h2>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase bg-slate-800 px-3 py-1 rounded-full">AI-Rated</span>
          </div>
          <div className="space-y-3">
            {pendingApps.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-sm font-medium">No pending applications.</p>
            ) : (
              pendingApps.slice(0, 5).map(app => (
                <Link href={`/review/${app.id}`} key={app.id} className="flex justify-between items-center p-4 bg-slate-800/40 hover:bg-slate-800 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all group">
                  <div>
                    <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">{app.firstName} {app.lastName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-[400px] mt-1">{app.aiRiskSummary}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner ${
                    (app.credibilityScore || 0) >= 7 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    (app.credibilityScore || 0) >= 4 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {app.credibilityScore || '-'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Ledger Activity - Sleek List */}
        {isAdmin && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">Recent Ledger Activity</h2>
            <div className="space-y-3">
              {ledgers.length === 0 ? (
                <p className="text-slate-500 text-center py-6 text-sm font-medium">No ledger transactions yet.</p>
              ) : (
                ledgers.slice(0, 5).map(ledger => {
                  const entry = formatLedgerEntry(ledger);
                  return (
                    <div key={ledger.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 hover:bg-slate-800/60 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-sm">{entry.icon}</span>
                          <div>
                            <p className="font-bold text-slate-200">{entry.title}</p>
                            <p className={`text-xs font-medium mt-0.5 ${entry.color}`}>{entry.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-slate-400 text-xs font-medium">
                          {new Date(ledger.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">
                          {new Date(ledger.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {isAdmin && <TimeTravelDebug />}
      </div>
    </div>
  );
}
