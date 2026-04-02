"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function fastForwardTime() {
  try {
    // Find all pending installments
    const installments = await prisma.loanInstallment.findMany({
      where: { status: { in: ["PENDING", "PARTIAL"] } }
    });
    
    // Shift them 7 days into the PAST (Simulating that we are 7 days in the future)
    for (const inst of installments) {
      const newDate = new Date(inst.dueDate);
      newDate.setDate(newDate.getDate() - 7);
      
      await prisma.loanInstallment.update({
        where: { id: inst.id },
        data: { dueDate: newDate }
      });
    }
    
    // Force the UI to refresh
    revalidatePath("/");
    revalidatePath("/portal/dashboard");
    revalidatePath("/clients/[id]", "page");
    
    return { success: true };
  } catch (error: any) {
    console.error("Time Travel Error:", error);
    return { error: error.message };
  }
}

export async function reverseTime() {
  try {
    // Find all pending installments
    const installments = await prisma.loanInstallment.findMany({
      where: { status: { in: ["PENDING", "PARTIAL"] } }
    });
    
    // Shift them 7 days back into the FUTURE (Restoring normal time)
    for (const inst of installments) {
      const newDate = new Date(inst.dueDate);
      newDate.setDate(newDate.getDate() + 7);
      
      await prisma.loanInstallment.update({
        where: { id: inst.id },
        data: { dueDate: newDate }
      });
    }
    
    // Force the UI to refresh
    revalidatePath("/");
    revalidatePath("/portal/dashboard");
    revalidatePath("/clients/[id]", "page");
    
    return { success: true };
  } catch (error: any) {
    console.error("Time Reversal Error:", error);
    return { error: error.message };
  }
}

