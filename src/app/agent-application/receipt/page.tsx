"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function DocumentViewer() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const phone = searchParams.get("phone");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id || phone) {
      const query = id ? `id=${id}` : `phone=${phone}`;
      fetch(`/api/agent-apply?${query}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success) setData(resData.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, phone]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-500 font-bold uppercase tracking-widest"><span className="animate-spin text-4xl mr-4">⚙️</span> Accessing Vault...</div>;
  if (!data) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-rose-500 font-bold uppercase"><span className="text-4xl mb-4">⚠️</span> Contract Not Found in Vault.</div>;

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 p-2 md:p-8 font-serif">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md uppercase">← Back</Link>
        <button onClick={() => window.print()} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-xl uppercase">🖨️ Save as PDF</button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 md:p-12 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-0">
        
        <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">FinTech Vault</h1>
          <h2 className="text-lg font-bold uppercase text-slate-600 mt-2">Binding Agent & Co-Maker Contract</h2>
          <p className="text-xs mt-3 font-mono text-slate-500 bg-slate-100 py-2 rounded-lg">DOC ID: FT-AGT-{data.id.toString().padStart(5, '0')} | DATE: {new Date(data.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-3 pb-1">1. Guarantor Details</h3>
              <p className="font-black text-xl uppercase">{data.firstName} {data.lastName}</p>
              <p className="text-sm">📞 {data.phone}</p>
              <p className="text-sm">📍 {data.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-3 pb-1">2. Financial Capacity</h3>
              <p className="text-sm font-bold uppercase text-slate-600">{data.incomeSource}</p>
              <p className="text-lg font-black">₱{data.grossIncome.toLocaleString()} / mo</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase border-b-2 border-slate-900 mb-3 pb-1">3. Pledged Collateral Declaration</h3>
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <p className="text-sm"><span className="font-bold uppercase">Asset Type:</span><br/> {data.assetType === "Other" ? data.customAssetType : data.assetType}</p>
                <p className="text-sm"><span className="font-bold uppercase">Market Value:</span><br/> <span className="font-black">₱{data.assetValue.toLocaleString()}</span></p>
              </div>
              <p className="text-sm"><span className="font-bold uppercase">Condition:</span><br/> {data.assetSpecs}</p>
            </div>
          </div>

          <div className="border-2 border-slate-900 p-5 bg-slate-50">
            <h3 className="text-md font-black uppercase mb-2 text-center">Strict Liability Agreement</h3>
            <p className="text-xs font-bold text-justify leading-relaxed text-slate-700">By executing this document, the individual legally binds themselves as a CO-MAKER for all recruited clients. If a client defaults, the Guarantor assumes 100% financial liability. FinTech Vault reserves the immediate right to seize the pledged collateral.</p>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-slate-200 text-center">
             <div className="w-64 mx-auto border-b-2 border-slate-900 pb-2 mb-2 flex justify-center">
               {data.signatureData ? <img src={data.signatureData} className="w-full h-auto invert" /> : <div className="h-16"></div>}
             </div>
             <p className="font-black uppercase text-sm">{data.firstName} {data.lastName}</p>
             <p className="text-xs font-bold text-slate-500 uppercase">Guarantor Signature</p>
          </div>

          {/* THE 6-CAMERA GRID */}
          <div className="mt-12 pt-8 border-t-2 border-slate-200 print:break-before-page">
            <h3 className="text-sm font-black uppercase mb-4 text-center">Appendix A: 6-Point Collateral Inspection</h3>
            <div className="grid grid-cols-3 gap-4">
              {data.collatFront && <div><p className="text-[10px] font-bold text-center">FRONT</p><img src={data.collatFront} className="border border-slate-300 w-full rounded" /></div>}
              {data.collatRear && <div><p className="text-[10px] font-bold text-center">REAR</p><img src={data.collatRear} className="border border-slate-300 w-full rounded" /></div>}
              {data.collatLeft && <div><p className="text-[10px] font-bold text-center">LEFT</p><img src={data.collatLeft} className="border border-slate-300 w-full rounded" /></div>}
              {data.collatRight && <div><p className="text-[10px] font-bold text-center">RIGHT</p><img src={data.collatRight} className="border border-slate-300 w-full rounded" /></div>}
              {data.collatSerial && <div><p className="text-[10px] font-bold text-center">SERIAL</p><img src={data.collatSerial} className="border border-slate-300 w-full rounded" /></div>}
              {data.collatDoc && <div><p className="text-[10px] font-bold text-center">DOCUMENT</p><img src={data.collatDoc} className="border border-slate-300 w-full rounded" /></div>}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t-2 border-slate-200">
             <h3 className="text-sm font-black uppercase mb-4 text-center">Appendix B: Forensic Identity</h3>
             <div className="grid grid-cols-2 gap-6">
              {data.idCardData && <div className="text-center"><p className="text-[10px] font-bold text-center">ID CARD</p><img src={data.idCardData} className="border border-slate-300 w-full max-h-48 object-contain rounded" /></div>}
              {data.selfieData && <div className="text-center"><p className="text-[10px] font-bold text-center">LIVE SELFIE</p><img src={data.selfieData} className="border border-slate-300 w-full max-h-48 object-contain rounded" /></div>}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AgentApplicationReceipt() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <DocumentViewer />
    </Suspense>
  );
}
