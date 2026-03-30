import { prisma } from "@/lib/db";
import Link from "next/link";
import TreasuryForm from "./TreasuryForm";
import { getActivePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function TreasuryPage() {
  const portfolio = await getActivePortfolio();
  
  const capitalTransactions = await prisma.capitalTransaction.findMany({ 
    where: { portfolio },
    orderBy: { date: 'desc' }, 
    take: 50 
  });
  
  let totalDeposits = 0, totalWithdrawals = 0;
  capitalTransactions.forEach(tx => {
    if (tx.type === "DEPOSIT") totalDeposits += Number(tx.amount);
    else totalWithdrawals += Number(tx.amount);
  });
  const netCapital = totalDeposits - totalWithdrawals;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Treasury</h1>
          <p className="text-sm text-zinc-500">Portfolio: <span className="text-yellow-400">{portfolio}</span></p>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:underline">← Dashboard</Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Deposits</p>
          <p className="text-xl font-bold text-emerald-400">₱{totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Withdrawals</p>
          <p className="text-xl font-bold text-red-400">₱{totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Net Capital</p>
          <p className="text-xl font-bold text-white">₱{netCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Inject or Withdraw Capital</h2>
        <TreasuryForm />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Transaction History</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {capitalTransactions.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No transactions recorded yet.</p>
          ) : (
            capitalTransactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-zinc-800 rounded-xl border border-zinc-700">
                <div>
                  <p className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.type}</p>
                  <p className="text-xs text-zinc-500">{tx.description || 'No description'}</p>
                </div>
                <p className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'DEPOSIT' ? '+' : '-'}₱{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
