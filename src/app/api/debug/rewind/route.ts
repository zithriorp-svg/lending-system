import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";

/**
 * DEBUG: Rewind Time (Undo Fast-Forward)
 * Moves all pending installment due dates 7 days into the future
 */
export async function POST() {
  try {
    const portfolio = await getActivePortfolio();
    
    // Get all pending installments for active loans in current portfolio
    const pendingInstallments = await prisma.loanInstallment.findMany({
      where: {
        status: "PENDING",
        loan: {
          portfolio,
          status: "ACTIVE"
        }
      },
      select: {
        id: true,
        dueDate: true,
        loan: {
          select: {
            id: true,
            client: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (pendingInstallments.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No pending installments found to rewind"
      });
    }

    // Calculate new due date: 7 days in the future
    const today = new Date();
    const newDueDate = new Date(today);
    newDueDate.setDate(today.getDate() + 7);
    newDueDate.setHours(0, 0, 0, 0);

    // Update all pending installments to have due date 7 days in the future
    const updatePromises = pendingInstallments.map(installment =>
      prisma.loanInstallment.update({
        where: { id: installment.id },
        data: { dueDate: newDueDate }
      })
    );

    await Promise.all(updatePromises);

    // Log the debug action
    await prisma.auditLog.create({
      data: {
        type: 'REWIND_TIME',
        amount: 0,
        description: `DEBUG: Rewound ${pendingInstallments.length} installments to 7 days in the future`,
        portfolio
      }
    });

    return NextResponse.json({
      success: true,
      message: `Rewound ${pendingInstallments.length} installments to 7 days in the future`,
      installmentsUpdated: pendingInstallments.length,
      newDueDate: newDueDate.toISOString(),
      affectedClients: pendingInstallments.map(i => ({
        installmentId: i.id,
        loanId: i.loan.id,
        clientName: `${i.loan.client.firstName} ${i.loan.client.lastName}`
      }))
    });
  } catch (error) {
    console.error("Rewind time error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to rewind installments"
    }, { status: 500 });
  }
}
