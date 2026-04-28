// src/Layouts/AdminLayout.jsx
import React from 'react';
import { LogOut, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminLayout({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra superior exclusiva de Admin */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Panel Maestro</h1>
            <p className="text-xs text-slate-400">Administrador del Sistema</p>
          </div>
        </div>

        {/* <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Panel
          </Link>

          <Link
            to="/admin/sessions"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Sesiones
          </Link>
        </div> */}
        
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">Usuario ADMIN</p>
            <p className="text-xs text-slate-400">Superusuario</p>
          </div>
          <button 
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <LogOut size={18} /> Salir
          </button>
        </div>
      </nav>

      {/* Contenido de la página */}
      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}