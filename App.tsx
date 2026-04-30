
import React, { useState, useMemo, useCallback } from 'react';
import { PlusCircle, Mail, AlertCircle, User } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  EMAIL_MAPPING,
} from './constants';
import { Input, Select } from './components/InputFields';
import { EngieLogo } from './components/Logo';
import RequisitionItemCard from './components/RequisitionItemCard';

const initialItem: RequisitionItem = {
  id: '1',
  itemCode: '',
  description: '',
  quantity: 1,
  price: 0,
  usageLocation: '',
  originType: 'Selecione',
  agreementType: 'Selecione',
  agreement: '',
  provider: '',
  osNumber: '',
  destinationType: 'Selecione',
  subInventory: 'Selecione',
  usageIntent: 'Selecione',
  objective: 'Selecione',
  justification: '',
  buyerObservation: '',
  providerObservation: '',
};

export default function App() {
  const [requester, setRequester] = useState('');
  const [location, setLocation] = useState('Selecione');
  const [items, setItems] = useState<RequisitionItem[]>([{ ...initialItem }]);
  
  const [error, setError] = useState<string | null>(null);

  // Helper to update specific item fields
  const updateItem = useCallback((index: number, field: keyof RequisitionItem, value: any) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      { ...initialItem, id: crypto.randomUUID() },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prevItems) => {
      if (prevItems.length === 1) return prevItems;
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

  const validateForm = (): boolean => {
    if (!requester.trim()) { setError('Solicitante é obrigatório.'); return false; }
    if (location === 'Selecione') { setError('Local para Entrega é obrigatório.'); return false; }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const prefix = items.length > 1 ? `Item ${i + 1}: ` : '';
      
      const rules = [
        { condition: !item.description.trim(), msg: 'Descrição é obrigatória.' },
        { condition: isNaN(item.quantity) || item.quantity <= 0, msg: 'Quantidade deve ser maior que 0.' },
        { condition: isNaN(item.price) || item.price <= 0, msg: 'Preço é obrigatório.' },
        { condition: item.originType === 'Selecione', msg: 'Tipo de Origem é obrigatório.' },
        { condition: item.agreementType === 'Selecione', msg: 'Tipo de Acordo é obrigatório.' },
        { condition: item.destinationType === 'Selecione', msg: 'Tipo de Destino é obrigatório.' },
        { condition: item.usageIntent === 'Selecione', msg: 'Uso Pretendido é obrigatório.' },
        { condition: item.objective === 'Selecione', msg: 'Objetivo da RC é obrigatório.' },
        { condition: !item.justification.trim(), msg: 'Justificativa é obrigatória.' }
      ];

      for (const rule of rules) {
        if (rule.condition) {
          setError(`${prefix}${rule.msg}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleOpenOutlook = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    // 1. Identificar Destinatário
    const recipientEmail = EMAIL_MAPPING[location] || '';
    if (!recipientEmail) {
      setError('E-mail não encontrado para a base selecionada.');
      return;
    }

    // 2. Montar Assunto
    const subject = `Solicitação de Requisição de Compra – ${requester} – ${location}`;

    // 3. Montar Corpo do E-mail (Texto Puro Formatado)
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
      
      bodyParts.push(`QUANTIDADE: ${item.quantity}\n`);
      bodyParts.push(`PREÇO EST.: R$ ${item.price.toFixed(2)}\n`);
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
      if (item.subInventory) bodyParts.push(`SUBINVENTÁRIO: ${item.subInventory}\n`);

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

    bodyParts.push(`Email gerado automaticamente pelo Sistema ESOM.\n`);
    const body = bodyParts.join('');

    // 4. Abrir Outlook via mailto
    // Encode components to ensure special characters work in URL
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Security Fix: Prevent silent DoS / data truncation in mail clients due to URL length limits
    if (mailtoLink.length > 2000) {
      setError('O tamanho da solicitação excede o limite do cliente de e-mail. Por favor, reduza a quantidade de itens ou o tamanho das descrições.');
      return;
    }

    window.location.href = mailtoLink;
  };

  // ⚡ Bolt Optimization: Memoize the rendered items list
  // Prevents O(N) array mapping and shallow prop comparisons when the user
  // types in the global form fields (Solicitante/Local).
  // Expected Impact: Render time for global field keystrokes drops from O(N) to O(1).
  const renderedItems = useMemo(() => {
    const canRemove = items.length > 1;
    return items.map((item, index) => (
      <RequisitionItemCard
        key={item.id}
        item={item}
        index={index}
        canRemove={canRemove}
        updateItem={updateItem}
        removeItem={removeItem}
      />
    ));
  }, [items, updateItem, removeItem]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center">
          <EngieLogo className="h-20 mb-6 w-auto" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Requisição de Compra <span className="text-sky-500">ESOM</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl">
            Preencha os dados abaixo e clique para abrir sua solicitação diretamente no Outlook.
          </p>
        </header>

        <form onSubmit={handleOpenOutlook} className="space-y-8">
          
          {/* Section 1: Identification */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-full">
                    <User className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Identificação</h3>
                  <p className="text-sm text-gray-500">Dados do solicitante e local de entrega</p>
                </div>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Solicitante" 
                  value={requester} 
                  onChange={(e) => setRequester(e.target.value)} 
                  placeholder="Nome Completo" 
                  required 
                />
                <Select 
                  label="Local para Entrega" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  options={LOCATIONS} 
                  required 
                />
             </div>
          </div>

          {/* Items Loop */}
          {renderedItems}
            
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              <PlusCircle className="mr-2 h-5 w-5 text-sky-500" /> Adicionar Outro Item
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Atenção</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 pb-12">
            <button
              type="submit"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all transform hover:-translate-y-0.5"
            >
              <Mail className="-ml-1 mr-2 h-5 w-5" />
              Abrir no Outlook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
