import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PlusCircle, Mail, AlertCircle, User, Copy, Check, Download, Calculator, RotateCcw } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  EMAIL_MAPPING,
} from './constants';
import { Input, Select } from './components/InputFields';
import { EngieLogo } from './components/Logo';
import RequisitionItemCard from './components/RequisitionItemCard';
import { formatRequisitionEmail } from './utils/emailTemplates';
import { formatBRL, toFileNameFragment } from './utils/format';
import { createInitialItem, requisitionTotal, SELECT_PLACEHOLDER } from './utils/items';
import { FormErrors, validateRequisition } from './utils/validation';
import { clearDraft, loadDraft, saveDraft } from './utils/draft';

// Outlook (and Windows, which hands the link to it) fails or truncates mailto: links
// longer than about 2000 characters.
const MAILTO_MAX_LENGTH = 2000;
const STATUS_MESSAGE_MS = 6000;
const DRAFT_SAVE_DELAY_MS = 400;

// Body used when the requisition is too long for the link: the full text goes to the clipboard.
const PASTE_INSTRUCTIONS =
  'A requisição completa foi copiada para a área de transferência.\n' +
  'Apague este texto e cole aqui com Ctrl+V (Cmd+V no Mac).\n';

const buildMailtoLink = (to: string, subject: string, body: string) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// Copies text to the clipboard, falling back to execCommand where the Clipboard API is
// unavailable (e.g. pages served over plain HTTP).
async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy method.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function App() {
  const [initialDraft] = useState(loadDraft);
  const [requester, setRequester] = useState(initialDraft?.requester ?? '');
  const [location, setLocation] = useState(initialDraft?.location ?? SELECT_PLACEHOLDER);
  const [items, setItems] = useState<RequisitionItem[]>(() => initialDraft?.items ?? [createInitialItem()]);

  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({ items: {} });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [focusErrorRequest, setFocusErrorRequest] = useState(0);
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();

  // Save a draft in this browser so a reload or a closed tab does not lose the form.
  useEffect(() => {
    const timer = setTimeout(() => saveDraft({ requester, location, items }), DRAFT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [requester, location, items]);

  useEffect(() => () => clearTimeout(statusTimer.current), []);

  // After a failed validation, move focus to the first invalid field.
  useEffect(() => {
    if (focusErrorRequest === 0) return;
    const field = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    field?.focus();
    field?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [focusErrorRequest]);

  const showStatus = useCallback((message: string) => {
    clearTimeout(statusTimer.current);
    setCopyStatus(message);
    statusTimer.current = setTimeout(() => setCopyStatus(null), STATUS_MESSAGE_MS);
  }, []);

  const clearMessages = () => {
    clearTimeout(statusTimer.current);
    setCopyStatus(null);
    setError(null);
  };

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
      const newItemsErrors: FormErrors['items'] = {};
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

  const handleClearForm = () => {
    if (!window.confirm('Apagar todos os dados preenchidos e começar uma nova requisição?')) return;
    clearDraft();
    setRequester('');
    setLocation(SELECT_PLACEHOLDER);
    setItems([createInitialItem()]);
    setFormErrors({ items: {} });
    clearMessages();
  };

  const validateForm = (): boolean => {
    const { errors, firstError } = validateRequisition(requester, location, items);
    setFormErrors(errors);
    setError(firstError);
    if (firstError) {
      setFocusErrorRequest((n) => n + 1);
      return false;
    }
    return true;
  };

  const totalEstimatedValue = useMemo(() => requisitionTotal(items), [items]);

  const handleOpenOutlook = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

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

    // 4. Abrir Outlook via mailto. If the full text does not fit in the link, copy it to the
    // clipboard and open the e-mail with recipient and subject filled in, ready to paste.
    let mailtoLink = buildMailtoLink(recipientEmail, subject, body);
    if (mailtoLink.length > MAILTO_MAX_LENGTH) {
      if (!(await copyText(body))) {
        setError(
          'A requisição é longa demais para abrir direto no Outlook e não foi possível copiá-la automaticamente. Use "Copiar Solicitação" ou "Baixar (.txt)" e cole o texto no corpo do e-mail.'
        );
        return;
      }
      mailtoLink = buildMailtoLink(recipientEmail, subject, PASTE_INSTRUCTIONS);
      showStatus(
        'A requisição é longa demais para ir pelo link, então o texto completo foi copiado. No e-mail que abriu, apague o texto e cole com Ctrl+V.'
      );
    }

    window.location.href = mailtoLink;
  };

  const handleCopyClipboard = async () => {
    clearMessages();
    if (!validateForm()) return;
    const body = formatRequisitionEmail(requester, location, items);
    if (await copyText(body)) {
      showStatus('Solicitação copiada com sucesso para a área de transferência!');
    } else {
      setError('Não foi possível copiar automaticamente para a área de transferência. Use "Baixar (.txt)".');
    }
  };

  const handleDownloadTxt = () => {
    clearMessages();
    if (!validateForm()) return;
    const body = formatRequisitionEmail(requester, location, items);
    const fileName = toFileNameFragment(requester) || 'solicitante';
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Requisicao_${fileName}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking right away can cancel the download in Safari and Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
          <p className="mt-1 text-sm text-gray-500">
            O preenchimento fica salvo neste navegador até você limpar o formulário.
          </p>
        </header>

        <form onSubmit={handleOpenOutlook} className="space-y-8">
          
          {/* Section 1: Identification */}
          <div className="bg-white shadow-xs rounded-xl border border-gray-200 overflow-hidden">
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
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              <PlusCircle className="mr-2 h-5 w-5 text-sky-500" /> Adicionar Outro Item
            </button>
          </div>

          {/* Requisition Summary Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
                {formatBRL(totalEstimatedValue)}
              </p>
            </div>
          </div>

          {copyStatus && (
            <div role="status" className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <Check className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm font-medium">{copyStatus}</p>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="shrink-0">
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
              onClick={handleClearForm}
              className="w-full sm:w-auto sm:mr-auto inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              title="Apagar todos os dados e começar uma nova requisição"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar formulário
            </button>
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              title="Copiar texto formatado da requisição para a área de transferência"
            >
              <Copy className="mr-2 h-4 w-4 text-gray-500" />
              Copiar Solicitação
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              title="Baixar a solicitação como arquivo de texto"
            >
              <Download className="mr-2 h-4 w-4 text-gray-500" />
              Baixar (.txt)
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all transform hover:-translate-y-0.5"
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
