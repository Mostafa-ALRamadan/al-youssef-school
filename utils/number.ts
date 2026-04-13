/**
 * Number formatting utilities for Arabic locale
 */

// Convert Western numerals to Arabic numerals
export const toArabicNumerals = (num: number | string): string => {
  return num.toString().replace(/[0-9]/g, (w) => {
    return ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'][parseInt(w)];
  });
};

// Format any number with Arabic numerals
export const formatNumber = (num: number | string): string => {
  return toArabicNumerals(num);
};

// Format decimal number with Arabic numerals
export const formatDecimal = (num: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  });
  return toArabicNumerals(formatted);
};

// Format percentage with Arabic numerals
export const formatPercentage = (num: number): string => {
  return `${toArabicNumerals(num)}%`;
};

// Format fraction like "5/10" with Arabic numerals
export const formatFraction = (numerator: number, denominator: number): string => {
  return `${toArabicNumerals(numerator)}\\${toArabicNumerals(denominator)}`;
};
