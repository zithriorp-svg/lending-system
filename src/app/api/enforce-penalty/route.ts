import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const portfolio = await getActivePortfolio();
    const body = await req.json();
    const { installmentId, loanId } = body;

    if (!installmentId || !loanId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: true,
        client: true
      }
    });

    if (!loan) {
      return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
    }

    const installment = loan.installments.find(i => i.id === installmentId);
    if (!installment) {
      return NextResponse.json({ success: false, error: "Installment not found" }, { status: 404 });
    }

    // 1. SAFETY LOCK: Prevent double-applying the exact same penalty
    const existingLogs = await prisma.collectionLog.findMany({
      where: {
        installmentId: installmentId,
        note: { contains: "DISCOUNT REVOKED: 4% Good Payer Discount" }
      }
    });

    if (existingLogs.length > 0) {
       return NextResponse.json({ success: false, error: "Penalty already applied to this installment." }, { status: 400 });
    }

    // 2. MATHEMATICAL PRECISION: Parse to exact float
    const currentPenalty = parseFloat(installment.penaltyFee?.toString() || "0");
    const penaltyAmountToAdd = 40.00; 
    
    // Calculate new total and enforce 2 decimal precision
    const newTotalPenalty = parseFloat((currentPenalty + penaltyAmountToAdd).toFixed(2));

    await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: {
        penaltyFee: newTotalPenalty
      }
    });

    if (!loan.goodPayerDiscountRevoked) {
      await prisma.loan.update({
        where: { id: loanId },
        data: { goodPayerDiscountRevoked: true }
      });
    }

    await prisma.collectionLog.create({
      data: {
        installmentId,
        type: 'NOTE',
        note: `DISCOUNT REVOKED: 4% Good Payer Discount (₱40.00) forfeited. \nTotal penalties: ₱${newTotalPenalty.toFixed(2)}`,
        loggedBy: 'System Auto',
        clientViewable: true
      }
    });

    await prisma.message.create({
      data: {
        clientId: loan.clientId,
        sender: "VAULT SYSTEM",
        text: `⚠️ PENALTY NOTICE: Your 4% Good Payer Discount has been revoked for Installment #${installment.period} due to late payment. A ₱40.00 penalty has been added to your balance. Please settle immediately.`
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Penalty enforcement error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
