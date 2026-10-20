import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Counts renders of the requester and location fields, which do not depend on the items.
const renders = { requester: 0, location: 0 };

vi.mock('./components/InputFields', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./components/InputFields')>();
  type InputProps = React.ComponentProps<typeof actual.Input>;
  type SelectProps = React.ComponentProps<typeof actual.Select>;

  const CountingInput = (props: InputProps) => {
    if (props.label === 'Solicitante') renders.requester++;
    return <actual.Input {...props} />;
  };
  const CountingSelect = (props: SelectProps) => {
    if (props.label === 'Local para Entrega') renders.location++;
    return <actual.Select {...props} />;
  };

  return { ...actual, Input: React.memo(CountingInput), Select: React.memo(CountingSelect) };
});

describe('render performance', () => {
  beforeEach(() => {
    renders.requester = 0;
    renders.location = 0;
  });

  it('does not re-render the requester and location fields when an item is added', async () => {
    const { getByText } = render(<App />);
    const before = { ...renders };

    await act(async () => {
      fireEvent.click(getByText(/Adicionar Outro Item/i));
    });

    expect(renders).toEqual(before);
  });
});
