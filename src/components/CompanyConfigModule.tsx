import React, { useState } from 'react';
import { Building2, Save, Phone, MapPin, FileSpreadsheet, Check, Smile, Percent, Upload, X } from 'lucide-react';
import { CompanyConfig } from '../types';

interface CompanyConfigModuleProps {
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => Promise<void>;
}

const EMOJI_OPTIONS = ['🥦', '🍎', '🥬', '🍉', '🍌', '🥕', '🥔', '🛒', '🏪', '🛍️', '📦'];

export default function CompanyConfigModule({ config, onUpdateConfig }: CompanyConfigModuleProps) {
  const [name, setName] = useState(config.name);
  const [emoji, setEmoji] = useState(config.emoji);
  const [document, setDocument] = useState(config.document);
  const [phone, setPhone] = useState(config.phone);
  const [address, setAddress] = useState(config.address);
  const [footerText, setFooterText] = useState(config.footerText);
  const [logoBase64, setLogoBase64] = useState(config.logoBase64 || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la empresa es obligatorio.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await onUpdateConfig({
        name: name.trim(),
        emoji,
        document: document.trim(),
        phone: phone.trim(),
        address: address.trim(),
        footerText: footerText.trim(),
        logoBase64: logoBase64,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="company-config-module" className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ajustes Generales</span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">Configuración de Empresa</h2>
          <p className="text-slate-500 text-xs mt-1">
            Personaliza los datos principales de tu comercio. Esta información se reflejará en el encabezado de las facturas, cuentas por cobrar/pagar y los reportes.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-2xl border border-green-100 self-start md:self-auto">
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-md bg-white border border-slate-200 p-1" />
          ) : (
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl shadow-md">
              {emoji}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-700 leading-none">{name || 'Sin Nombre'}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{document || 'Sin Documento'}</p>
          </div>
        </div>
      </div>

      {/* CONFIGURATION FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl font-medium">
              ⚠ {error}
            </div>
          )}

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl font-medium flex items-center gap-2 animate-fade-in">
              <Check size={16} className="text-emerald-500" />
              ¡Los datos de la empresa se han actualizado correctamente!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NAME */}
            <div className="md:col-span-2">
              <label id="lbl-company-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Abasto o Comercio</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><Building2 size={16} /></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Súper Abasto Familiar"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* DOCUMENT */}
            <div>
              <label id="lbl-company-doc" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Documento de Identidad / RIF / NIT</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><FileSpreadsheet size={16} /></span>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Ej. J-12345678-0"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label id="lbl-company-phone" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><Phone size={16} /></span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 0414-0001122"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <label id="lbl-company-address" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dirección Física</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400"><MapPin size={16} /></span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Principal, Sector Centro, Caracas"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* CUSTOM LOGO UPLOAD */}
            <div className="md:col-span-2">
              <label id="lbl-custom-logo-upload" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logo de la Empresa (Imagen PNG/JPG)</label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                {logoBase64 ? (
                  <div className="relative group">
                    <img src={logoBase64} alt="Company Logo" className="w-20 h-20 object-contain rounded-xl bg-white border border-slate-150 p-2 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setLogoBase64('')}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title="Eliminar logo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 text-slate-400">
                    <Upload size={24} />
                    <span className="text-[9px] mt-1 uppercase font-bold tracking-wider">Sin Logo</span>
                  </div>
                )}
                
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">Sube una imagen para tu logo</p>
                  <p className="text-[10px] text-slate-400 leading-normal">Se recomienda fondo transparente, formato JPG o PNG. Tamaño máximo recomendado de 800 KB.</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50/10 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer shadow-sm transition-all border-dashed">
                    <Upload size={12} />
                    <span>Seleccionar archivo</span>
                    <input
                      type="file"
                      id="company-logo-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* EMOJI SELECTOR */}
            <div className="md:col-span-2">
              <label id="lbl-company-logo" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ícono / Emoji alternativo (Si no subes logo)</label>
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                {EMOJI_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEmoji(opt)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer ${
                      emoji === opt ? 'bg-white border-2 border-green-500 shadow-sm scale-105' : 'border border-transparent'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 h-10 rounded-xl text-center text-xl bg-white border border-slate-200 outline-none focus:border-green-600 font-bold"
                  title="O digite un emoji personalizado"
                  placeholder="✨"
                />
              </div>
            </div>

            {/* FOOTER TEXT */}
            <div className="md:col-span-2">
              <label id="lbl-company-footer" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pie de Notario o Mensaje en Ticket Fiscal</label>
              <textarea
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                rows={3}
                placeholder="Ej. ¡Gracias por su compra, vuelva pronto!"
                className="w-full p-4 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all resize-none"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex md:justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>

        {/* INVOICE PREVIEW CARD */}
        <div className="h-fit bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vista Previa Impresión</span>
          <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-amber-50/20 font-mono text-[11px] text-slate-600 space-y-4 shadow-inner relative">
            <div className="absolute top-1 right-2 text-[8px] text-amber-500 font-sans font-bold">REPRESENTACIÓN VIRTUAL</div>
            {/* Header */}
            <div className="text-center space-y-1">
              {logoBase64 ? (
                <img src={logoBase64} alt="Logo" className="w-16 h-16 rounded-xl object-contain mx-auto bg-white border border-slate-200 p-1 shadow-sm mb-1" />
              ) : (
                <span className="text-3xl block filter drop-shadow">{emoji}</span>
              )}
              <p className="font-extrabold text-slate-800 uppercase text-xs tracking-tight">{name || 'Súper Abasto Familiar'}</p>
              <p className="text-[9px] text-slate-400">RIF/DOC: {document || 'J-12345678-0'}</p>
              <p className="text-[9px] text-slate-400">Telf: {phone || '0414-0001122'}</p>
              <p className="text-[9px] text-slate-400 break-words max-w-full">{address || 'Av. Principal, Sector Centro, Caracas'}</p>
            </div>

            <div className="border-t border-dashed border-slate-350 my-2"></div>

            {/* Invoice Meta */}
            <div className="space-y-0.5 text-[10px] text-slate-450">
              <p className="flex justify-between"><span>FACTURA:</span> <span className="font-bold text-slate-700">VEN-0348</span></p>
              <p className="flex justify-between"><span>FECHA:</span> <span>22/05/2026 14:35</span></p>
              <p className="flex justify-between"><span>COMPRADOR:</span> <span>María Rodríguez</span></p>
            </div>

            <div className="border-t border-dashed border-slate-350 my-2"></div>

            {/* Items table */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-800 font-bold">
                <span>CONCEPTO (CANT)</span>
                <span>TOTAL USD</span>
              </div>
              <div className="flex justify-between">
                <span>Manzanas Rojas (2.5 kg)</span>
                <span>$7.00</span>
              </div>
              <div className="flex justify-between">
                <span>Harina de Maíz (3 u)</span>
                <span>$4.20</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-350 my-2"></div>

            {/* Totals */}
            <div className="space-y-1 text-slate-700 font-semibold text-[10px]">
              <p className="flex justify-between"><span>SUB-TOTAL:</span> <span>$11.20</span></p>
              <p className="flex justify-between text-slate-900 font-bold text-xs"><span>TOTAL USD:</span> <span>$11.20</span></p>
              <p className="flex justify-between text-[9px] text-emerald-600 font-semibold"><span>CONV. VES (36.50):</span> <span>Bs.408.80</span></p>
              <p className="flex justify-between text-[9px] text-blue-600 font-semibold"><span>CONV. COP (3950):</span> <span>$44,240</span></p>
            </div>

            <div className="border-t border-dashed border-slate-350 my-2"></div>

            {/* Footer custom text */}
            <p className="text-center text-[9px] text-slate-400 italic break-words p-1 leading-normal">
              "{footerText || '¡Gracias por su compra, vuelva pronto!'}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
