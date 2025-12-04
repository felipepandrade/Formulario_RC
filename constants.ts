export const LOCATIONS = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'ESOM_F_CATU_OI', value: 'ESOM_F_CATU_OI' },
  { label: 'ESOM_F_CAMACARI_OI', value: 'ESOM_F_CAMACARI_OI' },
  { label: 'ESOM_F_ITABUNA_OI', value: 'ESOM_F_ITABUNA_OI' },
  { label: 'ESOM_F_PILAR_OI', value: 'ESOM_F_PILAR_OI' },
  { label: 'ESOM_F_ATALAIA_OI', value: 'ESOM_F_ATALAIA_OI' },
];

export const ORIGIN_TYPES = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'Fornecedor', value: 'Fornecedor' },
  { label: 'Estoque', value: 'Estoque' },
];

export const AGREEMENT_TYPES = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'Acordo de compra contratual', value: 'Acordo de compra contratual' },
  { label: 'Acordo de compra em aberto', value: 'Acordo de compra em aberto' },
];

export const DESTINATION_TYPES = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'Estoque', value: 'Estoque' },
  { label: 'Despesa', value: 'Despesa' },
];

export const SUB_INVENTORIES = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'Insumo', value: 'Insumo' },
  { label: 'Consumo', value: 'Consumo' },
  { label: 'EPI', value: 'EPI' },
  { label: 'Reparo', value: 'Reparo' },
  { label: 'Stage', value: 'Stage' },
  { label: 'Sucata', value: 'Sucata' },
  { label: 'TAG', value: 'TAG' },
];

export const USAGE_INTENTS = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'SOLUC_ATIVO IMOBILIZADO', value: 'SOLUC_ATIVO IMOBILIZADO' },
  { label: 'SOLUC_USO E CONSUMO', value: 'SOLUC_USO E CONSUMO' },
  { label: 'SOLUC_SERVICO', value: 'SOLUC_SERVICO' },
  { label: 'SOLUC_INSUMO PRESTCAO DE SERVICO', value: 'SOLUC_INSUMO PRESTCAO DE SERVICO' },
];

export const RC_OBJECTIVES = [
  { label: 'Selecione', value: 'Selecione' },
  { label: 'ATIVO IMOBILIZADO', value: 'ATIVO IMOBILIZADO' },
  { label: 'FERRAMENTAS', value: 'FERRAMENTAS' },
  { label: 'MANUTENÇÃO DE EQUIPAMENTOS', value: 'MANUTENÇÃO DE EQUIPAMENTOS' },
  { label: 'MATERIAL CONSUMO', value: 'MATERIAL CONSUMO' },
  { label: 'PRESTAÇÃO DE SERVIÇO', value: 'PRESTAÇÃO DE SERVIÇO' },
  { label: 'SPARE PARTS ESTOQUE', value: 'SPARE PARTS ESTOQUE' },
  { label: 'SPARE PARTS INSUMO', value: 'SPARE PARTS INSUMO' },
];

// Backend Mapping for reference (implemented in server logic)
export const EMAIL_MAPPING: Record<string, string> = {
  'ESOM_F_CATU_OI': 'tatiana.ribeiro@engie.com',
  'ESOM_F_CAMACARI_OI': 'luciana.buente@engie.com',
  'ESOM_F_ITABUNA_OI': 'alane.reis@engie.com',
  'ESOM_F_PILAR_OI': 'camila.monteiro@engie.com',
  'ESOM_F_ATALAIA_OI': 'ivone.andrade@engie.com',
};