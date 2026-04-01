"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgentApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert("Binding Agent Application Submitted. Awaiting Master Admin Review.");
      setIsSubmitting(false);
      window.location.href = "/";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
            Agent & Co-Maker
            <span className="block text-emerald-500">Official Application</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">
            SECURE • BINDING • ENCRYPTED
          </p>
        </div>

        {/* 🚨 CRITICAL LIABILITY WARNING */}
        <div className="bg-rose-950/30 border-2 border-rose-500/50 rounded-2xl p-6 shadow-2xl shadow-rose-900/20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl animate-pulse">⚠️</span>
            <h2 className="text-lg font-black text-rose-400 uppercase tracking-widest">Strict Liability Notice</h2>
          </div>
          <p className="text-rose-200/80 text-sm font-medium leading-relaxed">
            By applying as an Agent for FinTech Vault, you automatically assume the role of <strong>CO-MAKER / GUARANTOR</strong> for every client you onboard. If a client defaults, absconds, or refuses to pay, <strong>YOU are 100% financially and legally responsible</strong> for the unpaid principal, interest, and penalties. Your pledged collateral may be seized.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. PERSONAL MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">1. Personal Matrix</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none" placeholder="Legal First Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none" placeholder="Legal Last Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input required type="tel" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none" placeholder="09XX XXX XXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facebook Profile URL</label>
                <input required type="url" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" placeholder="https://facebook.com/..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Complete Current Address</label>
                <textarea required rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none" placeholder="House No., Street, Barangay, City, Province"></textarea>
              </div>
            </div>
          </div>

          {/* 2. GUARANTOR CAPACITY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest">2. Financial Capacity</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 text-sm text-slate-400 mb-2">
                To act as a Co-Maker, you must prove you have the income to cover your clients' debts.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Source of Income</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none" placeholder="Job Title / Business Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gross Monthly Income (₱)</label>
                <input required type="number" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none" placeholder="e.g. 25000" />
              </div>
            </div>
          </div>

          {/* 3. FORENSIC VERIFICATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest">3. Identity Verification</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                <span className="text-3xl mb-2 block">🪪</span>
                <p className="text-xs font-bold text-slate-300 uppercase">Upload Valid ID</p>
                <p className="text-[10px] text-slate-500 mt-1">Gov't issued ID only</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                <span className="text-3xl mb-2 block">🤳</span>
                <p className="text-xs font-bold text-slate-300 uppercase">Selfie with ID</p>
                <p className="text-[10px] text-slate-500 mt-1">Clear face and ID</p>
              </div>
            </div>
          </div>

          {/* 4. COLLATERAL DECLARATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-purple-400 uppercase tracking-widest">4. Collateral Declaration</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-sm text-slate-400 mb-2">
                Provide details of the asset you are pledging as a guarantee against client default. This asset will be seized if obligations are unmet.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asset Type</label>
                  <select required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none appearance-none">
                    <option value="">Select Category...</option>
                    <option value="motorcycle">Motorcycle / Vehicle</option>
                    <option value="real_estate">Land / Real Estate Title</option>
                    <option value="electronics">High-Value Electronics</option>
                    <option value="other">Other Appraisable Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Market Value (₱)</label>
                  <input required type="number" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none" placeholder="e.g. 150000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asset Specifications & Condition</label>
                  <textarea required rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none" placeholder="Include Make, Model, Year, Serial Number, OR/CR Number, and current physical condition..."></textarea>
                </div>
              </div>

              {/* Collateral Photos UI */}
              <div className="pt-4 border-t border-slate-800">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Asset Photographic Evidence</label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                      <span className="text-2xl mb-1 block">📸</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Front View</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                      <span className="text-2xl mb-1 block">📸</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Rear / Side View</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                      <span className="text-2xl mb-1 block">🔍</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Serial / Plate</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                      <span className="text-2xl mb-1 block">📄</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Title / ORCR</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* 5. LIABILITY ACKNOWLEDGMENT & SIGNATURE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest">5. Binding Agreement & Signature</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors">
                  <input required type="checkbox" className="w-5 h-5 mt-0.5 accent-rose-500 rounded bg-slate-900 border-slate-700" />
                  <span className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                    I acknowledge that I am applying as a <strong>Co-Maker</strong>. If any client assigned to me defaults on their loan, I agree that the unpaid balance will be legally charged to me, and my pledged collateral listed above may be seized by FinTech Vault.
                  </span>
                </label>
                
                <label className="flex items-start gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors">
                  <input required type="checkbox" className="w-5 h-5 mt-0.5 accent-emerald-500 rounded bg-slate-900 border-slate-700" />
                  <span className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                    I swear that all information, collateral details, and documents provided are genuine. Any fraudulent information is grounds for immediate termination and legal action.
                  </span>
                </label>
              </div>

              {/* Digital Signature Pad */}
              <div className="pt-6 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Digital E-Signature</label>
                  <p className="text-[10px] text-slate-500 text-center mb-4 uppercase tracking-widest">Type your full legal name to legally bind this contract</p>
                  
                  <div className="max-w-md mx-auto relative">
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-950/50 border-b-2 border-slate-600 border-t-0 border-l-0 border-r-0 rounded-none px-3 py-4 text-emerald-400 text-2xl font-serif italic focus:border-rose-500 focus:ring-0 transition-all outline-none text-center" 
                      placeholder="Sign Here..." 
                    />
                    <div className="absolute right-2 bottom-3 text-[10px] text-slate-600 font-bold uppercase pointer-events-none">
                      VERIFIED
                    </div>
                  </div>
              </div>

            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Encrypting Legal Contract...
                </>
              ) : (
                <>
                  <span>⚖️</span> Submit Binding Application
                </>
              )}
            </button>
          </div>
          
          <div className="text-center pt-4">
            <Link href="/" className="text-slate-500 text-xs font-bold hover:text-slate-300 transition-colors uppercase tracking-wider">
              ← Cancel & Return to Login
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
