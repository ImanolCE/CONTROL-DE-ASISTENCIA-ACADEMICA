import React, { useEffect, useState } from 'react';
import { Users, Calendar } from 'lucide-react';

export default function MyStudents({ user, cuatrimestres, cuatrimestreId, onChangeCuatrimestre, loadingCuatrimestre }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && cuatrimestreId) cargarAlumnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cuatrimestreId]);

  const cargarAlumnos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mis-alumnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_profesor: user.id_profesor, cuatrimestreId })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAlumnos(result.data);
      } else {
        setAlumnos([]);
      }
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Alumnos Inscritos</h1>
          <p className="text-slate-500">Listado de estudiantes registrados en tus clases (por cuatrimestre).</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtro</p>
            <h2 className="text-lg font-bold text-slate-900">Cuatrimestre</h2>
            <p className="text-sm text-slate-500">El catálogo se muestra solo del cuatrimestre seleccionado.</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex items-center gap-2 bg-slate-50/50">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <Users size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Total Inscritos: {alumnos.length}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Matrícula</th>
                <th className="px-6 py-4">Nombre del Alumno</th>
                <th className="px-6 py-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Fecha Inscripción
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!cuatrimestreId ? (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-slate-400 italic">
                    Selecciona un cuatrimestre para ver tu catálogo.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500 animate-pulse">
                    Cargando lista...
                  </td>
                </tr>
              ) : alumnos.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-slate-400 italic">
                    No tienes alumnos inscritos en este cuatrimestre.
                  </td>
                </tr>
              ) : (
                alumnos.map((alum) => (
                  <tr key={alum.matricula} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 bg-slate-50/30">{alum.matricula}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{alum.nombre}</td>
                    <td className="px-6 py-4 text-slate-500">{formatearFecha(alum.fecha_inscripcion)}</td>
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
