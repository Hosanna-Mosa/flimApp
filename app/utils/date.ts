const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function toDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** "30 Aug 2026" */
export function formatDate(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12:44 PM" */
export function formatTime(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  const h = d.getHours();
  const hour12 = h % 12 || 12;
  return `${hour12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
}

/**
 * "30 Aug 2026, 12:44 PM" — explicit formatting instead of
 * toLocaleString(), which on some Android/Hermes builds falls back to the
 * full Date string (day name, timezone, etc.).
 */
export function formatDateTime(value: string | number | Date): string {
  const d = toDate(value);
  if (!d) return '';
  return `${formatDate(d)}, ${formatTime(d)}`;
}
