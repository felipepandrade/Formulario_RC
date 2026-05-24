import { RequisitionItem } from '../types';

/**
 * Generates the formatted email body for the purchase requisition.
 * This is a pure function that takes the requester's name, delivery location,
 * and the list of items to be requested.
 */
export const generateEmailBody = (
  requester: string,
  location: string,
  items: RequisitionItem[]
): string => {
  const bodyParts: string[] = [];

  // Header section
  bodyParts.push(`SOLICITAÇÃO DE REQUISIÇÃO DE COMPRA\n`);
  bodyParts.push(`--------------------------------------------------\n`);
  bodyParts.push(`SOLICITANTE: ${requester}\n`);
  bodyParts.push(`LOCAL DE ENTREGA: ${location}\n`);
  bodyParts.push(`--------------------------------------------------\n\n`);

  // Items section
  items.forEach((item, index) => {
    bodyParts.push(`================ ITEM #${index + 1} ================\n`);
    bodyParts.push(`CÓDIGO: ${item.itemCode || 'A DEFINIR'}\n`);
    bodyParts.push(`DESCRIÇÃO:\n${item.description}\n\n`);

    bodyParts.push(`QUANTIDADE: ${item.quantity}\n`);
    bodyParts.push(`PREÇO EST.: R$ ${item.price.toFixed(2)}\n`);
    bodyParts.push(`OS: ${item.osNumber || 'N/A'}\n`);

    if (item.usageLocation) {
      bodyParts.push(`LOCAL DE UTILIZAÇÃO: ${item.usageLocation}\n`);
    }

    bodyParts.push(`\n--- ORIGEM & ACORDO ---\n`);
    bodyParts.push(`ORIGEM: ${item.originType}\n`);
    bodyParts.push(`TIPO ACORDO: ${item.agreementType}\n`);

    if (item.agreement) {
      bodyParts.push(`ACORDO: ${item.agreement}\n`);
    }

    if (item.provider) {
      bodyParts.push(`FORNECEDOR: ${item.provider}\n`);
    }

    bodyParts.push(`\n--- CLASSIFICAÇÃO & DESTINO ---\n`);
    bodyParts.push(`OBJETIVO: ${item.objective}\n`);
    bodyParts.push(`USO PRETENDIDO: ${item.usageIntent}\n`);
    bodyParts.push(`TIPO DESTINO: ${item.destinationType}\n`);

    if (item.subInventory) {
      bodyParts.push(`SUBINVENTÁRIO: ${item.subInventory}\n`);
    }

    bodyParts.push(`\n--- JUSTIFICATIVA ---\n`);
    bodyParts.push(`${item.justification}\n`);

    // Observations section
    if (item.buyerObservation) {
      bodyParts.push(`\nOBS. COMPRADOR: ${item.buyerObservation}`);
      if (item.provider) {
        bodyParts.push(` (Fornecedor indicado: ${item.provider})`);
      }
      bodyParts.push(`\n`);
    } else if (item.provider) {
      bodyParts.push(`\nOBS. COMPRADOR: Fornecedor indicado: ${item.provider}\n`);
    }

    if (item.providerObservation) {
      bodyParts.push(`OBS. FORNECEDOR: ${item.providerObservation}\n`);
    }

    bodyParts.push(`\n\n`);
  });

  // Footer section
  bodyParts.push(`Email gerado automaticamente pelo Sistema ESOM.\n`);

  return bodyParts.join('');
};
