// src/Pages/Classes.jsx
import React from 'react';
import { Search } from 'lucide-react';

export default function Classes() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mis Clases</h1>
        <p className="text-slate-600">Materias que imparto</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Listado de Clases</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por materia, grupo o profesor..."
              className="pl-10 h-10 w-80 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Profesor</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="text-center text-slate-500 py-10">
                  No tienes clases asignadas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}