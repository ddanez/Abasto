import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Phone, 
  MapPin, 
  FileSpreadsheet, 
  Check, 
  Upload, 
  X, 
  Users, 
  ScrollText, 
  Trash2, 
  PlusCircle, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  Search, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { CompanyConfig, User, AuditLog } from '../types';
import { apiFetch as fetch } from '../api';

interface CompanyConfigModuleProps {
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => Promise<void>;
}

const EMOJI_OPTIONS = ['🥦', '🍎', '🥬', '🍉', '🍌', '🥕', '🥔', '🛒', '🏪', '🛍️', '📦'];

export default function CompanyConfigModule({ config, onUpdateConfig }: CompanyConfigModuleProps) {
  // Tabs: 'empresa' | 'usuarios' | 'auditoria'
  const [activeSubTab, setActiveSubTab] = useState<'empresa' | 'usuarios' | 'auditoria'>('empresa');

  // ORIGINAL COMPANY CONFIG STATE
  const [name, setName] = useState(config.name);
  const [emoji, setEmoji] = useState(config.emoji);
  const [document, setDocument] = useState(config.document);
  const [phone, setPhone] = useState(config.phone);
  const [address, setAddress] = useState(config.address);
  const [footerText, setFooterText] = useState(config.footerText);
  const [logoBase64, setLogoBase64] = useState(config.logoBase64 || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState('');

  // USER MANAGEMENT STATE
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('Cajero');
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');

  // AUDIT LOG STATE
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [logsFilterModule, setLogsFilterModule] = useState('todos');

  // FETCH SYSTEM DATA
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'usuarios') {
      fetchUsers();
    } else if (activeSubTab === 'auditoria') {
      fetchLogs();
    }
  }, [activeSubTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorHeader('El nombre de la empresa es obligatorio.');
      return;
    }
    setErrorHeader('');
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
      setErrorHeader(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  // ADD USER HANDLER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
      setUserActionError('Debe completar todos los campos del nuevo usuario.');
      return;
    }
    setUserActionError('');
    setUserActionSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim().toLowerCase(),
          password: newPassword,
          name: newFullName.trim(),
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta.');
      }
      setUserActionSuccess(`¡Cuenta de ${data.user.name} creada exitosamente con rol ${data.user.role}!`);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setShowAddUserForm(false);
      fetchUsers();
      // Clear message after 3 seconds
      setTimeout(() => setUserActionSuccess(''), 4000);
    } catch (err: any) {
      setUserActionError(err.message || 'Error al guardar');
    }
  };

  // DELETE USER HANDLER
  const handleDeleteUser = async (username: string) => {
    if (username.toLowerCase() === 'admin') {
      alert('La cuenta raíz de Administrador (admin) no puede ser eliminada para garantizar la seguridad del abasto.');
      return;
    }

    const cachedUser = localStorage.getItem('abasto_user');
    const loggedInUserObj = cachedUser ? JSON.parse(cachedUser) : null;
    if (loggedInUserObj && loggedInUserObj.username.toLowerCase() === username.toLowerCase()) {
      alert('No puedes eliminar tu propio usuario mientras tienes una sesión activa.');
      return;
    }

    if (confirm(`¿Está seguro que desea revocar el acceso a '${username}'? Este usuario ya no podrá ingresar al sistema.`)) {
      try {
        const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
        if (res.ok) {
          setUserActionSuccess(`El acceso de '${username}' fue revocado correctamente.`);
          fetchUsers();
          setTimeout(() => setUserActionSuccess(''), 3000);
        } else {
          const data = await res.json();
          alert(data.error || 'Error revocando acceso');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // AUDIT LOGS FILTERING
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.username.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      log.name.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(logsSearchTerm.toLowerCase()));
      
    const matchesModule = logsFilterModule === 'todos' || log.module === logsFilterModule;
    return matchesSearch && matchesModule;
  });

  // LOGS STATISTICS COMPLIANCE
  const totalLogsCount = logs.length;
  const loginAttemptsCount = logs.filter(l => l.module === 'auth').length;
  const criticalSalesCount = logs.filter(l => l.module === 'sales').length;
  // Failures count
  const authFailuresCount = logs.filter(l => l.action.toLowerCase().includes('fallido') || l.action.toLowerCase().includes('error')).length;

  return (
    <div id="company-config-module" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Centro de Control</span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">Configuración y Seguridad</h2>
          <p className="text-slate-500 text-xs mt-1">
            Administra los datos fiscales de la empresa, gestiona las cuentas autorizadas del personal y audita la bitácora de transacciones del local.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-150 self-start md:self-auto font-sans">
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-md bg-white border border-slate-200 p-1" />
          ) : (
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl shadow-md">
              {emoji}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-700 leading-none">{name || 'Sin Nombre'}</p>
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">{document || 'Sin Documento'}</p>
          </div>
        </div>
      </div>

      {/* THREE TABS NAV SELECTOR */}
      <div className="flex border-b border-slate-200 gap-1.5 p-1 bg-slate-100 rounded-xl font-medium text-xs">
        <button
          onClick={() => setActiveSubTab('empresa')}
          style={{ minHeight: '40px' }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'empresa' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Building2 size={14} />
          <span>Datos Públicos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('usuarios')}
          style={{ minHeight: '40px' }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'usuarios' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Users size={14} />
          <span>Personal y Usuarios</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auditoria')}
          style={{ minHeight: '40px' }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'auditoria' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <ScrollText size={14} />
          <span>Bitácora de Auditoría</span>
        </button>
      </div>

      {/* TAB CONTAINER CONTENT */}
      <div>
        {activeSubTab === 'empresa' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* ORIGINAL FORM */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              {errorHeader && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl font-medium">
                  ⚠ {errorHeader}
                </div>
              )}

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl font-medium flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" />
                  ¡Los datos de la empresa se han actualizado correctamente!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Abasto o Comercio</label>
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Documento de Identidad / RIF / NIT</label>
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
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

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dirección Física</label>
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

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logo de la Empresa (Imagen PNG/JPG)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    {logoBase64 ? (
                      <div className="relative group">
                        <img src={logoBase64} alt="Company Logo" className="w-20 h-20 object-contain rounded-xl bg-white border border-slate-150 p-2 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setLogoBase64('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition-all cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 text-slate-400">
                        <Upload size={20} />
                        <span className="text-[8px] mt-1 uppercase font-bold tracking-wider">Sin Logo</span>
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <p className="text-xs font-bold text-slate-700">Sube una imagen para tu logo</p>
                      <p className="text-[9px] text-slate-400 leading-relaxed">Se imprimirá en el encabezado de las facturas impresas o en PDF.</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm transition-all">
                        <Upload size={12} />
                        <span>Seleccionar logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setLogoBase64(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* EMOJI */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ícono / Emoji alternativo</label>
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    {EMOJI_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEmoji(opt)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center hover:bg-white transition-all cursor-pointer ${
                          emoji === opt ? 'bg-white border-2 border-green-500 shadow-sm scale-105' : 'border border-transparent'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pie de Mensaje del Ticket</label>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    rows={3}
                    className="w-full p-4 text-xs rounded-xl border border-slate-200 focus:border-green-600 outline-none text-slate-800 font-medium transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex md:justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ minHeight: '44px' }}
                  className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
                </button>
              </div>
            </form>

            {/* PREVIEW */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Comprobante Virtual</span>
              <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-amber-50/10 font-mono text-[10px] text-slate-600 space-y-3.5 relative">
                <div className="text-center space-y-1">
                  <span className="text-2xl block">{emoji}</span>
                  <p className="font-extrabold text-slate-800 uppercase text-xs tracking-tight">{name}</p>
                  <p className="text-[9px] text-slate-400">RIF: {document}</p>
                  <p className="text-[9px] text-slate-450 leading-relaxed">{address}</p>
                </div>
                <div className="border-t border-dashed border-slate-250"></div>
                <div className="space-y-0.5 text-[9px]">
                  <p className="flex justify-between"><span>TICKET:</span> <span className="font-bold text-slate-700">VEN-0824</span></p>
                  <p className="flex justify-between"><span>ATENDIÓ:</span> <span className="font-semibold text-slate-700">AUTORIZADO</span></p>
                </div>
                <div className="border-t border-dashed border-slate-250"></div>
                <p className="text-center text-[9px] italic text-slate-400 leading-normal">"{footerText}"</p>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL AND USERS SECTOR */}
        {activeSubTab === 'usuarios' && (
          <div className="space-y-6 animate-fade-in">
            {userActionSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl font-medium flex items-center gap-2">
                <Check size={16} className="text-emerald-500 shrink-0" />
                <span>{userActionSuccess}</span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Cuentas Autorizadas para Acceso</h3>
                  <p className="text-xs text-slate-500">
                    Las credenciales son de uso personal. Solo los administradores pueden registrar nuevos cargos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddUserForm(!showAddUserForm);
                    setUserActionError('');
                  }}
                  style={{ minHeight: '40px' }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  <PlusCircle size={14} />
                  <span>{showAddUserForm ? 'Cancelar Registro' : 'Registrar Colaborador'}</span>
                </button>
              </div>

              {/* REGISTER NEW COLLABORATOR FORM */}
              {showAddUserForm && (
                <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-slide-down">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Información de la Nueva Cuenta</h4>
                  
                  {userActionError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium">
                      ⚠ {userActionError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre y Apellido</label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="Ej. María Pérez"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 justify-center outline-none bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de Usuario (Login)</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                        placeholder="Ej. maria95"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 justify-center outline-none bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña Inicial</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mín. 4 caracteres"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 justify-center outline-none bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cargo / Rol</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 justify-center outline-none bg-white text-slate-800 font-medium"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Cajero">Cajero / Vendedor</option>
                        <option value="Almacenista">Personal de Almacén</option>
                        <option value="Auditor">Auditor Externo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      style={{ minHeight: '36px' }}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      <span>Guardar y Habilitar Acceso</span>
                    </button>
                  </div>
                </form>
              )}

              {/* USERS LIST TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-50">
                      <th className="py-3 px-4">Colaborador</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Cargo / Rol</th>
                      <th className="py-3 px-4">Fecha Registro</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const isRootAdmin = user.username.toLowerCase() === 'admin';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/55 transition-all text-slate-700">
                          <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex animate-pulse shrink-0 bg-green-400" />
                            <span>{user.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">@{user.username}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              user.role === 'Administrador' 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px]">
                            {new Date(user.dateRegistered).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isRootAdmin ? (
                              <span className="text-[10px] text-slate-400 italic">Protegido</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(user.username)}
                                style={{ minHeight: '32px', minWidth: '32px' }}
                                className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                                title="Revocar acceso de usuario"
                              >
                                <Trash2 size={11} />
                                <span>Revocar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Ningún colaborador registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG BITÁCORA */}
        {activeSubTab === 'auditoria' && (
          <div className="space-y-6 animate-fade-in font-sans">
            
            {/* STATS DECK COMPLIANCE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Operaciones</p>
                  <p className="text-sm font-black text-slate-700 mt-1">{totalLogsCount}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Control Accesos</p>
                  <p className="text-sm font-black text-slate-700 mt-1">{loginAttemptsCount}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Ventas Registradas</p>
                  <p className="text-sm font-black text-slate-700 mt-1">{criticalSalesCount}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">Incidentes/Errores</p>
                  <p className="text-xs font-black text-rose-600 mt-1">
                    {authFailuresCount} {authFailuresCount > 0 ? '⚠ Detec.' : 'Ninguno'}
                  </p>
                </div>
              </div>
            </div>

            {/* FILTER BAR CARDS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Bitácora de Eventos Recientes</h3>
                  <p className="text-xs text-slate-500">Historial completo con auditoría de nombres e intentos de transacciones fiscalizadoras.</p>
                </div>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  style={{ minHeight: '36px' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 transition"
                  title="Sincronizar bitácora"
                >
                  <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                  <span>Sincronizar</span>
                </button>
              </div>

              {/* FILTERS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400"><Search size={14} /></span>
                  <input
                    type="text"
                    value={logsSearchTerm}
                    onChange={(e) => setLogsSearchTerm(e.target.value)}
                    placeholder="Buscar por usuario o acción..."
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-slate-450 bg-slate-50/50"
                  />
                </div>

                <div>
                  <select
                    value={logsFilterModule}
                    onChange={(e) => setLogsFilterModule(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-medium text-slate-650"
                  >
                    <option value="todos">Todos los módulos</option>
                    <option value="auth">Accesos e Inicio de Sesión</option>
                    <option value="sales">Ventas y Facturación</option>
                    <option value="inventory">Inventarios de Productos</option>
                    <option value="config">Ajustes del Comercio</option>
                    <option value="rates">Tasas y Divisas</option>
                  </select>
                </div>

                <div className="flex items-center justify-end font-mono text-[9px] text-slate-400">
                  Mostrando {filteredLogs.length} de {logs.length} entradas
                </div>
              </div>

              {/* LOGS LIST VIEW */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse divide-y divide-slate-150">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[9px] bg-slate-50">
                      <th className="py-2 px-3">Fecha / Hora</th>
                      <th className="py-2 px-3 col-span-2">Operador</th>
                      <th className="py-2 px-3">Módulo</th>
                      <th className="py-2 px-3">Acción Registrada</th>
                      <th className="py-2 px-3">Metadato / Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => {
                      // Custom colors based on module
                      let modColor = 'bg-slate-100 text-slate-700';
                      if (log.module === 'auth') modColor = 'bg-slate-900 text-slate-50';
                      if (log.module === 'sales') modColor = 'bg-green-50 text-green-700 border border-green-100';
                      if (log.module === 'inventory') modColor = 'bg-blue-50 text-blue-700 border border-blue-100';
                      if (log.module === 'rates') modColor = 'bg-amber-50 text-amber-700 border border-amber-100';
                      if (log.module === 'config') modColor = 'bg-purple-50 text-purple-700 border border-purple-100';

                      const isFailure = log.action.toLowerCase().includes('fallido') || log.action.toLowerCase().includes('error');

                      return (
                        <tr key={log.id} className={`hover:bg-slate-50/50 transition duration-150 ${isFailure ? 'bg-red-50/40 text-red-950 font-medium' : 'text-slate-600'}`}>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(log.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-805">
                            {log.name} <span className="font-mono text-slate-400 font-normal text-[9px]">@{log.username}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${modColor}`}>
                              {log.module}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px] leading-relaxed max-w-xs truncate" title={log.action}>
                            {log.action}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-450 italic max-w-xs truncate" title={log.details}>
                            {log.details || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                          No se encontraron registros de auditoría que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
