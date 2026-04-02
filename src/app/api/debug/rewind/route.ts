import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * DEBUG (GOD-MODE): Rewind Time & Full State Cleanse
 * Restores all original due dates, erases penalties, and restores discounts.
 */
export async function POST() {
  try {
    const portfolio = await getActivePortfolio();
    
    // 1. Get all ACTIVE loans in the current portfolio
    const activeLoans = await prisma.loan.findMany({
      where: { portfolio, status: "ACTIVE" },
      include: { installments: true }
    });

    if (activeLoans.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No active loans found to reverse."
      });
    }

    let updatedCount = 0;

    for (const loan of activeLoans) {
      // 2. Restore the Good Payer Discount (Remove the penalty lock)
      await prisma.loan.update({
        where: { id: loan.id },
        data: { goodPayerDiscountRevoked: false }
      });

      // 3. Recalculate original dates based on when the loan actually started
      const startDate = new Date(loan.startDate);
      const termType = loan.termType || "Months";

      for (const inst of loan.installments) {
        // Only cleanse installments that are NOT fully paid yet
        if (inst.status !== "PAID") {
          const periodNumber = inst.period;
          let originalDueDate = new Date(startDate);

          // Rebuild the proper calendar date
          switch (termType.toLowerCase()) {
            case 'days':
              originalDueDate.setDate(startDate.getDate() + periodNumber);
              break;
            case 'weeks':
              originalDueDate.setDate(startDate.getDate() + (periodNumber * 7));
              break;
            case 'months':
            default:
              originalDueDate.setMonth(startDate.getMonth() + periodNumber);
              break;
          }

          // Strip "LATE" or "MISSED" status, but preserve "PARTIAL" if they paid a little bit
          const newStatus = inst.status === "PARTIAL" ? "PARTIAL" : "PENDING";

          // 4. Erase the calculated penalties and fix the date
          await prisma.loanInstallment.update({
            where: { id: inst.id },
            data: { 
              dueDate: originalDueDate,
              status: newStatus,
              penaltyFee: 0 // 🔥 ERASE CALCULATED PENALTIES
            }
          });

          updatedCount++;
        }
      }
    }

    // 5. Log the God-Mode Reverse in the audit trail
    await prisma.auditLog.create({
      data: {
        type: 'REWIND_TIME',
        amount: 0,
        description: `DEBUG (GOD-MODE): Reversed time and cleansed ${updatedCount} installments. Penalties erased and discounts restored.`,
        portfolio
      }
    });

    return NextResponse.json({
      success: true,
      message: `God-Mode Reverse Complete! Cleansed ${updatedCount} installments.`,
      installmentsUpdated: updatedCount
    });

  } catch (error) {
    console.error("God-Mode Reverse error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to reverse time and cleanse state."
    }, { status: 500 });
  }
}
