import { describe, it, expect } from 'vitest';
import { formatRequisitionEmail } from './emailTemplates';
import { RequisitionItem } from '../types';

describe('formatRequisitionEmail', () => {
  const mockItem: RequisitionItem = {
    id: '1',
    itemCode: 'CODE123',
    description: 'Test Description',
    quantity: 5,
    price: 10.5,
    usageLocation: 'Test Location',
    originType: 'Fornecedor',
    agreementType: 'Acordo de compra contratual',
    agreement: 'AGR-001',
    provider: 'Test Provider',
    osNumber: 'OS-999',
    destinationType: 'Despesa',
    subInventory: 'Insumo',
    usageIntent: 'SOLUC_USO E CONSUMO',
    objective: 'MATERIAL CONSUMO',
    justification: 'Test Justification',
    buyerObservation: 'Buyer Obs',
    providerObservation: 'Provider Obs',
  };

  it('should format the email header correctly', () => {
    const requester = 'John Doe';
    const location = 'BASE_TEST';
    const result = formatRequisitionEmail(requester, location, [mockItem]);

    expect(result).toContain('SOLICITAÇÃO DE REQUISIÇÃO DE COMPRA');
    expect(result).toContain(`SOLICITANTE: ${requester}`);
    expect(result).toContain(`LOCAL DE ENTREGA: ${location}`);
  });

  it('should format item details correctly', () => {
    const result = formatRequisitionEmail('John', 'Base', [mockItem]);

    expect(result).toContain('================ ITEM #1 ================');
    expect(result).toContain('CÓDIGO: CODE123');
    expect(result).toContain('DESCRIÇÃO:\nTest Description');
    expect(result).toContain('QUANTIDADE: 5');
    expect(result).toContain('PREÇO EST.: R$ 10.50');
    expect(result).toContain('OS: OS-999');
    expect(result).toContain('LOCAL DE UTILIZAÇÃO: Test Location');
    expect(result).toContain('ORIGEM: Fornecedor');
    expect(result).toContain('TIPO ACORDO: Acordo de compra contratual');
    expect(result).toContain('ACORDO: AGR-001');
    expect(result).toContain('FORNECEDOR: Test Provider');
    expect(result).toContain('OBJETIVO: MATERIAL CONSUMO');
    expect(result).toContain('USO PRETENDIDO: SOLUC_USO E CONSUMO');
    expect(result).toContain('TIPO DESTINO: Despesa');
    expect(result).toContain('SUBINVENTÁRIO: Insumo');
    expect(result).toContain('Test Justification');
    expect(result).toContain('OBS. COMPRADOR: Buyer Obs (Fornecedor indicado: Test Provider)');
    expect(result).toContain('OBS. FORNECEDOR: Provider Obs');
  });

  it('should handle multiple items', () => {
    const items = [
      mockItem,
      { ...mockItem, id: '2', itemCode: 'CODE456' }
    ];
    const result = formatRequisitionEmail('John', 'Base', items);

    expect(result).toContain('================ ITEM #1 ================');
    expect(result).toContain('================ ITEM #2 ================');
    expect(result).toContain('CÓDIGO: CODE123');
    expect(result).toContain('CÓDIGO: CODE456');
  });

  it('should handle missing optional fields', () => {
    const minimalItem: RequisitionItem = {
      ...mockItem,
      itemCode: '',
      osNumber: '',
      usageLocation: '',
      agreement: '',
      provider: '',
      subInventory: '',
      buyerObservation: '',
      providerObservation: '',
    };

    const result = formatRequisitionEmail('John', 'Base', [minimalItem]);

    expect(result).toContain('CÓDIGO: A DEFINIR');
    expect(result).toContain('OS: N/A');
    expect(result).not.toContain('LOCAL DE UTILIZAÇÃO:');
    expect(result).not.toContain('\nACORDO:');
    expect(result).not.toContain('FORNECEDOR:');
    expect(result).not.toContain('SUBINVENTÁRIO:');
    expect(result).not.toContain('OBS. COMPRADOR:');
    expect(result).not.toContain('OBS. FORNECEDOR:');
  });

  it('should handle provider without buyer observation', () => {
    const itemWithProviderOnly: RequisitionItem = {
      ...mockItem,
      buyerObservation: '',
      provider: 'Only Provider',
    };

    const result = formatRequisitionEmail('John', 'Base', [itemWithProviderOnly]);

    expect(result).toContain('OBS. COMPRADOR: Fornecedor indicado: Only Provider');
  });
});
