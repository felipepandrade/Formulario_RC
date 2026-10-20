import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { DRAFT_STORAGE_KEY } from '../utils/draft';

const Broken = (): never => {
  throw new Error('falhou');
};

const originalLocation = window.location;

describe('ErrorBoundary', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true });
    vi.restoreAllMocks();
  });

  it('renders its children when nothing fails', () => {
    render(<ErrorBoundary><p>Formulário</p></ErrorBoundary>);
    expect(screen.getByText('Formulário')).toBeInTheDocument();
  });

  it('shows a message instead of a blank page and can clear the draft', () => {
    // React reports the thrown error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const swallow = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', swallow);
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload }, writable: true, configurable: true });
    localStorage.setItem(DRAFT_STORAGE_KEY, '{}');

    render(<ErrorBoundary><Broken /></ErrorBoundary>);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível exibir o formulário');
    fireEvent.click(screen.getByRole('button', { name: /Apagar rascunho e recarregar/ }));
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(reload).toHaveBeenCalled();
    window.removeEventListener('error', swallow);
  });
});
