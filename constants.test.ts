
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { EMAIL_MAPPING } from './constants';

describe('EMAIL_MAPPING', () => {
  it('should map locations to environment variables', () => {
    // In Vitest, import.meta.env is usually handled by the environment or can be mocked via vi.mock
    // For this test, we are checking if the mapping exists and is a string
    expect(EMAIL_MAPPING).toHaveProperty('ESOM_F_CATU_OI');
    expect(typeof EMAIL_MAPPING['ESOM_F_CATU_OI']).toBe('string');
  });

  it('should have all expected keys', () => {
    const keys = [
      'ESOM_F_CATU_OI',
      'ESOM_F_CAMACARI_OI',
      'ESOM_F_ITABUNA_OI',
      'ESOM_F_PILAR_OI',
      'ESOM_F_ATALAIA_OI',
    ];
    keys.forEach(key => {
      expect(EMAIL_MAPPING).toHaveProperty(key);
    });
  });
});
