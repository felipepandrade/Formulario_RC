
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './InputFields';

describe('Select Component', () => {
  const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ];

  it('renders label and options correctly', () => {
    render(<Select label="Test Select" options={options} />);

    expect(screen.getByText('Test Select')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(2);
  });

  it('renders required asterisk when required prop is true', () => {
    render(<Select label="Test Select" options={options} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message and applies error styles when error prop is provided', () => {
    const errorMessage = 'Selection is required';
    render(<Select label="Test Select" options={options} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-red-500');
  });

  it('calls onChange when a different option is selected', () => {
    const onChange = vi.fn();
    render(<Select label="Test Select" options={options} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue('2');
  });

  it('passes additional props to the select element', () => {
    render(<Select label="Test Select" options={options} data-testid="custom-select" disabled />);

    const select = screen.getByTestId('custom-select');
    expect(select).toBeDisabled();
  });
});
