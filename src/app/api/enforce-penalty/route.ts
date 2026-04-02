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
      return NextResponse.json({ success: false, error: "Loan not found or unauthorized access" }, { status: 404 });
    }

    // 🚀 FIXED: We completely REMOVED the hardcoded ₱500 penalty. 
    // The only penalty is revoking the Good Payer Discount (bumping interest to 10%)
    if (!loan.goodPayerDiscountRevoked) {
      // 1. Mark the loan as having its discount revoked
      await prisma.loan.update({
        where: { id: loanId },
        data: { goodPayerDiscountRevoked: true }
      });

      // 2. Recalculate ALL PENDING installments to 10% interest
      const newInterestTotal = Number(loan.principal) * 0.10; // 10% instead of 6%
      const newInterestPerPeriod = newInterestTotal / loan.termDuration;
      const principalPerPeriod = Number(loan.principal) / loan.termDuration;
      const newExpectedAmount = principalPerPeriod + newInterestPerPeriod;

      const pendingInstallments = loan.installments.filter(i => i.status === "PENDING" || i.status === "LATE");

      for (const inst of pendingInstallments) {
        // Find the difference between the new 10% rate and the old 6% rate
        const difference = newExpectedAmount - Number(inst.expectedAmount);

        // Update the installment by storing the difference as a 'penaltyFee' 
        // so the system tracks it, but it mathematically equals 10% total.
        await prisma.loanInstallment.update({
          where: { id: inst.id },
          data: {
            penaltyFee: { increment: difference }
          }
        });
      }

      // Log the revocation in the immutable Audit Ledger
      if (isAdmin) {
        await prisma.auditLog.create({
          data: {
            type: 'PENALTY',
            amount: newInterestTotal - (Number(loan.principal) * 0.06), // Log the total difference
            referenceId: loan.id,
            referenceType: 'LOAN',
            description: '4% Good Payer Discount REVOKED due to delinquency.',
            portfolio
          }
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Penalty Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
