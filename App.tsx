import React, { useState } from 'react';
import { PlusCircle, Trash2, Paperclip, Send, Loader2, AlertCircle } from 'lucide-react';
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
import { Input, Select, TextArea, Label } from './components/InputFields';

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
};

export default function App() {
  const [requester, setRequester] = useState('');
  const [location, setLocation] = useState('Selecione');
  const [justification, setJustification] = useState('');
  const [buyerObs, setBuyerObs] = useState('');
  const [providerObs, setProviderObs] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([{ ...initialItem }]);
  const [files, setFiles] = useState<FileList | null>(null);
  
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
    if (!justification.trim()) { setError('Justificativa é obrigatória.'); return false; }

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
      
      // Specific logic: Warn about Agreement code
      if (item.agreementType !== 'Selecione' && item.agreementType !== 'Acordo de compra em aberto' && !item.agreement?.trim()) {
        // Technically strict, but user asked for "Se acordo != selecione, sugerir preenchimento".
        // We will allow submission but maybe prompt? For now, enforcing if specific type selected is safer practice for "Senior" dev.
        // Let's keep it loose as "Warning" in UI, but strictly validation might be annoying.
        // Prompt says: "Se diferente de Selecione, exibir mensagem". We'll handle this in UI rendering.
      }
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
      const formData = new FormData();
      
      // Construct the JSON payload
      // Auto-append supplier to buyer observation
      const suppliers = items
        .filter(i => i.provider && i.provider.trim() !== '')
        .map(i => i.provider)
        .join(', ');
      
      let finalBuyerObs = buyerObs;
      if (suppliers) {
        finalBuyerObs += `\nFornecedor(es) indicado(s): ${suppliers}.`;
      }

      const payload = {
        requester,
        location,
        justification,
        buyerObservation: finalBuyerObs,
        providerObservation: providerObs,
        items,
      };

      formData.append('data', JSON.stringify(payload));

      if (files) {
        Array.from(files).forEach((file: any) => {
          formData.append('files', file);
        });
      }

      // NOTE: In a real environment, change this URL to your actual backend port
      const response = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao enviar requisição.');
      }

      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na comunicação com o servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sucesso!</h2>
          <p className="text-gray-600 mb-6">Sua requisição foi gerada e enviada por e-mail para a base selecionada.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Nova Requisição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Requisição de Compra ESOM</h1>
          <p className="mt-2 text-gray-600">Preencha os dados abaixo para gerar a solicitação e enviar por e-mail.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Header Info */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Identificação</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Dados do solicitante e local de entrega.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
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
          </div>

          {/* Section 2: Items */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 relative border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Item #{index + 1}
                  </h3>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-1">
                     <Input 
                      label="Item (Código)" 
                      value={item.itemCode} 
                      onChange={(e) => updateItem(index, 'itemCode', e.target.value)} 
                      placeholder="Opcional / A DEFINIR"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <TextArea 
                      label="Descrição do Item" 
                      value={item.description} 
                      onChange={(e) => updateItem(index, 'description', e.target.value)} 
                      placeholder="Ex: BATERIA PLC..."
                      rows={2}
                      required 
                    />
                  </div>

                  <Input 
                    label="Quantidade" 
                    type="number"
                    step="0.01"
                    value={item.quantity} 
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))} 
                    required 
                  />
                  
                  <Input 
                    label="Preço Estimado (Unit.)" 
                    type="number"
                    step="0.01"
                    value={item.price} 
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))} 
                    required 
                  />

                  <Input 
                    label="Número OS" 
                    value={item.osNumber || ''} 
                    onChange={(e) => updateItem(index, 'osNumber', e.target.value)} 
                    placeholder="Se houver"
                  />

                  <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Origem & Acordo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <p className="text-xs text-yellow-600 mt-[-10px] mb-2">Recomendado preencher o campo "Acordo".</p>
                         )}
                      </div>

                      <Input 
                        label="Acordo" 
                        value={item.agreement || ''} 
                        onChange={(e) => updateItem(index, 'agreement', e.target.value)} 
                        placeholder="Ex: AC288ESOM"
                      />

                      <div className="col-span-1 md:col-span-3">
                         <Input 
                          label="Fornecedor" 
                          value={item.provider || ''} 
                          onChange={(e) => updateItem(index, 'provider', e.target.value)} 
                          placeholder="Nome do Fornecedor"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Classificação & Destino</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                </div>
              </div>
            ))}
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Outro Item
              </button>
            </div>
          </div>

          {/* Section 3: Justification & Footer */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Justificativa e Anexos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Explique a necessidade da compra e anexe documentos relevantes (PDFs, Imagens).
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
                <TextArea 
                  label="Justificativa (Global)" 
                  value={justification} 
                  onChange={(e) => setJustification(e.target.value)} 
                  placeholder="Explique o que é, onde será usado, impacto de não comprar."
                  rows={4}
                  required 
                />
                
                <TextArea 
                  label="Observação ao Comprador" 
                  value={buyerObs} 
                  onChange={(e) => setBuyerObs(e.target.value)} 
                  placeholder="Ex: Duvidas, me contactar"
                />

                <TextArea 
                  label="Observação ao Fornecedor" 
                  value={providerObs} 
                  onChange={(e) => setProviderObs(e.target.value)} 
                  placeholder="Ex: Somente o modelo exato"
                />

                <div className="mb-4">
                  <Label>Anexos</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                    <div className="space-y-1 text-center">
                      <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload de arquivos</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            multiple 
                            onChange={(e) => setFiles(e.target.files)}
                            accept=".pdf,image/*,.txt,.doc,.docx"
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG até 10MB
                      </p>
                      {files && files.length > 0 && (
                        <div className="mt-2 text-left">
                          <p className="font-semibold text-sm">Arquivos selecionados:</p>
                          <ul className="text-xs text-gray-500 list-disc pl-4">
                            {Array.from(files).map((f: any, i) => (
                              <li key={i}>{f.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro no envio</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Processando...
                </>
              ) : (
                'Enviar Requisição'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}