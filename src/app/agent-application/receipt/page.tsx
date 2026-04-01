"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function DocumentViewer() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/agent-apply?id=${id}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success) setData(resData.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-emerald-500 font-bold uppercase tracking-widest"><span className="text-4xl animate-spin mb-4">⚙️</span> Generating Secure PDF...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-rose-500 font-bold uppercase">Contract Not Found in Vault.</div>;

  const handlePrint = () => {
    window.print(); // This triggers the phone/computer's native "Save as PDF" menu
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 p-2 md:p-8 font-serif">
      
      {/* ACTION BAR (Hidden when printing/saving PDF) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <Link href="/" className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md uppercase tracking-wider text-center">
          ← Back to Vault Login
        </Link>
        <button onClick={handlePrint} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider transition-all">
          <span className="text-xl">🖨️</span> Save as PDF / Print
        </button>
      </div>

      {/* THE ACTUAL LEGAL DOCUMENT */}
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-12 shadow-2xl border border-slate-300 relative print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-slate-900">FinTech Vault</h1>
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest text-slate-600 mt-2">Binding Agent & Co-Maker Contract</h2>
          <p className="text-xs md:text-sm mt-3 font-mono text-slate-500 bg-slate-100 py-2 rounded-lg">
            DOCUMENT ID: FT-AGT-{data.id.toString().padStart(5, '0')} | DATE FILED: {new Date(data.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Section 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase border-b-2 border-slate-900 mb-3 pb-1">1. Guarantor Details</h3>
              <p className="font-black text-xl mb-1 uppercase">{data.firstName} {data.lastName}</p>
              <p className="text-sm font-medium text-slate-700 mb-1">📞 {data.phone}</p>
              <p className="text-sm font-medium text-slate-700">📍 {data.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase border-b-2 border-slate-900 mb-3 pb-1">2. Financial Capacity</h3>
              <p className="text-sm mb-2"><span className="font-bold uppercase text-slate-600">Primary Income:</span><br/> {data.incomeSource}</p>
              <p className="text-sm"><span className="font-bold uppercase text-slate-600">Gross Monthly Income:</span><br/> <span className="text-lg font-black">₱{data.grossIncome.toLocaleString()}</span></p>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase border-b-2 border-slate-900 mb-3 pb-1">3. Pledged Collateral Declaration</h3>
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <p className="text-sm"><span className="font-bold uppercase text-slate-600">Asset Type:</span><br/> {data.assetType}</p>
                <p className="text-sm"><span className="font-bold uppercase text-slate-600">Market Value:</span><br/> <span className="font-black">₱{data.assetValue.toLocaleString()}</span></p>
              </div>
              <p className="text-sm"><span className="font-bold uppercase text-slate-600">Specifications & Condition:</span><br/> {data.assetSpecs}</p>
            </div>
          </div>

          {/* Liability Clause */}
          <div className="border-2 border-slate-900 p-5 bg-slate-50">
            <h3 className="text-md font-black text-slate-900 uppercase mb-2 text-center">Strict Liability Agreement</h3>
            <p className="text-xs font-bold text-justify leading-relaxed text-slate-700">
              By executing this document, the above-named individual legally binds themselves as a CO-MAKER and GUARANTOR for all clients they recruit into the FinTech Vault system. In the event that a recruited client defaults, absconds, or fails to meet payment obligations, the Guarantor assumes 100% financial liability. FinTech Vault reserves the immediate right to seize the pledged collateral listed in Section 3 to recover lost principal, interest, and penalties without need for further legal demand.
            </p>
          </div>

          {/* Signatures & Evidence */}
          <div className="mt-12 pt-8 border-t-2 border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase mb-6 text-center">Execution & Digital Signature</h3>
            
            <div className="flex flex-col items-center justify-center">
              {data.signatureData ? (
                <div className="w-64 border-b-2 border-slate-900 pb-2 mb-2 flex flex-col items-center">
                  <img src={data.signatureData} alt="Signature" className="w-full h-auto invert" /> 
                </div>
              ) : (
                <div className="w-64 border-b-2 border-slate-900 pb-12 mb-2"></div>
              )}
              <p className="font-black uppercase text-sm">{data.firstName} {data.lastName}</p>
              <p className="text-xs font-bold text-slate-500 uppercase">Guarantor / Co-Maker</p>
            </div>
          </div>

          {/* Forensic Evidence */}
          <div className="mt-12 pt-8 border-t-2 border-slate-200 print:break-before-page">
            <h3 className="text-sm font-black text-slate-900 uppercase mb-4 text-center">Appendix A: Forensic Evidence</h3>
            <div className="grid grid-cols-2 gap-6">
              {data.idCardData && (
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Government ID</p>
                  <img src={data.idCardData} alt="ID" className="border-2 border-slate-300 w-full h-auto max-h-64 object-contain rounded-xl mx-auto" />
                </div>
              )}
              {data.selfieData && (
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Live Selfie</p>
                  <img src={data.selfieData} alt="Selfie" className="border-2 border-slate-300 w-full h-auto max-h-64 object-contain rounded-xl mx-auto" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AgentApplicationReceipt() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Data Core...</div>}>
      <DocumentViewer />
    </Suspense>
  );
}

