"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DirectLoanCalculator from "@/components/DirectLoanCalculator";
import CollectionLog from "@/components/CollectionLog";
import { sendFBNotification, generateOverdueNotice, generatePaymentReminder, generatePaymentReceipt } from "@/utils/notifications";

// Number formatting helper
const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return "₱0.00";
  return "₱" + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Date formatting helper
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-PH', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

interface Installment {
  id: number;
  period: number;
  dueDate: Date;
  expectedAmount: number;
  principal: number;
  interest: number;
  penaltyFee: number;
  status: string;
  paymentDate: Date | null;
  amountPaid?: number;
}

interface Loan {
  id: number;
  principal: number;
  interestRate: number;
  termDuration: number;
  termType: string;
  totalRepayment: number;
  totalPaid: number;
  remainingBalance: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  status: string;
  installmentsCount: number;
  paidInstallments: number;
  totalInterestPaid: number;
  totalPenaltiesPaid: number;
  agentCommissions: number;
  netLoanProfit: number;
  agentName: string | null;
  installments: Installment[];
}

interface Transaction {
  id: number;
  loanId: number;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  paymentDate: Date;
  paymentType: string;
  periodNumber: number;
}

interface KYCData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string | null;
  birthDate: Date | null;
  age: number | null;
  employment: string;
  income: number;
  existingLoansDetails: string | null;
  monthlyDebtPayment: number | null;
  familySize: number | null;
  workingMembers: number | null;
  students: number | null;
  infants: number | null;
  housingStatus: string | null;
  rentAmount: number | null;
  monthlyBills: number | null;
  fbProfileUrl: string | null;
  messengerId: string | null;
  referenceName: string | null;
  referencePhone: string | null;
  selfieUrl: string | null;
  idPhotoUrl: string | null;
  payslipPhotoUrl: string | null;
  electricBillPhotoUrl: string | null;
  waterBillPhotoUrl: string | null;
  collateralUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationUrl: string | null;
  digitalSignature: string | null;
  credibilityScore: number;
  aiRiskSummary: string;
  status: string;
  createdAt: Date;
}

interface ClientData {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt: Date;
  riskScore: number;
  riskLevel: 'EXCELLENT' | 'MODERATE' | 'HIGH';
  riskEmoji: string;
  riskLabel: string;
  riskColor: string;
  trustScore: number;
  trustTier: 'PRIME' | 'WATCH' | 'HIGH_RISK';
  trustColor: string;
  totalPaymentsAnalyzed: number;
  onTimePercentage: number;
  paymentStats: {
    paidOnTime: number;
    paidLate: number;
    missed: number;
    pending: number;
    currentlyOverdue: number;
  };
  totalBorrowed: number;
  totalRepaid: number;
  activeLoansCount: number;
  paidLoansCount: number;
  loans: Loan[];
  transactions: Transaction[];
  kycData: KYCData | null;
}

// ============================================================================
// DOSSIER INTELLIGENT FB NOTIFY BUTTON
// ============================================================================
function DossierFBNotifyButton({ client, loan, inst }: { client: ClientData, loan: Loan, inst: Installment }) {
  const [copied, setCopied] = useState(false);

  const handleNotify = () => {
    let message = "";
    const isOverdue = new Date(inst.dueDate) < new Date() && inst.status !== 'PAID';

    if (inst.status === 'PAID') {
      message = generatePaymentReceipt({
        clientName: client.firstName,
        amount: inst.amountPaid || inst.expectedAmount,
        paymentDate: inst.paymentDate || new Date(),
        periodNumber: inst.period,
        loan: loan as any
      });
    } else if (isOverdue) {
      const baseAmount = inst.expectedAmount;
      const discountAmount = baseAmount * 0.04;
      const totalAmount = baseAmount + discountAmount + (inst.penaltyFee || 0);
      const daysLate = Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24));

      message = generateOverdueNotice({
        clientName: client.firstName,
        periodNumber: inst.period,
        daysLate: daysLate > 0 ? daysLate : 1,
        baseAmount,
        discountAmount,
        penaltyAmount: inst.penaltyFee || 0,
        totalAmount,
        dueDate: inst.dueDate,
        loan: loan as any
      });
    } else {
      message = generatePaymentReminder({
        clientName: client.firstName,
        amount: inst.expectedAmount,
        periodNumber: inst.period,
        dueDate: inst.dueDate,
        loan: loan as any
      });
    }

    sendFBNotification({
      message,
      clientName: `${client.firstName} ${client.lastName}`,
      fbProfileUrl: client.kycData?.fbProfileUrl,
      messengerId: client.kycData?.messengerId,
      onCopy: () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <button
      onClick={handleNotify}
      className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold rounded transition-all whitespace-nowrap ${
        copied ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40'
      }`}
      title="Send Full-Force Ledger Update via FB"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>
      {copied ? '✓ COPIED' : 'FB NOTIFY'}
    </button>
  );
}

const RiskBadge = ({ client }: { client: ClientData }) => {
  const colorMap = {
    'EXCELLENT': { bg: 'bg-emerald-500', text: 'text-white' },
    'MODERATE': { bg: 'bg-yellow-500', text: 'text-black' },
    'HIGH': { bg: 'bg-red-500', text: 'text-white' }
  };
  const style = colorMap[client.riskLevel];
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${style.bg} shadow-lg`}>
      <span className="text-xl">{client.riskEmoji}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${style.text} uppercase tracking-wider`}>
          {client.riskLabel}
        </span>
        <span className={`text-lg font-black ${style.text}`}>
          {client.riskScore}/100
        </span>
      </div>
    </div>
  );
};

const TrustScoreGauge = ({ client }: { client: ClientData }) => {
  const tierConfig = {
    'PRIME': { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', label: 'PRIME BORROWER', icon: '🏆' },
    'WATCH': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', label: 'WATCH LIST', icon: '⚠️' },
    'HIGH_RISK': { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', label: 'HIGH RISK', icon: '🚨' }
  };
  
  const config = tierConfig[client.trustTier];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (client.trustScore / 100) * circumference;
  
  return (
    <div className={`${config.bg} ${config.border} border rounded-2xl p-4`}>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90 pointer-events-none" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-700" />
            <circle
              cx="48" cy="48" r="45" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
              className={config.color}
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-2xl font-black ${config.color}`}>{client.trustScore}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.icon}</span>
            <span className={`text-sm font-bold ${config.color} uppercase tracking-wider`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Based on {client.totalPaymentsAnalyzed} payment{client.totalPaymentsAnalyzed !== 1 ? 's' : ''} analyzed
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${config.color.replace('text-', 'bg-')}`} style={{ width: `${client.trustScore}%` }} />
            </div>
            <span className="text-xs text-zinc-500">{client.trustScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentImage = ({ src, label }: { src: string | null; label: string }) => {
  if (!src) return null;
  return (
    <div className="bg-zinc-800 rounded-xl overflow-hidden">
      <div className="p-2 bg-zinc-900 border-b border-zinc-700">
        <p className="text-xs text-zinc-400 font-medium">{label}</p>
      </div>
      <div className="aspect-video relative">
        <img src={src} alt={label} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

type TabType = 'dossier' | 'loans' | 'transactions' | 'new-loan';

export default function ClientProfileClient({ client }: { client: ClientData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dossier');
  const hasKYC = !!client.kycData;

  const handleDisburseComplete = () => {
    router.refresh();
    setActiveTab('loans');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dossier', label: '📋 KYC Dossier' },
    { id: 'loans', label: '💰 Loans' },
    { id: 'transactions', label: '📄 Transactions' },
    { id: 'new-loan', label: '➕ New Loan' }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.firstName} {client.lastName}</h1>
          <p className="text-zinc-500 text-sm">Client Master Dossier • ID: {client.id}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <RiskBadge client={client} />
          <Link 
            href={`/clients/${client.id}/receipt`} 
            target="_blank" 
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded text-sm border border-zinc-600 transition-colors"
          >
            📄 View Original Application Receipt
          </Link>
          <Link href="/" className="text-sm text-blue-400 hover:underline">← Dashboard</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-2">Total Borrowed</p>
          <p className="text-xl font-bold text-white">{formatCurrency(client.totalBorrowed)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-2">Total Repaid</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(client.totalRepaid)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-2">Active Loans</p>
          <p className="text-xl font-bold text-blue-400">{client.activeLoansCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs text-zinc-500 uppercase mb-2">Completed Loans</p>
          <p className="text-xl font-bold text-white">{client.paidLoansCount}</p>
        </div>
      </div>

      <TrustScoreGauge client={client} />

      <div className="relative z-10 flex gap-2 bg-zinc-900 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id 
                ? tab.id === 'new-loan' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dossier' && (
        <div className="space-y-6">
          {!hasKYC ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
              <p className="text-zinc-500">No KYC application data available for this client.</p>
              <p className="text-zinc-600 text-sm mt-2">The client was created before KYC tracking was implemented.</p>
            </div>
          ) : (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">📋 Personal & Demographic Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Full Name</p>
                    <p className="text-white font-medium">{client.kycData!.firstName} {client.kycData!.lastName}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Phone Number</p>
                    <p className="text-white font-medium">{client.kycData!.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 md:col-span-2 lg:col-span-1">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Address</p>
                    <p className="text-white font-medium">{client.kycData!.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">💵 Financial Interrogation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Employment/Business</p>
                    <p className="text-white font-medium">{client.kycData!.employment}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Gross Monthly Income</p>
                    <p className="text-emerald-400 font-bold text-lg">{formatCurrency(client.kycData!.income)}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">AI Credibility Score</p>
                    <span className={`text-2xl font-bold ${client.kycData!.credibilityScore >= 7 ? 'text-emerald-400' : client.kycData!.credibilityScore >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {client.kycData!.credibilityScore}/10
                    </span>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">AI Risk Assessment</p>
                    <p className="text-zinc-300 text-sm">{client.kycData!.aiRiskSummary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">🏠 Living Expenses & Family</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Family Size</p>
                    <p className="text-2xl font-bold text-white">{client.kycData!.familySize || 0}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Working Members</p>
                    <p className="text-2xl font-bold text-emerald-400">{client.kycData!.workingMembers || 0}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Students</p>
                    <p className="text-2xl font-bold text-blue-400">{client.kycData!.students || 0}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Infants</p>
                    <p className="text-2xl font-bold text-pink-400">{client.kycData!.infants || 0}</p>
                  </div>
                </div>
              </div>

              {/* UPGRADED SOCIAL RECON & LOCATION */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">🔍 Social Recon & Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Facebook Profile</p>
                    {client.kycData!.fbProfileUrl ? (
                      <a href={client.kycData!.fbProfileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all text-sm">
                        {client.kycData!.fbProfileUrl}
                      </a>
                    ) : (
                      <p className="text-zinc-500">Not provided</p>
                    )}
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Reference</p>
                    <p className="text-white font-medium">{client.kycData!.referenceName || 'Not provided'}</p>
                    {client.kycData!.referencePhone && (
                      <p className="text-zinc-400 text-sm">{client.kycData!.referencePhone}</p>
                    )}
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase mb-1">Google Maps</p>
                    {client.kycData!.locationUrl ? (
                      <a href={client.kycData!.locationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all text-sm flex items-center gap-2">
                        <span>📍</span> View Location
                      </a>
                    ) : (
                      <p className="text-zinc-500">Not provided</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4">📸 Forensic Verification</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {client.kycData!.selfieUrl && <DocumentImage src={client.kycData!.selfieUrl} label="🤳 Selfie" />}
                  {client.kycData!.idPhotoUrl && <DocumentImage src={client.kycData!.idPhotoUrl} label="🪪 ID" />}
                  {client.kycData!.payslipPhotoUrl && <DocumentImage src={client.kycData!.payslipPhotoUrl} label="💼 Payslip" />}
                  {client.kycData!.electricBillPhotoUrl && <DocumentImage src={client.kycData!.electricBillPhotoUrl} label="⚡ Electric Bill" />}
                  {client.kycData!.waterBillPhotoUrl && <DocumentImage src={client.kycData!.waterBillPhotoUrl} label="💧 Water Bill" />}
                  {client.kycData!.collateralUrl && <DocumentImage src={client.kycData!.collateralUrl} label="🏠 Collateral" />}
                </div>
                {!client.kycData!.selfieUrl && !client.kycData!.idPhotoUrl && (
                  <p className="text-zinc-500 text-center py-4">No verification documents uploaded</p>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">✍️ Digital Signature & Consent</h2>
                {client.kycData!.digitalSignature ? (
                  <div className="bg-white rounded-xl p-6 max-w-md">
                    <img 
                      src={client.kycData!.digitalSignature} 
                      alt="Client Digital Signature" 
                      className="w-full max-w-xs mx-auto"
                    />
                    <p className="text-center text-zinc-600 text-sm mt-2">
                      Digitally signed by {client.kycData!.firstName} {client.kycData!.lastName}
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-800 rounded-xl p-6 text-center max-w-md">
                    <p className="text-zinc-500">No digital signature on file</p>
                    <p className="text-zinc-600 text-xs mt-1">Client may have been created before signature capture was implemented</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Loan History & P&L</h2>
          
          {client.loans.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No loans found</p>
          ) : (
            <div className="space-y-4">
              {client.loans.map(loan => (
                <div key={loan.id} className="bg-zinc-800 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-lg">TXN-{loan.id.toString().padStart(4, '0')}</p>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${loan.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">
                        {formatDate(loan.startDate)} → {formatDate(loan.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/clients/${client.id}/contract/${loan.id}`}
                        target="_blank"
                        className="text-sm px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                      >
                        📄 Contract
                      </Link>
                      <Link 
                        href={`/payments?loan=${loan.id}`}
                        className="text-blue-400 text-sm hover:underline"
                      >
                        View Payments →
                      </Link>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-zinc-500">Principal</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(loan.principal)}</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-zinc-500">Rate</p>
                      <p className="text-sm font-bold text-white">10% <span className="text-emerald-400 text-xs">(Effective: 6% w/ Discount)</span></p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-zinc-500">Total</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(loan.totalRepayment)}</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-zinc-500">Paid</p>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(loan.totalPaid)}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${
                      loan.netLoanProfit >= 0 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}>
                      <p className="text-xs text-zinc-500">Net Profit</p>
                      <p className={`text-sm font-bold ${loan.netLoanProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(loan.netLoanProfit)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span>Interest: <span className="text-emerald-400 font-medium">{formatCurrency(loan.totalInterestPaid)}</span></span>
                    <span>Penalties: <span className="text-amber-400 font-medium">{formatCurrency(loan.totalPenaltiesPaid)}</span></span>
                    {loan.agentCommissions > 0 && (
                      <span>Agent Commission (40%): <span className="text-rose-400 font-medium">-{formatCurrency(loan.agentCommissions)}</span></span>
                    )}
                    {loan.agentName && (
                      <span className="text-zinc-400">Agent: {loan.agentName}</span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Progress: {loan.paidInstallments}/{loan.installmentsCount} installments</span>
                      <span>{Math.round((loan.totalPaid / loan.totalRepayment) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ width: `${(loan.totalPaid / loan.totalRepayment) * 100}%` }}
                      />
                    </div>
                  </div>

                  {loan.installments && loan.installments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-zinc-500 uppercase mb-2">Installments</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {loan.installments.map((inst) => (
                          <div key={inst.id} className="bg-zinc-900 rounded-lg p-3 relative group border border-transparent hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400">Period {inst.period}</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                  inst.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                                  inst.status === 'LATE' ? 'bg-rose-500/20 text-rose-400' :
                                  inst.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-zinc-500/20 text-zinc-400'
                                }`}>
                                  {inst.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-zinc-500">Due: {formatDate(inst.dueDate)}</span>
                                <DossierFBNotifyButton client={client} loan={loan} inst={inst} />
                              </div>
                            </div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-zinc-400">Principal: <span className="text-white">{formatCurrency(inst.principal)}</span></span>
                              <span className="text-zinc-400">Interest: <span className="text-amber-400">{formatCurrency(inst.interest)}</span></span>
                              {inst.penaltyFee > 0 && (
                                <span className="text-rose-400">Penalty: {formatCurrency(inst.penaltyFee)}</span>
                              )}
                            </div>
                            {inst.status !== 'PAID' && (
                              <CollectionLog
                                installmentId={inst.id}
                                penaltyFee={inst.penaltyFee}
                                status={inst.status}
                                expectedAmount={inst.expectedAmount}
                                principalAmount={loan.principal}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Transaction History</h2>
          
          {client.transactions.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No transactions found</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {client.transactions.map((tx) => (
                <div key={tx.id} className="bg-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">RCP-{tx.id.toString().padStart(6, '0')}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        tx.paymentType === 'INTEREST' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : tx.paymentType === 'PRINCIPAL'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tx.paymentType || 'FULL'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Loan TXN-{tx.loanId.toString().padStart(4, '0')} • {formatDateTime(tx.paymentDate)}
                    </p>
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">{formatCurrency(tx.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'new-loan' && (
        <DirectLoanCalculator
          clientId={client.id}
          clientName={`${client.firstName} ${client.lastName}`}
          onDisburseComplete={handleDisburseComplete}
        />
      )}
    </div>
  );
}
