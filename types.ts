export interface RequisitionItem {
  id: string;
  itemCode: string; // "Item"
  description: string;
  quantity: number;
  price: number;
  originType: string;
  agreementType: string;
  agreement?: string;
  provider?: string;
  osNumber?: string;
  destinationType: string;
  subInventory?: string; // Optional depending on context, but field exists
  usageIntent: string; // Uso Pretendido
  objective: string; // Objetivo da RC
}

export interface RequisitionForm {
  requester: string;
  location: string;
  justification: string;
  buyerObservation: string;
  providerObservation: string;
  items: RequisitionItem[];
  files: FileList | null;
}

// For API Payload structure (excluding files which go in FormData)
export interface RequisitionPayload {
  requester: string;
  location: string;
  justification: string;
  buyerObservation: string;
  providerObservation: string;
  items: RequisitionItem[];
}