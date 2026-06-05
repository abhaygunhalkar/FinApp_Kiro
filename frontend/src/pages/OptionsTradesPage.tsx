import { useEffect, useMemo, useRef, useState } from 'react';
import { useOptions, useCreateOption, useUpdateOption, useDeleteOption, useOptionsSummary } from '../hooks';
import { parseLocalDateString } from '../utils/date';
import OptionsLogForm from '../components/options/OptionsLogForm';

const TYPE_COLORS: Record<string, string> = {
  sell_put: 'bg-amber-200 text-amber-800',
  sell_call: 'bg-sky-200 text-sky-800',
  buy_call: 'bg-emerald-200 text-emerald-800',
  buy_put: 'bg-red-200 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  closed: 'bg-gray-100 text-gray-700',
  expired_worthless: 'bg-emerald-100 text-emerald-700',
  assigned: 'bg-amber-100 text-amber-700',
};

export default function OptionsTradesPage() {
  const { data: trades } = useOptions();
  const summary = useOptionsSummary();
  const create = useCreateOption();
  const update = useUpdateOption();
  const remove = useDeleteOption();

  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'expired_worthless' | 'assigned'>('all');
  const [editing, setEditing] = useState<any | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<string>('open');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditing, setModalEditing] = useState<any | null>(null);

  const filtered = useMemo(() => {
    if (!trades) return [];
    if (filter === 'all') return trades;
    return trades.filter((t: any) => t.status === filter);
  }, [trades, filter]);

  function startEdit(trade: any) {
    // open modal in edit mode
    setModalEditing(trade);
    setModalOpen(true);
  }

  function clearForm() {
    setEditing(null);
    setStatus('open');
    setErrorMsg(null);
    setModalEditing(null);
  }

  useEffect(() => {
    if (modalEditing) {
      setStatus(modalEditing.status ?? 'open');
    }
  }, [modalEditing]);

  async function submit(e: any) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload: any = {
      ticker: fd.get('ticker')?.toString().toUpperCase(),
      trade_type: fd.get('trade_type'),
      strike_price: Number(fd.get('strike_price')),
      premium: Number(fd.get('premium')),
      contracts: Number(fd.get('contracts')),
      open_date: fd.get('open_date'),
      expiry_date: fd.get('expiry_date'),
      status: fd.get('status'),
      close_price: fd.get('close_price') ? Number(fd.get('close_price')) : null,
      notes: fd.get('notes')?.toString() || null,
    };

    // client-side validation
    setErrorMsg(null);
    if (!payload.ticker) return setErrorMsg('Ticker is required');
    if (!(payload.strike_price > 0)) return setErrorMsg('Strike price must be greater than 0');
    if (!(payload.premium > 0)) return setErrorMsg('Premium must be greater than 0');
    if (!(payload.contracts >= 1)) return setErrorMsg('Contracts must be at least 1');
    if (parseLocalDateString(payload.expiry_date) <= parseLocalDateString(payload.open_date)) return setErrorMsg('Expiry date must be after open date');
    if (payload.status === 'closed' && !(payload.close_price > 0)) return setErrorMsg('Close price is required when status is Closed');

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      clearForm();
      (e.target as HTMLFormElement).reset();
      setSuccessMsg(editing ? 'Trade updated' : 'Trade logged');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Save failed');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Options Trades</h1>
        <div className="text-sm text-gray-500">
          Total P&L: {summary.data ? `$${summary.data.total_pnl}` : '—'} • Open: {summary.data?.open_positions ?? '—'} • Win Rate: {summary.data?.win_rate ?? '—'}%
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {['all','open','closed','expired_worthless','assigned'].map((k) => (
          <button key={k} onClick={() => setFilter(k as any)} className={`px-3 py-1 rounded ${filter===k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {k === 'all' ? 'All' : k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => { setModalEditing(null); setModalOpen(true); }} className="px-3 py-1 bg-green-600 text-white rounded">Log a trade</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="px-3 py-2">Ticker</th>
              <th>Type</th>
              <th>Strike</th>
              <th>Premium</th>
              <th>Contracts</th>
              <th>Expiry</th>
              <th>Status</th>
              <th className="text-right">P&L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => {
              const expiryDate = parseLocalDateString(t.expiry_date);
              const expiringSoon = expiryDate.getTime() - Date.now() <= 7 * 24 * 3600 * 1000;
              return (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-3 font-medium">{t.ticker}</td>
                  <td><span className={`px-2 py-1 rounded text-xs font-semibold ${TYPE_COLORS[t.trade_type] || 'bg-gray-100'}`}>{t.trade_type}</span></td>
                  <td>{t.strike_price}</td>
                  <td>{t.premium}</td>
                  <td>{t.contracts}</td>
                  <td className={`${expiringSoon ? 'text-amber-600 font-semibold' : ''}`}>{expiryDate.toISOString().slice(0,10)}</td>
                  <td><span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>{t.status}</span></td>
                  <td className="text-right font-medium">
                    {t.pnl == null ? '—' : (t.pnl >= 0 ? <span className="text-emerald-600">${t.pnl}</span> : <span className="text-red-600">${t.pnl}</span>)}
                  </td>
                  <td className="pl-4">
                    <button onClick={() => startEdit(t)} className="text-sm text-sky-600">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">* Premium kept as gain. Update cost basis in holdings page.</p>
      </div>

      {/* Inline form removed — now using modal-based separate form page */}
      {/* Modal form component will be shown when modalOpen is true */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => { setModalOpen(false); setModalEditing(null); }} />
          <div className="relative z-10 w-full max-w-2xl mx-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
            {/* lazy load: render local form component */}
            <OptionsLogForm editing={modalEditing ?? undefined} onClose={() => { setModalOpen(false); setModalEditing(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}
