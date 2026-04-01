"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function AgentApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File Upload States
  const [uploads, setUploads] = useState({
    idCard: null as File | null,
    selfie: null as File | null,
    billing: null as File | null,
    income: null as File | null,
    collatFront: null as File | null,
    collatRear: null as File | null,
    collatSerial: null as File | null,
    collatTitle: null as File | null,
  });

  // Digital Signature Pad Logic (Native HTML5 Canvas)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFileChange = (key: keyof typeof uploads, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploads(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if signature is empty (basic check)
    const canvas = canvasRef.current;
    const signatureDataUrl = canvas?.toDataURL(); // This is the image data of the signature

    setIsSubmitting(true);
    
    // ⚠️ THIS IS WHERE PHASE 2 (DATABASE) AND PHASE 3 (PDF) WILL GO.
    // Right now, it simulates a 2-second upload.
    setTimeout(() => {
      alert("Hardware Test Successful! Next step: Connect to Database & PDF Engine.");
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 pb-24" id="application-document">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
            Agent & Co-Maker
            <span className="block text-emerald-500">Official Application</span>
          </h1>
        </div>

        {/* 🚨 CRITICAL LIABILITY WARNING */}
        <div className="bg-rose-950/30 border-2 border-rose-500/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl animate-pulse">⚠️</span>
            <h2 className="text-lg font-black text-rose-400 uppercase tracking-widest">Strict Liability Notice</h2>
          </div>
          <p className="text-rose-200/80 text-sm font-medium leading-relaxed">
            By applying as an Agent, you assume the role of <strong>CO-MAKER / GUARANTOR</strong>. If a client defaults, <strong>YOU are 100% financially and legally responsible</strong>. Your pledged collateral may be seized.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. PERSONAL MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">1. Personal Matrix</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">First Name</label><input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="Legal First Name" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Last Name</label><input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="Legal Last Name" /></div>
            </div>
          </div>

          {/* 3. HARDWARE VERIFICATION (CAMERAS & FILES) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest">2. Identity Verification</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <label className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploads.idCard ? 'bg-cyan-950/30 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50'}`}>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange('idCard', e)} />
                <span className="text-3xl mb-2 block">{uploads.idCard ? '✅' : '🪪'}</span>
                <p className="text-xs font-bold text-slate-300 uppercase">{uploads.idCard ? 'ID Uploaded' : 'Snap Valid ID'}</p>
              </label>

              <label className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploads.selfie ? 'bg-cyan-950/30 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50'}`}>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileChange('selfie', e)} />
                <span className="text-3xl mb-2 block">{uploads.selfie ? '✅' : '🤳'}</span>
                <p className="text-xs font-bold text-slate-300 uppercase">{uploads.selfie ? 'Selfie Captured' : 'Take Selfie with ID'}</p>
              </label>

            </div>
          </div>

          {/* 4. DIGITAL SIGNATURE PAD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest">3. Binding Agreement & Signature</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <label className="flex items-start gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <input required type="checkbox" className="w-5 h-5 mt-0.5 accent-rose-500 rounded" />
                <span className="text-xs md:text-sm text-slate-300 font-medium">I acknowledge that I am applying as a Co-Maker and assume all financial liability for defaulted clients.</span>
              </label>

              <div className="pt-6 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Digital Signature (Draw Below)</label>
                  
                  {/* TOUCH PAD */}
                  <div className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl overflow-hidden relative touch-none">
                    <canvas 
                      ref={canvasRef}
                      width={400} 
                      height={200}
                      className="w-full h-[200px] cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <button type="button" onClick={clearSignature} className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-bold uppercase underline">
                    Clear Signature
                  </button>
              </div>

            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-lg transition-all text-sm md:text-base">
              {isSubmitting ? "Processing Hardware Data..." : "Submit Binding Application"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
