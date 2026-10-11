/**
 * Converts dd-mm-yyyy or dd/mm/yyyy or yyyy-mm-dd → Date (safe)
 * Accepts: "09-01-2026", "09/01/2026", "2026-01-09"
 */
export const toDate = (dateStr) => {
  if (!dateStr) return null;

  // If already a Date object, return as-is
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  const str = String(dateStr).trim();
  const sep = str.includes('/') ? '/' : str.includes('-') ? '-' : null;

  if (sep) {
    const parts = str.split(sep);
    if (parts.length === 3) {
      const p1 = parts[0];
      const p2 = parts[1];
      const p3 = parts[2].split(' ')[0].split('T')[0]; // strip time if present

      if (p1.length === 4) {
        // yyyy-mm-dd
        const d = new Date(Number(p1), Number(p2) - 1, Number(p3));
        if (!isNaN(d.getTime())) return d;
      } else if (p3.length === 4) {
        // dd-mm-yyyy
        const d = new Date(Number(p3), Number(p2) - 1, Number(p1));
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // Fallback to native constructor
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Normalize date (remove time)
 */
export const normalize = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Check overdue (date < today)
 */
export const isOverdue = (dateStr) => {
  const date = toDate(dateStr);
  if (!date) return false;
  return normalize(date) < normalize(new Date());
};

/**
 * Format as "1 Aug"
 */
export const formatDayMonth = (dateStr) => {
  const date = toDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Safely format date without returning 'Invalid Date'
 */
export const formatDateSafe = (dateStr, options = { day: '2-digit', month: 'short' }) => {
  if (!dateStr) return '-';
  const date = toDate(dateStr);
  if (!date) return String(dateStr);
  return date.toLocaleDateString('en-GB', options);
};

