import React, { useState } from 'react';
import { GraduationCap, Loader2, Lock, User, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Solo pedimos contraseña si es el ADMIN
  const isAdmin = employeeNumber.trim().toUpperCase() === 'ADMIN';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const usuarioLimpio = employeeNumber.trim().toUpperCase();

    // Validación visual
    if (usuarioLimpio !== 'ADMIN' && usuarioLimpio.length !== 6) {
      setError('El número de empleado debe ser de 6 dígitos.');
      setLoading(false);
      return;
    }

    if (isAdmin && !password.trim()) {
      setError('El administrador requiere contraseña');
      setLoading(false);
      return;
    }

    try {
      // 🔥 CORRECCIÓN AQUÍ: Usamos 127.0.0.1 y la ruta /api/login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          num_empleado: usuarioLimpio,
          password: password // Se enviará vacía si no es admin, y el server lo ignorará
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.profesor); 
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }

    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor. Revisa que server.js esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <div className="bg-blue-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
          <GraduationCap size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ClassAccess</h1>
        <p className="text-slate-500 mb-8">Control de Asistencias</p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Número de Empleado</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="Ej: 105555"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value.toUpperCase())}
                disabled={loading}
              />
            </div>
          </div>

          {/* Solo mostramos el campo contraseña si escribe ADMIN */}
          {isAdmin && (
            <div className="animate-fade-in-up">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Contraseña de Admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl text-lg transition-all shadow-lg flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}