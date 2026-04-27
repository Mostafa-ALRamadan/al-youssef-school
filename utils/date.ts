/**
 * Date formatting utilities for Arabic locale with Gregorian calendar
 */

// Convert Western numerals to Arabic numerals
export const toArabicNumerals = (num: number | string): string => {
  return num.toString().replace(/[0-9]/g, (w) => {
    return ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'][parseInt(w)];
  });
};

// Format date as YYYY/MM/DD with Arabic numerals (for RTL display)
export const formatDate = (date: string | Date): string => {
  let year: number, month: number, day: number;
  
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Date-only string YYYY-MM-DD - parse manually to avoid timezone issues
    [year, month, day] = date.split('-').map(Number);
  } else {
    // ISO timestamp or Date object - use Date constructor
    const d = new Date(date);
    day = d.getDate();
    month = d.getMonth() + 1;
    year = d.getFullYear();
  }
  
  return `${toArabicNumerals(year)}/${toArabicNumerals(month)}/${toArabicNumerals(day)}`;
};

// Alternative format: DD/MM/YYYY (if needed)
export const formatDateLTR = (date: string | Date): string => {
  let year: number, month: number, day: number;
  
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Date-only string YYYY-MM-DD - parse manually to avoid timezone issues
    [year, month, day] = date.split('-').map(Number);
  } else {
    // ISO timestamp or Date object - use Date constructor
    const d = new Date(date);
    day = d.getDate();
    month = d.getMonth() + 1;
    year = d.getFullYear();
  }
  
  return `${toArabicNumerals(day)}/${toArabicNumerals(month)}/${toArabicNumerals(year)}`;
};

// Format date with time as DD/MM/YYYY HH:MM
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${toArabicNumerals(day)}/${toArabicNumerals(month)}/${toArabicNumerals(year)} ${toArabicNumerals(hours)}:${toArabicNumerals(minutes)}`;
};

// Format date with time as YYYY/MM/DD HH:MM (RTL format like other admin pages)
export const formatDateTimeRTL = (date: string | Date): string => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${toArabicNumerals(year)}/${toArabicNumerals(month)}/${toArabicNumerals(day)} ${toArabicNumerals(hours)}:${toArabicNumerals(minutes)}`;
};

// Format time only as HH:MM with AM/PM in Arabic
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'مساءً' : 'صباحاً';
  const hour12 = hour % 12 || 12;
  return `${toArabicNumerals(hour12)}:${toArabicNumerals(minutes)} ${period}`;
};
