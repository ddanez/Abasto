import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Plus,
  Edit2,
  Phone,
  Mail,
  Coins,
  Search,
  X,
  CreditCard
} from 'lucide-react';
import { Customer, Provider } from '../types';

interface ContactsModuleProps {
  customers: Customer[];
  providers: Provider[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onAddProvider: (provider: Omit<Provider, 'id'>) => Promise<void>;
  onUpdateProvider: (id: string, provider: Partial<Provider>) => Promise<void>;
}

export default function ContactsModule({
  customers,
  providers,
  onAddCustomer,
  onUpdateCustomer,
  onAddProvider,
  onUpdateProvider
}: ContactsModuleProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'providers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'customer' | 'provider' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimitUsd, setCreditLimitUsd] = useState('100');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.document.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const filteredProviders = useMemo(() => {
    return providers.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.document.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [providers, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setPhone('');
    setDocument('');
    setEmail('');
    setCreditLimitUsd('100');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any, type: 'customer' | 'provider') => {
    setEditingItem({ id: item.id, type });
    setName(item.name);
    setPhone(item.phone);
    setDocument(item.document);
    setEmail(item.email || '');
    setCreditLimitUsd(type === 'customer' ? String(item.creditLimitUsd) : '0');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !document.trim()) return;

    if (activeTab === 'customers') {
      const payload = {
        name,
        phone,
        document,
        email,
        creditLimitUsd: parseFloat(creditLimitUsd) || 0
      };
      if (editingItem) {
        await onUpdateCustomer(editingItem.id, payload);
      } else {
        await onAddCustomer(payload);
      }
    } else {
      const payload = { name, phone, document, email };
      if (editingItem) {
        await onUpdateProvider(editingItem.id, payload);
      } else {
        await onAddProvider(payload);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div id="contacts-module" className="space-y-6 animate-fade-in">
      {/* Tab Selector & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('customers');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'customers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            👥 Clientes ({customers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('providers');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'providers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🚚 Proveedores ({providers.length})
          </button>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Plus size={14} />
          {activeTab === 'customers' ? 'Registrar Cliente' : 'Registrar Proveedor'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder={activeTab === 'customers' ? "Buscar clientes por nombre o cédula/RIF..." : "Buscar proveedores mayoristas..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 outline-none rounded-2xl focus:border-emerald-500 text-xs text-slate-800 font-medium bg-white"
        />
      </div>

      {/* Grid of contacts cards */}
      {activeTab === 'customers' ? (
        /* CUSTOMERS RENDER */
        filteredCustomers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-xs text-slate-600">No se encontraron clientes registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm leading-tight">{c.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">Doc: {c.document}</span>
                    </div>
                  </div>
                  {c.id !== 'casual' && (
                    <button
                      onClick={() => handleOpenEditModal(c, 'customer')}
                      className="text-slate-400 hover:text-emerald-500 p-1 rounded-lg"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    <span>Tel: {c.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-400" />
                    <span>Email: {c.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400 flex items-center gap-1">
                    <CreditCard size={12} /> Límite Crédito CxC:
                  </span>
                  <span className="font-black text-slate-800">${c.creditLimitUsd.toFixed(2)} USD</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* PROVIDERS RENDER */
        filteredProviders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-xs text-slate-600">No se encontraron proveedores registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map(p => (
              <div key={p.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm leading-tight">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">Doc: {p.document}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(p, 'provider')}
                    className="text-slate-400 hover:text-emerald-500 p-1 rounded-lg"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    <span>Tel: {p.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-400" />
                    <span>Email: {p.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* POPUP MODAL Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-up">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">
                  {editingItem ? 'Editar Detalles de Contacto' : activeTab === 'customers' ? 'Inscribir Cliente' : 'Inscribir Proveedor'}
                </h3>
                <p className="text-xs text-slate-400">Completa los campos necesarios para las operaciones crediticias de facturación.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-2 hover:bg-slate-800 text-slate-400 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-slate-700 text-xs font-bold">Razón Social o Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez, Finca San José, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Document ID */}
              <div className="space-y-1">
                <label className="block text-slate-700 text-xs font-bold">Documento / Cédula / RIF / NIT *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-12345678, J-98765432-1"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-slate-700 text-xs font-bold">Número Telefónico</label>
                <input
                  type="text"
                  placeholder="Ej. 0414-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-slate-700 text-xs font-bold">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej. contacto@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Credit Limit (Only for customer) */}
              {activeTab === 'customers' && (
                <div className="space-y-1">
                  <label className="block text-slate-700 text-xs font-bold">Límite de Crédito Permitido (USD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Monto de préstamo máximo en dólares"
                    value={creditLimitUsd}
                    onChange={(e) => setCreditLimitUsd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-xs text-slate-800 focus:border-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400">Si el cliente intenta realizar una compra a crédito por encima de este límite, el sistema lo bloqueará por seguridad.</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm rounded-lg cursor-pointer"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
