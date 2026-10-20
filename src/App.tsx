import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PlusCircle, Mail, AlertCircle, User, Copy, Check, Download, RotateCcw, Save, Info } from 'lucide-react';
import { RequisitionItem } from './types';
import {
  LOCATIONS,
  EMAIL_MAPPING,
} from './constants';
import { Input, Select } from './components/InputFields';
import { EngieLogo } from './components/Logo';
import RequisitionItemCard from './components/RequisitionItemCard';
import { formatRequisitionEmail } from './utils/emailTemplates';
import { formatBRL, formatShortDateTime, toFileNameFragment } from './utils/format';
import { createInitialItem, generateId, requisitionTotal, SELECT_PLACEHOLDER } from './utils/items';
import { errorSummary, FormErrors, validateRequisition } from './utils/validation';
import { clearDraft, isDraftEmpty, loadDraft, saveDraft } from './utils/draft';

// Outlook (and Windows, which hands the link to it) fails or truncates mailto: links
// longer than about 2000 characters.
const MAILTO_MAX_LENGTH = 2000;
const STATUS_MESSAGE_MS = 6000;
const UNDO_MESSAGE_MS = 10000;
const DRAFT_SAVE_DELAY_MS = 400;

// Body used when the requisition is too long for the link: the full text goes to the clipboard.
const PASTE_INSTRUCTIONS =
  'A requisição completa foi copiada para a área de transferência.\n' +
  'Apague este texto e cole aqui com Ctrl+V (Cmd+V no Mac).\n';

const scrollBehavior = (): ScrollBehavior =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

interface StatusMessage {
  text: string;
  action?: { label: string; onClick: () => void };
}

// Where to put the keyboard focus after the list of items changes.
interface FocusTarget {
  itemId: string;
  /** 'field' puts the cursor in the item's first field; 'heading' only moves focus to the item. */
  mode: 'field' | 'heading';
}

// Shifts per-item errors when an item is removed (delta -1) or put back (delta +1) at `index`.
function shiftItemErrors(items: FormErrors['items'], index: number, delta: 1 | -1): FormErrors['items'] {
  const shifted: FormErrors['items'] = {};
  Object.entries(items).forEach(([key, value]) => {
    const i = Number(key);
    if (i < index) shifted[i] = value;
    else if (delta === 1) shifted[i + 1] = value;
    else if (i > index) shifted[i - 1] = value;
  });
  return shifted;
}

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
  const [sentAt, setSentAt] = useState(initialDraft?.sentAt);
  const [restoredAt, setRestoredAt] = useState(() =>
    initialDraft && !isDraftEmpty(initialDraft) ? initialDraft.savedAt : undefined
  );

  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({ items: {} });
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [focusErrorRequest, setFocusErrorRequest] = useState(0);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Save a draft in this browser so a reload or a closed tab does not lose the form.
  useEffect(() => {
    const timer = setTimeout(() => saveDraft({ requester, location, items, sentAt }), DRAFT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [requester, location, items, sentAt]);

  useEffect(() => () => clearTimeout(statusTimer.current), []);

  // After a failed validation, move focus to the first invalid field.
  useEffect(() => {
    if (focusErrorRequest === 0) return;
    const field = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    field?.focus();
    field?.scrollIntoView?.({ block: 'center', behavior: scrollBehavior() });
  }, [focusErrorRequest]);

  // After adding, duplicating, removing or restoring an item, move focus to the right card so
  // keyboard and screen reader users are not sent back to the top of the page.
  useEffect(() => {
    if (!focusTarget) return;
    const card = document.querySelector<HTMLElement>(`[data-item-card="${focusTarget.itemId}"]`);
    if (!card) return;
    card.scrollIntoView?.({ block: 'start', behavior: scrollBehavior() });
    const target =
      focusTarget.mode === 'field'
        ? card.querySelector<HTMLElement>('input, textarea, select')
        : card.querySelector<HTMLElement>('h3');
    target?.focus({ preventScroll: true });
  }, [focusTarget]);

  // Shows a message in the action bar. Pass `durationMs: null` to keep it until the next action.
  const showStatus = useCallback((message: StatusMessage, durationMs: number | null = STATUS_MESSAGE_MS) => {
    clearTimeout(statusTimer.current);
    setStatus(message);
    if (durationMs !== null) statusTimer.current = setTimeout(() => setStatus(null), durationMs);
  }, []);

  const clearMessages = useCallback(() => {
    clearTimeout(statusTimer.current);
    setStatus(null);
    setError(null);
  }, []);

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
    const item = createInitialItem();
    setItems((prevItems) => [...prevItems, item]);
    setFocusTarget({ itemId: item.id, mode: 'field' });
  }, []);

  const duplicateItem = useCallback((index: number) => {
    const source = itemsRef.current[index];
    if (!source) return;
    const copy = { ...source, id: generateId() };
    setItems((prevItems) => [...prevItems.slice(0, index + 1), copy, ...prevItems.slice(index + 1)]);
    setFormErrors((prev) => ({ ...prev, items: shiftItemErrors(prev.items, index + 1, 1) }));
    setFocusTarget({ itemId: copy.id, mode: 'field' });
    showStatus({ text: `Item ${index + 1} duplicado. Revise os dados do novo item ${index + 2}.` });
  }, [showStatus]);

  const restoreItem = useCallback((item: RequisitionItem, index: number) => {
    setItems((prevItems) => {
      if (prevItems.some((i) => i.id === item.id)) return prevItems;
      const at = Math.min(index, prevItems.length);
      return [...prevItems.slice(0, at), item, ...prevItems.slice(at)];
    });
    setFormErrors((prev) => ({ ...prev, items: shiftItemErrors(prev.items, index, 1) }));
    setFocusTarget({ itemId: item.id, mode: 'heading' });
    clearTimeout(statusTimer.current);
    setStatus(null);
  }, []);

  // Removes at once, with a few seconds to undo, and keeps focus on a nearby item.
  const removeItem = useCallback((index: number) => {
    const current = itemsRef.current;
    const removed = current[index];
    if (current.length === 1 || !removed) return;
    const neighbor = current[index + 1] ?? current[index - 1];
    setItems(current.filter((_, i) => i !== index));
    setFormErrors((prev) => ({ ...prev, items: shiftItemErrors(prev.items, index, -1) }));
    setFocusTarget({ itemId: neighbor.id, mode: 'heading' });
    showStatus(
      {
        text: `Item ${index + 1} removido.`,
        action: { label: 'Desfazer', onClick: () => restoreItem(removed, index) },
      },
      UNDO_MESSAGE_MS
    );
  }, [restoreItem, showStatus]);

  const resetForm = useCallback(() => {
    clearDraft();
    setRequester('');
    setLocation(SELECT_PLACEHOLDER);
    setItems([createInitialItem()]);
    setFormErrors({ items: {} });
    setSentAt(undefined);
    setRestoredAt(undefined);
    clearMessages();
    window.scrollTo?.({ top: 0, behavior: scrollBehavior() });
  }, [clearMessages]);

  const handleClearForm = () => {
    if (!window.confirm('Apagar todos os dados preenchidos e começar uma nova requisição?')) return;
    resetForm();
  };

  const validateForm = (): boolean => {
    const { errors, firstError, errorCount } = validateRequisition(requester, location, items);
    setFormErrors(errors);
    setError(errorSummary(firstError, errorCount));
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
    const newRequisition = { label: 'Nova requisição', onClick: resetForm };
    let mailtoLink = buildMailtoLink(recipientEmail, subject, body);
    let message = 'E-mail aberto no Outlook. Depois de enviá-lo, comece uma nova requisição para não repetir o pedido.';
    if (mailtoLink.length > MAILTO_MAX_LENGTH) {
      if (!(await copyText(body))) {
        setError(
          'A requisição é longa demais para abrir direto no Outlook e não foi possível copiá-la automaticamente. Use "Copiar Solicitação" ou "Baixar (.txt)" e cole o texto no corpo do e-mail.'
        );
        return;
      }
      mailtoLink = buildMailtoLink(recipientEmail, subject, PASTE_INSTRUCTIONS);
      message =
        'A requisição é longa demais para ir pelo link, então o texto completo foi copiado. No e-mail que abriu, apague o texto e cole com Ctrl+V.';
    }

    window.location.href = mailtoLink;
    setSentAt(new Date().toISOString());
    showStatus({ text: message, action: newRequisition }, null);
  };

  const handleCopyClipboard = async () => {
    clearMessages();
    if (!validateForm()) return;
    const body = formatRequisitionEmail(requester, location, items);
    if (await copyText(body)) {
      showStatus({ text: 'Solicitação copiada com sucesso para a área de transferência!' });
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

  // Memoized so typing in Solicitante/Local does not re-render every item card.
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
        duplicateItem={duplicateItem}
      />
    ));
  }, [items, formErrors.items, updateItem, removeItem, duplicateItem]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <EngieLogo className="h-9 w-auto shrink-0" />
          <span className="h-6 w-px bg-gray-300" aria-hidden="true" />
          <p className="text-sm font-bold text-gray-700">
            ESOM
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Requisição de Compra
            </h1>
            <p className="mt-2 max-w-2xl text-base text-gray-700">
              Preencha os dados abaixo e clique para abrir sua solicitação diretamente no Outlook.
            </p>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-700">
              <Save className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                O preenchimento fica salvo neste navegador até você limpar o formulário.
                {restoredAt && !sentAt && (
                  <> <strong className="font-bold">Rascunho recuperado de {formatShortDateTime(restoredAt)}.</strong></>
                )}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearForm}
            className="-ml-3 inline-flex h-11 shrink-0 items-center justify-center self-start rounded-lg px-3 sm:ml-0 text-sm font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-red-200 sm:self-auto"
            title="Apagar todos os dados e começar uma nova requisição"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Limpar formulário
          </button>
        </div>

        {sentAt && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold">Esta requisição já foi aberta no Outlook em {formatShortDateTime(sentAt)}.</strong>{' '}
                Se o e-mail já foi enviado, comece uma nova para não repetir o pedido.
              </span>
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white px-4 text-sm font-bold text-orange-700 hover:bg-orange-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-200"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Nova requisição
            </button>
          </div>
        )}

        <form onSubmit={handleOpenOutlook} noValidate className="space-y-6">
          <p className="text-sm text-gray-700">
            Campos marcados com <span className="font-bold text-red-600">*</span> são obrigatórios.
          </p>

          {/* Section 1: Identification */}
          <section aria-labelledby="identificacao-title" className="bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="identificacao-title" className="text-lg font-bold text-gray-900">Identificação</h2>
                <p className="text-sm text-gray-600">Dados do solicitante e local de entrega</p>
              </div>
            </div>
            <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 px-5 py-6 sm:px-6 md:grid-cols-2">
              <Input
                label="Solicitante"
                value={requester}
                onChange={handleRequesterChange}
                error={formErrors.requester}
                placeholder="Nome completo"
                autoComplete="name"
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
          </section>

          {/* Items Loop */}
          {renderedItems}

          <button
            type="button"
            onClick={addItem}
            className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-white text-base font-bold text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-200"
          >
            <PlusCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Adicionar Outro Item
          </button>

          {/* Summary and actions stay in view while the form scrolls. */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:pt-4 sm:pb-4">
            {/* Live regions stay in the page (empty when idle) so screen readers announce new text. */}
            <div role="status" aria-live="polite">
              {status && (
                <div className="mb-3 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                  <p className="flex-1 text-sm font-bold">{status.text}</p>
                  {status.action && (
                    <button
                      type="button"
                      onClick={status.action.onClick}
                      className="-my-1 inline-flex h-9 shrink-0 items-center rounded-lg border border-green-200 bg-white px-3 text-sm font-bold text-green-800 hover:bg-green-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-green-200"
                    >
                      {status.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div role="alert">
              {error && (
                <div className="mb-3 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <p className="text-sm">
                    <span className="font-bold">Atenção: </span>
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-6 lg:justify-start">
                <h2 className="sr-only">Resumo da Requisição</h2>
                <div>
                  <p className="text-xs text-gray-600">Valor Total Estimado</p>
                  <p className="text-2xl font-bold leading-tight text-brand-700 tabular-nums">
                    {formatBRL(totalEstimatedValue)}
                  </p>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">{items.length}</span>{' '}
                  {items.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm sm:w-auto sm:px-4 font-bold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-200"
                  title="Copiar texto formatado da requisição para a área de transferência"
                >
                  <Copy className="h-4 w-4 text-gray-600 sm:mr-2" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Copiar Solicitação</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm sm:w-auto sm:px-4 font-bold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-200"
                  title="Baixar a solicitação como arquivo de texto"
                >
                  <Download className="h-4 w-4 text-gray-600 sm:mr-2" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Baixar (.txt)</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex h-12 flex-1 sm:flex-none items-center justify-center rounded-lg bg-brand-600 px-6 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 active:bg-brand-800 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
                >
                  <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
                  Abrir no Outlook
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
