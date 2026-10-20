
export interface RequisitionItem {
  id: string;
  itemCode: string; // "Item"
  description: string;
  quantity: string; // raw text typed by the user, parsed with parseDecimal
  price: string; // raw text typed by the user, parsed with parseDecimal
  usageLocation: string; // Local de Utilização - Nome da Instalação/Gasoduto
  originType: string;
  agreementType: string;
  agreement?: string;
  provider?: string;
  osNumber?: string;
  destinationType: string;
  subInventory?: string; // Optional depending on context
  usageIntent: string; // Uso Pretendido
  objective: string; // Objetivo da RC
  
  // Moved from global to per-item
  justification: string;
  buyerObservation: string;
  providerObservation: string;
}
