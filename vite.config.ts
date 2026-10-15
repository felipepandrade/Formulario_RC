/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Recipient e-mails (Base64) required for each location. See .env.example.
const REQUIRED_EMAIL_VARS = [
  'VITE_EMAIL_CATU_OI',
  'VITE_EMAIL_R_CATU_OI',
  'VITE_EMAIL_CAMACARI_OI',
  'VITE_EMAIL_ITABUNA_OI',
  'VITE_EMAIL_PILAR_OI',
  'VITE_EMAIL_ATALAIA_OI',
];

// Fails the production build when a recipient e-mail is missing or is not valid
// Base64. Without this, the app builds fine and only shows
// "E-mail não encontrado para a base selecionada." when a user submits.
const requireRecipientEmails = (): Plugin => ({
  name: 'require-recipient-emails',
  apply: 'build',
  configResolved(config) {
    const env = loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_EMAIL_');
    const problems = REQUIRED_EMAIL_VARS.flatMap((name) => {
      const value = (env[name] || '').trim();
      if (!value) return [`${name} não definida`];
      try {
        if (!atob(value).includes('@')) return [`${name} não contém um e-mail em Base64`];
      } catch {
        return [`${name} não é Base64 válido`];
      }
      return [];
    });
    if (problems.length > 0) {
      throw new Error(
        `Variáveis de e-mail ausentes ou inválidas no build:\n  - ${problems.join('\n  - ')}\n` +
          'Defina-as no ambiente de build (ex.: Vercel > Settings > Environment Variables). Veja .env.example.'
      );
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), requireRecipientEmails()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
});
