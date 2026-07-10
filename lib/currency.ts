import type { Currency } from '../types';

export const MOBILE_MONEY_UNAVAILABLE_MESSAGE =
  'This lease is billed in USD. Please arrange payment with your landlord directly (bank transfer / cash) — mobile money is not available for USD.';

/** Format an amount using the lease's currency. */
export function formatMoney(amount: number | string, currency: Currency = 'UGX'): string {
  const normalizedCurrency: Currency = currency === 'USD' ? 'USD' : 'UGX';
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numericAmount)) {
    return normalizedCurrency === 'USD' ? 'USD 0.00' : 'UGX 0';
  }

  const fractionDigits = normalizedCurrency === 'USD' ? 2 : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    currencyDisplay: 'code',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numericAmount).replace(/\u00a0/g, ' ');
}

/** Format an amount compactly using the lease's currency. */
export function formatCompactMoney(amount: number | string, currency: Currency = 'UGX'): string {
  const normalizedCurrency: Currency = currency === 'USD' ? 'USD' : 'UGX';
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numericAmount)) {
    return normalizedCurrency === 'USD' ? 'USD 0.00' : 'UGX 0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    currencyDisplay: 'code',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: normalizedCurrency === 'USD' ? 2 : 0,
    maximumFractionDigits: normalizedCurrency === 'USD' ? 2 : 1,
  }).format(numericAmount).replace(/\u00a0/g, ' ');
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
 * Parse a formatted money string back to a number.
 */
export function parseMoney(moneyString: string): number {
  const cleanString = moneyString
    .replace(/UGX|USD|USh|\$/gi, '')
    .replace(/[,\s]/g, '')
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate a payment amount.
 */
export function validatePaymentAmount(
  amount: number,
  currency: Currency,
  minAmount: number = 10000,
  maxAmount?: number
): { isValid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  if (amount < minAmount) {
    return {
      isValid: false,
      error: `Minimum payment amount is ${formatMoney(minAmount, currency)}`
    };
  }

  if (maxAmount && amount > maxAmount) {
    return {
      isValid: false,
      error: `Maximum payment amount is ${formatMoney(maxAmount, currency)}`
    };
  }

  return { isValid: true };
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
