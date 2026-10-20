import React from 'react';
import { Trash2, Package, FileText, MessageSquareText, Info, LucideIcon } from 'lucide-react';
import { RequisitionItem } from '../types';
import { Input, Select, TextArea } from './InputFields';
import {
  ORIGIN_TYPES,
  AGREEMENT_TYPES,
  DESTINATION_TYPES,
  SUB_INVENTORIES,
  USAGE_INTENTS,
  RC_OBJECTIVES,
} from '../constants';
import { formatBRL, sanitizeDecimalInput } from '../utils/format';
import { itemSubtotal, SELECT_PLACEHOLDER } from '../utils/items';
import { ItemErrors } from '../utils/validation';

interface RequisitionItemCardProps {
  item: RequisitionItem;
  index: number;
  canRemove: boolean;
  errors?: ItemErrors;
  updateItem: <K extends keyof RequisitionItem>(index: number, field: K, value: RequisitionItem[K]) => void;
  removeItem: (index: number) => void;
}

// ⚡ Bolt Optimization: Extracted item to a separate component and wrapped in React.memo()
// This prevents expensive O(N) re-renders of the entire item list when typing in a single input field.
// Expected Impact: Eliminates typing lag on large lists. Editing one item now takes O(1) render time instead of O(N).

// ⚡ Bolt Optimization: Replaced totalItems: number with canRemove: boolean
// This prevents invalidating React.memo cache for all existing items when a new item is added.
// Because canRemove is typically true for all items, adding an Nth item doesn't change the props of items 1 to N-1.
// Expected Impact: Adding/removing items becomes an O(1) operation for existing items rather than triggering O(N) re-renders.
const SectionTitle: React.FC<{ icon: LucideIcon; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-brand-800">
    <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
    {children}
  </h4>
);

const RequisitionItemCard: React.FC<RequisitionItemCardProps> = ({
  item,
  index,
  canRemove,
  errors,
  updateItem,
  removeItem,
}) => {
  // ⚡ Bolt Optimization: Memoize inline onChange handlers.
  // Because `Input`, `Select`, and `TextArea` are wrapped in `React.memo`, passing
  // inline anonymous functions like `(e) => updateItem(...)` causes them to re-render
  // on every keystroke, defeating the purpose of `React.memo` entirely.
  // By memoizing the handlers based on `index` and `updateItem`, we stabilize their
  // references and allow the child form fields to properly skip rendering.
  // Expected Impact: Significant reduction in child component render counts during typing.
  const handlers = React.useMemo(() => ({
    onItemCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'itemCode', e.target.value),
    onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateItem(index, 'description', e.target.value),
    // Keep the text as typed (so the field can be cleared and accepts "1.500,50");
    // it is only converted to a number for the subtotal, validation and e-mail.
    onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      updateItem(index, 'quantity', sanitizeDecimalInput(e.target.value)),
    onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      updateItem(index, 'price', sanitizeDecimalInput(e.target.value)),
    onOsNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'osNumber', e.target.value),
    onUsageLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'usageLocation', e.target.value),
    onOriginTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'originType', e.target.value),
    onAgreementTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'agreementType', e.target.value),
    onAgreementChange: (e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'agreement', e.target.value),
    onProviderChange: (e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'provider', e.target.value),
    onObjectiveChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'objective', e.target.value),
    onUsageIntentChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'usageIntent', e.target.value),
    onDestinationTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'destinationType', e.target.value),
    onSubInventoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, 'subInventory', e.target.value),
    onJustificationChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateItem(index, 'justification', e.target.value),
    onBuyerObservationChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateItem(index, 'buyerObservation', e.target.value),
    onProviderObservationChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateItem(index, 'providerObservation', e.target.value),
  }), [index, updateItem]);

  const subtotal = itemSubtotal(item);

  const agreementHint =
    item.agreementType !== SELECT_PLACEHOLDER && !item.agreement ? (
      <span className="inline-flex items-start gap-1.5 text-orange-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Recomendado preencher o campo "Acordo".
      </span>
    ) : undefined;

  return (
    <section
      aria-labelledby={`item-${item.id}-title`}
      data-item-card
      className="bg-white rounded-xl border border-gray-200 shadow-xs scroll-mt-6"
    >
      {/* Item Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 id={`item-${item.id}-title`} className="text-lg font-bold text-gray-900">
              <span className="sr-only">{`${index + 1}º `}</span>Item da Requisição
            </h3>
            <p className="truncate text-sm text-gray-600">{item.itemCode || 'Novo item'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-gray-600">Subtotal</p>
            <p className="font-bold text-gray-900 tabular-nums">{formatBRL(subtotal)}</p>
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-red-200"
              title="Remover Item"
              aria-label={`Remover Item ${index + 1}`}
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100 px-5 sm:px-6">
        {/* What is being requested */}
        <div className="space-y-5 py-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-12">
            <div className="md:col-span-3">
              <Input
                label="Código do Item"
                value={item.itemCode}
                onChange={handlers.onItemCodeChange}
                placeholder="Opcional"
              />
            </div>
            <div className="md:col-span-9">
              <TextArea
                label="Descrição Detalhada"
                value={item.description}
                onChange={handlers.onDescriptionChange}
                error={errors?.description}
                placeholder="Descreva o material ou serviço com detalhes..."
                rows={2}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Quantidade"
              inputMode="decimal"
              autoComplete="off"
              value={item.quantity}
              onChange={handlers.onQuantityChange}
              error={errors?.quantity}
              required
            />
            <Input
              label="Preço Unit. Estimado (R$)"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={item.price}
              onChange={handlers.onPriceChange}
              error={errors?.price}
              required
            />
            <div>
              <span className="mb-1.5 block text-sm font-bold text-gray-800">Subtotal Estimado</span>
              <div className="flex h-11 w-full items-center rounded-lg bg-brand-50 px-3 font-bold text-brand-800 tabular-nums">
                {formatBRL(subtotal)}
              </div>
            </div>
            <Input
              label="Número da OS"
              value={item.osNumber || ''}
              onChange={handlers.onOsNumberChange}
              placeholder="Se houver"
            />
          </div>

          <Input
            label="Local de Utilização - Nome da Instalação/Gasoduto"
            value={item.usageLocation || ''}
            onChange={handlers.onUsageLocationChange}
            placeholder="Ex: Gasoduto X, Instalação Y..."
          />
        </div>

        {/* Origin & Agreement */}
        <div className="py-6">
          <SectionTitle icon={Package}>Origem e acordo</SectionTitle>
          <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-3">
            <Select
              label="Tipo de Origem"
              value={item.originType}
              onChange={handlers.onOriginTypeChange}
              options={ORIGIN_TYPES}
              error={errors?.originType}
              required
            />
            <Select
              label="Tipo de Acordo"
              value={item.agreementType}
              onChange={handlers.onAgreementTypeChange}
              options={AGREEMENT_TYPES}
              error={errors?.agreementType}
              hint={agreementHint}
              required
            />
            <Input
              label="Acordo"
              value={item.agreement || ''}
              onChange={handlers.onAgreementChange}
              placeholder="Ex: AC288ESOM"
            />
            <div className="md:col-span-3">
              <Input
                label="Fornecedor Sugerido"
                value={item.provider || ''}
                onChange={handlers.onProviderChange}
                placeholder="Nome do Fornecedor"
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="py-6">
          <SectionTitle icon={FileText}>Classificação e destino</SectionTitle>
          <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Objetivo da RC"
              value={item.objective}
              onChange={handlers.onObjectiveChange}
              options={RC_OBJECTIVES}
              error={errors?.objective}
              required
            />
            <Select
              label="Uso Pretendido"
              value={item.usageIntent}
              onChange={handlers.onUsageIntentChange}
              options={USAGE_INTENTS}
              error={errors?.usageIntent}
              required
            />
            <Select
              label="Tipo de Destino"
              value={item.destinationType}
              onChange={handlers.onDestinationTypeChange}
              options={DESTINATION_TYPES}
              error={errors?.destinationType}
              required
            />
            <Select
              label="Subinventário"
              value={item.subInventory}
              onChange={handlers.onSubInventoryChange}
              options={SUB_INVENTORIES}
            />
          </div>
        </div>

        {/* Justification & Observations */}
        <div className="py-6">
          <SectionTitle icon={MessageSquareText}>Justificativa e observações</SectionTitle>
          <div className="space-y-5">
            <TextArea
              label="Justificativa Técnica"
              value={item.justification}
              onChange={handlers.onJustificationChange}
              error={errors?.justification}
              placeholder="Explique a necessidade, aplicação e impacto..."
              rows={4}
              required
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <TextArea
                label="Obs. ao Comprador"
                value={item.buyerObservation}
                onChange={handlers.onBuyerObservationChange}
                placeholder="Instruções para compras..."
                rows={2}
              />
              <TextArea
                label="Obs. ao Fornecedor"
                value={item.providerObservation}
                onChange={handlers.onProviderObservationChange}
                placeholder="Instruções para o fornecedor..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(RequisitionItemCard);
