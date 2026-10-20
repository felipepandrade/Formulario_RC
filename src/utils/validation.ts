import { RequisitionItem } from '../types';
import { parseDecimal } from './format';
import { isUnselected } from './items';

export type ItemErrors = Partial<Record<keyof RequisitionItem, string>>;

export interface FormErrors {
  requester?: string;
  location?: string;
  items: Record<number, ItemErrors>;
}

interface ItemRule {
  field: keyof RequisitionItem;
  message: string;
  isInvalid: (item: RequisitionItem) => boolean;
}

const isBlank = (value?: string) => !value || !value.trim();
const isNotPositive = (value: string) => !(parseDecimal(value) > 0);

/** Items sent to stock must say which subinventory they go to. */
export const isSubInventoryRequired = (item: Pick<RequisitionItem, 'destinationType'>): boolean =>
  item.destinationType === 'Estoque';

// Required fields of each item, in the order they appear on screen.
const ITEM_RULES: ItemRule[] = [
  { field: 'description', message: 'Descrição é obrigatória.', isInvalid: (i) => isBlank(i.description) },
  { field: 'quantity', message: 'Quantidade deve ser maior que 0.', isInvalid: (i) => isNotPositive(i.quantity) },
  { field: 'price', message: 'Preço deve ser maior que 0.', isInvalid: (i) => isNotPositive(i.price) },
  { field: 'originType', message: 'Tipo de Origem é obrigatório.', isInvalid: (i) => isUnselected(i.originType) },
  { field: 'agreementType', message: 'Tipo de Acordo é obrigatório.', isInvalid: (i) => isUnselected(i.agreementType) },
  { field: 'objective', message: 'Objetivo da RC é obrigatório.', isInvalid: (i) => isUnselected(i.objective) },
  { field: 'usageIntent', message: 'Uso Pretendido é obrigatório.', isInvalid: (i) => isUnselected(i.usageIntent) },
  { field: 'destinationType', message: 'Tipo de Destino é obrigatório.', isInvalid: (i) => isUnselected(i.destinationType) },
  {
    field: 'subInventory',
    message: 'Subinventário é obrigatório quando o destino é Estoque.',
    isInvalid: (i) => isSubInventoryRequired(i) && isUnselected(i.subInventory),
  },
  { field: 'justification', message: 'Justificativa é obrigatória.', isInvalid: (i) => isBlank(i.justification) },
];

/**
 * Validates the whole form. Returns the errors per field, the first error message (prefixed
 * with the item number when there is more than one item) and how many fields are invalid.
 */
export function validateRequisition(
  requester: string,
  location: string,
  items: RequisitionItem[]
): { errors: FormErrors; firstError: string | null; errorCount: number } {
  const errors: FormErrors = { items: {} };
  const messages: string[] = [];

  if (isBlank(requester)) {
    errors.requester = 'Solicitante é obrigatório.';
    messages.push(errors.requester);
  }
  if (isUnselected(location)) {
    errors.location = 'Local para Entrega é obrigatório.';
    messages.push(errors.location);
  }

  const prefixWithItem = items.length > 1;
  items.forEach((item, index) => {
    const itemErrors: ItemErrors = {};
    for (const rule of ITEM_RULES) {
      if (rule.isInvalid(item)) {
        itemErrors[rule.field] = rule.message;
        messages.push(prefixWithItem ? `Item ${index + 1}: ${rule.message}` : rule.message);
      }
    }
    if (Object.keys(itemErrors).length > 0) errors.items[index] = itemErrors;
  });

  return { errors, firstError: messages[0] ?? null, errorCount: messages.length };
}

/** Short message for the warning box: the only error, or how many there are and where to start. */
export function errorSummary(firstError: string | null, errorCount: number): string | null {
  if (!firstError) return null;
  if (errorCount <= 1) return firstError;
  return `${errorCount} campos precisam ser corrigidos. Comece por: ${firstError}`;
}
