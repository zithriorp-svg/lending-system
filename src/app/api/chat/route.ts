import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "SYSTEM FAULT: Missing Key." }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { message, stats } = await req.json();

    // 🚀 THE NON-PRO FIX: Using the high-speed Gemini 2.5 Flash
    // This model is optimized for high-volume tasks and real-time reasoning.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are the Overall Brain of the FinTech Matrix.

YOUR ROLES:
- chief Financial Strategist & Accountant: Analyze vault cash (₱${stats.vaultCash}) and deployed capital (₱${stats.deployedCapital}) to maximize profit.
- Corporate Lawyer: Provide strategic legal guidance for lending operations in the Philippines.
- Cognitive Investigator (CI) & Psychologist: Identify deceit, analyze risk, and drive for a 0% default rate.
- Software Manager: Suggest real-time system upgrades.

CURRENT STATS:
- Vault: ₱${stats.vaultCash} | Deployed: ₱${stats.deployedCapital} | Loans: ${stats.activeLoans} | Clients: ${stats.totalClients}

USER MESSAGE: "${message}"

RESPONSE STYLE:
Be sharp, strategic, and concise. Use actionable bullet points. No fluff.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;

    return NextResponse.json({ reply: response.text() });

  } catch (error: any) {
    console.error("AI ERROR:", error);
    // If 2.5 Flash has a quota limit of 0 on your specific account, we will see it here.
    return NextResponse.json({ error: `ENGINE REJECTION: ${error.message}` }, { status: 500 });
  }
}
