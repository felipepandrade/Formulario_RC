import { describe, it, expect } from 'vitest';
import { errorSummary, validateRequisition } from './validation';
import { createInitialItem } from './items';
import { RequisitionItem } from '../types';

const validItem = (): RequisitionItem => ({
  ...createInitialItem(),
  description: 'Válvula',
  quantity: '2',
  price: '10,00',
  originType: 'Fornecedor',
  agreementType: 'Acordo de compra em aberto',
  destinationType: 'Despesa',
  usageIntent: 'SOLUC_USO E CONSUMO',
  objective: 'MATERIAL CONSUMO',
  justification: 'Necessário',
});

describe('validateRequisition', () => {
  it('accepts a complete form', () => {
    const { errors, firstError } = validateRequisition('Ana', 'ESOM_F_CATU_OI', [validItem()]);
    expect(firstError).toBeNull();
    expect(errors.items).toEqual({});
  });

  it('flags every missing required field', () => {
    const { errors, firstError } = validateRequisition(' ', 'Selecione', [{ ...createInitialItem(), quantity: '' }]);
    expect(firstError).toBe('Solicitante é obrigatório.');
    expect(errors.location).toBeDefined();
    expect(Object.keys(errors.items[0]).sort()).toEqual(
      ['agreementType', 'description', 'destinationType', 'justification', 'objective', 'originType', 'price', 'quantity', 'usageIntent'].sort()
    );
  });

  it('prefixes the first error with the item number when there are several items', () => {
    const { firstError } = validateRequisition('Ana', 'ESOM_F_CATU_OI', [validItem(), { ...validItem(), price: '0' }]);
    expect(firstError).toBe('Item 2: Preço deve ser maior que 0.');
  });

  it('requires the subinventory only when the destination is stock', () => {
    const toStock = { ...validItem(), destinationType: 'Estoque' };
    expect(validateRequisition('Ana', 'ESOM_F_CATU_OI', [toStock]).errors.items[0]).toEqual({
      subInventory: 'Subinventário é obrigatório quando o destino é Estoque.',
    });
    expect(validateRequisition('Ana', 'ESOM_F_CATU_OI', [{ ...toStock, subInventory: 'EPI' }]).firstError).toBeNull();
  });

  it('counts every invalid field', () => {
    const { errorCount } = validateRequisition(' ', 'Selecione', [{ ...createInitialItem(), quantity: '' }]);
    expect(errorCount).toBe(11);
  });
});

describe('errorSummary', () => {
  it('shows a single error as is and summarizes several', () => {
    expect(errorSummary(null, 0)).toBeNull();
    expect(errorSummary('Solicitante é obrigatório.', 1)).toBe('Solicitante é obrigatório.');
    expect(errorSummary('Solicitante é obrigatório.', 3)).toBe(
      '3 campos precisam ser corrigidos. Comece por: Solicitante é obrigatório.'
    );
  });
});
