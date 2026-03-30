"use client";

import { logout } from "@/lib/auth";

export default function LockVaultButton() {
  const handleLogout = async () => {
    if (confirm("Lock the vault and logout?")) {
      await logout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-xs text-red-400 font-bold uppercase tracking-wider hover:text-red-300 transition-colors bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-700 hover:border-red-500/50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Lock Vault
    </button>
  );
}
