import { RequisitionItem } from '../types';
import { parseDecimal } from './format';

/** Placeholder value used by every select before the user picks an option. */
export const SELECT_PLACEHOLDER = 'Selecione';

/**
 * Generates a unique id. `crypto.randomUUID` only exists in secure contexts (HTTPS or
 * localhost), so fall back to `crypto.getRandomValues` when the app is opened over HTTP.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const createInitialItem = (): RequisitionItem => ({
  id: generateId(),
  itemCode: '',
  description: '',
  quantity: '1',
  price: '',
  usageLocation: '',
  originType: SELECT_PLACEHOLDER,
  agreementType: SELECT_PLACEHOLDER,
  agreement: '',
  provider: '',
  osNumber: '',
  destinationType: SELECT_PLACEHOLDER,
  subInventory: SELECT_PLACEHOLDER,
  usageIntent: SELECT_PLACEHOLDER,
  objective: SELECT_PLACEHOLDER,
  justification: '',
  buyerObservation: '',
  providerObservation: '',
});

/** True when an optional select was left on the placeholder (or is empty). */
export const isUnselected = (value?: string): boolean => !value || value === SELECT_PLACEHOLDER;

/** Quantity × unit price, or 0 while either value is missing or invalid. */
export function itemSubtotal(item: Pick<RequisitionItem, 'quantity' | 'price'>): number {
  const quantity = parseDecimal(item.quantity);
  const price = parseDecimal(item.price);
  return quantity > 0 && price > 0 ? quantity * price : 0;
}

export const requisitionTotal = (items: RequisitionItem[]): number =>
  items.reduce((sum, item) => sum + itemSubtotal(item), 0);
