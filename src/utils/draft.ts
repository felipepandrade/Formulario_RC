import { RequisitionItem } from '../types';
import { LOCATIONS } from '../constants';
import { createInitialItem, generateId, SELECT_PLACEHOLDER } from './items';

export const DRAFT_STORAGE_KEY = 'esom-rc-rascunho-v1';

export interface Draft {
  requester: string;
  location: string;
  items: RequisitionItem[];
}

const asString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;

// Rebuilds an item from stored data, keeping only known fields with the right types.
function restoreItem(raw: unknown): RequisitionItem {
  const base = createInitialItem();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Record<string, unknown>;
  const restored = { ...base };
  (Object.keys(base) as (keyof RequisitionItem)[]).forEach((field) => {
    if (field !== 'id') restored[field] = asString(data[field], base[field] ?? '');
  });
  restored.id = typeof data.id === 'string' && data.id ? data.id : generateId();
  return restored;
}

/** Reads the saved draft, or returns null when there is none or it cannot be read. */
export function loadDraft(): Draft | null {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as Record<string, unknown>;
    const location = asString(data.location, SELECT_PLACEHOLDER);
    const items = Array.isArray(data.items) && data.items.length > 0 ? data.items.map(restoreItem) : [createInitialItem()];
    return {
      requester: asString(data.requester, ''),
      location: LOCATIONS.some((l) => l.value === location) ? location : SELECT_PLACEHOLDER,
      items,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked (private mode): the form keeps working without a draft.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore: nothing to clear.
  }
}
