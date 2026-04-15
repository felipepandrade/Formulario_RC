
import React, { useState } from 'react';
import { PlusCircle, Mail, AlertCircle, User } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  EMAIL_MAPPING,
} from './constants';
import { Input, Select } from './components/InputFields';
import { EngieLogo } from './components/Logo';
import RequisitionItemCard from './components/RequisitionItemCard';
import { useCallback } from 'react';

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
      { ...initialItem, id: Math.random().toString(36).substr(2, 9) },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prevItems) => {
      if (prevItems.length === 1) return prevItems;
      return prevItems.filter((_, i) => i !== index);
    });
  }, []);

  const validateForm = (): boolean => {
    if (!requester.trim()) { setError('Solicitante é obrigatório.'); return false; }
    if (location === 'Selecione') { setError('Local para Entrega é obrigatório.'); return false; }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const prefix = items.length > 1 ? `Item ${i + 1}: ` : '';
      
      if (!item.description.trim()) { setError(`${prefix}Descrição é obrigatória.`); return false; }
      if (item.quantity <= 0) { setError(`${prefix}Quantidade deve ser maior que 0.`); return false; }
      if (item.price <= 0) { setError(`${prefix}Preço é obrigatório.`); return false; }
      if (item.originType === 'Selecione') { setError(`${prefix}Tipo de Origem é obrigatório.`); return false; }
      if (item.agreementType === 'Selecione') { setError(`${prefix}Tipo de Acordo é obrigatório.`); return false; }
      if (item.destinationType === 'Selecione') { setError(`${prefix}Tipo de Destino é obrigatório.`); return false; }
      if (item.usageIntent === 'Selecione') { setError(`${prefix}Uso Pretendido é obrigatório.`); return false; }
      if (item.objective === 'Selecione') { setError(`${prefix}Objetivo da RC é obrigatório.`); return false; }
      if (!item.justification.trim()) { setError(`${prefix}Justificativa é obrigatória.`); return false; }
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
    let body = `SOLICITAÇÃO DE REQUISIÇÃO DE COMPRA\n`;
    body += `--------------------------------------------------\n`;
    body += `SOLICITANTE: ${requester}\n`;
    body += `LOCAL DE ENTREGA: ${location}\n`;
    body += `--------------------------------------------------\n\n`;

    items.forEach((item, index) => {
      body += `================ ITEM #${index + 1} ================\n`;
      body += `CÓDIGO: ${item.itemCode || 'A DEFINIR'}\n`;
      body += `DESCRIÇÃO:\n${item.description}\n\n`;
      
      body += `QUANTIDADE: ${item.quantity}\n`;
      body += `PREÇO EST.: R$ ${item.price.toFixed(2)}\n`;
      body += `OS: ${item.osNumber || 'N/A'}\n`;
      if (item.usageLocation) body += `LOCAL DE UTILIZAÇÃO: ${item.usageLocation}\n`;
      
      body += `\n--- ORIGEM & ACORDO ---\n`;
      body += `ORIGEM: ${item.originType}\n`;
      body += `TIPO ACORDO: ${item.agreementType}\n`;
      if (item.agreement) body += `ACORDO: ${item.agreement}\n`;
      if (item.provider) body += `FORNECEDOR: ${item.provider}\n`;

      body += `\n--- CLASSIFICAÇÃO & DESTINO ---\n`;
      body += `OBJETIVO: ${item.objective}\n`;
      body += `USO PRETENDIDO: ${item.usageIntent}\n`;
      body += `TIPO DESTINO: ${item.destinationType}\n`;
      if (item.subInventory) body += `SUBINVENTÁRIO: ${item.subInventory}\n`;

      body += `\n--- JUSTIFICATIVA ---\n`;
      body += `${item.justification}\n`;

      if (item.buyerObservation) {
        body += `\nOBS. COMPRADOR: ${item.buyerObservation}`;
        if (item.provider) body += ` (Fornecedor indicado: ${item.provider})`;
        body += `\n`;
      } else if (item.provider) {
         body += `\nOBS. COMPRADOR: Fornecedor indicado: ${item.provider}\n`;
      }

      if (item.providerObservation) {
        body += `OBS. FORNECEDOR: ${item.providerObservation}\n`;
      }
      
      body += `\n\n`;
    });

    body += `Email gerado automaticamente pelo Sistema ESOM.\n`;

    // 4. Abrir Outlook via mailto
    // Encode components to ensure special characters work in URL
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
  };

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
          {items.map((item, index) => (
             <RequisitionItemCard
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                updateItem={updateItem}
                removeItem={removeItem}
             />
          ))}
            
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
