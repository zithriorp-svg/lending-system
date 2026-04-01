import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 1. THE RECEIVER (Saves new applications)
export async function POST(req: Request) {
  try {
    const data = await req.json();
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
    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Agent App Error:", error);
    return NextResponse.json({ success: false, error: "Failed to secure application." }, { status: 500 });
  }
}

// 2. THE RETRIEVER (Fetches the application to build the PDF)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const application = await prisma.agentApplication.findUnique({
      where: { id: Number(id) }
    });

    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Database fetch failed." }, { status: 500 });
  }
}
