"use client";

import { useState, useEffect } from "react";
import { submitAgentApplication } from "./actions";
import SignaturePad from "@/components/SignaturePad";

export default function AgentApplyClient({ defaultPortfolio }: { defaultPortfolio: string }) {
  const [formData, setFormData] = useState<any>({
    firstName: "", lastName: "", phone: "", address: "",
    birthDate: "", territory: "", networkSize: "1-10", employment: "",
    selfieUrl: "", idPhotoUrl: "", clearanceUrl: "", digitalSignature: "",
    portfolio: defaultPortfolio // 🚀 LOCK THE PORTFOLIO IN STATE
  });

  const [status, setStatus] = useState("");
  const [locStatus, setLocStatus] = useState("Locating...");

  useEffect(() => {
    const geoOptions = { timeout: 3000, maximumAge: 10000, enableHighAccuracy: false };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev: any) => ({...prev, locationLat: pos.coords.latitude, locationLng: pos.coords.longitude}));
          setLocStatus("Location Verified ✓");
        },
        () => setLocStatus("Location Bypassed"),
        geoOptions
      );
    } else {
      setLocStatus("Location Bypassed");
    }
  }, []);

  const handleImage = (e: any, field: string) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: any) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        setFormData((prev: any) => ({...prev, [field]: compressedBase64}));
      };
    };
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    window.print();
    
    setStatus("SUBMITTING AGENT DOSSIER...");
    try {
      const res = await submitAgentApplication(formData);
      if (res?.error) throw new Error(res.error);
      alert("Application Received! Our team will review your application shortly.");
      window.location.href = "/";
    } catch (error: any) {
      alert("Submission Error: " + error.message);
      setStatus("");
    }
  };

  const rapidInputStyle = "w-full bg-transparent p-3 text-sm border-b border-[#2a2a35] outline-none text-white appearance-none";
  const borderStyle = "border border-[#2a2a35] bg-[#0f0f13]";
  const headerStyle = "text-blue-600 font-bold text-lg mb-3 uppercase tracking-wider";
  const currentDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-300 p-4 font-sans pb-20 print:block print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:text-black print:p-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 pt-4 print:hidden">
          <h1 className="text-3xl font-serif font-bold text-gray-200 mb-2">Field Agent<br/>Application</h1>
          {/* 🚀 SHOW THE APPLICANT WHICH PORTFOLIO THEY ARE JOINING */}
          <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block mb-3">
            DIVISION: {defaultPortfolio}
          </span>
          <p className="text-gray-500 text-xs tracking-widest font-bold">EARN 40% COMMISSION • FLEXIBLE HOURS</p>
        </div>

        <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-6">
          <h1 className="text-2xl font-bold text-black mb-1">FIELD AGENT APPLICATION RECEIPT</h1>
          <p className="text-sm text-gray-600">Division: {defaultPortfolio} • {currentDate}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="print:hidden">
            <h2 className={headerStyle}>1. Agent Dossier (Personal Info)</h2>
            <div className={`grid grid-cols-2 gap-0 ${borderStyle}`}>
              <input name="firstName" required placeholder="First Name" className={`${rapidInputStyle} border-r`} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input name="lastName" required placeholder="Last Name" className={rapidInputStyle} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              <input name="birthDate" required type="text" placeholder="Birth Date (YYYY-MM-DD)" className={`${rapidInputStyle} border-r col-span-1 text-gray-400`} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
              <input name="phone" required placeholder="Phone Number" className={`${rapidInputStyle} col-span-2`} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input name="address" required placeholder="Full Address" className={`${rapidInputStyle} col-span-2 border-b-0`} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>

          <div className="print:hidden">
            <h2 className={headerStyle}>2. Territory & Operational Capacity</h2>
            <div className={`${borderStyle} p-4 space-y-4`}>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Primary Operation Area (City/Barangay)</label>
                <input name="territory" required placeholder="e.g., Brgy. San Jose, Pasig City" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" onChange={e => setFormData({...formData, territory: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Estimated Network Size</label>
                <select name="networkSize" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" value={formData.networkSize} onChange={e => setFormData({...formData, networkSize: e.target.value})}>
                  <option value="1-10">1-10 people</option><option value="11-30">11-30 people</option><option value="31-50">31-50 people</option><option value="50+">50+ people</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Current Employment / Business</label>
                <input name="employment" required placeholder="e.g., Sari-sari store owner, Tricycle driver" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" onChange={e => setFormData({...formData, employment: e.target.value})} />
              </div>
              <p className={`text-center text-xs pb-2 ${locStatus.includes('Verified') ? 'text-[#00df82]' : 'text-yellow-500'}`}>GPS: {locStatus}</p>
            </div>
          </div>

          <div className="print:hidden">
            <h2 className="text-[#00df82] font-bold text-lg mb-3 uppercase tracking-wider">3. Forensic Verification Dossier</h2>
            <div className={`${borderStyle} p-4 space-y-4`}>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {[
                  {field: 'selfieUrl', label: 'Live Selfie (capture)', required: true},
                  {field: 'idPhotoUrl', label: 'Valid Government ID', required: true},
                  {field: 'clearanceUrl', label: 'NBI / Barangay Clearance (Recommended)', required: false}
                ].map(item => (
                  <div key={item.field} className="bg-[#1c1c21] border border-[#2a2a35] rounded-lg p-3">
                    <label className="block text-gray-400 text-xs mb-1 uppercase tracking-widest">{item.label}</label>
                    <input name={item.field} type="file" accept="image/*" capture={item.field === 'selfieUrl' ? 'user' : undefined} required={item.required} className="w-full text-xs text-gray-500" onChange={e => handleImage(e, item.field)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="print:hidden">
            <h2 className="text-red-400 font-bold text-lg mb-3 uppercase tracking-wider">4. Commission Agreement & Legal Consent</h2>
            <div className={`${borderStyle} p-4 space-y-4`}>
              <div className="border border-zinc-700 p-4 text-sm text-zinc-300 print:break-inside-avoid print:mb-4 print:bg-white print:border-black print:text-black">
                <h3 className="font-bold text-white mb-2 uppercase print:text-black">Agent Commission & Remittance Agreement</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li className="break-words print:text-black"><strong>Hatian ng Komisyon (40/60 Rule):</strong> Ang Ahente ay tatanggap ng 40% na komisyon mula lamang sa TUBONG (Interest) nakolekta. Ang puhunan (Principal) at ang natitirang 60% ng tubo ay pag-aari ng Vault.</li>
                  <li className="break-words print:text-black"><strong>Agarang Remittance:</strong> Obligasyon ng Ahente na i-remit ang nakolektang Principal at 60% Vault Interest sa parehong araw ng pangingilekta. Bawal itago, gamitin, o ipahiram ang pera ng Vault.</li>
                  <li className="break-words print:text-black"><strong>Responsibilidad sa Kliyente:</strong> Ang Ahente ang pangunahing tagapaningil ng kanyang mga nirekomendang kliyente. Kung sakaling mag-default ang kliyente, responsibilidad ng Ahente na tumulong sa collection protocol ng Vault.</li>
                  <li className="break-words print:text-black"><strong>Legal na Aksyon (Estafa):</strong> Ang anumang hindi awtorisadong paggamit o pagtatago ng nakolektang pera ng Vault ay ituturing na pagnanakaw at maaaring magresulta sa kasong Estafa.</li>
                </ol>
              </div>

              <div className="print:break-inside-avoid print:mb-4">
                <label className="block text-zinc-400 text-xs mb-2 uppercase tracking-widest print:text-black">Digital Signature (Sign Below)</label>
                <SignaturePad onSignature={(dataUrl) => setFormData(prev => ({...prev, digitalSignature: dataUrl}))} />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 print:text-black">
                <input type="checkbox" required className="w-4 h-4 accent-emerald-500 print:hidden" />
                <span className="break-words">I have read and agree to the Commission & Remittance Agreement above</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={status !== ""} className="w-full bg-[#00df82] border border-[#00df82]/40 text-[#09090b] py-5 font-black text-xs tracking-widest uppercase hover:bg-[#00df82]/80 disabled:opacity-50 rounded-xl transition-colors shadow-[0_0_20px_rgba(0,223,130,0.15)] print:hidden">
            {status || "SUBMIT AGENT APPLICATION"}
          </button>
        </form>

        <div className="hidden print:block mt-8 text-black">
          <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">AGENT APPLICANT INFORMATION</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
            <div className="font-semibold">Full Name:</div><div>{formData.firstName} {formData.lastName}</div>
            <div className="font-semibold">Phone:</div><div>{formData.phone || '—'}</div>
            <div className="font-semibold">Address:</div><div>{formData.address || '—'}</div>
            <div className="font-semibold">Birth Date:</div><div>{formData.birthDate || '—'}</div>
          </div>
          <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">TERRITORY & CAPACITY</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
            <div className="font-semibold">Primary Territory:</div><div>{formData.territory || '—'}</div>
            <div className="font-semibold">Network Size:</div><div>{formData.networkSize || '—'}</div>
            <div className="font-semibold">Employment/Business:</div><div>{formData.employment || '—'}</div>
          </div>
          {formData.digitalSignature && (
            <div className="mt-6 pt-4 border-t-2 border-black print:break-inside-avoid print:mb-4">
              <h2 className="font-bold text-lg mb-3">DIGITAL SIGNATURE</h2>
              <div className="bg-white border border-gray-400 p-2 inline-block">
                <img src={formData.digitalSignature} alt="Digital Signature" className="max-h-24 print:invert" />
              </div>
            </div>
          )}
          <div className="mt-8 pt-4 border-t-2 border-black text-xs text-gray-600 text-center print:break-inside-avoid">
            <p className="font-semibold mb-1">IMPORTANT: This is your official agent application receipt.</p>
            <p>Keep this document for your records. Your application is now being processed.</p>
            <p className="mt-2 text-gray-400">Generated: {currentDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
