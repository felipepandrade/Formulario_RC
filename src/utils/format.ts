/**
 * Converts what the user typed in a quantity/price field into a number.
 * Accepts the Brazilian format ("1.500,50", "2,5") and the plain format ("1500.50").
 * Returns NaN when the text is empty or not a valid non-negative number.
 */
export function parseDecimal(raw: string | number | undefined | null): number {
  if (typeof raw === 'number') return raw;
  const text = (raw ?? '').replace(/\s/g, '');
  if (!text) return NaN;

  let normalized: string;
  if (text.includes(',')) {
    // Brazilian format: dots are thousands separators, the comma is the decimal separator.
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d*$/.test(text)) return NaN;
    normalized = text.replace(/\./g, '').replace(',', '.').replace(/\.$/, '');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    // "1.500" or "2.000.000" without a comma: dots are thousands separators.
    normalized = text.replace(/\./g, '');
  } else {
    normalized = text;
  }

  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

/** Keeps only the characters that can appear in a decimal number (digits, dot, comma). */
export const sanitizeDecimalInput = (value: string): string => value.replace(/[^\d.,]/g, '');

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const quantityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

/** Formats a value as Brazilian currency ("R$ 1.500,50") using a regular space. */
export const formatBRL = (value: number): string =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0).replace(/ /g, ' ');

/** Formats a quantity in the Brazilian format ("1.500", "2,5"). */
export const formatQuantity = (value: number): string =>
  Number.isFinite(value) ? quantityFormatter.format(value) : '0';

/** Turns a free-text name into a safe file name fragment ("João Silva" -> "Joao_Silva"). */
export const toFileNameFragment = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** Formats an ISO date as "19/10 às 14:30" in the user's time zone, or '' when invalid. */
export function formatShortDateTime(iso: string | undefined): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} às ${time}`;
}
