import { describe, it, expect } from 'vitest';
import { clearDraft, DRAFT_STORAGE_KEY, isDraftEmpty, loadDraft, saveDraft } from './draft';
import { createInitialItem } from './items';

describe('draft', () => {
  it('returns null when nothing was saved', () => {
    expect(loadDraft()).toBeNull();
  });

  it('restores what was saved', () => {
    const item = { ...createInitialItem(), description: 'Parafuso', quantity: '3' };
    saveDraft({ requester: 'Ana', location: 'ESOM_F_PILAR_OI', items: [item] });

    const draft = loadDraft();
    expect(draft).toMatchObject({ requester: 'Ana', location: 'ESOM_F_PILAR_OI', items: [item] });
    expect(Date.parse(draft?.savedAt ?? '')).not.toBeNaN();
    expect(draft?.sentAt).toBeUndefined();
  });

  it('keeps when the requisition was opened in Outlook and drops invalid dates', () => {
    saveDraft({ requester: 'Ana', location: 'ESOM_F_PILAR_OI', items: [createInitialItem()], sentAt: '2026-10-19T14:30:00.000Z' });
    expect(loadDraft()?.sentAt).toBe('2026-10-19T14:30:00.000Z');

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ requester: 'Ana', sentAt: 'ontem', savedAt: 3 }));
    expect(loadDraft()).not.toHaveProperty('sentAt');
    expect(loadDraft()).not.toHaveProperty('savedAt');
  });

  it('tells an untouched form apart from one with data', () => {
    const blank = { requester: '', location: 'Selecione', items: [createInitialItem()] };
    expect(isDraftEmpty(blank)).toBe(true);
    expect(isDraftEmpty({ ...blank, requester: 'Ana' })).toBe(false);
    expect(isDraftEmpty({ ...blank, items: [{ ...createInitialItem(), price: '10' }] })).toBe(false);
    expect(isDraftEmpty({ ...blank, items: [createInitialItem(), createInitialItem()] })).toBe(false);
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
