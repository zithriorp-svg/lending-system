/**
 * OMNICHANNEL NOTIFICATION ENGINE
 * 
 * Generates dynamic, context-aware message templates for FB Messenger notifications.
 * All templates use absolute numbers, proper currency formatting, and detailed ledger breakdowns.
 */

// Currency formatter - Philippine Peso
const formatCurrency = (amount: number): string => {
  return `₱${Math.abs(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Date formatter - human readable
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Short date formatter
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
  status: string; // PENDING, PAID, LATE, MISSED, PARTIAL
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
// LEDGER SUMMARY HELPER
// ============================================================================

/**
 * Generates the bottom half of notification messages with:
 * - Overall Account Status
 * - Payment History (Cleared)
 * - Pending & Overdue Installments
 */
export function generateLedgerSummary(loan: LoanData): string {
  const installments = loan.installments || [];
  
  // Separate installments by status
  const paidInstallments = installments
    .filter(i => i.status === 'PAID' || i.status === 'LATE')
    .sort((a, b) => a.period - b.period);
  
  const pendingInstallments = installments
    .filter(i => i.status === 'PENDING' || i.status === 'MISSED' || i.status === 'PARTIAL' || i.status === 'LATE')
    .sort((a, b) => a.period - b.period);

  // Build ledger sections
  let ledger = `\n📊 OVERALL ACCOUNT STATUS:\n`;
  ledger += `- Total Loan Amount: ${formatCurrency(loan.totalRepayment)}\n`;
  ledger += `- Total Paid to Date: ${formatCurrency(loan.totalPaid)}\n`;
  ledger += `- Remaining Balance: ${formatCurrency(loan.remainingBalance)}\n`;

  // Payment History (Cleared)
  ledger += `\n✅ PAYMENT HISTORY (CLEARED):\n`;
  if (paidInstallments.length === 0) {
    ledger += `   None\n`;
  } else {
    paidInstallments.forEach(inst => {
      const paidDate = inst.paymentDate ? formatShortDate(inst.paymentDate) : 'N/A';
      ledger += `   ✅ Inst #${inst.period}: ${paidDate} - ${formatCurrency(inst.amountPaid || inst.expectedAmount)}\n`;
    });
  }

  // Pending & Overdue Installments
  ledger += `\n❌ PENDING & OVERDUE INSTALLMENTS:\n`;
  if (pendingInstallments.length === 0) {
    ledger += `   None\n`;
  } else {
    pendingInstallments.forEach(inst => {
      const dueDate = formatShortDate(inst.dueDate);
      const penalties = inst.penaltyFee > 0 ? ` (Penalties: ${formatCurrency(inst.penaltyFee)})` : '';
      const statusTag = inst.status === 'LATE' || inst.status === 'MISSED' ? '⚠️ OVERDUE' : '';
      ledger += `   ❌ Inst #${inst.period}: ${dueDate} - ${formatCurrency(inst.expectedAmount)}${penalties} ${statusTag}\n`;
    });
  }

  return ledger;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * OVERDUE / PENALTY NOTICE
 * Sent when a payment is late
 * 
 * IMPORTANT: penaltyAmount is DYNAMIC - passed from installment.penaltyFee
 */
export function generateOverdueNotice(params: {
  clientName: string;
  periodNumber: number;
  daysLate: number;
  baseAmount: number;
  discountAmount: number;
  penaltyAmount: number; // DYNAMIC - from installment.penaltyFee
  totalAmount: number;
  dueDate: Date | string;
  loan: LoanData;
}): string {
  const { clientName, periodNumber, daysLate, baseAmount, discountAmount, penaltyAmount, totalAmount, dueDate, loan } = params;
  
  let message = `URGENT ACCOUNT NOTICE ⚠️

Hello ${clientName},

Our records indicate that your payment for Installment #${periodNumber} is currently OVERDUE.

🚨 PENALTY & DISCOUNT FORFEITURE:
Because this payment is late, your Good Payer Discount has been strictly REVOKED.
- Base Installment: ${formatCurrency(baseAmount)}
- Revoked Discount: + ${formatCurrency(discountAmount)}
- Applied Late Fees: + ${formatCurrency(penaltyAmount)}
----------------------------------
📌 TOTAL OVERDUE FOR INST #${periodNumber}: ${formatCurrency(totalAmount)}

📅 MISSED DUE DATE: ${formatShortDate(dueDate)}`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\nPlease settle your overdue balance immediately to prevent further penalties or account escalation.

- Company Manager`;

  return message;
}

/**
 * PAYMENT REMINDER - 2-Day Heads Up before due date
 */
export function generatePaymentReminder(params: {
  clientName: string;
  amount: number;
  periodNumber: number;
  dueDate: Date | string;
  loan: LoanData;
}): string {
  const { clientName, amount, periodNumber, dueDate, loan } = params;
  
  let message = `UPCOMING PAYMENT REMINDER 🔔

Hello ${clientName},

This is a reminder that your next payment for Installment #${periodNumber} is due in 2 days.

📌 AMOUNT DUE: ${formatCurrency(amount)} (Includes your 6% Good Payer rate)
📅 DUE DATE: ${formatShortDate(dueDate)}

🚨 IMPORTANT: If you pay late, the 4% discount is no longer applicable and you will be charged the standard 10% contract rate plus penalties.`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

/**
 * OFFICIAL RECEIPT - After payment received
 */
export function generatePaymentReceipt(params: {
  clientName: string;
  amount: number;
  paymentDate: Date | string;
  periodNumber: number;
  loan: LoanData;
}): string {
  const { clientName, amount, paymentDate, periodNumber, loan } = params;
  
  let message = `OFFICIAL PAYMENT RECEIPT 🧾

Hello ${clientName},

We have successfully received your payment for Installment #${periodNumber}. Thank you for your prompt payment!

📌 AMOUNT RECEIVED: ${formatCurrency(amount)}
📅 DATE POSTED: ${formatShortDate(paymentDate)}`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

/**
 * LOAN DISBURSED - When funds are released
 */
export function generateLoanDisbursed(params: {
  clientName: string;
  amount: number;
  disbursementDate: Date | string;
  loan: LoanData;
}): string {
  const { clientName, amount, disbursementDate, loan } = params;
  
  let message = `LOAN DISBURSEMENT CONFIRMED 💸

Hello ${clientName},

Your loan funds have been successfully released to you! 

📌 AMOUNT DISBURSED: ${formatCurrency(amount)}
📅 DATE: ${formatShortDate(disbursementDate)}`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

/**
 * LOAN APPROVED - Sent when application is approved
 */
export function generateLoanApproved(params: {
  clientName: string;
  amount: number;
  loan: LoanData;
}): string {
  const { clientName, amount, loan } = params;
  
  let message = `LOAN APPROVED ✅

Hello ${clientName},

Great news! Your loan application for ${formatCurrency(amount)} has been officially APPROVED. Please prepare to review and sign your contract.`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

/**
 * LOAN FULLY PAID - Account cleared notification
 */
export function generateLoanFullyPaid(params: {
  clientName: string;
  totalLoanAmount: number;
  loan: LoanData;
}): string {
  const { clientName, totalLoanAmount, loan } = params;
  
  let message = `ACCOUNT CLEARED 🎉

Congratulations ${clientName}!

Your loan of ${formatCurrency(totalLoanAmount)} is now FULLY PAID.

Thank you for being a highly valued client. You are now eligible to apply for your next capital advance.`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

/**
 * DUE TODAY - Same day reminder
 */
export function generateDueTodayNotice(params: {
  clientName: string;
  amount: number;
  periodNumber: number;
  loan: LoanData;
}): string {
  const { clientName, amount, periodNumber, loan } = params;
  
  let message = `TODAY'S REMINDER 🔔

Hello ${clientName},

Your payment of ${formatCurrency(amount)} for Installment #${periodNumber} is DUE TODAY.

Please settle your account to maintain your Good Payer discount.`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

// ============================================================================
// SIMPLIFIED GENERATORS (for dashboard alerts without full loan context)
// ============================================================================

/**
 * Simplified overdue notice - for dashboard alerts without full loan context
 */
export function generateSimpleOverdueNotice(params: {
  clientName: string;
  amount: number;
  daysLate: number;
  periodNumber: number;
  penaltyAmount?: number; // DYNAMIC penalty
}): string {
  const { clientName, amount, daysLate, periodNumber, penaltyAmount } = params;
  
  let message = `URGENT: Hello ${clientName}, your payment of ${formatCurrency(amount)} for Installment #${periodNumber} is ${daysLate} day${daysLate > 1 ? 's' : ''} OVERDUE.`;

  if (penaltyAmount && penaltyAmount > 0) {
    message += `\n\n⚠️ A late penalty of ${formatCurrency(penaltyAmount)} has been applied.`;
  }

  message += `\n\nPlease contact your assigned officer immediately to settle your account and avoid further penalties.

- Company Manager`;

  return message;
}

/**
 * Simplified due today notice - for dashboard alerts without full loan context
 */
export function generateSimpleDueTodayNotice(params: {
  clientName: string;
  amount: number;
  periodNumber: number;
}): string {
  const { clientName, amount, periodNumber } = params;
  
  return `TODAY'S REMINDER: Hello ${clientName}, your payment of ${formatCurrency(amount)} for Installment #${periodNumber} is DUE TODAY.

Please settle your account to maintain your Good Payer discount.

- Company Manager`;
}

/**
 * ACCOUNT STATUS UPDATE - General notification with ledger
 */
export function generateAccountStatusUpdate(params: {
  clientName: string;
  loan: LoanData;
}): string {
  const { clientName, loan } = params;
  
  let message = `ACCOUNT STATUS UPDATE 📊

Hello ${clientName},

This is a routine update regarding your active account with FinTech Vault.`;

  // Append Ledger Summary
  message += generateLedgerSummary(loan);

  message += `\n- Company Manager`;

  return message;
}

// ============================================================================
// FB NOTIFICATION HANDLER
// ============================================================================

/**
 * Generic FB notification handler
 * Copies message to clipboard and opens Facebook profile directly
 * NO m.me logic - opens the raw fbProfileUrl as stored in database
 */
export function sendFBNotification(params: {
  message: string;
  clientName: string;
  fbProfileUrl?: string | null;
  messengerId?: string | null;
  onCopy?: () => void;
}): { success: boolean; message: string } {
  const { message, clientName, fbProfileUrl, messengerId, onCopy } = params;

  try {
    // Step 1: Copy message to clipboard
    navigator.clipboard.writeText(message);

    // Step 2: Determine profile URL - use raw URL directly, no m.me construction
    let profileUrl: string;

    if (fbProfileUrl) {
      // Use the stored URL exactly as-is
      if (fbProfileUrl.startsWith('http://') || fbProfileUrl.startsWith('https://')) {
        profileUrl = fbProfileUrl;
      } else {
        // Add https prefix if missing
        profileUrl = `https://${fbProfileUrl}`;
      }
    } else if (messengerId) {
      // Fallback to messengerId field - use as profile URL, not m.me
      if (messengerId.startsWith('http://') || messengerId.startsWith('https://')) {
        profileUrl = messengerId;
      } else {
        profileUrl = `https://${messengerId}`;
      }
    } else {
      // Last resort: search Facebook for client name
      profileUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(clientName)}`;
    }

    // Step 3: Open profile in new tab
    window.open(profileUrl, '_blank');

    // Callback
    if (onCopy) onCopy();

    return { success: true, message: `Message copied! Facebook profile opened for ${clientName}.` };
  } catch (error) {
    return { success: false, message: 'Failed to copy message.' };
  }
}

// Export currency formatter for use in other components
export { formatCurrency, formatDate, formatShortDate };
