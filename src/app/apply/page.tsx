import { Suspense } from "react";
import { prisma } from "@/lib/db";
import ApplyFormClient from "./ApplyFormClient";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  // Fetch all registered agents from the database
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Fetch all portfolios from the database
  const portfolios = await prisma.systemPortfolio.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] text-gray-300 p-4 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00df82] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Application Form...</p>
        </div>
      </div>
    }>
      <ApplyFormClient agents={agents} portfolios={portfolios} />
    </Suspense>
  );
}
