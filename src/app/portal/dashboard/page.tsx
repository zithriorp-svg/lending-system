import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ClientDashboardClient from "./ClientDashboardClient";

export const dynamic = "force-dynamic";

/**
 * CLIENT PORTAL DASHBOARD
 * 
 * STRICTLY READ-ONLY view of client's loan information.
 * Security: Only fetches data where client.id matches session client_id.
 */
export default async function ClientDashboard() {
  const cookieStore = await cookies();
  
  // Verify session - CRITICAL SECURITY CHECK
  const clientSession = cookieStore.get("client_session")?.value;
  const clientIdStr = cookieStore.get("client_id")?.value;
  const clientName = cookieStore.get("client_name")?.value || "Client";

  // Redirect to login if not authenticated
  if (clientSession !== "authenticated" || !clientIdStr) {
    redirect("/portal");
  }

  const clientId = parseInt(clientIdStr);

  // SECURITY: Only fetch data for THIS client - data isolation is mandatory
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      loans: {
        where: { status: "ACTIVE" },
        include: {
          installments: {
            orderBy: { period: "asc" }
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 10
          }
        }
      },
      application: true
    }
  });

  if (!client) {
    redirect("/portal");
  }

  // Calculate account statistics
  let totalBorrowed = 0;
  let totalPaid = 0;
  let remainingBalance = 0;
  let nextDueDate: Date | null = null;
  let nextDueAmount = 0;
  let nextDuePeriod = 0;
  let activeLoanId = 0;

  // Process active loans
  for (const loan of client.loans) {
    totalBorrowed += Number(loan.totalRepayment);
    remainingBalance += Number(loan.totalRepayment) - Number(loan.totalPaid || 0);
    totalPaid += Number(loan.totalPaid || 0);

    // Find next pending installment
    for (const inst of loan.installments) {
      if (inst.status === "PENDING") {
        if (!nextDueDate || new Date(inst.dueDate) < nextDueDate) {
          nextDueDate = new Date(inst.dueDate);
          nextDueAmount = Number(inst.expectedAmount);
          nextDuePeriod = inst.period;
          activeLoanId = loan.id;
        }
        break; // Only get first pending for each loan
      }
    }
  }

  // Calculate payment stats for trust score
  let totalInstallments = 0;
  let paidOnTime = 0;
  let paidLate = 0;
  let pending = 0;
  let overdue = 0;

  for (const loan of client.loans) {
    for (const inst of loan.installments) {
      totalInstallments++;
      if (inst.status === "PAID") {
        paidOnTime++;
      } else if (inst.status === "LATE") {
        paidLate++;
      } else if (inst.status === "PENDING") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(inst.dueDate) < today) {
          overdue++;
        } else {
          pending++;
        }
      }
    }
  }

  // Calculate trust score (percentage of on-time payments)
  const trustScore = totalInstallments > 0 
    ? Math.round((paidOnTime / totalInstallments) * 100) 
    : 100;

  // Determine trust tier
  let trustTier = "PRIME";
  let trustColor = "text-emerald-400";
  let trustBg = "bg-emerald-500/20";
  
  if (trustScore < 70) {
    trustTier = "HIGH RISK";
    trustColor = "text-rose-400";
    trustBg = "bg-rose-500/20";
  } else if (trustScore < 90) {
    trustTier = "WATCH";
    trustColor = "text-amber-400";
    trustBg = "bg-amber-500/20";
  }

  // Serialize data for client component
  const serializedLoans = client.loans.map(loan => ({
    id: loan.id,
    principal: Number(loan.principal),
    interestRate: Number(loan.interestRate),
    termDuration: loan.termDuration,
    termType: loan.termType,
    totalRepayment: Number(loan.totalRepayment),
    totalPaid: Number(loan.totalPaid || 0),
    remainingBalance: Number(loan.totalRepayment) - Number(loan.totalPaid || 0),
    startDate: loan.startDate.toISOString(),
    endDate: loan.endDate.toISOString(),
    status: loan.status,
    installments: loan.installments.map(inst => ({
      period: inst.period,
      dueDate: inst.dueDate.toISOString(),
      expectedAmount: Number(inst.expectedAmount),
      principal: Number(inst.principal),
      interest: Number(inst.interest),
      penaltyFee: Number(inst.penaltyFee || 0),
      status: inst.status,
      paymentDate: inst.paymentDate?.toISOString() || null,
      amountPaid: Number(inst.amountPaid || 0)
    })),
    payments: loan.payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      periodNumber: p.periodNumber,
      paymentType: p.paymentType
    }))
  }));

  const dashboardData = {
    clientName: `${client.firstName} ${client.lastName}`,
    clientId: client.id,
    totalBorrowed,
    totalPaid,
    remainingBalance,
    nextDueDate: nextDueDate?.toISOString() || null,
    nextDueAmount,
    nextDuePeriod,
    activeLoanId,
    trustScore,
    trustTier,
    trustColor,
    trustBg,
    paymentStats: {
      totalInstallments,
      paidOnTime,
      paidLate,
      pending,
      overdue
    },
    loans: serializedLoans
  };

  return <ClientDashboardClient data={dashboardData} />;
}
