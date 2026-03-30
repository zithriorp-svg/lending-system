import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import AgentPortalClient from "./AgentPortalClient";

export const dynamic = "force-dynamic";

/**
 * AGENT PORTAL GATEWAY
 *
 * This is the main entry point for the Agent Portal.
 * - Unauthenticated users see the login form
 * - Authenticated agents see their dashboard
 * - Locked agents are redirected to login with error
 */
export default async function AgentPortalPage() {
  // Check if agent is logged in via cookie
  const cookieStore = await cookies();
  const agentSession = cookieStore.get("agent_session");
  const agentIdCookie = cookieStore.get("agent_id");

  // Get error from URL params (for displaying login errors)
  const url = new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  // Note: In server components, we can't access request URL directly, so we pass error via searchParams in redirects

  // If not authenticated, show login form
  if (agentSession?.value !== "authenticated" || !agentIdCookie?.value) {
    return <AgentLoginGateway />;
  }

  // Parse agent ID from cookie
  const agentId = parseInt(agentIdCookie.value);
  if (isNaN(agentId) || agentId <= 0) {
    return <AgentLoginGateway />;
  }

  // Verify agent exists in database and check lock status
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      phone: true,
      username: true,
      isLocked: true,
      createdAt: true,
    }
  });

  // If agent doesn't exist or is locked, clear session and show login
  if (!agent || agent.isLocked) {
    return <AgentLoginGateway />;
  }

  // Fetch partitioned data for authenticated agent
  const agentLoans = await prisma.loan.findMany({
    where: {
      agentId: agent.id,
      status: "ACTIVE"
    },
    include: {
      client: {
        include: {
          application: true
        }
      },
      installments: {
        orderBy: { period: 'asc' }
      },
      payments: {
        orderBy: { paymentDate: 'desc' }
      }
    }
  });

  // Calculate stats with full loan data for ledger
  const activeClients = agentLoans.map(loan => {
    const totalPaid = loan.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPrincipalPaid = loan.installments
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.principalPaid), 0);
    const totalInterestPaid = loan.installments
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.interestPaid), 0);

    const pendingInstallment = loan.installments.find(i => i.status === 'PENDING');
    const overdueInstallment = loan.installments.find(
      i => i.status === 'PENDING' && new Date(i.dueDate) < new Date()
    );
    const isOverdue = !!overdueInstallment;

    // Calculate days late if overdue
    let daysLate = 0;
    if (overdueInstallment) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(overdueInstallment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      loanId: loan.id,
      clientId: loan.client.id,
      clientName: `${loan.client.firstName} ${loan.client.lastName}`,
      firstName: loan.client.firstName,
      phone: loan.client.phone || "",
      originalPrincipal: Number(loan.principal),
      remainingBalance: Number(loan.totalRepayment) - totalPaid,
      nextDueDate: pendingInstallment?.dueDate || null,
      nextDueAmount: pendingInstallment ? Number(pendingInstallment.expectedAmount) : null,
      nextDuePeriod: pendingInstallment?.period || null,
      status: isOverdue ? 'OVERDUE' as const : 'ON_TRACK' as const,
      daysLate,
      // FB profile data
      fbProfileUrl: loan.client.application?.fbProfileUrl || null,
      messengerId: loan.client.application?.messengerId || null,
      // Full loan data for ledger
      loan: {
        id: loan.id,
        principal: Number(loan.principal),
        interestRate: Number(loan.interestRate),
        termDuration: loan.termDuration,
        totalRepayment: Number(loan.totalRepayment),
        totalPaid: totalPrincipalPaid + totalInterestPaid,
        remainingBalance: Number(loan.totalRepayment) - (totalPrincipalPaid + totalInterestPaid),
        startDate: loan.startDate,
        endDate: loan.endDate,
        status: loan.status,
        goodPayerDiscountRevoked: loan.goodPayerDiscountRevoked,
        installments: loan.installments.map(inst => ({
          period: inst.period,
          dueDate: inst.dueDate,
          expectedAmount: Number(inst.expectedAmount),
          principal: Number(inst.principal),
          interest: Number(inst.interest),
          penaltyFee: Number(inst.penaltyFee) || 0,
          status: inst.status,
          paymentDate: inst.paymentDate,
          amountPaid: Number(inst.amountPaid) || 0
        }))
      }
    };
  });

  const totalRiskLiability = agentLoans.reduce(
    (sum, loan) => sum + Number(loan.principal), 0
  );

  const totalCollected = agentLoans.reduce(
    (sum, loan) => sum + loan.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
    0
  );

  const overdueCount = activeClients.filter(c => c.status === 'OVERDUE').length;
  const onTrackCount = activeClients.filter(c => c.status === 'ON_TRACK').length;

  const agentData = {
    id: agent.id,
    name: agent.name,
    phone: agent.phone,
    username: agent.username,
    createdAt: agent.createdAt,
    activeClients,
    totalRiskLiability,
    pendingCommission: 0,
    totalLifetimeEarnings: 0,
    totalCollected,
    commissionsCount: 0,
    overdueCount,
    onTrackCount,
    totalActiveLoans: agentLoans.length
  };

  return <AgentPortalClient agent={agentData} />;
}

/**
 * AGENT LOGIN GATEWAY COMPONENT
 * Matrix-styled login form for agent authentication
 */
function AgentLoginGateway() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-500/20">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Agent Portal</h1>
          <p className="text-zinc-500 text-sm font-mono">VAULT ACCESS GATEWAY</p>
        </div>

        {/* Login Form */}
        <form
          action="/api/agent-auth/login"
          method="POST"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-5"
        >
          {/* Username Field */}
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="YOUR_USERNAME"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono uppercase tracking-wider"
              required
              autoComplete="username"
            />
          </div>

          {/* PIN Field */}
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              6-Digit PIN
            </label>
            <input
              type="password"
              name="pin"
              placeholder="• • • • • •"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all text-center text-2xl tracking-[0.5em] font-mono"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 uppercase tracking-widest text-sm border border-emerald-500/30"
          >
            Access Portal
          </button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-zinc-600 text-xs font-mono">
            Contact your administrator for credentials
          </p>
          <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono">SECURE CONNECTION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
