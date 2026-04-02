import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getActivePortfolio } from "@/lib/portfolio";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user_role")?.value || "AGENT";
    const isAdmin = userRole === "ADMIN";
    
    const body = await req.json();
    const { installmentId, loanId } = body;

    if (!installmentId || !loanId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const portfolio = await getActivePortfolio();

    const loan = await prisma.loan.findFirst({
      where: { id: loanId, portfolio },
      include: { installments: true }
    });

    if (!loan) {
      return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
    }

    if (!loan.goodPayerDiscountRevoked) {
      await prisma.loan.update({
        where: { id: loanId },
        data: { goodPayerDiscountRevoked: true }
      });

      const newInterestTotal = Number(loan.principal) * 0.10; 
      const newInterestPerPeriod = newInterestTotal / loan.termDuration;
      const principalPerPeriod = Number(loan.principal) / loan.termDuration;
      const newExpectedAmount = principalPerPeriod + newInterestPerPeriod;

      const pendingInstallments = loan.installments.filter(i => i.status === "PENDING" || i.status === "LATE");

      for (const inst of pendingInstallments) {
        const difference = newExpectedAmount - Number(inst.expectedAmount);
        await prisma.loanInstallment.update({
          where: { id: inst.id },
          data: { penaltyFee: { increment: difference } }
        });
      }

      if (isAdmin) {
        await prisma.auditLog.create({
          data: {
            type: 'PENALTY', amount: newInterestTotal - (Number(loan.principal) * 0.06),
            referenceId: loan.id, referenceType: 'LOAN', description: '4% Good Payer Discount REVOKED.', portfolio
          }
        });
      }

      // 🚀 INJECT: SYSTEM BOT SENDS MESSAGE TO COMM-LINK
      await prisma.message.create({
        data: {
          clientId: loan.clientId,
          sender: "VAULT SYSTEM",
          text: `⚠️ CONTRACT ENFORCEMENT: Your 4% Good Payer Discount has been permanently REVOKED due to delinquent payment on TXN-${loan.id.toString().padStart(4, '0')}. Your interest rate is now locked at the standard 10%.`
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Penalty Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
