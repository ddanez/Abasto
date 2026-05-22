import React, { useState } from 'react';
import { Coins, HelpCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { ExchangeRate } from '../types';

interface CurrencyModalProps {
  onRatesSubmit: (ves: number, cop: number) => void;
  currentRates?: ExchangeRate;
}

export default function CurrencyModal({ onRatesSubmit, currentRates }: CurrencyModalProps) {
  const [vesRate, setVesRate] = useState<string>(currentRates?.usdToVes ? String(currentRates.usdToVes) : '36.50');
  const [copRate, setCopRate] = useState<string>(currentRates?.usdToCop ? String(currentRates.usdToCop) : '3950');
  const [error, setError] = useState<string>('');

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ves = parseFloat(vesRate);
    const cop = parseFloat(copRate);

    if (isNaN(ves) || ves <= 0) {
      setError('Por favor introduce una tasa válida para el Bolívar (VES)');
      return;
    }
    if (isNaN(cop) || cop <= 0) {
      setError('Por favor introduce una tasa válida para el Peso Colombiano (COP)');
      return;
    }

    setError('');
    onRatesSubmit(ves, cop);
  };

  const loadPreset = (vesVal: number, copVal: number) => {
    setVesRate(String(vesVal));
    setCopRate(String(copVal));
  };

  return (
    <div id="currency-modal-backdrop" className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div id="currency-modal-card" className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all animate-scale-up">
        {/* Header decoration */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <div className="absolute top-4 right-4 bg-white/15 p-1.5 rounded-full backdrop-blur-sm animate-pulse">
            <TrendingUp size={18} className="text-green-400" />
          </div>
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Coins size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Cotización del Día</h2>
          <p className="text-slate-400 text-xs font-mono mt-1 capitalize">{today}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center text-slate-500 text-sm">
            Para operar hoy, por favor ingresa la cotización oficial o de mercado con respecto al <span className="font-semibold text-slate-800">Dólar ($ USD)</span>.
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium text-center">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* VES RATE */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
                1 USD ➔ Bolívares (VES)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">Bs.</span>
                <input
                  type="text"
                  value={vesRate}
                  onChange={(e) => setVesRate(e.target.value)}
                  placeholder="36.50"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-green-650 focus:ring-4 focus:ring-green-600/5 outline-none text-slate-800 font-bold transition-all text-lg"
                />
              </div>
            </div>

            {/* COP RATE */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
                1 USD ➔ Pesos Colombianos (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="text"
                  value={copRate}
                  onChange={(e) => setCopRate(e.target.value)}
                  placeholder="3950"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-green-650 focus:ring-4 focus:ring-green-600/5 outline-none text-slate-800 font-bold transition-all text-lg"
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Tasas Referenciales Rápidas</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => loadPreset(36.50, 3950)}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-green-600 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-all text-left"
              >
                <span>BCV + TRM Standard</span>
                <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={() => loadPreset(37.20, 4000)}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-green-600 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-all text-left"
              >
                <span>Mercado Libre</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-sm hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            Establecer Cotizaciones e Iniciar
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
