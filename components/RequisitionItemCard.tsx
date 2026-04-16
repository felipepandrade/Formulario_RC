import React from 'react';
import { Trash2, Package, FileText } from 'lucide-react';
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

interface RequisitionItemCardProps {
  item: RequisitionItem;
  index: number;
  canRemove: boolean;
  updateItem: (index: number, field: keyof RequisitionItem, value: any) => void;
  removeItem: (index: number) => void;
}

// ⚡ Bolt Optimization: Extracted item to a separate component and wrapped in React.memo()
// This prevents expensive O(N) re-renders of the entire item list when typing in a single input field.
// Expected Impact: Eliminates typing lag on large lists. Editing one item now takes O(1) render time instead of O(N).

// ⚡ Bolt Optimization: Replaced totalItems: number with canRemove: boolean
// This prevents invalidating React.memo cache for all existing items when a new item is added.
// Because canRemove is typically true for all items, adding an Nth item doesn't change the props of items 1 to N-1.
// Expected Impact: Adding/removing items becomes an O(1) operation for existing items rather than triggering O(N) re-renders.
const RequisitionItemCard: React.FC<RequisitionItemCardProps> = ({
  item,
  index,
  canRemove,
  updateItem,
  removeItem,
}) => {
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Item Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white font-bold text-sm shadow-sm">
            {index + 1}
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Item da Requisição</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              {item.itemCode || 'Novo Item'}
            </p>
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
            title="Remover Item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Row 1: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <Input
              label="Código do Item"
              value={item.itemCode}
              onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
              placeholder="Opcional"
              maxLength={50}
            />
          </div>
          <div className="md:col-span-9">
            <TextArea
              label="Descrição Detalhada"
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="Descreva o material ou serviço com detalhes..."
              rows={2}
              maxLength={1000}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Input
            label="Quantidade"
            type="number"
            step="0.01"
            min={0.01}
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
            required
          />
          <Input
            label="Preço Unit. Estimado (R$)"
            type="number"
            step="0.01"
            min={0.01}
            value={item.price}
            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
            required
          />
          <Input
            label="Número da OS"
            value={item.osNumber || ''}
            onChange={(e) => updateItem(index, 'osNumber', e.target.value)}
            placeholder="Se houver"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Local de Utilização - Nome da Instalação/Gasoduto"
            value={item.usageLocation || ''}
            onChange={(e) => updateItem(index, 'usageLocation', e.target.value)}
            placeholder="Ex: Gasoduto X, Instalação Y..."
            maxLength={200}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Origin & Agreement */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-sky-600" />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Origem & Acordo</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Tipo de Origem"
              value={item.originType}
              onChange={(e) => updateItem(index, 'originType', e.target.value)}
              options={ORIGIN_TYPES}
              required
            />

            <div>
              <Select
                label="Tipo de Acordo"
                value={item.agreementType}
                onChange={(e) => updateItem(index, 'agreementType', e.target.value)}
                options={AGREEMENT_TYPES}
                required
              />
              {item.agreementType !== 'Selecione' && !item.agreement && (
                <p className="text-xs text-yellow-600 mt-[-10px] mb-2 font-medium">⚠ Recomendado preencher "Acordo"</p>
              )}
            </div>

            <Input
              label="Acordo"
              value={item.agreement || ''}
              onChange={(e) => updateItem(index, 'agreement', e.target.value)}
              placeholder="Ex: AC288ESOM"
              maxLength={100}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Fornecedor Sugerido"
              value={item.provider || ''}
              onChange={(e) => updateItem(index, 'provider', e.target.value)}
              placeholder="Nome do Fornecedor"
              maxLength={150}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Classification */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-sky-600" />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Classificação & Destino</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Select
              label="Objetivo da RC"
              value={item.objective}
              onChange={(e) => updateItem(index, 'objective', e.target.value)}
              options={RC_OBJECTIVES}
              required
            />
            <Select
              label="Uso Pretendido"
              value={item.usageIntent}
              onChange={(e) => updateItem(index, 'usageIntent', e.target.value)}
              options={USAGE_INTENTS}
              required
            />
            <Select
              label="Tipo de Destino"
              value={item.destinationType}
              onChange={(e) => updateItem(index, 'destinationType', e.target.value)}
              options={DESTINATION_TYPES}
              required
            />
            <Select
              label="Subinventário"
              value={item.subInventory}
              onChange={(e) => updateItem(index, 'subInventory', e.target.value)}
              options={SUB_INVENTORIES}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Justification & Observations */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Justificativa & Observações</h4>
            <TextArea
              label="Justificativa Técnica"
              value={item.justification}
              onChange={(e) => updateItem(index, 'justification', e.target.value)}
              placeholder="Explique a necessidade, aplicação e impacto..."
              rows={4}
              maxLength={1000}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea
                label="Obs. ao Comprador"
                value={item.buyerObservation}
                onChange={(e) => updateItem(index, 'buyerObservation', e.target.value)}
                placeholder="Instruções para compras..."
                rows={2}
                maxLength={500}
              />
              <TextArea
                label="Obs. ao Fornecedor"
                value={item.providerObservation}
                onChange={(e) => updateItem(index, 'providerObservation', e.target.value)}
                placeholder="Instruções para o fornecedor..."
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RequisitionItemCard);
