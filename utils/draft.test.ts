import { describe, it, expect } from 'vitest';
import { clearDraft, DRAFT_STORAGE_KEY, loadDraft, saveDraft } from './draft';
import { createInitialItem } from './items';

describe('draft', () => {
  it('returns null when nothing was saved', () => {
    expect(loadDraft()).toBeNull();
  });

  it('restores what was saved', () => {
    const item = { ...createInitialItem(), description: 'Parafuso', quantity: '3' };
    saveDraft({ requester: 'Ana', location: 'ESOM_F_PILAR_OI', items: [item] });

    expect(loadDraft()).toEqual({ requester: 'Ana', location: 'ESOM_F_PILAR_OI', items: [item] });
  });

  it('fills missing fields, converts old numeric values and drops unknown locations', () => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ requester: 'Ana', location: 'BASE_REMOVIDA', items: [{ description: 'X', quantity: 2, price: 1.5 }] })
    );

    const draft = loadDraft();
    expect(draft?.location).toBe('Selecione');
    expect(draft?.items[0]).toMatchObject({ description: 'X', quantity: '2', price: '1.5', originType: 'Selecione' });
    expect(draft?.items[0].id).toBeTruthy();
  });

  it('ignores a corrupted draft and can be cleared', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, '{not json');
    expect(loadDraft()).toBeNull();
    clearDraft();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
