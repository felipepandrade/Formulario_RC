import { RequisitionItem } from '../types';
import { LOCATIONS } from '../constants';
import { createInitialItem, generateId, SELECT_PLACEHOLDER } from './items';

export const DRAFT_STORAGE_KEY = 'esom-rc-rascunho-v1';

export interface Draft {
  requester: string;
  location: string;
  items: RequisitionItem[];
  /** When the requisition was last opened in Outlook (ISO date), to warn before sending it twice. */
  sentAt?: string;
}

export interface StoredDraft extends Draft {
  /** When the draft was last saved (ISO date). */
  savedAt?: string;
}

const asString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;

const asDate = (value: unknown): string | undefined =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;

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
export function loadDraft(): StoredDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as Record<string, unknown>;
    const location = asString(data.location, SELECT_PLACEHOLDER);
    const items = Array.isArray(data.items) && data.items.length > 0 ? data.items.map(restoreItem) : [createInitialItem()];
    const draft: StoredDraft = {
      requester: asString(data.requester, ''),
      location: LOCATIONS.some((l) => l.value === location) ? location : SELECT_PLACEHOLDER,
      items,
    };
    const savedAt = asDate(data.savedAt);
    const sentAt = asDate(data.sentAt);
    if (savedAt) draft.savedAt = savedAt;
    if (sentAt) draft.sentAt = sentAt;
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  try {
    const stored: StoredDraft = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(stored));
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

/** True when the draft holds nothing the user typed or picked (a fresh, untouched form). */
export function isDraftEmpty(draft: Pick<Draft, 'requester' | 'location' | 'items'>): boolean {
  if (draft.requester.trim() || draft.location !== SELECT_PLACEHOLDER || draft.items.length !== 1) return false;
  const blank = createInitialItem();
  const item = draft.items[0];
  return (Object.keys(blank) as (keyof RequisitionItem)[]).every(
    (field) => field === 'id' || (item[field] ?? '') === (blank[field] ?? '')
  );
}
