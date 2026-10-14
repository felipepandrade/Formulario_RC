
import React, { useState, useMemo, useCallback } from 'react';
import { PlusCircle, Mail, AlertCircle, User, Copy, Check, Download, Calculator } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  EMAIL_MAPPING,
} from './constants';
import { Input, Select } from './components/InputFields';
import { EngieLogo } from './components/Logo';
import RequisitionItemCard from './components/RequisitionItemCard';
import { formatRequisitionEmail } from './utils/emailTemplates';

const createInitialItem = (): RequisitionItem => ({
  id: crypto.randomUUID(),
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
});

interface FormErrors {
  requester?: string;
  location?: string;
  items: Record<number, Partial<Record<keyof RequisitionItem, string>>>;
}

export default function App() {
  const [requester, setRequester] = useState('');
  const [location, setLocation] = useState('Selecione');
  const [items, setItems] = useState<RequisitionItem[]>(() => [createInitialItem()]);
  
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({ items: {} });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleRequesterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRequester(e.target.value);
    setFormErrors((prev) => (prev.requester ? { ...prev, requester: undefined } : prev));
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value);
    setFormErrors((prev) => (prev.location ? { ...prev, location: undefined } : prev));
  }, []);

  // Helper to update specific item fields
  const updateItem = useCallback(<K extends keyof RequisitionItem>(index: number, field: K, value: RequisitionItem[K]) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
    setFormErrors((prev) => {
      if (prev.items[index]?.[field]) {
        const itemErrors = { ...prev.items[index] };
        delete itemErrors[field];
        return {
          ...prev,
          items: {
            ...prev.items,
            [index]: itemErrors,
          },
        };
      }
      return prev;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      createInitialItem(),
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prevItems) => {
      if (prevItems.length === 1) return prevItems;
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
    setFormErrors((prev) => {
      const newItemsErrors: Record<number, Partial<Record<keyof RequisitionItem, string>>> = {};
      Object.entries(prev.items).forEach(([key, val]) => {
        const numKey = Number(key);
        if (numKey < index) {
          newItemsErrors[numKey] = val;
        } else if (numKey > index) {
          newItemsErrors[numKey - 1] = val;
        }
      });
      return { ...prev, items: newItemsErrors };
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { items: {} };
    let firstError: string | null = null;

    if (!requester.trim()) {
      newErrors.requester = 'Solicitante é obrigatório.';
      if (!firstError) firstError = newErrors.requester;
    }
    if (location === 'Selecione') {
      newErrors.location = 'Local para Entrega é obrigatório.';
      if (!firstError) firstError = newErrors.location;
    }

    const hasMultipleItems = items.length > 1;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemErrors: Partial<Record<keyof RequisitionItem, string>> = {};

      if (!item.description.trim()) {
        itemErrors.description = 'Descrição é obrigatória.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Descrição é obrigatória.`;
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        itemErrors.quantity = 'Quantidade deve ser maior que 0.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Quantidade deve ser maior que 0.`;
      }
      if (isNaN(item.price) || item.price <= 0) {
        itemErrors.price = 'Preço é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Preço é obrigatório.`;
      }
      if (item.originType === 'Selecione') {
        itemErrors.originType = 'Tipo de Origem é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Tipo de Origem é obrigatório.`;
      }
      if (item.agreementType === 'Selecione') {
        itemErrors.agreementType = 'Tipo de Acordo é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Tipo de Acordo é obrigatório.`;
      }
      if (item.destinationType === 'Selecione') {
        itemErrors.destinationType = 'Tipo de Destino é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Tipo de Destino é obrigatório.`;
      }
      if (item.usageIntent === 'Selecione') {
        itemErrors.usageIntent = 'Uso Pretendido é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Uso Pretendido é obrigatório.`;
      }
      if (item.objective === 'Selecione') {
        itemErrors.objective = 'Objetivo da RC é obrigatório.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Objetivo da RC é obrigatório.`;
      }
      if (!item.justification.trim()) {
        itemErrors.justification = 'Justificativa é obrigatória.';
        if (!firstError) firstError = `${hasMultipleItems ? `Item ${i + 1}: ` : ''}Justificativa é obrigatória.`;
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors.items[i] = itemErrors;
      }
    }

    setFormErrors(newErrors);
    if (firstError) {
      setError(firstError);
      return false;
    }
    setError(null);
    return true;
  };

  const totalEstimatedValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const prc = Number(item.price) || 0;
      return sum + (qty > 0 && prc > 0 ? qty * prc : 0);
    }, 0);
  }, [items]);

  const handleOpenOutlook = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCopyStatus(null);

    if (!validateForm()) return;

    // 1. Identificar Destinatário
    const recipientEmail = EMAIL_MAPPING[location] || '';
    if (!recipientEmail) {
      setError('E-mail não encontrado para a base selecionada.');
      return;
    }

    // 2. Montar Assunto com higienização de quebra de linha
    const sanitizedRequester = requester.replace(/[\r\n]+/g, ' ').trim();
    const sanitizedLocation = location.replace(/[\r\n]+/g, ' ').trim();
    const subject = `Solicitação de Requisição de Compra – ${sanitizedRequester} – ${sanitizedLocation}`;

    // 3. Montar Corpo do E-mail (Texto Puro Formatado)
    const body = formatRequisitionEmail(requester, location, items);

    // 4. Abrir Outlook via mailto
    // Encode components to ensure special characters work in URL
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Security / Usability Fix: Prevent silent DoS / data truncation in mail clients due to URL length limits
    // Note: Outlook and other clients typically fail when the mailto URI exceeds 2000 characters.
    if (mailtoLink.length > 2000) {
      setError(
        `O tamanho da solicitação (${mailtoLink.length} caracteres) excede o limite máximo para abertura direta pelo link do Outlook (2000 caracteres). Utilize o botão "Copiar Solicitação" abaixo para colar o texto completo no corpo do seu e-mail.`
      );
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(body).then(() => {
          setCopyStatus('O texto da requisição foi copiado para sua Área de Transferência. Cole no Outlook!');
        }).catch(() => {});
      }
      return;
    }

    window.location.href = mailtoLink;
  };

  const handleCopyClipboard = async () => {
    setError(null);
    if (!validateForm()) return;
    const body = formatRequisitionEmail(requester, location, items);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(body);
        setCopyStatus('Solicitação copiada com sucesso para a área de transferência!');
        setTimeout(() => setCopyStatus(null), 4000);
      } else {
        setError('Área de transferência não suportada neste ambiente.');
      }
    } catch {
      setError('Não foi possível copiar automaticamente para a área de transferência.');
    }
  };

  const handleDownloadTxt = () => {
    setError(null);
    if (!validateForm()) return;
    const body = formatRequisitionEmail(requester, location, items);
    const sanitizedRequester = requester.replace(/[^a-zA-Z0-9_-]/g, '_') || 'solicitante';
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Requisicao_${sanitizedRequester}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        errors={formErrors.items[index]}
        updateItem={updateItem}
        removeItem={removeItem}
      />
    ));
  }, [items, formErrors.items, updateItem, removeItem]);

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
                  onChange={handleRequesterChange}
                  error={formErrors.requester}
                  placeholder="Nome Completo" 
                  required 
                />
                <Select 
                  label="Local para Entrega" 
                  value={location} 
                  onChange={handleLocationChange}
                  error={formErrors.location}
                  options={LOCATIONS} 
                  required 
                />
             </div>
          </div>

          {/* Items Loop */}
          {renderedItems}
            
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              <PlusCircle className="mr-2 h-5 w-5 text-sky-500" /> Adicionar Outro Item
            </button>
          </div>

          {/* Requisition Summary Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Resumo da Requisição</p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">{items.length}</span> {items.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Valor Total Estimado</p>
              <p className="text-2xl font-extrabold text-sky-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEstimatedValue)}
              </p>
            </div>
          </div>

          {copyStatus && (
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-medium">{copyStatus}</p>
            </div>
          )}

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

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 pb-12">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              title="Copiar texto formatado da requisição para a área de transferência"
            >
              <Copy className="mr-2 h-4 w-4 text-gray-500" />
              Copiar Solicitação
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              title="Baixar a solicitação como arquivo de texto"
            >
              <Download className="mr-2 h-4 w-4 text-gray-500" />
              Baixar (.txt)
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all transform hover:-translate-y-0.5"
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
