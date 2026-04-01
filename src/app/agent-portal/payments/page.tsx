import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

// 🚀 IMPORTING THE MASTER TERMINAL SAFELY INTO THE AGENT ZONE
import PaymentTerminal from "@/app/payments/PaymentTerminal";

export const dynamic = "force-dynamic";

export default async function AgentPaymentsPage() {
  const cookieStore = await cookies();
  const agentSession = cookieStore.get("agent_session");
  const agentIdCookie = cookieStore.get("agent_id");

  // Verify Agent Credentials
  if (agentSession?.value !== "authenticated" || !agentIdCookie?.value) {
    redirect("/agent-portal");
  }

  const agentId = parseInt(agentIdCookie.value);

  // 🔒 SECURE BYPASS: Fetch ONLY active loans assigned to THIS specific agent
  const loans = await prisma.loan.findMany({
    where: {
      agentId: agentId,
      status: "ACTIVE"
    },
    include: { client: true },
    orderBy: { id: 'desc' }
  });

  const loanOptions = loans.map(loan => ({
    id: loan.id,
    clientId: loan.clientId,
    client: {
      firstName: loan.client.firstName,
      lastName: loan.client.lastName
    }
  }));

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  // Boot up the exact same Payment Terminal UI, fully synchronized!
  return <PaymentTerminal loans={loanOptions} portfolio={agent?.portfolio || "Agent Field Ops"} />;
}

