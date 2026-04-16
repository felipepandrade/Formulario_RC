
export interface RequisitionItem {
  id: string;
  itemCode: string; // "Item"
  description: string;
  quantity: number;
  price: number;
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
