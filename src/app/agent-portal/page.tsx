import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import AgentPortalClient from "./AgentPortalClient";

export const dynamic = "force-dynamic";

export default async function AgentPortalPage() {
  // Check if agent is logged in via cookie
  const cookieStore = await cookies();
  const agentSession = cookieStore.get("agent_session");
  const agentIdCookie = cookieStore.get("agent_id");

  // If not authenticated, show login form INSTEAD of redirecting
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
      fbProfileUrl: loan.client.application?.fbProfileUrl || null,
      messengerId: loan.client.application?.messengerId || null,
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

// THE AGENT GATEWAY UI
function AgentLoginGateway() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-4xl">💼</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Gateway</h1>
          <p className="text-zinc-400 text-sm">Secure Field Operations Portal</p>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Agent Authentication</h2>

          <form action="/api/agent-auth/login" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full bg-zinc-900 border border-zinc-600 rounded-xl p-4 text-white text-lg font-mono text-center focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                name="pin"
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                autoComplete="current-password"
                className="w-full bg-zinc-900 border border-zinc-600 rounded-xl p-4 text-white text-lg text-center focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 uppercase tracking-wider"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 text-center">
              Use your assigned agent credentials.<br />
              If your account is locked, contact your Master Admin.
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          © {new Date().getFullYear()} FinTech Vault. All rights reserved.
        </p>
      </div>
    </div>
  );
}
