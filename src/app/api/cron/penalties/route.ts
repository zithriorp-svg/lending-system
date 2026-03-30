import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// CRON_SECRET environment variable for security
// This ensures only Vercel cron or authorized calls can trigger this
const CRON_SECRET = process.env.CRON_SECRET;

// Penalty configuration - 5% of expected amount per week late, capped at 50%
const PENALTY_RATE = 0.05; // 5% penalty
const MAX_PENALTY_RATE = 0.50; // Max 50% of principal
const PENALTY_FLAT_FEE = 50; // Fixed penalty fee option

export async function GET(request: Request) {
  try {
    // Security check - verify cron secret
    const authHeader = request.headers.get("authorization");
    const urlSecret = new URL(request.url).searchParams.get("secret");
    
    // Allow either header auth or URL param for Vercel cron
    const providedSecret = authHeader?.replace("Bearer ", "") || urlSecret;
    
    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Find all overdue installments that are still PENDING
    const overdueInstallments = await prisma.loanInstallment.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: now }
      },
      include: {
        loan: { include: { client: true } }
      }
    });

    const results = {
      processed: 0,
      penaltiesApplied: 0,
      totalPenalties: 0,
      errors: [] as string[]
    };

    for (const installment of overdueInstallments) {
      try {
        // Calculate days late
        const dueDate = new Date(installment.dueDate);
        const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only apply penalty once per 7 days late (weekly penalty)
        const expectedAmount = Number(installment.expectedAmount);
        const currentPenalty = Number(installment.penaltyFee);
        
        // Calculate what the penalty should be based on days late
        // Penalty increases by PENALTY_FLAT_FEE every 7 days late
        const weeksLate = Math.floor(daysLate / 7);
        const expectedPenalty = weeksLate * PENALTY_FLAT_FEE;
        
        // Also calculate percentage-based penalty (5% per week, max 50%)
        const percentageBasedPenalty = Math.min(
          expectedAmount * PENALTY_RATE * weeksLate,
          expectedAmount * MAX_PENALTY_RATE
        );
        
        // Use the higher of flat fee or percentage-based penalty
        const newPenalty = Math.max(expectedPenalty, percentageBasedPenalty);
        
        // Only update if penalty has increased
        if (newPenalty > currentPenalty) {
          const penaltyIncrement = newPenalty - currentPenalty;
          
          await prisma.loanInstallment.update({
            where: { id: installment.id },
            data: {
              penaltyFee: newPenalty,
              status: "LATE" // Update status to LATE
            }
          });
          
          results.penaltiesApplied++;
          results.totalPenalties += penaltyIncrement;
        }
        
        results.processed++;
      } catch (error) {
        const errorMsg = `Error processing installment ${installment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log the cron execution
    console.log(`[CRON] Penalty Engine executed at ${new Date().toISOString()}`);
    console.log(`[CRON] Processed: ${results.processed}, Penalties Applied: ${results.penaltiesApplied}, Total: ${results.totalPenalties}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error) {
    console.error("[CRON] Penalty Engine Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
