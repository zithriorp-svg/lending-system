"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { submitApplicationRecord } from "./actions";
import SignaturePad from "@/components/SignaturePad";

interface Agent {
  id: number;
  name: string;
}

interface Portfolio {
  id: number;
  name: string;
}

interface ApplyFormClientProps {
  agents: Agent[];
  portfolios: Portfolio[];
}

export default function ApplyFormClient({ agents, portfolios }: ApplyFormClientProps) {
  const searchParams = useSearchParams();
  
  // Read portfolioId from URL (preferred) or fall back to portfolio name
  const urlPortfolioId = searchParams.get('portfolioId');
  const urlPortfolioName = searchParams.get('portfolio');
  
  // Determine the target portfolio
  const targetPortfolio = urlPortfolioId 
    ? portfolios.find(p => p.id === parseInt(urlPortfolioId))
    : urlPortfolioName 
      ? portfolios.find(p => p.name === urlPortfolioName) || portfolios[0]
      : portfolios[0];
  
  const targetPortfolioId = targetPortfolio?.id || null;
  const targetPortfolioName = targetPortfolio?.name || "Main Portfolio";
  
  // Loan Configuration State
  const [principal, setPrincipal] = useState<number>(0);
  const [termType, setTermType] = useState<string>("Months");
  const [agentId, setAgentId] = useState<string>("");

  // REBATE TRAP PRICING MODEL
  const baseInterestRate = 0.10; // 10% official rate
  const discountRate = 0.04;     // 4% Good Payer Discount
  const effectiveRate = 0.06;    // 6% effective rate (if paid on time)

  // Auto-computed loan values
  const baseInterest = principal * baseInterestRate;
  const discountAmount = principal * discountRate;
  const netInterest = principal * effectiveRate;
  
  // Optimal Duration Logic
  const getOptimalDuration = (principal: number, termType: string): number => {
    if (principal <= 5000) {
      if (termType === "Days") return 30;
      if (termType === "Weeks") return 4;
      return 1; // Months
    } else {
      if (termType === "Days") return 60;
      if (termType === "Weeks") return 8;
      return 2; // Months
    }
  };
  
  const optimalDuration = getOptimalDuration(principal, termType);
  const totalDue = principal + netInterest; // Assumes Good Payer behavior for schedule
  const perPeriod = optimalDuration > 0 ? totalDue / optimalDuration : 0;

  // Dynamic Amortization Schedule Generator
  const generateSchedule = () => {
    if (!principal || principal <= 0 || !optimalDuration) return [];
    
    const schedule = [];
    const principalPerPeriod = principal / optimalDuration;
    const interestPerPeriod = netInterest / optimalDuration;
    const totalPerPeriod = totalDue / optimalDuration;
    
    for (let i = 1; i <= optimalDuration; i++) {
      const date = new Date();
      if (termType === 'Days') {
        date.setDate(date.getDate() + i);
      } else if (termType === 'Weeks') {
        date.setDate(date.getDate() + (i * 7));
      } else if (termType === 'Months') {
        date.setMonth(date.getMonth() + i);
      }
      
      schedule.push({
        period: i,
        dateStr: date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
        principal: principalPerPeriod,
        interest: interestPerPeriod,
        total: totalPerPeriod
      });
    }
    return schedule;
  };

  const amortizationSchedule = generateSchedule();
  
  const [formData, setFormData] = useState<any>({
    firstName: "", lastName: "", phone: "", address: "",
    birthDate: "", age: "",
    employment: "", income: "", fbProfileUrl: "", messengerId: "",
    familySize: "1", workingMembers: "1", students: "0", infants: "0",
    housingStatus: "Owned", rentAmount: "", monthlyBills: "",
    existingLoansDetails: "", monthlyDebtPayment: "",
    referenceName: "", referencePhone: "",
    locationLat: "", locationLng: "", locationUrl: "",
    selfieUrl: "", idPhotoUrl: "",
    payslipPhotoUrl: "", electricBillPhotoUrl: "", waterBillPhotoUrl: "",
    collateralUrl: "",
    // Collateral (Palit-Sigurado) text fields
    collateralName: "",
    collateralDescription: "",
    collateralDefects: "",
    // AI Appraisal Fields
    collateralValue: "",
    collateralAge: "",
    collateralCondition: "Good",
    digitalSignature: ""
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

  const calculateAge = (bday: string) => {
    if (!bday) return;
    const birthDate = new Date(bday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    setFormData((prev: any) => ({...prev, birthDate: bday, age: age}));
  };

  // Get selected agent name for print receipt
  const selectedAgentName = agents.find(a => a.id === parseInt(agentId))?.name || "No Agent Assigned";

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // TRIGGER PRINT DIALOG FIRST - User receives legal receipt before server processes
    window.print();
    
    setStatus("UPLOADING FORENSIC DOSSIER...");
    try {
      // Include targetPortfolioId and loan configuration in the form data
      const res = await submitApplicationRecord({ 
        ...formData, 
        targetPortfolio: targetPortfolioName, // Keep for backward compatibility
        targetPortfolioId: targetPortfolioId, // New: portfolio ID for precise routing
        // Loan Configuration - Sends effective 6% rate (Good Payer assumption)
        principal,
        termType,
        termDuration: optimalDuration,
        interestRate: 6, // Effective rate (Good Payer track)
        totalInterest: netInterest,
        totalRepayment: totalDue,
        perPeriodAmount: perPeriod,
        agentId: agentId ? parseInt(agentId) : null
      });
      if (res?.error) throw new Error(res.error);
      alert("Application Received! Our AI is performing a forensic review.");
      window.location.href = "/";
    } catch (error: any) {
      alert("Matrix Error: " + error.message);
      setStatus("");
    }
  };

  const rapidInputStyle = "w-full bg-transparent p-3 text-sm border-b border-[#2a2a35] outline-none text-white appearance-none";
  const borderStyle = "border border-[#2a2a35] bg-[#0f0f13]";
  const headerStyle = "text-blue-600 font-bold text-lg mb-3 uppercase tracking-wider";

  // Current date for receipt
  const currentDate = new Date().toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-300 p-4 font-sans pb-20 print:block print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:text-black print:p-8">
      <div className="max-w-md mx-auto">
        {/* Header - Hidden during print */}
        <div className="text-center mb-6 pt-4 print:hidden">
          <h1 className="text-3xl font-serif font-bold text-gray-200 mb-2">Digital Loan<br/>Application</h1>
          <p className="text-gray-500 text-xs tracking-widest font-bold">SECURE • FAST • ENCRYPTED</p>
          {targetPortfolioName !== 'Main Portfolio' && (
            <p className="text-[#00df82] text-xs mt-2">Portfolio: {targetPortfolioName}</p>
          )}
        </div>

        {/* ===== PRINT-ONLY RECEIPT HEADER ===== */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-6">
          <h1 className="text-2xl font-bold text-black mb-1">LOAN APPLICATION RECEIPT</h1>
          <p className="text-sm text-gray-600">Official Document • {currentDate}</p>
          <p className="text-xs text-gray-500 mt-1">Portfolio: {targetPortfolioName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* LOAN CONFIGURATOR - Smart Auto-Compute Section */}
          <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-md shadow-lg print:bg-white print:border-black print:shadow-none print:p-0 print:rounded-none print:border-b-2 print:break-inside-avoid print:mb-4">
            <h3 className="font-bold text-white mb-4 border-b border-zinc-700 pb-2 uppercase tracking-wider text-sm print:text-black print:border-black">
              💰 LOAN CONFIGURATION
            </h3>
            
            {/* Input fields - hidden during print */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Assigned Agent / Co-Maker (Optional)</label>
                <select 
                  name="agentId" 
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm"
                >
                  <option value="">No Agent Assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Term Type</label>
                <select 
                  name="termType" 
                  value={termType} 
                  onChange={(e) => setTermType(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm"
                >
                  <option value="Days">Daily Payments</option>
                  <option value="Weeks">Weekly Payments</option>
                  <option value="Months">Monthly Payments</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Principal Amount (₱)</label>
                <input 
                  type="number" 
                  name="principal" 
                  value={principal || ""} 
                  onChange={(e) => setPrincipal(Number(e.target.value))} 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" 
                  placeholder="e.g. 5000"
                  required
                  min="100"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Official Interest Rate (%)</label>
                <input 
                  type="number" 
                  value="10" 
                  readOnly 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-zinc-400 cursor-not-allowed text-sm" 
                />
              </div>
            </div>

            {/* Auto-Computed Results - The Psychology Box */}
            <div className="bg-black p-4 rounded border border-zinc-800 mt-4 print:bg-white print:border-black print:text-black print:rounded-none print:border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm print:text-black">Principal Amount:</span>
                <span className="text-white font-mono font-bold print:text-black">₱{principal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm print:text-black">Assigned Agent:</span>
                <span className="text-emerald-400 font-bold print:text-black">{selectedAgentName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm print:text-black">Payment Schedule:</span>
                <span className="text-emerald-400 font-bold print:text-black">{termType === 'Days' ? 'Daily' : termType === 'Weeks' ? 'Weekly' : 'Monthly'} Payments</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm print:text-black">Optimal Duration:</span>
                <span className="text-emerald-400 font-bold print:text-black">{optimalDuration} {termType.slice(0, -1)}{optimalDuration > 1 ? 's' : ''}</span>
              </div>
              
              {/* Rebate Trap Pricing Breakdown */}
              <div className="border-t border-zinc-700 pt-3 mt-3 print:border-black">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 text-sm print:text-black">Official Interest (10%):</span>
                  <span className="text-red-400 line-through font-mono print:text-black">₱{baseInterest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-zinc-700 print:border-black">
                  <span className="text-emerald-400 text-sm font-bold print:text-black">⭐ Good Payer Discount (-4%):</span>
                  <span className="text-emerald-400 font-mono font-bold print:text-black">- ₱{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300 text-sm print:text-black">Net Interest (If paid on time):</span>
                  <span className="text-white font-mono print:text-black">₱{netInterest.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2 pt-2">
                <span className="text-zinc-300 text-sm print:text-black">Total Repayment:</span>
                <span className="text-white font-mono font-bold print:text-black">₱{totalDue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800 bg-emerald-900/20 p-2 rounded mt-2 print:border-black print:bg-gray-100">
                <span className="text-zinc-300 text-sm font-bold print:text-black">Discounted {termType === 'Days' ? 'Daily' : termType === 'Weeks' ? 'Weekly' : 'Monthly'} Payment:</span>
                <span className="text-emerald-400 font-mono font-bold text-lg print:text-black">₱{perPeriod.toFixed(2)}</span>
              </div>
            </div>

            {/* Dynamic Amortization Schedule Preview */}
            {amortizationSchedule.length > 0 && (
              <div className="mt-6 border-t border-zinc-800 pt-4 print:bg-white print:text-black print:border-t-2 print:border-black print:break-inside-avoid print:mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 print:text-black">
                    📅 ISKEDUL NG PAGBAYAD (Payment Schedule)
                  </h4>
                  {/* Download button - hidden during print */}
                  <button 
                    type="button" 
                    onClick={() => window.print()} 
                    className="print:hidden flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-white py-1 px-3 rounded border border-zinc-600 transition-colors"
                  >
                    📥 Download / Save PDF
                  </button>
                </div>
                {/* Disclaimer - Simplified during print */}
                <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded flex items-start gap-2 text-yellow-500/90 text-[11px] sm:text-xs italic print:text-black print:bg-transparent print:border-none print:p-0 print:text-xs print:not-italic print:text-gray-600">
                  <span className="print:hidden">⚠️</span>
                  <p>
                    <strong className="print:hidden">PAALALA:</strong> <span className="print:hidden">Ang schedule ng pagbabayad na ito ay hindi pa official. </span><span className="hidden print:inline">Payment dates will be adjusted upon approval.</span><span className="print:hidden">Magbabago ang schedule na ito ayon sa date ng pagka-approved ng loan. Salamat po.</span>
                  </p>
                </div>
                <div className="overflow-x-auto rounded border border-zinc-800 print:border-black print:bg-white">
                  <table className="w-full text-left text-xs text-zinc-400 print:text-black">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 uppercase print:bg-gray-100 print:text-black print:border-black">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Principal</th>
                        <th className="p-2 text-right">Interest</th>
                        <th className="p-2 text-right">Total Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 bg-black print:bg-white print:divide-y print:divide-gray-300">
                      {amortizationSchedule.map((row) => (
                        <tr key={row.period} className="hover:bg-zinc-900/50 transition-colors print:hover:bg-transparent">
                          <td className="p-2 whitespace-nowrap print:text-black">{row.dateStr}</td>
                          <td className="p-2 text-right font-mono print:text-black">₱{row.principal.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono print:text-black">₱{row.interest.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono text-emerald-400 font-bold print:text-black">₱{row.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hidden inputs to pass computed data to Server Action */}
            <input type="hidden" name="termDuration" value={optimalDuration} />
            <input type="hidden" name="interestRate" value="6" />
          </div>

          {/* SEC 1: BASIC & DEMOGRAPHICS - Hidden during print */}
          <div className="print:hidden">
            <h2 className={headerStyle}>1. Personal & Demographic Matrix</h2>
            <div className={`grid grid-cols-2 gap-0 ${borderStyle}`}>
              <input 
                name="firstName" 
                required 
                placeholder="First Name" 
                className={`${rapidInputStyle} border-r`} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
              />
              <input 
                name="lastName" 
                required 
                placeholder="Last Name" 
                className={rapidInputStyle} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
              />
              <input 
                name="birthDate"
                required 
                type="text" 
                placeholder="Birth Date (YYYY-MM-DD)" 
                className={`${rapidInputStyle} border-r text-gray-400`} 
                onChange={e => calculateAge(e.target.value)} 
              />
              <input 
                name="age"
                readOnly 
                placeholder="Age" 
                value={formData.age ? `Age: ${formData.age}` : ""} 
                className={`${rapidInputStyle} text-[#00df82]`} 
              />
              <input 
                name="phone" 
                required 
                placeholder="Phone Number" 
                className={`${rapidInputStyle} col-span-2`} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
              <input 
                name="address" 
                required 
                placeholder="Current Address" 
                className={`${rapidInputStyle} col-span-2 border-b-0`} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </div>

          {/* SEC 2: FINANCIALS & DEEP CI - Hidden during print */}
          <div className="print:hidden">
            <h2 className={headerStyle}>2. Financial Interrogation & Capacity</h2>
            <div className={`grid grid-cols-2 gap-0 ${borderStyle}`}>
              <input 
                name="employment" 
                required 
                placeholder="Employment / Business Name" 
                className={`${rapidInputStyle} col-span-2`} 
                onChange={e => setFormData({...formData, employment: e.target.value})} 
              />
              <input 
                name="income" 
                required 
                type="number" 
                placeholder="Gross Income (₱)" 
                className={`${rapidInputStyle} col-span-2 text-[#00df82] font-black`} 
                onChange={e => setFormData({...formData, income: e.target.value})} 
              />
              {/* Existing Obligations Disclosure */}
              <input 
                name="existingLoansDetails" 
                placeholder="Existing Loans? (Banks/Apps like Tala)" 
                className={`${rapidInputStyle} col-span-2 text-yellow-500`} 
                onChange={e => setFormData({...formData, existingLoansDetails: e.target.value})} 
              />
              <input 
                name="monthlyDebtPayment" 
                type="number" 
                placeholder="Combined Monthly Amortization (₱)" 
                className={`${rapidInputStyle} col-span-2 text-red-400`} 
                onChange={e => setFormData({...formData, monthlyDebtPayment: e.target.value})} 
              />
              {/* Dropdown Selection Conversions */}
              <div className="col-span-2 p-3 bg-[#1c1c21] text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#2a2a35]">Living Expenses</div>
              <select 
                name="familySize" 
                defaultValue="1" 
                className={`${rapidInputStyle} border-r text-gray-400`} 
                onChange={e => setFormData({...formData, familySize: e.target.value})}
              >
                {[1,2,3,4,5,"6+"].map(n => <option key={n} value={n}>Family Size: {n}</option>)}
              </select>
              <select 
                name="workingMembers" 
                defaultValue="1" 
                className={`${rapidInputStyle} text-gray-400`} 
                onChange={e => setFormData({...formData, workingMembers: e.target.value})}
              >
                {[1,2,3,4,"5+"].map(n => <option key={n} value={n}>Working Members: {n}</option>)}
              </select>
              <select 
                name="students" 
                defaultValue="0" 
                className={`${rapidInputStyle} border-r text-gray-400`} 
                onChange={e => setFormData({...formData, students: e.target.value})}
              >
                {[0,1,2,3,4,5,"6+"].map(n => <option key={n} value={n}>Students: {n}</option>)}
              </select>
              <select 
                name="infants" 
                defaultValue="0" 
                className={`${rapidInputStyle} text-gray-400`} 
                onChange={e => setFormData({...formData, infants: e.target.value})}
              >
                {[0,1,2,3,"4+"].map(n => <option key={n} value={n}>Infants/Toddlers: {n}</option>)}
              </select>
              <select 
                name="housingStatus" 
                className={`${rapidInputStyle} border-r text-gray-400`} 
                onChange={e => setFormData({...formData, housingStatus: e.target.value})}
              >
                <option value="Owned">Housing: Owned</option>
                <option value="Renting">Housing: Renting</option>
                <option value="Relatives">Housing: Relatives</option>
              </select>
              <input 
                name="rentAmount" 
                type="number" 
                placeholder="Rent/mo (If Renting)" 
                className={`${rapidInputStyle}`} 
                onChange={e => setFormData({...formData, rentAmount: e.target.value})} 
              />
              <input 
                name="monthlyBills" 
                required 
                type="number" 
                placeholder="Est. Monthly Utility & Food Bills (₱)" 
                className={`${rapidInputStyle} col-span-2 text-red-400 border-b-0`} 
                onChange={e => setFormData({...formData, monthlyBills: e.target.value})} 
              />
            </div>
          </div>

          {/* SEC 3: RECONNAISSANCE & REFERENCES - Hidden during print */}
          <div className="print:hidden">
            <h2 className={headerStyle}>3. Social Recon & References</h2>
            <div className={`grid grid-cols-2 gap-0 ${borderStyle}`}>
              <input 
                name="fbProfileUrl" 
                placeholder="Facebook Profile URL" 
                className={`${rapidInputStyle} col-span-2`} 
                onChange={e => setFormData({...formData, fbProfileUrl: e.target.value})} 
              />
              <input 
                name="messengerId" 
                placeholder="Messenger Name / ID" 
                className={`${rapidInputStyle} col-span-2`} 
                onChange={e => setFormData({...formData, messengerId: e.target.value})} 
              />
              <div className="col-span-2 p-3 bg-[#1c1c21] text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#2a2a35]">Character Reference (Relative/Co-worker)</div>
              <input 
                name="referenceName" 
                required 
                placeholder="Reference Full Name" 
                className={`${rapidInputStyle} col-span-2`} 
                onChange={e => setFormData({...formData, referenceName: e.target.value})} 
              />
              <input 
                name="referencePhone" 
                required 
                placeholder="Reference Phone Number" 
                className={`${rapidInputStyle} col-span-2 border-b-0`} 
                onChange={e => setFormData({...formData, referencePhone: e.target.value})} 
              />
            </div>
          </div>

          {/* SEC 4: FORENSIC VERIFICATION (Uploads) - Hidden during print */}
          <div className="print:hidden">
            <h2 className="text-[#00df82] font-bold text-lg mb-3 uppercase tracking-wider">4. Forensic Verification Dossier</h2>
            <div className={`${borderStyle} p-4 space-y-4`}>
              <p className={`text-center text-xs pb-2 ${locStatus.includes('Verified') ? 'text-[#00df82]' : 'text-yellow-500'}`}>
                GPS: {locStatus}
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {[
                  {field: 'selfieUrl', label: 'Live Selfie (capture)'},
                  {field: 'idPhotoUrl', label: 'Valid ID (Required)'},
                  {field: 'payslipPhotoUrl', label: 'Payment Slip / Payslip (Required)'},
                  {field: 'electricBillPhotoUrl', label: 'Electricity Bill (Proof of Address)'},
                  {field: 'waterBillPhotoUrl', label: 'Water Bill'},
                  {field: 'collateralUrl', label: 'Collateral Photo'}
                ].map(item => (
                  <div key={item.field} className="bg-[#1c1c21] border border-[#2a2a35] rounded-lg p-3">
                    <label className="block text-gray-400 text-xs mb-1 uppercase tracking-widest">{item.label}</label>
                    <input 
                      name={item.field}
                      type="file" 
                      accept="image/*"
                      capture={item.field === 'selfieUrl' ? 'user' : undefined}
                      required={['selfieUrl','idPhotoUrl','payslipPhotoUrl'].includes(item.field)}
                      className="w-full text-xs text-gray-500" 
                      onChange={e => handleImage(e, item.field)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 4.5: KOLATERAL (PALIT-SIGURADO) - Optional - Hidden during print */}
          <div className="print:hidden">
            <h2 className="text-amber-400 font-bold text-lg mb-3 uppercase tracking-wider">5. Kolateral (Palit-Sigurado) - Optional</h2>
            <div className={`${borderStyle} p-4 space-y-3`}>
              <p className="text-xs text-zinc-500 mb-2">
                If providing collateral for this loan, describe the item below. This will be documented in the contract.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <input 
                  name="collateralName" 
                  placeholder="Item Name (e.g., Samsung Galaxy S22)" 
                  className={`${rapidInputStyle} bg-[#1c1c21] rounded-lg px-4`} 
                  onChange={e => setFormData({...formData, collateralName: e.target.value})} 
                />
                <input 
                  name="collateralDescription" 
                  placeholder="Description (e.g., Black, 128GB, with charger and case)" 
                  className={`${rapidInputStyle} bg-[#1c1c21] rounded-lg px-4`} 
                  onChange={e => setFormData({...formData, collateralDescription: e.target.value})} 
                />
                <input 
                  name="collateralDefects" 
                  placeholder="Known Defects (e.g., Small scratch on screen, battery replaced)" 
                  className={`${rapidInputStyle} bg-[#1c1c21] rounded-lg px-4`} 
                  onChange={e => setFormData({...formData, collateralDefects: e.target.value})} 
                />
              </div>
              
              {/* AI Appraisal Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-zinc-700/50">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estimated Value (₱)</label>
                  <input 
                    type="number" 
                    name="collateralValue" 
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" 
                    placeholder="e.g. 15000"
                    onChange={e => setFormData({...formData, collateralValue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Age of Item</label>
                  <input 
                    type="text" 
                    name="collateralAge" 
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" 
                    placeholder="e.g. 1 Year, 6 Months"
                    onChange={e => setFormData({...formData, collateralAge: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Condition</label>
                  <select 
                    name="collateralCondition" 
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm"
                    value={formData.collateralCondition}
                    onChange={e => setFormData({...formData, collateralCondition: e.target.value})}
                  >
                    <option value="Excellent">Excellent (Like New)</option>
                    <option value="Good">Good (Minor Wear)</option>
                    <option value="Fair">Fair (Visible Scratches/Dents)</option>
                    <option value="Poor">Poor (Needs Repair)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-amber-500/70 mt-2">
                ⚠️ Collateral items will be forfeited in case of default per contract terms.
              </p>
            </div>
          </div>

          {/* SEC 6: LEGAL COMPLIANCE & CONSENT - Hidden during print */}
          <div className="print:hidden">
            <h2 className="text-red-400 font-bold text-lg mb-3 uppercase tracking-wider">6. Legal Compliance & Consent</h2>
            <div className={`${borderStyle} p-4 space-y-4`}>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-xs text-zinc-400 leading-relaxed print:break-inside-avoid print:mb-4 print:bg-white print:border-black print:text-black">
                <p className="font-bold text-white mb-2 uppercase tracking-wider print:text-black">DATA PRIVACY & CONSENT WAIVER</p>
                <p className="mb-2 break-words print:text-black">
                  By signing below, I hereby authorize the lending institution to collect, process, and store my personal and financial information for the purpose of evaluating my loan application.
                </p>
                <p className="mb-2 break-words print:text-black">
                  I understand that my data may be shared with third-party verification services and credit bureaus for authentication and risk assessment purposes.
                </p>
                <p className="mb-2 break-words print:text-black">
                  I certify that all information provided in this application is true and accurate to the best of my knowledge. I acknowledge that any false statement may result in immediate rejection of my application and potential legal action.
                </p>
                <p className="break-words print:text-black">
                  I agree to the terms and conditions of the loan agreement, including but not limited to: interest rates, repayment schedules, and penalties for late or non-payment.
                </p>
              </div>

              {/* MGA TUNTUNIN AT KUNDISYON (Terms and Conditions) */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-md p-4 text-sm text-zinc-300 shadow-inner print:break-inside-avoid print:mb-4 print:bg-white print:border-black print:text-black print:shadow-none">
                <h3 className="font-bold text-white text-base mb-3 border-b border-zinc-700 pb-2 print:text-black print:border-black">MGA TUNTUNIN AT KUNDISYON (Terms and Conditions)</h3>
                <ol className="list-decimal pl-5 space-y-2 break-words">
                  <li className="break-words print:text-black">
                    <strong>INTERES AT GOOD PAYER DISCOUNT:</strong> Ang opisyal na flat-rate interest ng utang na ito ay <strong className="text-amber-400 print:text-black">10%</strong>. PERO, kung ang NANGUTANG ay magbabayad ng tama sa oras sa lahat ng kanyang iskedul, siya ay bibigyan ng <strong className="text-emerald-400 print:text-black">4% Good Payer Discount</strong> (kaya magiging 6% na lamang ang epektibong interes). 
                    <br/>
                    <span className="text-zinc-400 text-[11px] italic print:text-black">
                      (Simpleng paliwanag: Kung palagi kang on-time, 6% lang ang tubo ng utang mo. Pero kapag na-late ka kahit isang araw sa iyong hulog, ma-vo-void ang discount at sisingilin ka ng buong 10% interes para sa buong kontrata.)
                    </span>
                  </li>
                  <li className="break-words print:text-black">
                    <strong>LOAN EXTENSION (ROLLOVER):</strong> Kung sakaling matapos ang kontrata at hindi pa kayang bayaran ng buo ang utang, ang NANGUTANG ay maaaring humingi ng palugit (Rollover). Upang ma-extend ang utang, kailangang magbayad ng <strong className="text-amber-400 print:text-black">Extension Fee</strong> na katumbas ng 6% ng orihinal na Principal.
                    <br/>
                    <span className="text-zinc-400 text-[11px] italic print:text-black">
                      (Simpleng paliwanag: Kung ₱20,000 ang utang mo at hindi mo mabayaran sa due date, kailangan mong magbayad ng ₱1,200 Extension Fee para mabigyan ka ng panibagong palugit. Ang ₱1,200 na ito ay fee lamang at HINDI ibabawas sa utang mong ₱20,000.)
                    </span>
                  </li>
                  <li className="break-words print:text-black">Ang nag PAUTANG ay may karapatang mangolekta o maningil ng utang sa pamamagitan ng mga lehitimong paraan tulad ng pagbisita sa bahay, pagtawag, o pagsulat ng liham.</li>
                  <li className="break-words print:text-black">Ang mga impormasyong ibinigay ng NANGUTANG ay totoo at tama. Ang anumang maling impormasyon ay maaaring maging dahilan ng agarang pagbabayad ng buong halaga.</li>
                  <li className="break-words print:text-black">Ang kasunduang ito ay sumasailalim sa batas ng Republika ng Pilipinas.</li>
                  <li className="break-words print:text-black">Sa kaso ng hindi pagbabayad, ang NANGUTANG ay sumasang-ayon na maaaring isama ang kanyang pangalan sa lista ng mga delinquent borrowers.</li>
                  <li className="break-words print:text-black">Ang pagpirma sa kasunduang ito ay patunay na ang NANGUTANG ay nagkasundo at sumasang-ayon sa lahat ng tuntunin at kundisyon.</li>
                </ol>
              </div>

              <div className="print:break-inside-avoid print:mb-4">
                <label className="block text-zinc-400 text-xs mb-2 uppercase tracking-widest print:text-black">Digital Signature (Sign Below)</label>
                <SignaturePad onSignature={(dataUrl) => setFormData(prev => ({...prev, digitalSignature: dataUrl}))} />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 print:text-black">
                <input type="checkbox" required className="w-4 h-4 accent-emerald-500 print:hidden" />
                <span className="break-words">I have read and agree to the Data Privacy & Consent Waiver above</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={status !== ""} className="w-full bg-[#00df82] border border-[#00df82]/40 text-[#09090b] py-5 font-black text-xs tracking-widest uppercase hover:bg-[#00df82]/80 disabled:opacity-50 rounded-xl transition-colors shadow-[0_0_20px_rgba(0,223,130,0.15)] print:hidden">
            {status || "SUBMIT FORENSIC DOSSIER"}
          </button>
        </form>

        {/* ===== PRINT-ONLY: BORROWER INFORMATION SUMMARY ===== */}
        <div className="hidden print:block mt-8 text-black">
          <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">BORROWER INFORMATION</h2>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6 break-inside-avoid">
            <div className="font-semibold">Full Name:</div>
            <div>{formData.firstName} {formData.lastName}</div>
            
            <div className="font-semibold">Phone:</div>
            <div>{formData.phone || '—'}</div>
            
            <div className="font-semibold">Address:</div>
            <div>{formData.address || '—'}</div>
            
            <div className="font-semibold">Birth Date:</div>
            <div>{formData.birthDate || '—'}</div>
            
            <div className="font-semibold">Age:</div>
            <div>{formData.age || '—'}</div>
          </div>

          <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">FINANCIAL INFORMATION</h2>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6 break-inside-avoid">
            <div className="font-semibold">Employment/Business:</div>
            <div>{formData.employment || '—'}</div>
            
            <div className="font-semibold">Gross Income:</div>
            <div>₱{formData.income || '—'}</div>
            
            <div className="font-semibold">Existing Loans:</div>
            <div>{formData.existingLoansDetails || 'None declared'}</div>
            
            <div className="font-semibold">Monthly Debt Payment:</div>
            <div>₱{formData.monthlyDebtPayment || '0'}</div>
            
            <div className="font-semibold">Family Size:</div>
            <div>{formData.familySize}</div>
            
            <div className="font-semibold">Working Members:</div>
            <div>{formData.workingMembers}</div>
            
            <div className="font-semibold">Housing Status:</div>
            <div>{formData.housingStatus}</div>
            
            <div className="font-semibold">Monthly Bills:</div>
            <div>₱{formData.monthlyBills || '—'}</div>
          </div>

          <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">REFERENCE</h2>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6 break-inside-avoid">
            <div className="font-semibold">Reference Name:</div>
            <div>{formData.referenceName || '—'}</div>
            
            <div className="font-semibold">Reference Phone:</div>
            <div>{formData.referencePhone || '—'}</div>
          </div>

          {/* Collateral Section */}
          {formData.collateralName && (
            <div className="break-inside-avoid">
              <h2 className="font-bold text-lg border-b border-black pb-2 mb-4">COLLATERAL (PALIT-SIGURADO)</h2>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
                <div className="font-semibold">Item Name:</div>
                <div>{formData.collateralName}</div>
                
                <div className="font-semibold">Description:</div>
                <div>{formData.collateralDescription || '—'}</div>
                
                <div className="font-semibold">Known Defects:</div>
                <div>{formData.collateralDefects || 'None declared'}</div>
              </div>
            </div>
          )}

          {/* ===== PRINT-ONLY: LEGAL COMPLIANCE & CONSENT ===== */}
          <div className="print:block print:w-full print:h-auto print:overflow-visible whitespace-normal">
            <h2 className="font-bold text-lg border-b border-black pb-2 mb-4 mt-6">LEGAL COMPLIANCE & CONSENT</h2>
            
            {/* DATA PRIVACY & CONSENT WAIVER - Allow natural page breaks */}
            <div className="bg-transparent text-black text-xs leading-relaxed mb-6 whitespace-normal">
              <p className="font-bold text-black mb-2 uppercase tracking-wider">DATA PRIVACY & CONSENT WAIVER</p>
              <p className="mb-2 break-words text-black">
                By signing below, I hereby authorize the lending institution to collect, process, and store my personal and financial information for the purpose of evaluating my loan application.
              </p>
              <p className="mb-2 break-words text-black">
                I understand that my data may be shared with third-party verification services and credit bureaus for authentication and risk assessment purposes.
              </p>
              <p className="mb-2 break-words text-black">
                I certify that all information provided in this application is true and accurate to the best of my knowledge. I acknowledge that any false statement may result in immediate rejection of my application and potential legal action.
              </p>
              <p className="break-words text-black">
                I agree to the terms and conditions of the loan agreement, including but not limited to: interest rates, repayment schedules, and penalties for late or non-payment.
              </p>
            </div>

            {/* MGA TUNTUNIN AT KUNDISYON - Allow natural page breaks */}
            <div className="bg-transparent text-black text-sm mb-6 whitespace-normal">
              <h3 className="font-bold text-black text-base mb-3 border-b border-black pb-2">MGA TUNTUNIN AT KUNDISYON (Terms and Conditions)</h3>
              <ol className="list-decimal pl-5 space-y-2 break-words">
                <li className="break-words text-black">Ang NANGUTANG ay sumasang-ayon na bayaran ang kabuuang halaga ng utang kasama ang interes sa petsang nakasaad sa iskedul ng pagbabayad.</li>
                <li className="break-words text-black">Ang hindi pagbabayad sa tamang petsa ay magreresulta sa pagdagdag ng <strong className="text-black">5% penalty fee</strong> bawat buwan na hindi nababayaran.</li>
                <li className="break-words text-black">Ang nag PAUTANG ay may karapatang mangolekta o maningil ng utang sa pamamagitan ng mga lehitimong paraan tulad ng pagbisita sa bahay, pagtawag, o pagsulat ng liham.</li>
                <li className="break-words text-black">Ang mga impormasyong ibinigay ng NANGUTANG ay totoo at tama. Ang anumang maling impormasyon ay maaaring maging dahilan ng agarang pagbabayad ng buong halaga.</li>
                <li className="break-words text-black">Ang kasunduang ito ay sumasailalim sa batas ng Republika ng Pilipinas.</li>
                <li className="break-words text-black">Sa kaso ng hindi pagbabayad, ang NANGUTANG ay sumasang-ayon na maaaring isama ang kanyang pangalan sa lista ng mga delinquent borrowers.</li>
                <li className="break-words text-black">Ang pagpirma sa kasunduang ito ay patunay na ang NANGUTANG ay nagkasundo at sumasang-ayon sa lahat ng tuntunin at kundisyon.</li>
              </ol>
            </div>
          </div>

          {/* Digital Signature Display - Keep break-inside-avoid for this small block */}
          {formData.digitalSignature && (
            <div className="mt-6 pt-4 border-t-2 border-black break-inside-avoid mb-4">
              <h2 className="font-bold text-lg mb-3">DIGITAL SIGNATURE</h2>
              <div className="bg-white border border-gray-400 p-2 inline-block">
                <img src={formData.digitalSignature} alt="Digital Signature" className="max-h-24 print:invert" />
              </div>
              <p className="text-xs text-gray-600 mt-2 italic">I have read and agree to the Data Privacy & Consent Waiver above</p>
            </div>
          )}

          {/* Footer for print receipt */}
          <div className="mt-8 pt-4 border-t-2 border-black text-xs text-gray-600 text-center print:break-inside-avoid">
            <p className="font-semibold mb-1">IMPORTANT: This is your official application receipt.</p>
            <p>Keep this document for your records. Your application is now being processed.</p>
            <p className="mt-2 text-gray-400">Generated: {currentDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
