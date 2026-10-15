import { RequisitionItem } from '../types';
import { formatBRL, formatQuantity, parseDecimal } from './format';
import { isUnselected, itemSubtotal, requisitionTotal } from './items';

/**
 * Formats the requisition data into a plain text email body.
 *
 * @param requester - The name of the person making the request.
 * @param location - The delivery location.
 * @param items - The list of items to include in the requisition.
 * @returns A formatted string representing the email body.
 */
export function formatRequisitionEmail(
  requester: string,
  location: string,
  items: RequisitionItem[]
): string {
  // Optimization: Using an array to collect string parts and joining them at the end.
  // This avoids multiple string allocations and copies in each iteration of the loop,
  // which can lead to better memory efficiency and performance as the number of items grows.
  const bodyParts: string[] = [];
  bodyParts.push(`SOLICITAÇÃO DE REQUISIÇÃO DE COMPRA\n`);
  bodyParts.push(`--------------------------------------------------\n`);
  bodyParts.push(`SOLICITANTE: ${requester}\n`);
  bodyParts.push(`LOCAL DE ENTREGA: ${location}\n`);
  bodyParts.push(`--------------------------------------------------\n\n`);

  items.forEach((item, index) => {
    bodyParts.push(`================ ITEM #${index + 1} ================\n`);
    bodyParts.push(`CÓDIGO: ${item.itemCode || 'A DEFINIR'}\n`);
    bodyParts.push(`DESCRIÇÃO:\n${item.description}\n\n`);

    bodyParts.push(`QUANTIDADE: ${formatQuantity(parseDecimal(item.quantity))}\n`);
    bodyParts.push(`PREÇO UNIT. EST.: ${formatBRL(parseDecimal(item.price))}\n`);
    bodyParts.push(`SUBTOTAL EST.: ${formatBRL(itemSubtotal(item))}\n`);
    bodyParts.push(`OS: ${item.osNumber || 'N/A'}\n`);
    if (item.usageLocation) bodyParts.push(`LOCAL DE UTILIZAÇÃO: ${item.usageLocation}\n`);

    bodyParts.push(`\n--- ORIGEM & ACORDO ---\n`);
    bodyParts.push(`ORIGEM: ${item.originType}\n`);
    bodyParts.push(`TIPO ACORDO: ${item.agreementType}\n`);
    if (item.agreement) bodyParts.push(`ACORDO: ${item.agreement}\n`);
    if (item.provider) bodyParts.push(`FORNECEDOR: ${item.provider}\n`);

    bodyParts.push(`\n--- CLASSIFICAÇÃO & DESTINO ---\n`);
    bodyParts.push(`OBJETIVO: ${item.objective}\n`);
    bodyParts.push(`USO PRETENDIDO: ${item.usageIntent}\n`);
    bodyParts.push(`TIPO DESTINO: ${item.destinationType}\n`);
    if (!isUnselected(item.subInventory)) bodyParts.push(`SUBINVENTÁRIO: ${item.subInventory}\n`);

    bodyParts.push(`\n--- JUSTIFICATIVA ---\n`);
    bodyParts.push(`${item.justification}\n`);

    if (item.buyerObservation) {
      bodyParts.push(`\nOBS. COMPRADOR: ${item.buyerObservation}`);
      if (item.provider) bodyParts.push(` (Fornecedor indicado: ${item.provider})`);
      bodyParts.push(`\n`);
    } else if (item.provider) {
       bodyParts.push(`\nOBS. COMPRADOR: Fornecedor indicado: ${item.provider}\n`);
    }

    if (item.providerObservation) {
      bodyParts.push(`OBS. FORNECEDOR: ${item.providerObservation}\n`);
    }

    bodyParts.push(`\n\n`);
  });

  bodyParts.push(`--------------------------------------------------\n`);
  bodyParts.push(`VALOR TOTAL ESTIMADO: ${formatBRL(requisitionTotal(items))}\n`);
  bodyParts.push(`--------------------------------------------------\n\n`);
  bodyParts.push(`Email gerado automaticamente pelo Sistema ESOM.\n`);

  return bodyParts.join('');
}
