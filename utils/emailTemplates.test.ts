import { describe, it, expect } from 'vitest';
import { generateEmailBody } from './emailTemplates';
import { RequisitionItem } from '../types';

describe('generateEmailBody', () => {
  const mockItem: RequisitionItem = {
    id: '1',
    itemCode: 'CODE123',
    description: 'Test Item Description',
    quantity: 5,
    price: 100.5,
    usageLocation: 'Plant A',
    originType: 'Type A',
    agreementType: 'Contract',
    agreement: 'AG-001',
    provider: 'Provider X',
    osNumber: 'OS-999',
    destinationType: 'Stock',
    subInventory: 'Sub 1',
    usageIntent: 'Maintenance',
    objective: 'Repair',
    justification: 'This is a test justification.',
    buyerObservation: 'Buyer notes',
    providerObservation: 'Provider notes',
  };

  it('generates a correctly formatted header', () => {
    const body = generateEmailBody('John Doe', 'Location Y', [mockItem]);
    expect(body).toContain('SOLICITANTE: John Doe');
    expect(body).toContain('LOCAL DE ENTREGA: Location Y');
  });

  it('formats item details correctly', () => {
    const body = generateEmailBody('John Doe', 'Location Y', [mockItem]);
    expect(body).toContain('================ ITEM #1 ================');
    expect(body).toContain('CÓDIGO: CODE123');
    expect(body).toContain('DESCRIÇÃO:\nTest Item Description');
    expect(body).toContain('QUANTIDADE: 5');
    expect(body).toContain('PREÇO EST.: R$ 100.50');
    expect(body).toContain('OS: OS-999');
    expect(body).toContain('LOCAL DE UTILIZAÇÃO: Plant A');
    expect(body).toContain('ORIGEM: Type A');
    expect(body).toContain('ACORDO: AG-001');
    expect(body).toContain('FORNECEDOR: Provider X');
    expect(body).toContain('OBJETIVO: Repair');
    expect(body).toContain('USO PRETENDIDO: Maintenance');
    expect(body).toContain('SUBINVENTÁRIO: Sub 1');
    expect(body).toContain('This is a test justification.');
    expect(body).toContain('OBS. COMPRADOR: Buyer notes (Fornecedor indicado: Provider X)');
    expect(body).toContain('OBS. FORNECEDOR: Provider notes');
  });

  it('handles multiple items', () => {
    const items = [
      { ...mockItem, id: '1' },
      { ...mockItem, id: '2', itemCode: 'CODE456', description: 'Second Item' }
    ];
    const body = generateEmailBody('John Doe', 'Location Y', items);
    expect(body).toContain('================ ITEM #1 ================');
    expect(body).toContain('================ ITEM #2 ================');
    expect(body).toContain('CÓDIGO: CODE456');
    expect(body).toContain('DESCRIÇÃO:\nSecond Item');
  });

  it('handles missing optional fields', () => {
    const minimalItem: RequisitionItem = {
      id: '1',
      itemCode: '',
      description: 'Minimal Item',
      quantity: 1,
      price: 10,
      usageLocation: '',
      originType: 'Type B',
      agreementType: 'Type C',
      destinationType: 'Type D',
      usageIntent: 'Type E',
      objective: 'Type F',
      justification: 'Minimal justification',
      buyerObservation: '',
      providerObservation: '',
    };

    const body = generateEmailBody('Jane Doe', 'Location Z', [minimalItem]);
    expect(body).toContain('CÓDIGO: A DEFINIR');
    expect(body).toContain('OS: N/A');
    expect(body).not.toContain('LOCAL DE UTILIZAÇÃO:');
    expect(body).not.toContain('ACORDO:');
    expect(body).not.toContain('FORNECEDOR:');
    expect(body).not.toContain('SUBINVENTÁRIO:');
    expect(body).not.toContain('OBS. COMPRADOR:');
    expect(body).not.toContain('OBS. FORNECEDOR:');
  });

  it('handles item with provider but no buyer observation', () => {
    const item = { ...mockItem, buyerObservation: '', provider: 'Special Provider' };
    const body = generateEmailBody('John', 'Loc', [item]);
    expect(body).toContain('OBS. COMPRADOR: Fornecedor indicado: Special Provider');
  });

  it('includes the footer', () => {
    const body = generateEmailBody('John', 'Loc', [mockItem]);
    expect(body).toContain('Email gerado automaticamente pelo Sistema ESOM.');
  });
});
