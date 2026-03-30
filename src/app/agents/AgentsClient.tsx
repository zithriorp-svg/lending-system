"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: number;
  name: string;
  phone: string;
  activeLoans: number;
  totalExposure: number;
  pendingCommission: number;
  commissionsCount: number;
  username?: string | null;
  pin?: string | null;
  isLocked?: boolean;
}

interface AgentDossier {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  portfolio: string;
  username?: string | null;
  pin?: string | null;
  isLocked?: boolean;
  totalLifetimeEarnings: number;
  pendingPayout: number;
  commissionsCount: number;
  pendingCommissionsCount: number;
  totalRiskLiability: number;
  activeLoansCount: number;
  activeClients: Array<{
    loanId: number;
    clientId: number;
    clientName: string;
    originalPrincipal: number;
    remainingBalance: number;
    nextDueDate: string | null;
    nextDueAmount: number | null;
    statusColor: string;
  }>;
}

interface AgentsResponse {
  agents: Agent[];
  portfolio: string;
}

const formatCurrency = (value: number) => {
  return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function AgentCommandCenter() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected agent for dossier
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [dossier, setDossier] = useState<AgentDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payout state
  const [settlingAgentId, setSettlingAgentId] = useState<number | null>(null);

  // Credentials state
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDossier = async (agentId: number) => {
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/agents/dossier?agentId=${agentId}`);
      const json = await res.json();
      if (json.error) {
        console.error(json.error);
      } else {
        setDossier(json.dossier);
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchDossier(selectedAgentId);
    } else {
      setDossier(null);
    }
  }, [selectedAgentId]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone })
      });

      if (res.ok) {
        setNewName("");
        setNewPhone("");
        fetchData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to create agent");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettlePayout = async (agentId: number) => {
    if (!confirm("Settle and payout all pending commissions for this agent?")) return;

    setSettlingAgentId(agentId);
    try {
      const res = await fetch('/api/agents/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      const json = await res.json();
      if (json.success) {
        alert(`Settled ${json.settledCount} commissions. Total payout: ${formatCurrency(json.totalPayout)}`);
        fetchData();
        if (selectedAgentId === agentId) {
          fetchDossier(agentId);
        }
      } else {
        alert(json.error || "Failed to settle commissions");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSettlingAgentId(null);
    }
  };

  const handleGenerateCredentials = async (agentId: number) => {
    if (!confirm("Generate new login credentials for this agent? This will overwrite any existing credentials.")) return;

    setGeneratingCredentials(true);
    try {
      const res = await fetch('/api/agents/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      const json = await res.json();
      if (json.success) {
        alert(`Credentials generated!\n\nUsername: ${json.agent.username}\nPIN: ${json.agent.pin}\n\nPlease share these credentials securely with the agent.`);
        fetchDossier(agentId);
        fetchData();
      } else {
        alert(json.error || "Failed to generate credentials");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGeneratingCredentials(false);
    }
  };

  const handleToggleLock = async (agentId: number, currentLockStatus: boolean) => {
    const action = currentLockStatus ? "unlock" : "lock";
    if (!confirm(`Are you sure you want to ${action} this agent?`)) return;

    setTogglingLock(true);
    try {
      const res = await fetch('/api/agents/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, isLocked: !currentLockStatus })
      });

      const json = await res.json();
      if (json.success) {
        alert(`Agent ${action}ed successfully!`);
        fetchDossier(agentId);
        fetchData();
      } else {
        alert(json.error || `Failed to ${action} agent`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTogglingLock(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Error</p>
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Command Center</h1>
          <p className="text-sm text-zinc-500">Portfolio: <span className="text-yellow-400">{data?.portfolio}</span></p>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:underline">← Dashboard</Link>
      </div>

      {/* SELECT AGENT Dropdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Select Agent for Master Dossier</h2>
        <select
          value={selectedAgentId || ""}
          onChange={(e) => setSelectedAgentId(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">-- Select an Agent --</option>
          {data?.agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name} {agent.phone ? `(${agent.phone})` : ''} - {agent.activeLoans} active loans
            </option>
          ))}
        </select>
      </div>

      {/* MASTER DOSSIER */}
      {selectedAgentId && (
        loadingDossier ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading dossier...</p>
          </div>
        ) : dossier ? (
          <div className="space-y-6">
            {/* Card 0: Authentication & Access Control */}
            <div className={`bg-zinc-900 border rounded-2xl p-6 shadow-xl ${dossier.isLocked ? 'border-rose-500/50' : 'border-zinc-800'}`}>
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">🔐 Authentication & Access Control</h2>

              {dossier.isLocked && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="text-rose-400 font-bold">ACCOUNT LOCKED</p>
                      <p className="text-xs text-rose-300">This agent cannot access the portal</p>
                    </div>
                  </div>
                </div>
              )}

              {dossier.username ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Username</p>
                      <p className="text-lg font-mono font-bold text-emerald-400">{dossier.username}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">PIN</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono font-bold text-emerald-400">
                          {showCredentials ? dossier.pin : '••••••'}
                        </p>
                        <button
                          onClick={() => setShowCredentials(!showCredentials)}
                          className="text-zinc-400 hover:text-white text-sm"
                        >
                          {showCredentials ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGenerateCredentials(dossier.id)}
                      disabled={generatingCredentials}
                      className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                    >
                      {generatingCredentials ? "Regenerating..." : "🔄 Regenerate Credentials"}
                    </button>
                    <button
                      onClick={() => handleToggleLock(dossier.id, dossier.isLocked || false)}
                      disabled={togglingLock}
                      className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all ${
                        dossier.isLocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      } disabled:opacity-50`}
                    >
                      {togglingLock ? "Processing..." : dossier.isLocked ? "🔓 Unlock Agent" : "🔒 Lock Agent"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-zinc-500 mb-4">No credentials generated yet</p>
                  <button
                    onClick={() => handleGenerateCredentials(dossier.id)}
                    disabled={generatingCredentials}
                    className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white disabled:opacity-50"
                  >
                    {generatingCredentials ? "Generating..." : "🔑 Generate Login Credentials"}
                  </button>
                </div>
              )}
            </div>

            {/* Card 1: Agent Identity & Risk Profile */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Card 1: Agent Identity</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Agent Name</p>
                  <p className="text-2xl font-bold text-white">{dossier.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-2xl font-bold text-white">{dossier.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date Registered</p>
                  <p className="text-lg font-bold text-white">{formatDate(dossier.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Card 2: 60/40 Commission Ledger */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Card 2: 60/40 Commission Ledger</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Lifetime Earnings</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatCurrency(dossier.totalLifetimeEarnings)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{dossier.commissionsCount} total commissions</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pending Payout</p>
                  <p className="text-3xl font-bold text-amber-400">{formatCurrency(dossier.pendingPayout)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{dossier.pendingCommissionsCount} pending transactions</p>
                </div>
              </div>
              <button
                onClick={() => handleSettlePayout(dossier.id)}
                disabled={dossier.pendingPayout === 0 || settlingAgentId !== null}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-all ${
                  dossier.pendingPayout > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {settlingAgentId === dossier.id
                  ? "Processing..."
                  : dossier.pendingPayout > 0
                    ? `Settle Payout - ${formatCurrency(dossier.pendingPayout)}`
                    : "No Pending Payout"
                }
              </button>
            </div>

            {/* Card 3: Co-Maker Liability */}
            <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4">Card 3: Co-Maker Liability (CRITICAL)</h2>
              <div className="bg-rose-500/10 rounded-xl p-4 mb-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total Risk / Liability</p>
                <p className="text-4xl font-bold text-rose-500">{formatCurrency(dossier.totalRiskLiability)}</p>
                <p className="text-xs text-zinc-400 mt-2">
                  This is what the agent owes the House if all their clients default.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase">Active Loans</p>
                  <p className="text-2xl font-bold text-white">{dossier.activeLoansCount}</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase">Active Clients</p>
                  <p className="text-2xl font-bold text-white">{dossier.activeClients.length}</p>
                </div>
              </div>
            </div>

            {/* Card 4: Active Client Roster */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Card 4: Active Client Roster</h2>

              {dossier.activeClients.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No active clients for this agent
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {dossier.activeClients.map(client => (
                    <Link
                      key={client.loanId}
                      href={`/clients/${client.clientId}`}
                      className="block bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 border border-zinc-700 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-lg font-bold text-white">{client.clientName}</p>
                          <p className="text-xs text-zinc-500">Loan ID: {client.loanId}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          client.statusColor === 'text-rose-500' ? 'bg-rose-500/20 text-rose-400' :
                          client.statusColor === 'text-amber-400' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-zinc-700 text-zinc-400'
                        }`}>
                          {client.statusColor === 'text-rose-500' ? 'LATE' :
                           client.statusColor === 'text-amber-400' ? 'DUE TODAY' : 'ON TRACK'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">Original Principal</p>
                          <p className="font-bold text-white">{formatCurrency(client.originalPrincipal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Remaining Balance</p>
                          <p className="font-bold text-blue-400">{formatCurrency(client.remainingBalance)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Next Due</p>
                          <p className={`font-bold ${client.statusColor}`}>
                            {client.nextDueDate ? formatDate(client.nextDueDate) : 'N/A'}
                          </p>
                          {client.nextDueAmount && (
                            <p className="text-xs text-zinc-500">{formatCurrency(client.nextDueAmount)}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null
      )}

      {/* Register New Agent Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Register New Agent</h2>
        <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 uppercase mb-1">Agent Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="09xx xxx xxxx"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-wider"
            >
              {submitting ? "Registering..." : "Add Agent"}
            </button>
          </div>
        </form>
      </div>

      {/* Commission Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Commission Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 uppercase mb-1">Total Agents</p>
            <p className="text-3xl font-bold text-white">{data?.agents.length || 0}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 uppercase mb-1">Active Loans Managed</p>
            <p className="text-3xl font-bold text-blue-400">{data?.agents.reduce((sum, a) => sum + a.activeLoans, 0) || 0}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 uppercase mb-1">Total Pending Payouts</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(data?.agents.reduce((sum, a) => sum + a.pendingCommission, 0) || 0)}</p>
          </div>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Commission Structure</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">House Share</span>
              <span className="text-2xl font-bold text-blue-400">60%</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Retained in Vault Cash immediately upon interest collection</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Agent Share</span>
              <span className="text-2xl font-bold text-emerald-400">40%</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Accumulates as pending commission until settled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
