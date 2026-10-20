import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fails the test on any console error, which includes Content-Security-Policy violations.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

async function fillItem(page: Page) {
  await page.getByLabel('Solicitante').fill('Maria Souza');
  await page.getByLabel('Local para Entrega').selectOption('ESOM_F_CATU_OI');
  await page.getByLabel('Descrição Detalhada').fill('Válvula esfera 2"');
  await page.getByLabel(/Preço Unit/).fill('1.500,50');
  await page.getByLabel('Tipo de Origem').selectOption('Fornecedor');
  await page.getByLabel('Tipo de Acordo').selectOption('Acordo de compra em aberto');
  await page.getByLabel('Objetivo da RC').selectOption('MATERIAL CONSUMO');
  await page.getByLabel('Uso Pretendido').selectOption('SOLUC_USO E CONSUMO');
  await page.getByLabel('Tipo de Destino').selectOption('Despesa');
  await page.getByLabel('Justificativa Técnica').fill('Substituição de válvula com vazamento.');
}

test.beforeEach(async ({ page }) => {
  // The draft is saved in localStorage; start every test with a clean form.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('carrega sem erros, sem violações de acessibilidade e sem indexação', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  const response = await page.reload();

  await expect(page.getByRole('heading', { name: 'Requisição de Compra' })).toBeVisible();
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expectNoA11yViolations(page);
  expect(errors).toEqual([]);
});

test('mostra os erros, mantém o primeiro campo visível e segue acessível', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir no Outlook' }).click();

  await expect(page.getByRole('alert')).toContainText('campos precisam ser corrigidos');
  const requester = page.getByLabel('Solicitante');
  await expect(requester).toBeFocused();

  // The sticky action bar must not cover the field the user has to fix.
  const field = await requester.boundingBox();
  const bar = await page.locator('form .sticky').boundingBox();
  expect(field && bar && field.y + field.height <= bar.y).toBe(true);

  await expectNoA11yViolations(page);
});

test('envia uma requisição completa e avisa para não repetir o pedido', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await fillItem(page);
  await expect(page.locator('form .sticky').getByText('R$ 1.500,50')).toBeVisible();

  await page.getByRole('button', { name: 'Abrir no Outlook' }).click();

  await expect(page.getByRole('status')).toContainText('E-mail aberto no Outlook');
  await expect(page.getByText(/já foi aberta no Outlook em/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/já foi aberta no Outlook em/)).toBeVisible();
  await page.getByRole('button', { name: 'Nova requisição' }).click();
  await expect(page.getByLabel('Solicitante')).toHaveValue('');
  expect(errors.filter((e) => !e.includes('mailto'))).toEqual([]);
});

test('desfaz a remoção de um item e duplica itens', async ({ page }) => {
  await page.getByLabel('Descrição Detalhada').fill('Luva nitrílica');
  await page.getByRole('button', { name: 'Duplicar Item 1' }).click();

  const descriptions = page.getByLabel('Descrição Detalhada');
  await expect(descriptions).toHaveCount(2);
  await expect(descriptions.nth(1)).toHaveValue('Luva nitrílica');
  await expect(page.getByLabel('Código do Item').nth(1)).toBeFocused();

  await page.getByRole('button', { name: 'Remover Item 2' }).click();
  await expect(descriptions).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Item 1 da Requisição/ })).toBeFocused();

  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(descriptions).toHaveCount(2);
});
