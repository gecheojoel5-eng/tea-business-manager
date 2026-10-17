import { PaymentMethod, MovementType, TaxCategoryCode } from './types';

/**
 * Format numbers into Kenyan Shilling display: "KSh 1,250.00"
 */
export function formatKES(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'KSh 0.00';
  }
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats canonical grams into human-friendly weight units
 * E.g., 500g -> "500 g", 1000g -> "1.0 kg", 480000g -> "480.0 kg"
 */
export function formatWeight(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || isNaN(grams)) {
    return '0 g';
  }
  const absGrams = Math.abs(grams);
  const sign = grams < 0 ? '-' : '';

  if (absGrams >= 1000) {
    const kg = absGrams / 1000;
    // If integer, don't show trailing zero, else show 1 or 2 decimals
    const formattedKg = kg % 1 === 0 ? kg.toLocaleString('en-KE') : kg.toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return `${sign}${formattedKg} kg`;
  }
  return `${sign}${absGrams.toLocaleString('en-KE')} g`;
}

/**
 * Kenyan standard date format: DD/MM/YYYY
 */
export function formatKenyanDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Kenyan standard datetime format: DD/MM/YYYY HH:mm
 */
export function formatKenyanDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'mpesa':
      return 'M-Pesa';
    case 'cash':
      return 'Cash';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'credit':
      return 'Credit (On Account)';
    default:
      return method;
  }
}

export function getMovementTypeLabel(type: MovementType): { label: string; isPositive: boolean } {
  switch (type) {
    case 'purchase_receive':
      return { label: 'Purchase Received', isPositive: true };
    case 'sale_dispatch':
      return { label: 'Sale Dispatched', isPositive: false };
    case 'repack_source':
      return { label: 'Repacking (Deducted from Bulk)', isPositive: false };
    case 'repack_dest':
      return { label: 'Repacking (Packets Produced)', isPositive: true };
    case 'adjustment_gain':
      return { label: 'Stock Audit Gain', isPositive: true };
    case 'adjustment_loss':
      return { label: 'Stock Audit Loss', isPositive: false };
    case 'sale_return':
      return { label: 'Customer Return Restocked', isPositive: true };
    default:
      return { label: type, isPositive: true };
  }
}

export function getTaxRate(code: TaxCategoryCode): number {
  switch (code) {
    case 'standard_16':
      return 16.0;
    case 'zero_rated_0':
      return 0.0;
    case 'exempt':
      return 0.0;
    default:
      return 0.0;
  }
}

export function getTaxCategoryName(code: TaxCategoryCode): string {
  switch (code) {
    case 'standard_16':
      return '16% Standard VAT';
    case 'zero_rated_0':
      return '0% Zero-Rated';
    case 'exempt':
      return 'Exempt';
    default:
      return code;
  }
}
