"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from 'next/cache';

export async function submitAgentApplication(data: any) {
  try {
    // Parse networkSize to integer (extract first number)
    let networkSizeNum: number | null = null;
    if (data.networkSize) {
      if (data.networkSize === "1-10") networkSizeNum = 5;
      else if (data.networkSize === "11-30") networkSizeNum = 20;
      else if (data.networkSize === "31-50") networkSizeNum = 40;
      else if (data.networkSize === "50+") networkSizeNum = 50;
    }

    await (prisma.agentApplication as any).create({
      data: {
        // Personal Information
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        address: data.address || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,

        // Territory & Operational Capacity
        territory: data.territory || null,
        networkSize: networkSizeNum,
        employment: data.employment || null,

        // Forensic Verification
        selfieUrl: data.selfieUrl || null,
        idPhotoUrl: data.idPhotoUrl || null,
        clearanceUrl: data.clearanceUrl || null,

        // Legal Compliance
        digitalSignature: data.digitalSignature || null,

        // Status
        status: "PENDING"
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (dbError: any) {
    console.error("Agent Application Error:", dbError);
    return { error: `DATABASE ERROR: ${dbError.message}` };
  }
}
