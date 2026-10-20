import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EngieLogo, ENGIE_BLUE } from './Logo';

describe('EngieLogo Component', () => {
  it('renders the inline official logo with an accessible name', () => {
    render(<EngieLogo />);
    const logo = screen.getByRole('img', { name: 'ENGIE' });

    expect(logo.tagName.toLowerCase()).toBe('svg');
    expect(logo).toHaveAttribute('viewBox', '0 0 382.68 138.23');
    expect(logo).toHaveAttribute('fill', ENGIE_BLUE);
    expect(logo.querySelector('path')?.getAttribute('d')).toMatch(/^M23\.59 98\.07/);
  });

  it('does not load the logo from the network', () => {
    const { container } = render(<EngieLogo />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('applies the default className', () => {
    render(<EngieLogo />);
    expect(screen.getByRole('img', { name: 'ENGIE' })).toHaveClass('h-24', 'w-auto');
  });

  it('applies custom className when provided', () => {
    render(<EngieLogo className="custom-class" />);
    const logo = screen.getByRole('img', { name: 'ENGIE' });

    expect(logo).toHaveClass('custom-class');
    expect(logo).not.toHaveClass('h-24');
  });
});
