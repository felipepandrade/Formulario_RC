
import React, { useState } from 'react';
import { PlusCircle, Trash2, Download, Loader2, AlertCircle, User, Package, FileText, CheckCircle } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  ORIGIN_TYPES,
  AGREEMENT_TYPES,
  DESTINATION_TYPES,
  SUB_INVENTORIES,
  USAGE_INTENTS,
  RC_OBJECTIVES,
} from './constants';
import { Input, Select, TextArea } from './components/InputFields';

const initialItem: RequisitionItem = {
  id: '1',
  itemCode: '',
  description: '',
  quantity: 1,
  price: 0,
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
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to update specific item fields
  const updateItem = (index: number, field: keyof RequisitionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { ...initialItem, id: Math.random().toString(36).substr(2, 9) },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const itemsPayload = items.map((item) => {
        let finalBuyerObs = item.buyerObservation;
        if (item.provider && item.provider.trim() !== '') {
          finalBuyerObs += `${finalBuyerObs ? '\n' : ''}Fornecedor indicado: ${item.provider}.`;
        }
        
        return {
          ...item,
          buyerObservation: finalBuyerObs,
        };
      });

      const payload = {
        requester,
        location,
        items: itemsPayload,
      };

      try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao gerar arquivo de requisição.');
        }

        // Get the response as a Blob (File)
        const blob = await response.blob();
        
        // Create a download link and click it programmatically
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `Requisicao_${requester.replace(/\s+/g, '_')}.eml`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSuccess(true);
        window.scrollTo(0, 0);

      } catch (networkError: any) {
         throw networkError;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-sky-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Arquivo Gerado!</h2>
          <p className="text-gray-600 mb-8">
             O arquivo <strong>.eml</strong> foi baixado no seu computador.
             <br/><br/>
             <span className="font-semibold text-sky-700">Abra-o no Outlook para revisar e enviar o e-mail.</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg hover:bg-sky-700 transition shadow-md font-medium"
          >
            Nova Requisição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Engie_logo.svg/800px-Engie_logo.svg.png" 
            alt="ENGIE Logo" 
            className="h-24 mb-6 object-contain"
          />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Requisição de Compra <span className="text-sky-500">ESOM</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl">
            Preencha os dados abaixo para gerar o arquivo de e-mail da solicitação.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
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
             <div key={item.id} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
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
                   {items.length > 1 && (
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
                        />
                      </div>
                      <div className="md:col-span-9">
                        <TextArea 
                            label="Descrição Detalhada" 
                            value={item.description} 
                            onChange={(e) => updateItem(index, 'description', e.target.value)} 
                            placeholder="Descreva o material ou serviço com detalhes..."
                            rows={2}
                            required 
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <Input 
                            label="Quantidade" 
                            type="number"
                            step="0.01"
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))} 
                            required 
                        />
                        <Input 
                            label="Preço Unit. Estimado (R$)" 
                            type="number"
                            step="0.01"
                            value={item.price} 
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))} 
                            required 
                        />
                         <Input 
                            label="Número da OS" 
                            value={item.osNumber || ''} 
                            onChange={(e) => updateItem(index, 'osNumber', e.target.value)} 
                            placeholder="Se houver"
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
                            />
                        </div>
                        <div className="mt-4">
                             <Input 
                                label="Fornecedor Sugerido" 
                                value={item.provider || ''} 
                                onChange={(e) => updateItem(index, 'provider', e.target.value)} 
                                placeholder="Nome do Fornecedor"
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
                                required 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextArea 
                                    label="Obs. ao Comprador" 
                                    value={item.buyerObservation} 
                                    onChange={(e) => updateItem(index, 'buyerObservation', e.target.value)} 
                                    placeholder="Instruções para compras..."
                                    rows={2}
                                />
                                <TextArea 
                                    label="Obs. ao Fornecedor" 
                                    value={item.providerObservation} 
                                    onChange={(e) => updateItem(index, 'providerObservation', e.target.value)} 
                                    placeholder="Instruções para o fornecedor..."
                                    rows={2}
                                />
                            </div>
                       </div>
                   </div>

                </div>
             </div>
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
              disabled={loading}
              className={`inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="-ml-1 mr-2 h-5 w-5" />
                  Gerar Requisição (Outlook)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
