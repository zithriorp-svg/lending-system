import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; 

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const portfolio = await getActivePortfolio();
    
    const activeLoans = await prisma.loan.findMany({
      where: { portfolio, status: "ACTIVE" },
      include: { installments: true }
    });

    if (activeLoans.length === 0) {
      return NextResponse.json({ success: false, error: "No active loans found to reverse." });
    }

    let updatedCount = 0;

    for (const loan of activeLoans) {
      // 1. Restore the Good Payer Discount
      await prisma.loan.update({
        where: { id: loan.id },
        data: { goodPayerDiscountRevoked: false }
      });

      // 🚀 2. THE VAPORIZER: Obliterate all corrupted collection logs for this loan!
      const installmentIds = loan.installments.map(i => i.id);
      if (installmentIds.length > 0) {
        await prisma.collectionLog.deleteMany({
          where: { installmentId: { in: installmentIds } }
        });
      }

      const startDate = new Date(loan.startDate);
      const termType = loan.termType || "Months";

      // 3. Reset dates and erase penalties mathematically
      for (const inst of loan.installments) {
        if (inst.status !== "PAID") {
          const periodNumber = inst.period;
          let originalDueDate = new Date(startDate);

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

          const newStatus = inst.status === "PARTIAL" ? "PARTIAL" : "PENDING";

          await prisma.loanInstallment.update({
            where: { id: inst.id },
            data: { dueDate: originalDueDate, status: newStatus, penaltyFee: 0 }
          });

          updatedCount++;
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        type: 'REWIND_TIME', amount: 0,
        description: `DEBUG (GOD-MODE): Reversed time, cleansed ${updatedCount} installments, and vaporized corrupted logs.`,
        portfolio
      }
    });

    // Force the entire UI to refresh
    revalidatePath("/");
    revalidatePath("/payments");
    revalidatePath("/agent-portal");
    revalidatePath("/clients/[id]", "page");

    return NextResponse.json({
      success: true,
      message: `God-Mode Reverse Complete! Cleansed ${updatedCount} installments and wiped corrupted logs.`,
    });

  } catch (error) {
    console.error("God-Mode Reverse error:", error);
    return NextResponse.json({ success: false, error: "Failed to reverse time and cleanse state." }, { status: 500 });
  }
}
