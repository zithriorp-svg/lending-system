import { NextResponse } from "next/server";

/**
 * OMNICHANNEL NOTIFICATION ENGINE - FULL FORCE DOCTRINE
 * Generates dynamic, context-aware message templates for FB Messenger notifications.
 * All templates include the FULL LEDGER to ensure absolute transparency.
 */

const formatCurrency = (amount: number): string => {
  return `₱${Math.abs(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const formatShortDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InstallmentData {
  period: number;
  dueDate: Date | string;
  expectedAmount: number;
  principal: number;
  interest: number;
  penaltyFee: number;
  status: string; 
  paymentDate: Date | string | null;
  amountPaid: number;
}

export interface LoanData {
  id: number;
  principal: number;
  interestRate: number;
  termDuration: number;
  totalRepayment: number;
  totalPaid: number;
  remainingBalance: number;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  goodPayerDiscountRevoked: boolean;
  installments: InstallmentData[];
}

// ============================================================================
// THE FULL FORCE LEDGER SUMMARY 
// ============================================================================

export function generateLedgerSummary(loan: LoanData): string {
  const installments = loan.installments || [];
  
  const paidInstallments = installments
    .filter(i => i.status === 'PAID' || i.status === 'LATE')
    .sort((a, b) => a.period - b.period);
  
  const pendingInstallments = installments
    .filter(i => i.status === 'PENDING' || i.status === 'MISSED' || i.status === 'PARTIAL' || i.status === 'LATE')
    .sort((a, b) => a.period - b.period);

  let ledger = `\n📊 OVERALL ACCOUNT STATUS:\n`;
  ledger += `----------------------------------\n`;
  ledger += `- Total Loan Amount: ${formatCurrency(loan.totalRepayment)}\n`;
  ledger += `- Total Paid to Date: ${formatCurrency(loan.totalPaid)}\n`;
  ledger += `- Remaining Balance: ${formatCurrency(loan.remainingBalance)}\n`;
  ledger += `----------------------------------\n`;

  ledger += `\n✅ PAYMENT HISTORY (CLEARED):\n`;
  if (paidInstallments.length === 0) {
    ledger += `   [ No payments made yet ]\n`;
  } else {
    paidInstallments.forEach(inst => {
      const paidDate = inst.paymentDate ? formatShortDate(inst.paymentDate) : 'N/A';
      ledger += `   ✅ Inst #${inst.period}: ${paidDate} - ${formatCurrency(inst.amountPaid || inst.expectedAmount)}\n`;
    });
  }

  ledger += `\n❌ PENDING & OVERDUE INSTALLMENTS:\n`;
  if (pendingInstallments.length === 0) {
    ledger += `   [ All current installments cleared ]\n`;
  } else {
    pendingInstallments.forEach(inst => {
      const dueDate = formatShortDate(inst.dueDate);
      const penalties = inst.penaltyFee > 0 ? ` (+${formatCurrency(inst.penaltyFee)} Penalty)` : '';
      const statusTag = inst.status === 'LATE' || inst.status === 'MISSED' ? '⚠️ OVERDUE' : '';
      ledger += `   ${inst.status === 'LATE' || inst.status === 'MISSED' ? '❌' : '⏳'} Inst #${inst.period}: ${dueDate} - ${formatCurrency(inst.expectedAmount)}${penalties} ${statusTag}\n`;
    });
  }

  return ledger;
}

// ============================================================================
// NOTIFICATION TEMPLATES (ALL MOVEMENTS OF MONEY)
// ============================================================================

export function generateLoanApproved(params: { clientName: string; amount: number; loan: LoanData; }): string {
  let message = `✅ LOAN APPLICATION APPROVED ✅\n\nHello ${params.clientName},\n\nGreat news! Your loan application for ${formatCurrency(params.amount)} has been officially APPROVED. Please review your full repayment schedule below.`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generateLoanDisbursed(params: { clientName: string; amount: number; disbursementDate: Date | string; loan: LoanData; }): string {
  let message = `💸 FUNDS DISBURSED 💸\n\nHello ${params.clientName},\n\nYour loan funds of ${formatCurrency(params.amount)} have been successfully released to you on ${formatShortDate(params.disbursementDate)}. Your billing cycle has officially started.`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generatePaymentReminder(params: { clientName: string; amount: number; periodNumber: number; dueDate: Date | string; loan: LoanData; }): string {
  let message = `🔔 UPCOMING PAYMENT REMINDER 🔔\n\nHello ${params.clientName},\n\nThis is a reminder that your next payment for Installment #${params.periodNumber} is due soon.\n\n📌 AMOUNT DUE: ${formatCurrency(params.amount)}\n📅 DUE DATE: ${formatShortDate(params.dueDate)}\n\n🚨 IMPORTANT: If you pay late, your 4% discount will be revoked and you will be charged the standard 10% contract rate plus penalties.`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generateDueTodayNotice(params: { clientName: string; amount: number; periodNumber: number; loan: LoanData; }): string {
  let message = `⚠️ PAYMENT DUE TODAY ⚠️\n\nHello ${params.clientName},\n\nYour payment of ${formatCurrency(params.amount)} for Installment #${params.periodNumber} is DUE TODAY. Please settle your account before midnight to maintain your Good Payer discount.`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generateOverdueNotice(params: { clientName: string; periodNumber: number; daysLate: number; baseAmount: number; discountAmount: number; penaltyAmount: number; totalAmount: number; dueDate: Date | string; loan: LoanData; }): string {
  let message = `🚨 URGENT: ACCOUNT OVERDUE 🚨\n\nHello ${params.clientName},\n\nYour payment for Installment #${params.periodNumber} is currently OVERDUE by ${params.daysLate} days.\n\n⚠️ PENALTY & DISCOUNT FORFEITURE:\nBecause this payment is late, your Good Payer Discount has been strictly REVOKED.\n- Base Installment: ${formatCurrency(params.baseAmount)}\n- Revoked Discount: + ${formatCurrency(params.discountAmount)}\n- Applied Late Fees: + ${formatCurrency(params.penaltyAmount)}\n----------------------------------\n📌 TOTAL OVERDUE FOR INST #${params.periodNumber}: ${formatCurrency(params.totalAmount)}\n📅 MISSED DUE DATE: ${formatShortDate(params.dueDate)}`;
  message += generateLedgerSummary(params.loan);
  message += `\n\nPlease settle your overdue balance immediately to prevent account escalation.\n\n- FinTech Vault Management`;
  return message;
}

export function generatePenaltyAppliedNotice(params: { clientName: string; periodNumber: number; penaltyAmount: number; newTotalAmount: number; loan: LoanData; }): string {
  let message = `⛔ PENALTY APPLIED ⛔\n\nHello ${params.clientName},\n\nThis is an official notice that a late penalty of ${formatCurrency(params.penaltyAmount)} has been added to Installment #${params.periodNumber}.\n\n📌 NEW TOTAL DUE FOR INST #${params.periodNumber}: ${formatCurrency(params.newTotalAmount)}`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generatePaymentReceipt(params: { clientName: string; amount: number; paymentDate: Date | string; periodNumber: number; loan: LoanData; }): string {
  let message = `🧾 OFFICIAL PAYMENT RECEIPT 🧾\n\nHello ${params.clientName},\n\nWe have successfully received your payment of ${formatCurrency(params.amount)} for Installment #${params.periodNumber} on ${formatShortDate(params.paymentDate)}. Thank you for your payment!`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

export function generateLoanFullyPaid(params: { clientName: string; totalLoanAmount: number; loan: LoanData; }): string {
  let message = `🎉 ACCOUNT FULLY CLEARED 🎉\n\nCongratulations ${params.clientName}!\n\nYour loan of ${formatCurrency(params.totalLoanAmount)} is now FULLY PAID. Thank you for being a highly valued client. You are now eligible to apply for your next capital advance.`;
  message += generateLedgerSummary(params.loan);
  message += `\n\n- FinTech Vault Management`;
  return message;
}

// ============================================================================
// FB NOTIFICATION BUTTON LOGIC
// ============================================================================

export function sendFBNotification(params: {
  message: string;
  clientName: string;
  fbProfileUrl?: string | null;
  messengerId?: string | null;
  onCopy?: () => void;
}): { success: boolean; message: string } {
  const { message, clientName, fbProfileUrl, messengerId, onCopy } = params;

  try {
    navigator.clipboard.writeText(message);
    let profileUrl: string;

    if (fbProfileUrl) {
      profileUrl = (fbProfileUrl.startsWith('http://') || fbProfileUrl.startsWith('https://')) ? fbProfileUrl : `https://${fbProfileUrl}`;
    } else if (messengerId) {
      profileUrl = (messengerId.startsWith('http://') || messengerId.startsWith('https://')) ? messengerId : `https://${messengerId}`;
    } else {
      profileUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(clientName)}`;
    }

    window.open(profileUrl, '_blank');
    if (onCopy) onCopy();
    return { success: true, message: `Message copied!` };
  } catch (error) {
    return { success: false, message: 'Failed to copy message.' };
  }
}
