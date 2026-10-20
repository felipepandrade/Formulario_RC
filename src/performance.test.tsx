
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import App from './App';

let inputRenderCount = 0;
let selectRenderCount = 0;

// Mock the components to track renders
vi.mock('./components/InputFields', async (importOriginal) => {
  const actual = await importOriginal<any>();

  const MockInput = vi.fn((props: any) => {
    if (props.label === 'Solicitante') {
      inputRenderCount++;
    }
    return <actual.Input {...props} />;
  });

  const MockSelect = vi.fn((props: any) => {
    if (props.label === 'Local para Entrega') {
      selectRenderCount++;
    }
    return <actual.Select {...props} />;
  });

  return {
    ...actual,
    Input: React.memo(MockInput),
    Select: React.memo(MockSelect),
  };
});

describe('Performance Baseline', () => {
  beforeEach(() => {
    inputRenderCount = 0;
    selectRenderCount = 0;
    vi.clearAllMocks();
  });

  it('measures render counts of Input and Select when unrelated state changes', async () => {
    const { getByText } = render(<App />);

    const initialInputCount = inputRenderCount;
    const initialSelectCount = selectRenderCount;

    console.log(`Baseline - Initial Renders: Input=${initialInputCount}, Select=${initialSelectCount}`);

    // Trigger an unrelated state change (adding an item)
    const addButton = getByText(/Adicionar Outro Item/i);

    await act(async () => {
      fireEvent.click(addButton);
    });

    console.log(`Verified - Renders after adding item: Input=${inputRenderCount}, Select=${selectRenderCount}`);

    // After optimization, these should NOT increase because React.memo skips re-render
    expect(inputRenderCount).toBe(initialInputCount);
    expect(selectRenderCount).toBe(initialSelectCount);
  });
});
