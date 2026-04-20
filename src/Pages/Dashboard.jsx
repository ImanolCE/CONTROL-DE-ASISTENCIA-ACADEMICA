import React, { useEffect, useState } from 'react';
import { Users, Clock, Activity, CreditCard, Keyboard } from 'lucide-react';

export default function Dashboard({ user, cuatrimestres, cuatrimestreId, onChangeCuatrimestre, loadingCuatrimestre }) {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    asistenciasHoy: 0,
    recientes: []
  });

  const fetchDatos = async () => {
    if (!user) return;
    if (!cuatrimestreId) return;

    try {
      const response = await fetch(`/api/dashboard/${user.id_profesor}?cuatrimestreId=${cuatrimestreId}`);
      const data = await response.json();

      if (data.success) {
        setStats({
          totalAlumnos: data.alumnos,
          asistenciasHoy: data.asistencias_hoy,
          recientes: data.recientes || []
        });
      }
    } catch (error) {
      console.error('Error conectando al backend', error);
    }
  };

  useEffect(() => {
    fetchDatos();
    const intervalo = setInterval(fetchDatos, 2000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cuatrimestreId]);

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500">
            Bienvenido, <span className="font-semibold text-blue-600">{user?.nombre} {user?.apellidos}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtro</p>
            <h2 className="text-lg font-bold text-slate-900">Cuatrimestre</h2>
            <p className="text-sm text-slate-500">Selecciona un cuatrimestre para ver solo su información.</p>
          </div>

          <div className="min-w-[260px]">
            <label className="text-xs font-semibold text-slate-600">Cuatrimestre</label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cuatrimestreId ?? ''}
              onChange={(e) => onChangeCuatrimestre(e.target.value)}
              disabled={loadingCuatrimestre || !(cuatrimestres?.length)}
            >
              {loadingCuatrimestre ? (
                <option value="">Cargando...</option>
              ) : (
                <>
                  {!cuatrimestres?.length && <option value="">Sin cuatrimestres</option>}
                  {cuatrimestres?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between transition-transform hover:scale-[1.01]">
          <div>
            <p className="text-slate-500 text-sm font-medium">Mis Alumnos Inscritos</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">{stats.totalAlumnos}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Users size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between transition-transform hover:scale-[1.01]">
          <div>
            <p className="text-slate-500 text-sm font-medium">Asistencias Hoy</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.asistenciasHoy}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <Activity size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Actividad Reciente (En Vivo)
          </h3>

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Actualizando...</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Matrícula</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!cuatrimestreId ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-400 italic">
                    Selecciona un cuatrimestre para ver la actividad.
                  </td>
                </tr>
              ) : stats.recientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-400 italic">
                    Esperando registros en tus clases...
                  </td>
                </tr>
              ) : (
                stats.recientes.map((registro, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors animate-fade-in-up">
                    <td className="px-6 py-4 font-mono text-slate-700">{registro.hora_llegada}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{registro.matricula}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {registro.nombre || <span className="text-gray-400 italic">Desconocido</span>}
                    </td>
                    <td className="px-6 py-4">
                      {registro.metodo === 'RFID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                          <CreditCard size={14} /> Tarjeta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                          <Keyboard size={14} /> Teclado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
