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

    // 1. Get the current state of the loan and the specific installment
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

    // 2. SAFETY LOCK: Check if this specific installment already has a penalty applied today
    // We check the collection logs to see if a penalty was already logged for this exact installment
    const existingLogs = await prisma.collectionLog.findMany({
      where: {
        installmentId: installmentId,
        note: { contains: "DISCOUNT REVOKED: 4% Good Payer Discount (₱40) forfeited." }
      }
    });

    if (existingLogs.length > 0) {
       return NextResponse.json({ success: false, error: "Penalty already applied to this installment." }, { status: 400 });
    }

    // 3. MATHEMATICAL RECALIBRATION: Force everything to strict numbers
    const currentPenalty = Number(installment.penaltyFee?.toString() || 0);
    const penaltyAmountToAdd = 40; 
    
    // Strict Addition (Prevents string concatenation like 404040)
    const newTotalPenalty = currentPenalty + penaltyAmountToAdd; 

    // 4. Update the specific installment with the new math
    await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: {
        penaltyFee: newTotalPenalty
      }
    });

    // 5. Revoke the 4% discount globally for the loan
    if (!loan.goodPayerDiscountRevoked) {
      await prisma.loan.update({
        where: { id: loanId },
        data: { goodPayerDiscountRevoked: true }
      });
    }

    // 6. Log the action in the Collection Log exactly ONCE
    await prisma.collectionLog.create({
      data: {
        installmentId,
        type: 'NOTE',
        note: `DISCOUNT REVOKED: 4% Good Payer Discount (₱40) forfeited. \nTotal penalties: ₱${newTotalPenalty}`,
        loggedBy: 'System Auto',
        clientViewable: true
      }
    });

    // 7. Drop a polite notification in the Comm-Link
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
