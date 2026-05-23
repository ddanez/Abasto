import React, { useState } from 'react';
import { ShieldCheck, User, Lock, UserCheck, AlertTriangle, HelpCircle } from 'lucide-react';

interface LoginModuleProps {
  onLoginSuccess: (user: { id: string; username: string; name: string; role: string }) => void;
  companyConfig: { name: string; emoji: string };
}

export default function LoginModule({ onLoginSuccess, companyConfig }: LoginModuleProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Cajero');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor introduzca su usuario y su clave.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesión.');
      }
      if (data.success && data.user) {
        localStorage.setItem('abasto_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          name: fullName.trim(),
          role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar la cuenta.');
      }
      setSuccessMsg(`¡Usuario '${data.user.username}' registrado correctamente!`);
      // Auto-login or toggle back after 1.5s
      setTimeout(() => {
        localStorage.setItem('abasto_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setUsername('admin');
    setPassword('admin');
    setIsRegistering(false);
    setError('');
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo and Store Info Card */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-500 text-3xl shadow-xl shadow-green-150 mb-4 animate-bounce">
            {companyConfig.emoji || '🥬'}
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
            {companyConfig.name || 'Súper Abasto Familiar'}
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            Punto de Venta e Inventario
          </p>
        </div>

        {/* Main interactive form card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-150 p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {isRegistering ? 'Crear nueva cuenta' : 'Control de Acceso'}
            </h2>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
              style={{ minHeight: '32px' }}
              className="text-xs text-green-600 font-bold hover:underline cursor-pointer"
            >
              {isRegistering ? 'Volver al Inicio' : 'Registrar Nuevo Usuario'}
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium flex items-start gap-2.5 animate-shake">
              <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl font-medium flex items-start gap-2.5 animate-fade-in">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre de Usuario
                </label>
                <div id="wrapper-username" className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. admin o cajero1"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Clave / Contraseña de Acceso
                </label>
                <div id="wrapper-password" className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ minHeight: '44px' }}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <ShieldCheck size={16} />
                {loading ? 'Validando sesión...' : 'Ingresar al Sistema'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre y Apellido
                </label>
                <div id="wrapper-name" className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <UserCheck size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María Rodríguez"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre de Usuario (Para acceder)
                </label>
                <div id="wrapper-reg-username" className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="Ej. maria, cajero_perez"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Contraseña de Seguridad
                </label>
                <div id="wrapper-reg-password" className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña robusta"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 focus:ring-4 focus:ring-green-100 outline-none text-slate-800 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Cargo / Rol Asignado
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-green-600 outline-none text-slate-800 font-medium transition-all bg-white"
                >
                  <option value="Administrador">Administrador / Supervisor</option>
                  <option value="Cajero">Cajero / Vendedor</option>
                  <option value="Almacenista">Personal de Almacén</option>
                  <option value="Auditor">Auditor Contable</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ minHeight: '44px' }}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <ShieldCheck size={16} />
                {loading ? 'Registrando cuenta...' : 'Crear Cuenta y Entrar'}
              </button>
            </form>
          )}

          {/* Prompt standard credentials */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <HelpCircle size={13} className="text-slate-400" />
              <span>¿No tienes credenciales?</span>
            </span>
            <button
              onClick={fillDefaultCredentials}
              className="text-green-600 font-bold hover:underline cursor-pointer"
            >
              Usar usuario 'admin'
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
