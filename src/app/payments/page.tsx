import { prisma } from "@/lib/db";
import PaymentTerminal from "./PaymentTerminal";
import { getActivePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const portfolio = await getActivePortfolio();
  
  // Fetch all active loans in this portfolio
  const loans = await prisma.loan.findMany({
    where: { portfolio },
    include: { client: true },
    orderBy: { id: 'desc' }
  });

  // Get loan IDs for this portfolio
  const loanIds = loans.map(l => l.id);

  // Fetch recent payments for loans in this portfolio
  const recentPayments = await prisma.payment.findMany({
    where: { 
      loanId: { in: loanIds }
    },
    include: { loan: { include: { client: true } } },
    orderBy: { paymentDate: 'desc' },
    take: 10
  });

  // Format for client component - include clientId for deep-linking
  const loanOptions = loans.map(loan => ({
    id: loan.id,
    clientId: loan.clientId,
    client: {
      firstName: loan.client.firstName,
      lastName: loan.client.lastName
    }
  }));

  return <PaymentTerminal loans={loanOptions} portfolio={portfolio} />;
}
