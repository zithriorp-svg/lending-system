import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Lock the data into the database vault
    const application = await prisma.agentApplication.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        fbProfileUrl: data.fbProfileUrl,
        address: data.address,
        incomeSource: data.incomeSource,
        grossIncome: Number(data.grossIncome),
        assetType: data.assetType,
        assetValue: Number(data.assetValue),
        assetSpecs: data.assetSpecs,
        idCardData: data.idCardData || null,
        selfieData: data.selfieData || null,
        signatureData: data.signatureData || null,
        status: "PENDING",
      },
    });

    // Return success and the new ID so we can generate the PDF
    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Agent App Error:", error);
    return NextResponse.json({ success: false, error: "Failed to secure application." }, { status: 500 });
  }
}

