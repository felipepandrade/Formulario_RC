
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('EMAIL_MAPPING', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    // Clear module cache to allow re-importing constants with new env stubs
    vi.resetModules();
  });

  it('should decode Base64 environment variables', async () => {
    vi.stubEnv('VITE_EMAIL_CATU_OI', btoa('test@catu.com'));
    vi.stubEnv('VITE_EMAIL_CAMACARI_OI', btoa('test@camacari.com'));
    vi.stubEnv('VITE_EMAIL_ITABUNA_OI', btoa('test@itabuna.com'));
    vi.stubEnv('VITE_EMAIL_PILAR_OI', btoa('test@pilar.com'));
    vi.stubEnv('VITE_EMAIL_ATALAIA_OI', btoa('test@atalaia.com'));

    // Re-import the module to pick up the stubbed environment variables
    const { EMAIL_MAPPING } = await import('./constants');

    expect(EMAIL_MAPPING['ESOM_F_CATU_OI']).toBe('test@catu.com');
    expect(EMAIL_MAPPING['ESOM_F_CAMACARI_OI']).toBe('test@camacari.com');
    expect(EMAIL_MAPPING['ESOM_F_ITABUNA_OI']).toBe('test@itabuna.com');
    expect(EMAIL_MAPPING['ESOM_F_PILAR_OI']).toBe('test@pilar.com');
    expect(EMAIL_MAPPING['ESOM_F_ATALAIA_OI']).toBe('test@atalaia.com');
  });

  it('should return empty string for missing or invalid environment variables', async () => {
    vi.stubEnv('VITE_EMAIL_CATU_OI', '');
    vi.stubEnv('VITE_EMAIL_CAMACARI_OI', '!!!invalid-base64!!!');

    const { EMAIL_MAPPING } = await import('./constants');

    expect(EMAIL_MAPPING['ESOM_F_CATU_OI']).toBe('');
    // Invalid Base64 should return empty string due to try-catch in decodeEmail
    expect(EMAIL_MAPPING['ESOM_F_CAMACARI_OI']).toBe('');
  });
});
