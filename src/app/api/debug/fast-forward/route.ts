import { prisma } from "@/lib/db";
import { getActivePortfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";

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
        error: "No pending installments found to fast-forward"
      });
    }

    // Calculate new due date: 7 days in the past
    const today = new Date();
    const newDueDate = new Date(today);
    newDueDate.setDate(today.getDate() - 7);
    newDueDate.setHours(0, 0, 0, 0);

    // Update all pending installments to have due date 7 days in the past
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
        type: 'FAST_FORWARD',
        amount: 0,
        description: `DEBUG: Fast-forwarded ${pendingInstallments.length} installments to 7 days overdue for testing`,
        portfolio
      }
    });

    return NextResponse.json({
      success: true,
      message: `Fast-forwarded ${pendingInstallments.length} installments to 7 days overdue`,
      installmentsUpdated: pendingInstallments.length,
      newDueDate: newDueDate.toISOString(),
      affectedClients: pendingInstallments.map(i => ({
        installmentId: i.id,
        loanId: i.loan.id,
        clientName: `${i.loan.client.firstName} ${i.loan.client.lastName}`
      }))
    });
  } catch (error) {
    console.error("Fast-forward error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fast-forward installments"
    }, { status: 500 });
  }
}
