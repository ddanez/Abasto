import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Search,
  User,
  Activity,
  X
} from 'lucide-react';
import { CxcInvoice, CxpInvoice, ExchangeRate } from '../types';

interface CxcCxpModuleProps {
  cxc: CxcInvoice[];
  cxp: CxpInvoice[];
  rates: ExchangeRate;
  onPayCxc: (id: string, amountUsd: number, method: 'cash' | 'transfer', reference?: string) => Promise<void>;
  onPayCxp: (id: string, amountUsd: number, method: 'cash' | 'transfer', reference?: string) => Promise<void>;
}

export default function CxcCxpModule({ cxc, cxp, rates, onPayCxc, onPayCxp }: CxcCxpModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'cxc' | 'cxp'>('cxc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeBill, setActiveBill] = useState<{ id: string; name: string; maxAmount: number; type: 'cxc' | 'cxp' } | null>(null);

  // Payment Form Fields
  const [paymentAmountUsd, setPaymentAmountUsd] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [reference, setReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter lists based on search
  const filteredCxcList = useMemo(() => {
    return cxc.filter(item =>
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cxc, searchQuery]);

  const filteredCxpList = useMemo(() => {
    return cxp.filter(item =>
      item.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cxp, searchQuery]);

  const totals = useMemo(() => {
    const cxcPending = cxc.reduce((sum, item) => item.status === 'pendiente' ? sum + item.remainingBalanceUsd : sum, 0);
    const cxpPending = cxp.reduce((sum, item) => item.status === 'pendiente' ? sum + item.remainingBalanceUsd : sum, 0);
    return { cxcPending, cxpPending };
  }, [cxc, cxp]);

  const handleOpenPaymentModal = (item: any, type: 'cxc' | 'cxp') => {
    setActiveBill({
      id: item.id,
      name: type === 'cxc' ? item.customerName : item.providerName,
      maxAmount: item.remainingBalanceUsd,
      type
    });
    setPaymentAmountUsd(String(item.remainingBalanceUsd));
    setPaymentMethod('cash');
    setReference('');
    setErrorMessage('');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBill) return;

    const amt = parseFloat(paymentAmountUsd);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Por favor ingrese un monto de abono válido.');
      return;
    }
    if (amt > activeBill.maxAmount) {
      setErrorMessage(`El monto (${amt} USD) no puede ser mayor al saldo restante (${activeBill.maxAmount} USD).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (activeBill.type === 'cxc') {
        await onPayCxc(activeBill.id, amt, paymentMethod, reference);
      } else {
        await onPayCxp(activeBill.id, amt, paymentMethod, reference);
      }
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error procesando el abono en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSecondary = (usd: number) => {
    const ves = usd * rates.usdToVes;
    const cop = usd * rates.usdToCop;
    return `Bs. ${ves.toFixed(1)} / COP $${Math.round(cop).toLocaleString('es-CO')}`;
  };

  return (
    <div id="cxccxp-module" className="space-y-6 animate-fade-in">
      {/* Financial overview mini banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CxC Ledger Mini Banner */}
        <div className="bg-green-50/60 border border-green-150 rounded-3xl p-5 text-slate-800 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-750 block">Cartera de Cobros (CxC)</span>
            <span className="text-2xl font-black text-slate-800">${totals.cxcPending.toFixed(2)} USD</span>
            <span className="text-[11px] text-green-600 font-semibold block">Equivalente: {formatSecondary(totals.cxcPending)}</span>
          </div>
          <div className="bg-green-500/10 p-3.5 rounded-2xl text-green-600 animate-pulse">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* CxP Ledger Mini Banner */}
        <div className="bg-amber-50/60 border border-amber-150 rounded-3xl p-5 text-slate-800 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-750 block">Cartera de Pagos (CxP)</span>
            <span className="text-2xl font-black text-slate-800">${totals.cxpPending.toFixed(2)} USD</span>
            <span className="text-[11px] text-amber-600 font-semibold block">Equivalente: {formatSecondary(totals.cxpPending)}</span>
          </div>
          <div className="bg-amber-500/10 p-3.5 rounded-2xl text-amber-600">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Main visual Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toggle navigation bar header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveSubTab('cxc');
                setSearchQuery('');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeSubTab === 'cxc' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              💸 Cuentas Por Cobrar (Clientes)
            </button>
            <button
              onClick={() => {
                setActiveSubTab('cxp');
                setSearchQuery('');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeSubTab === 'cxp' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              🚚 Cuentas Por Pagar (Proveedores)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar por beneficiario, estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full sm:w-52 text-xs border border-slate-200 outline-none rounded-lg focus:border-emerald-500 font-semibold"
            />
          </div>
        </div>

        {/* Dynamic List Rendering */}
        <div className="overflow-x-auto">
          {activeSubTab === 'cxc' ? (
            /* CXC TABLE */
            filteredCxcList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-xs">No hay cuentas por cobrar pendientes</p>
                <p className="text-[10px] text-slate-400">Tus ventas a crédito aparecerán listadas aquí.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[9px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Factura Venta</th>
                    <th className="p-4">Cliente Deudor</th>
                    <th className="p-4">Fecha Registro</th>
                    <th className="p-4">Fecha Vencimiento</th>
                    <th className="p-4 text-right">Crédito Inicial</th>
                    <th className="p-4 text-right">Saldo Pendiente</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCxcList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 font-bold text-indigo-600 font-mono">#{item.saleId ? 'VEN-' + item.saleId.substring(10, 13).toUpperCase() : 'N/A'}</td>
                      <td className="p-4 font-semibold text-slate-800">{item.customerName}</td>
                      <td className="p-4 text-slate-500 font-mono">{new Date(item.date).toLocaleDateString('es-ES')}</td>
                      <td className="p-4 text-slate-500 font-mono font-bold">{new Date(item.dueDate).toLocaleDateString('es-ES')}</td>
                      <td className="p-4 text-right font-semibold text-slate-500">${item.totalAmountUsd.toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-slate-800">
                        <span className="block">${item.remainingBalanceUsd.toFixed(2)} USD</span>
                        <span className="block text-[9px] text-slate-400 font-normal">{formatSecondary(item.remainingBalanceUsd)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${item.status === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.status !== 'pagado' ? (
                          <button
                            onClick={() => handleOpenPaymentModal(item, 'cxc')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 mx-auto shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <PlusCircle size={12} /> Abonar Cobro
                          </button>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1 justify-center">
                            <CheckCircle size={14} /> Liquidado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* CXP TABLE */
            filteredCxpList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-xs">No hay cuentas por pagar pendientes</p>
                <p className="text-[10px] text-slate-400">Las adquisiciones autorizadas de mercancía a crédito aparecerán aquí.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[9px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Factura Compra</th>
                    <th className="p-4">Proveedor Agrario</th>
                    <th className="p-4">Fecha Registro</th>
                    <th className="p-4">Fecha Vencimiento</th>
                    <th className="p-4 text-right">Crédito Inicial</th>
                    <th className="p-4 text-right">Deuda Restante</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCxpList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 font-bold text-orange-600 font-mono">#{item.purchaseId ? 'COM-' + item.purchaseId.substring(8, 11).toUpperCase() : 'N/A'}</td>
                      <td className="p-4 font-semibold text-slate-800">{item.providerName}</td>
                      <td className="p-4 text-slate-500 font-mono">{new Date(item.date).toLocaleDateString('es-ES')}</td>
                      <td className="p-4 text-slate-500 font-mono font-bold">{new Date(item.dueDate).toLocaleDateString('es-ES')}</td>
                      <td className="p-4 text-right font-semibold text-slate-500">${item.totalAmountUsd.toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-slate-800">
                        <span className="block">${item.remainingBalanceUsd.toFixed(2)} USD</span>
                        <span className="block text-[9px] text-slate-400 font-normal">{formatSecondary(item.remainingBalanceUsd)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${item.status === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-850 animate-pulse'}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.status !== 'pagado' ? (
                          <button
                            onClick={() => handleOpenPaymentModal(item, 'cxp')}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 mx-auto shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <PlusCircle size={12} /> Registrar Pago
                          </button>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1 justify-center">
                            <CheckCircle size={14} /> Liquidado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* PAYMENT TRANSACTION MODAL */}
      {isPaymentModalOpen && activeBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Activity size={18} className="text-emerald-400" />
                  {activeBill.type === 'cxc' ? 'Abono de Cliente' : 'Pago a Proveedor'}
                </h3>
                <p className="text-xs text-slate-400">Amortiza saldo de crédito registrado para {activeBill.name}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">
                  ⚠ {errorMessage}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sujeto / Beneficiario</span>
                <span className="text-sm font-bold text-slate-800 block">{activeBill.name}</span>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200 mt-2 text-slate-600 font-semibold">
                  <span>Deuda restante:</span>
                  <span className="text-slate-800 font-extrabold">${activeBill.maxAmount.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Amount to Pay */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 text-xs font-semibold uppercase">Monto a Amortizar (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={activeBill.maxAmount}
                    required
                    value={paymentAmountUsd}
                    onChange={(e) => setPaymentAmountUsd(e.target.value)}
                    className="w-full pl-7 pr-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Convertido:</span>
                  <span className="font-bold text-emerald-600">
                    {paymentAmountUsd ? formatSecondary(parseFloat(paymentAmountUsd) || 0) : '$0'}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 text-xs font-semibold uppercase">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'cash' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    Efectivo Divisas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'transfer' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    Pago Móvil / Transf.
                  </button>
                </div>
              </div>

              {/* Bank Reference code */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 text-xs font-semibold uppercase">Nro de Referencia / Notas</label>
                <input
                  type="text"
                  placeholder="Ej. Ref #5125 o Efectivo entregado"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md rounded-lg cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
