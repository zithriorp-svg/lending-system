import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * ENFORCEMENT PROTOCOL: Late Penalty & Rebate Revocation
 * 
 * POST: Apply penalty fee and revoke Good Payer Discount
 * - Adds ₱500 late fee to installment's penaltyFee
 * - Revokes 4% Good Payer Discount on the loan
 */

const LATE_FEE_AMOUNT = 500; // Fixed late fee

export async function POST(request: NextRequest) {
  try {
    const portfolio = await getActivePortfolio();
    const body = await request.json();
    const { installmentId, loanId } = body;

    if (!installmentId || !loanId) {
      return NextResponse.json({ 
        error: 'installmentId and loanId are required' 
      }, { status: 400 });
    }

    // Verify installment exists and belongs to this portfolio
    const installment = await prisma.loanInstallment.findFirst({
      where: { id: installmentId },
      include: { 
        loan: {
          include: { client: true }
        } 
      }
    });

    if (!installment || installment.loan.portfolio !== portfolio) {
      return NextResponse.json({ 
        error: 'Installment not found' 
      }, { status: 404 });
    }

    // Get the loan principal for calculating the revoked discount amount
    const loanPrincipal = Number(installment.loan.principal);
    const revokedDiscountAmount = loanPrincipal * 0.04; // 4% of principal

    // Apply penalty fee and revoke discount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Add late fee to installment
      const updatedInstallment = await tx.loanInstallment.update({
        where: { id: installmentId },
        data: {
          penaltyFee: installment.penaltyFee + LATE_FEE_AMOUNT,
          status: 'LATE' // Ensure status reflects late payment
        }
      });

      // 2. Revoke Good Payer Discount on the loan (if not already revoked)
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          goodPayerDiscountRevoked: true
        }
      });

      // 3. Create a collection note documenting the enforcement action
      await tx.collectionNote.create({
        data: {
          installmentId,
          note: `🚨 ENFORCEMENT: ₱${LATE_FEE_AMOUNT} late fee applied. Good Payer Discount (₱${revokedDiscountAmount.toFixed(2)}) REVOKED. Total penalties: ₱${updatedInstallment.penaltyFee}`
        }
      });

      return { installment: updatedInstallment, loan: updatedLoan };
    });

    return NextResponse.json({
      success: true,
      message: `Penalty applied successfully`,
      details: {
        lateFee: LATE_FEE_AMOUNT,
        revokedDiscount: revokedDiscountAmount,
        totalPenaltyFee: Number(result.installment.penaltyFee),
        discountRevoked: result.loan.goodPayerDiscountRevoked
      },
      installment: {
        id: result.installment.id,
        penaltyFee: Number(result.installment.penaltyFee),
        status: result.installment.status
      },
      loan: {
        id: result.loan.id,
        goodPayerDiscountRevoked: result.loan.goodPayerDiscountRevoked
      }
    });

  } catch (error) {
    console.error('Enforcement penalty error:', error);
    return NextResponse.json({ 
      error: 'Failed to apply penalty' 
    }, { status: 500 });
  }
}
