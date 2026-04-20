import React, { useState } from 'react';
import { Search, Download, CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function Reports({ user, cuatrimestres, cuatrimestreId, onChangeCuatrimestre, loadingCuatrimestre }) {
  if (!user) return <div className="p-4 text-slate-500">Cargando...</div>;

  const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  const [sesiones, setSesiones] = useState([]);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState({});

  const toggleSession = (id) => setExpandedSessions((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleGenerarReporte = async () => {
    if (!cuatrimestreId) return alert('Selecciona un cuatrimestre primero');
    if (!startDate || !endDate) return alert('Selecciona ambas fechas');

    setLoading(true);
    setSesiones([]);
    setTotalAlumnos(0);

    try {
      const response = await fetch('/api/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_profesor: user.id_profesor,
          fechaInicio: startDate,
          fechaFin: endDate,
          cuatrimestreId
        })
      });

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setSesiones(result.data);
        setTotalAlumnos(result.totalMisAlumnos || 0);
        const allOpen = {};
        result.data.forEach((s) => (allOpen[s.id_sesion] = true));
        setExpandedSessions(allOpen);
      } else {
        setSesiones([]);
        setExpandedSessions({});
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const totalAsistenciasRango = sesiones.reduce((acc, s) => acc + (s.asistencias?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div className="flex flex-col gap-3 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes por Clase</h1>
          <p className="text-slate-500">Consulta tus sesiones por rango de fechas (filtrado por cuatrimestre).</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtro</p>
            <h2 className="text-lg font-bold text-slate-900">Cuatrimestre</h2>
            <p className="text-sm text-slate-500">El reporte se genera solo con datos del cuatrimestre seleccionado.</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700">Desde</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Hasta</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleGenerarReporte}
            disabled={loading || !cuatrimestreId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex justify-center gap-2"
          >
            {loading ? 'Buscando...' : (
              <>
                <Search size={18} /> Buscar
              </>
            )}
          </button>
        </div>
      </div>

      {searched && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm font-bold">Asistencias Totales</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{totalAsistenciasRango}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <CheckCircle size={28} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm font-bold">Total Alumnos</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{totalAlumnos}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                <Users size={28} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sesiones.length === 0 ? (
              <div className="text-center p-10 text-slate-400 bg-white rounded-xl border border-dashed">
                No se encontraron clases en este rango.
              </div>
            ) : (
              sesiones.map((sesion) => {
                const asistieron = sesion.asistencias?.length || 0;
                const badgeColor = asistieron > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';

                return (
                  <div key={sesion.id_sesion} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div
                      className="p-4 bg-slate-50 border-b flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => toggleSession(sesion.id_sesion)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded border border-slate-200 shadow-sm text-center min-w-[60px]">
                          <span className="block text-xs text-slate-500 font-bold uppercase">
                            {new Date(sesion.fecha).toLocaleDateString('es-MX', { weekday: 'short' })}
                          </span>
                          <span className="block text-lg font-bold text-slate-800">{new Date(sesion.fecha).getDate()}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Clase Registrada</h3>
                          <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <ClockIcon /> {sesion.inicio} - {sesion.fin}
                            </span>

                            <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${badgeColor} border border-black/5`}>
                              {asistieron} Asistentes
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedSessions[sesion.id_sesion] ? (
                        <ChevronUp className="text-slate-400" />
                      ) : (
                        <ChevronDown className="text-slate-400" />
                      )}
                    </div>

                    {expandedSessions[sesion.id_sesion] && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-white text-slate-500 border-b text-xs uppercase">
                            <tr>
                              <th className="px-6 py-2">Hora</th>
                              <th className="px-6 py-2">Matrícula</th>
                              <th className="px-6 py-2">Alumno</th>
                              <th className="px-6 py-2">Método</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(sesion.asistencias || []).length > 0 ? (
                              sesion.asistencias.map((a, i) => (
                                <tr key={i} className="hover:bg-blue-50/50">
                                  <td className="px-6 py-3 font-mono text-blue-600">{a.hora}</td>
                                  <td className="px-6 py-3 font-bold">{a.matricula}</td>
                                  <td className="px-6 py-3">{a.nombre}</td>
                                  <td className="px-6 py-3">
                                    <span
                                      className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                        a.metodo === 'RFID'
                                          ? 'bg-purple-50 text-purple-600 border-purple-100'
                                          : 'bg-orange-50 text-orange-600 border-orange-100'
                                      }`}
                                    >
                                      {a.metodo}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="p-4 text-center text-slate-400 italic text-xs">
                                  Clase creada pero nadie asistió.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {sesiones.length > 0 && (
            <div className="flex justify-end no-print">
              <button
                onClick={() => window.print()}
                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex gap-2 hover:bg-black shadow-lg"
              >
                <Download size={20} /> Imprimir Reporte
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
