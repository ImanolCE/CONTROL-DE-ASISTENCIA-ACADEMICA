import React, { useState } from 'react';
import { Search, Download, BarChart2, UserCheck, Users, GraduationCap } from 'lucide-react';

export default function AdminReports() {
  const hoy = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(hoy);
  const [endDate, setEndDate] = useState(hoy);
  
  // Estado para guardar las dos listas
  const [dataAlumnos, setDataAlumnos] = useState([]);
  const [dataProfes, setDataProfes] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('alumnos'); // 'alumnos' o 'profesores'

  const handleBuscar = async () => {
    setLoading(true);
    try {
      // Usamos 127.0.0.1 para evitar errores de conexión
      const res = await fetch('/api/admin/reporte-afluencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicio: startDate, fechaFin: endDate })
      });
      const result = await res.json();
      if (result.success) {
        setDataAlumnos(result.alumnos);
        setDataProfes(result.profesores);
      }
    } catch (e) { console.error(e); alert("Error de conexión con el servidor"); }
    finally { setLoading(false); setSearched(true); }
  };

  const datosActuales = activeTab === 'alumnos' ? dataAlumnos : dataProfes;
  
  const totalPersonas = datosActuales.length;
  const promedioActividad = totalPersonas > 0 
    ? (datosActuales.reduce((acc, curr) => acc + curr.total_actividad, 0) / totalPersonas).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER INTERNO */}
      <div className="flex justify-between items-center no-print">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Reporte de Afluencia</h2>
            <p className="text-slate-500 text-sm">Registro de entradas al edificio.</p>
        </div>
      </div>

      {/* FILTROS DE FECHA */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div><label className="text-sm font-bold text-slate-700">Desde</label><input type="date" className="w-full p-2 border rounded-lg bg-white" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
          <div><label className="text-sm font-bold text-slate-700">Hasta</label><input type="date" className="w-full p-2 border rounded-lg bg-white" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
          <button onClick={handleBuscar} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center gap-2 transition shadow-sm">
            {loading ? 'Cargando...' : <><Search size={18}/> Generar</>}
          </button>
        </div>
      </div>

      {searched && (
        <div className="space-y-6">
          
          {/* PESTAÑAS INTERNAS (Sub-tabs) */}
          <div className="flex gap-2 border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('alumnos')}
                className={`pb-2 px-4 font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'alumnos' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-indigo-500'}`}
            >
                <Users size={18}/> Alumnos
                <span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs">{dataAlumnos.length}</span>
            </button>
            <button 
                onClick={() => setActiveTab('profesores')}
                className={`pb-2 px-4 font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'profesores' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-blue-500'}`}
            >
                <GraduationCap size={18}/> Profesores
                <span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs">{dataProfes.length}</span>
            </button>
          </div>

          {/* TARJETAS RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Total {activeTab === 'alumnos' ? 'Alumnos' : 'Profesores'}</p>
                    <p className={`text-3xl font-bold mt-1 ${activeTab === 'alumnos' ? 'text-indigo-600' : 'text-blue-600'}`}>{totalPersonas}</p>
                </div>
                <div className={`p-3 rounded-full ${activeTab === 'alumnos' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                    <UserCheck size={24}/>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Promedio Actividad</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{promedioActividad}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-full text-green-600"><BarChart2 size={24}/></div>
            </div>
          </div>

          {/* TABLA */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">Detalle de Registros</h3>
                {datosActuales.length > 0 && <button onClick={()=>window.print()} className="text-blue-600 hover:text-blue-800 font-bold text-xs flex gap-1"><Download size={14}/> IMPRIMIR</button>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 border-b uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">{activeTab === 'alumnos' ? 'Matrícula' : 'No. Empleado'}</th>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3 text-center">{activeTab === 'alumnos' ? 'Clases' : 'Sesiones'}</th>
                            <th className="px-6 py-3">Horas Entrada</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {datosActuales.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Sin datos para mostrar.</td></tr>
                        ) : (
                            datosActuales.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-500">{row.fecha}</td>
                                    <td className="px-6 py-3 font-mono font-bold text-slate-700">{row.id}</td>
                                    <td className="px-6 py-3 font-medium text-blue-600">{row.nombre}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.total_actividad >= 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {row.total_actividad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                        {row.horas ? row.horas.split(',').join(' • ') : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}