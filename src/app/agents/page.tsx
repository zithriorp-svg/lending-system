"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";

export default function AgentManagement() {
  const [agents, setAgents] = useState<any[]>([]);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING">("ACTIVE");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, pendingRes] = await Promise.all([
        fetch("/api/agents").then(res => res.json()),
        fetch("/api/agents/pending").then(res => res.json())
      ]);
      if (agentsRes.success) setAgents(agentsRes.data);
      if (pendingRes.success) setPendingApps(pendingRes.data);
    } catch (error) {
      console.error("Failed to load agents", error);
    }
    setLoading(false);
  };

  const handleProcessApplication = async (id: number, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;
    
    try {
      const res = await fetch("/api/agents/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        alert(`Application ${action}D successfully.`);
        fetchData(); // Refresh the lists
      }
    } catch (error) {
      alert("Error processing application.");
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading Agent Database...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Agent Fleet Control</h1>
        <Link href="/" className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase">Back to Hub</Link>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
        <button onClick={() => setActiveTab("ACTIVE")} className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all ${activeTab === "ACTIVE" ? "bg-amber-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>Active Fleet ({agents.length})</button>
        <button onClick={() => setActiveTab("PENDING")} className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "PENDING" ? "bg-emerald-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
          Pending Recruits {pendingApps.length > 0 && <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingApps.length}</span>}
        </button>
      </div>

      {/* ACTIVE FLEET TAB */}
      {activeTab === "ACTIVE" && (
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center text-zinc-500">No active agents.</div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-amber-400">{agent.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-1">ID: AGT-{agent.id.toString().padStart(4, '0')} | {agent.portfolio}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${agent.isLocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
                    {agent.isLocked ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div><span className="text-zinc-500 text-xs uppercase block">Active Loans</span><span className="font-bold text-white">{agent._count?.loans || 0}</span></div>
                  <div><span className="text-zinc-500 text-xs uppercase block">Phone</span><span className="font-bold text-white">{agent.phone}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PENDING RECRUITS TAB */}
      {activeTab === "PENDING" && (
        <div className="space-y-4">
          {pendingApps.length === 0 ? (
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center text-zinc-500">No pending agent applications.</div>
          ) : (
            pendingApps.map((app) => (
              <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase">{app.firstName} {app.lastName}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{app.phone} • {app.address}</p>
                  </div>
                  <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded font-mono">ID: {app.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2 text-sm">
                    <p className="text-zinc-500 text-xs font-bold uppercase">Financial Capacity</p>
                    <p className="text-white"><span className="text-zinc-400">Source:</span> {app.incomeSource}</p>
                    <p className="text-emerald-400 font-bold"><span className="text-zinc-400 font-normal">Income:</span> ₱{app.grossIncome.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-purple-400 text-xs font-bold uppercase">Pledged Collateral</p>
                    <p className="text-white"><span className="text-zinc-400">Type:</span> {app.assetType}</p>
                    <p className="text-purple-400 font-bold"><span className="text-zinc-400 font-normal">Value:</span> ₱{app.assetValue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Evidence Thumbnails */}
                <div className="flex gap-4 mb-6">
                   {app.idCardData && (
                     <div className="flex-1">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ID Card</p>
                       <img src={app.idCardData} alt="ID" className="h-16 w-full object-cover rounded border border-zinc-700 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                     </div>
                   )}
                   {app.selfieData && (
                     <div className="flex-1">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Selfie</p>
                       <img src={app.selfieData} alt="Selfie" className="h-16 w-full object-cover rounded border border-zinc-700 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                     </div>
                   )}
                   {app.signatureData && (
                     <div className="flex-1">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Signature</p>
                       <img src={app.signatureData} alt="Signature" className="h-16 w-full object-contain rounded border border-zinc-700 bg-white" />
                     </div>
                   )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleProcessApplication(app.id, "REJECT")} className="flex-1 py-3 bg-zinc-800 hover:bg-rose-900/50 text-rose-400 border border-zinc-700 hover:border-rose-500 rounded-xl font-bold text-sm uppercase transition-colors">Reject</button>
                  <button onClick={() => handleProcessApplication(app.id, "APPROVE")} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase transition-colors">Approve & Hire Agent</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
