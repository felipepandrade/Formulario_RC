import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EngieLogo } from './Logo';

describe('EngieLogo Component', () => {
  const localUrl = "/engie-logo.svg";
  const wikimediaUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9b/Engie_logo.svg";

  it('renders with the local SVG URL and alt text', () => {
    render(<EngieLogo />);
    const img = screen.getByRole('img', { name: 'ENGIE' });

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', localUrl);
    expect(img).toHaveClass('h-24 w-auto');
  });

  it('falls back to Wikimedia URL when the initial image fails to load', () => {
    render(<EngieLogo />);
    const img = screen.getByRole('img', { name: 'ENGIE' });

    // Initial state
    expect(img).toHaveAttribute('src', localUrl);

    // Simulate error
    fireEvent.error(img);

    // Check if fallback URL is applied
    expect(img).toHaveAttribute('src', wikimediaUrl);
  });

  it('does not change src if error occurs on fallback image', () => {
    render(<EngieLogo />);
    const img = screen.getByRole('img', { name: 'ENGIE' });

    // Simulate error on initial load
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', wikimediaUrl);

    // Simulate error on fallback load
    fireEvent.error(img);
    // Should still be wikimediaUrl, infinite loop prevented
    expect(img).toHaveAttribute('src', wikimediaUrl);
  });

  it('applies custom className when provided', () => {
    render(<EngieLogo className="custom-class" />);
    const img = screen.getByRole('img', { name: 'ENGIE' });

    expect(img).toHaveClass('custom-class');
    // Ensure default class is NOT there when a custom one is provided (based on component implementation)
    expect(img).not.toHaveClass('h-24 w-auto');
  });
});
