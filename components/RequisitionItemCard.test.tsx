
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RequisitionItemCard from './RequisitionItemCard';
import { RequisitionItem } from '../types';

const mockItem: RequisitionItem = {
  id: '1',
  itemCode: 'ITEM001',
  description: 'Test Description',
  quantity: 10,
  price: 100.5,
  usageLocation: 'Test Location',
  originType: 'Fornecedor',
  agreementType: 'Acordo de compra contratual',
  agreement: 'AG123',
  provider: 'Test Provider',
  osNumber: 'OS456',
  destinationType: 'Despesa',
  subInventory: 'Insumo',
  usageIntent: 'SOLUC_USO E CONSUMO',
  objective: 'MATERIAL CONSUMO',
  justification: 'Test Justification',
  buyerObservation: 'Buyer Obs',
  providerObservation: 'Provider Obs',
};

describe('RequisitionItemCard', () => {
  const mockUpdateItem = vi.fn();
  const mockRemoveItem = vi.fn();

  it('renders correctly with item data', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={true}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    expect(screen.getByText('Item da Requisição')).toBeInTheDocument();
    expect(screen.getByText('ITEM001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ITEM001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AG123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
    expect(screen.getByDisplayValue('OS456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Justification')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Buyer Obs')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Provider Obs')).toBeInTheDocument();
  });

  it('calls updateItem when item code changes', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={true}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    const input = screen.getByDisplayValue('ITEM001');
    fireEvent.change(input, { target: { value: 'ITEM999' } });
    expect(mockUpdateItem).toHaveBeenCalledWith(0, 'itemCode', 'ITEM999');
  });

  it('calls updateItem when quantity changes', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={true}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '20' } });
    expect(mockUpdateItem).toHaveBeenCalledWith(0, 'quantity', 20);
  });

  it('calls updateItem when a select field changes', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={true}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    // Target "Tipo de Origem" select
    const select = screen.getByDisplayValue('Fornecedor');
    fireEvent.change(select, { target: { value: 'Estoque' } });
    expect(mockUpdateItem).toHaveBeenCalledWith(0, 'originType', 'Estoque');
  });

  it('calls removeItem when trash icon is clicked', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={true}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    const removeButton = screen.getByTitle('Remover Item');
    fireEvent.click(removeButton);
    expect(mockRemoveItem).toHaveBeenCalledWith(0);
  });

  it('does not render remove button when canRemove is false', () => {
    render(
      <RequisitionItemCard
        item={mockItem}
        index={0}
        canRemove={false}
        updateItem={mockUpdateItem}
        removeItem={mockRemoveItem}
      />
    );

    expect(screen.queryByTitle('Remover Item')).not.toBeInTheDocument();
  });
});
