
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select, Input, TextArea } from './InputFields';

describe('Input Component', () => {
  it('renders label correctly', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders required asterisk when required prop is true', () => {
    render(<Input label="Test Label" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message and applies error styles when error prop is provided', () => {
    const errorMessage = 'Field is required';
    render(<Input label="Test Label" error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<Input label="Test Label" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Value' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('New Value');
  });

  it('passes additional props to the input element', () => {
    render(
      <Input
        label="Test Label"
        placeholder="Enter text"
        type="password"
        disabled
        data-testid="custom-input"
      />
    );

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toBeDisabled();
  });
});

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

describe('TextArea Component', () => {
  it('renders label correctly', () => {
    render(<TextArea label="Test TextArea" />);
    expect(screen.getByText('Test TextArea')).toBeInTheDocument();
  });

  it('renders required asterisk when required prop is true', () => {
    render(<TextArea label="Test TextArea" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message and applies error styles when error prop is provided', () => {
    const errorMessage = 'Description is required';
    render(<TextArea label="Test TextArea" error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-red-500');
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<TextArea label="Test TextArea" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Detailed description' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('Detailed description');
  });

  it('passes additional props to the textarea element', () => {
    render(
      <TextArea
        label="Test TextArea"
        placeholder="Enter description"
        rows={5}
        disabled
        data-testid="custom-textarea"
      />
    );

    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter description');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toBeDisabled();
  });
});
