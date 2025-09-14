/**
 * Currency formatting utilities for Ugandan Shilling (UGX)
 */

/**
 * Format number as UGX currency
 */
export function formatUGX(amount: number): string {
  if (isNaN(amount)) return 'UGX 0';
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('USh', 'UGX');
}

/**
 * Format number as compact UGX (e.g., 16.8M instead of 16,800,000)
 */
export function formatCompactUGX(amount: number): string {
  if (isNaN(amount)) return 'UGX 0';
  
  const formatter = new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  
  return formatter.format(amount).replace('USh', 'UGX');
}

/**
 * Format number with thousands separators (no currency symbol)
 */
export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse UGX string back to number
 */
export function parseUGX(ugxString: string): number {
  // Remove currency symbols and spaces
  const cleanString = ugxString
    .replace(/UGX|USh/gi, '')
    .replace(/[,\s]/g, '')
    .trim();
  
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate UGX amount input
 */
export function validateUGXAmount(
  amount: number,
  minAmount: number = 10000,
  maxAmount?: number
): { isValid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (amount < minAmount) {
    return { 
      isValid: false, 
      error: `Minimum payment amount is ${formatUGX(minAmount)}` 
    };
  }
  
  if (maxAmount && amount > maxAmount) {
    return { 
      isValid: false, 
      error: `Maximum payment amount is ${formatUGX(maxAmount)}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Generate suggested payment amounts based on outstanding balance
 */
export function generatePaymentSuggestions(
  outstandingBalance: number,
  minimumPayment: number = 10000
): number[] {
  const suggestions: number[] = [];
  
  // Add minimum payment if different from other suggestions
  if (minimumPayment < outstandingBalance) {
    suggestions.push(minimumPayment);
  }
  
  // Add percentage-based suggestions
  const percentages = [25, 50, 75];
  percentages.forEach(percent => {
    const amount = Math.floor((outstandingBalance * percent) / 100);
    if (amount >= minimumPayment && amount < outstandingBalance) {
      suggestions.push(amount);
    }
  });
  
  // Add full amount
  suggestions.push(outstandingBalance);
  
  // Remove duplicates and sort
  return [...new Set(suggestions)].sort((a, b) => a - b);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle Ugandan phone numbers
  if (digits.length === 10 && digits.startsWith('0')) {
    // Format as: 0XXX XXX XXX
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  } else if (digits.length === 12 && digits.startsWith('256')) {
    // Format as: +256 XXX XXX XXX
    return `+${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  }
  
  // Return original if format not recognized
  return phoneNumber;
}

/**
 * Validate Ugandan phone number
 */
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check for valid Ugandan formats
  const isValid = 
    (digits.length === 10 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith('256'));
  
  if (!isValid) {
    return {
      isValid: false,
      error: 'Please enter a valid Ugandan phone number (0XXX XXX XXX or +256 XXX XXX XXX)'
    };
  }
  
  return { isValid: true };
}

/**
 * Convert phone number to international format for API
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 10 && digits.startsWith('0')) {
    // Convert 0XXX XXX XXX to 256XXX XXX XXX
    return '256' + digits.substring(1);
  } else if (digits.length === 12 && digits.startsWith('256')) {
    // Already in correct format
    return digits;
  }
  
  // Return as-is if format not recognized
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Get mobile money provider from phone number
 */
export function getMobileMoneyProvider(phoneNumber: string): 'mtn' | 'airtel' | 'unknown' {
  const digits = phoneNumber.replace(/\D/g, '');
  const normalizedNumber = normalizePhoneNumber(digits);
  
  // MTN prefixes in Uganda
  const mtnPrefixes = ['25677', '25678', '25676', '25639'];
  
  // Airtel prefixes in Uganda
  const airtelPrefixes = ['25675', '25670', '25674', '25620'];
  
  for (const prefix of mtnPrefixes) {
    if (normalizedNumber.startsWith(prefix)) {
      return 'mtn';
    }
  }
  
  for (const prefix of airtelPrefixes) {
    if (normalizedNumber.startsWith(prefix)) {
      return 'airtel';
    }
  }
  
  return 'unknown';
}