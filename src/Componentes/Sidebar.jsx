import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, GraduationCap, LogOut, Users } from 'lucide-react';

export default function Sidebar({ user, onLogout, cuatrimestreId, cuatrimestres, loadingCuatrimestre }) {
  const activeLinkClass =
    "flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-200 transition-all transform scale-[1.02]";
  const normalLinkClass =
    "flex items-center gap-3 p-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all hover:pl-4";

  const cuatrimestreLabel = useMemo(() => {
    if (loadingCuatrimestre) return 'Cargando...';
    const found = (cuatrimestres || []).find(c => Number(c.id) === Number(cuatrimestreId));
    return found?.nombre || 'Sin seleccionar';
  }, [cuatrimestres, cuatrimestreId, loadingCuatrimestre]);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between fixed h-full left-0 top-0 z-20 shadow-xl">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">ClassAccess</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Profesor</p>
          </div>
        </div>

        <nav className="space-y-3">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? activeLinkClass : normalLinkClass)}>
            <LayoutDashboard size={20} />
            <span>Control</span>
          </NavLink>

          <NavLink to="/my-students" className={({ isActive }) => (isActive ? activeLinkClass : normalLinkClass)}>
            <Users size={20} />
            <span>Mis Alumnos</span>
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => (isActive ? activeLinkClass : normalLinkClass)}>
            <FileText size={20} />
            <span>Reportes</span>
          </NavLink>
        </nav>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sesión Actual</p>
          <p className="text-sm font-bold text-slate-800 truncate" title={user ? `${user.nombre} ${user.apellidos}` : ''}>
            {user ? `${user.nombre} ${user.apellidos}` : 'Cargando...'}
          </p>
          <p className="text-xs text-blue-600 font-medium">{user?.num_empleado}</p>

          <div className="mt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cuatrimestre</p>
            <p className="text-xs text-slate-600 font-semibold truncate" title={cuatrimestreLabel}>
              {cuatrimestreLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 w-full transition-colors font-medium border border-transparent hover:border-red-100"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
