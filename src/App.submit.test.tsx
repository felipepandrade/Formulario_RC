import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { DRAFT_STORAGE_KEY } from './utils/draft';

vi.mock('./constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./constants')>();
  return { ...actual, EMAIL_MAPPING: { ESOM_F_CATU_OI: 'compras@example.com' } };
});

const originalLocation = window.location;
const writeText = vi.fn();

function fillValidForm(justification = 'Necessário para manutenção.') {
  fireEvent.change(screen.getByLabelText(/Solicitante/), { target: { value: 'João' } });
  fireEvent.change(screen.getByLabelText(/Local para Entrega/), { target: { value: 'ESOM_F_CATU_OI' } });
  fireEvent.change(screen.getByLabelText(/Descrição Detalhada/), { target: { value: 'Válvula' } });
  fireEvent.change(screen.getByLabelText(/Preço Unit/), { target: { value: '1.500,50' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Origem/), { target: { value: 'Fornecedor' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Acordo/), { target: { value: 'Acordo de compra em aberto' } });
  fireEvent.change(screen.getByLabelText(/Objetivo da RC/), { target: { value: 'MATERIAL CONSUMO' } });
  fireEvent.change(screen.getByLabelText(/Uso Pretendido/), { target: { value: 'SOLUC_USO E CONSUMO' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Destino/), { target: { value: 'Despesa' } });
  fireEvent.change(screen.getByLabelText(/Justificativa Técnica/), { target: { value: justification } });
}

describe('App submission', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true });
  });

  it('opens the e-mail with the full requisition when it fits in the link', async () => {
    render(<App />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    await waitFor(() => expect(window.location.href).toMatch(/^mailto:compras@example\.com\?subject=/));
    const body = decodeURIComponent(window.location.href.split('&body=')[1]);
    expect(body).toContain('PREÇO UNIT. EST.: R$ 1.500,50');
    expect(body).toContain('VALOR TOTAL ESTIMADO: R$ 1.500,50');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies a long requisition and still opens the e-mail with recipient and subject', async () => {
    render(<App />);
    fillValidForm('Justificativa muito longa. '.repeat(120));
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    await waitFor(() => expect(window.location.href).toMatch(/^mailto:compras@example\.com\?subject=/));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Justificativa muito longa.'));
    expect(decodeURIComponent(window.location.href)).toContain('cole aqui com Ctrl+V');
    expect(window.location.href.length).toBeLessThan(2000);
    expect(screen.getByRole('status')).toHaveTextContent(/texto completo foi copiado/);
  });

  it('warns that the requisition was already opened and starts a new one on request', async () => {
    const { unmount } = render(<App />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    await waitFor(() => expect(screen.getByText(/já foi aberta no Outlook em/)).toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent(/comece uma nova requisição/);
    await waitFor(() => expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('sentAt'));

    // The warning survives a reload, so the same requisition is not sent twice by mistake.
    unmount();
    render(<App />);
    expect(screen.getByText(/já foi aberta no Outlook em/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nova requisição' }));
    expect(screen.getByLabelText(/Solicitante/)).toHaveValue('');
    expect(screen.queryByText(/já foi aberta no Outlook em/)).not.toBeInTheDocument();
  });

  it('marks invalid fields and moves focus to the first one', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    const requester = screen.getByLabelText(/Solicitante/);
    expect(requester).toHaveAttribute('aria-invalid', 'true');
    expect(requester).toHaveAccessibleDescription('Solicitante é obrigatório.');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '10 campos precisam ser corrigidos. Comece por: Solicitante é obrigatório.'
    );
    await waitFor(() => expect(requester).toHaveFocus());
    expect(window.location.href).toBe('');
  });
});

describe('App draft', () => {
  it('restores the saved draft and clears it on request', async () => {
    const { unmount } = render(<App />);
    fireEvent.change(screen.getByLabelText(/Solicitante/), { target: { value: 'Maria' } });
    await waitFor(() => expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('Maria'));
    unmount();

    render(<App />);
    expect(screen.getByLabelText(/Solicitante/)).toHaveValue('Maria');
    expect(screen.getByText(/Rascunho recuperado de \d{2}\/\d{2} às \d{2}:\d{2}/)).toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Limpar formulário/i }));
    expect(screen.getByLabelText(/Solicitante/)).toHaveValue('');
  });
});

describe('App items', () => {
  it('undoes a removal and keeps focus on a nearby item', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Adicionar Outro Item/i));
    const descriptions = screen.getAllByLabelText(/Descrição Detalhada/);
    fireEvent.change(descriptions[0], { target: { value: 'Primeiro' } });
    fireEvent.change(descriptions[1], { target: { value: 'Segundo' } });

    fireEvent.click(screen.getByRole('button', { name: 'Remover Item 1' }));
    expect(screen.getAllByLabelText(/Descrição Detalhada/)).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Item 1 removido.');
    await waitFor(() => expect(screen.getByRole('heading', { name: /1º Item da Requisição/ })).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    const restored = screen.getAllByLabelText(/Descrição Detalhada/);
    expect(restored.map((el) => (el as HTMLTextAreaElement).value)).toEqual(['Primeiro', 'Segundo']);
    await waitFor(() => expect(screen.getByRole('heading', { name: /1º Item da Requisição/ })).toHaveFocus());
  });

  it('duplicates an item right after it, with all its data', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/), { target: { value: 'Luva' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/), { target: { value: 'Fornecedor' } });

    fireEvent.click(screen.getByRole('button', { name: 'Duplicar Item 1' }));

    const descriptions = screen.getAllByLabelText(/Descrição Detalhada/);
    expect(descriptions.map((el) => (el as HTMLTextAreaElement).value)).toEqual(['Luva', 'Luva']);
    expect(screen.getAllByLabelText(/Tipo de Origem/)[1]).toHaveValue('Fornecedor');
    await waitFor(() => expect(screen.getAllByLabelText(/Código do Item/)[1]).toHaveFocus());
  });
});
