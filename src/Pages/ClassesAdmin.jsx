import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp, BookOpen, ArrowLeft, Trash2, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClassesAdmin() {
  const [grupos, setGrupos] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      const res = await fetch('/api/admin/alumnos-por-profesor');
      const data = await res.json();
      if (data.success) {
        setGrupos(data.data);
      }
    } catch (error) {
      console.error("Error cargando grupos");
    }
  };

  const toggleGrupo = (id) => {
    setExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  // 🔥 NUEVA FUNCIÓN: Desinscribir (Solo quita de la clase)
  const handleDesinscribir = async (matricula, idProfesor, nombreAlumno) => {
    if (!window.confirm(`¿Seguro que quieres sacar a "${nombreAlumno}" de esta clase?\n(El alumno NO se borrará del sistema, solo de este profesor).`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin/desinscribir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula, id_profesor: idProfesor })
        });

        const data = await res.json();
        
        if (data.success) {
            alert("Alumno desinscrito de la clase.");
            cargarGrupos(); // Recargar la lista para ver cambios
        } else {
            alert("Error al desinscribir.");
        }
    } catch (error) {
        alert("Error de conexión.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 max-w-6xl mx-auto">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Clases</h1>
            <p className="text-slate-500">Administrar listas de alumnos por profesor.</p>
        </div>
        
        <Link 
            to="/admin" 
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105"
        >
            <ArrowLeft size={20}/> Volver al Panel
        </Link>
      </div>

      <div className="grid gap-4">
        {grupos.map((grupo) => (
          <div key={grupo.id_profesor} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* CABECERA GRUPO */}
            <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"
                onClick={() => toggleGrupo(grupo.id_profesor)}
            >
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                        <BookOpen size={24}/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{grupo.nombre} {grupo.apellidos}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Users size={14}/> {grupo.alumnos.length} Alumnos Inscritos
                        </p>
                    </div>
                </div>
                {expanded[grupo.id_profesor] ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
            </div>

            {/* LISTA DE ALUMNOS */}
            {expanded[grupo.id_profesor] && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    {grupo.alumnos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {grupo.alumnos.map(alum => (
                                <div key={alum.id_alumno} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{alum.nombre}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 rounded">{alum.matricula}</p>
                                            {alum.rfid_uid ? (
                                                <span className="w-2 h-2 rounded-full bg-green-500" title="Tarjeta OK"></span>
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-red-300" title="Sin Tarjeta"></span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 🔥 BOTÓN DESINSCRIBIR (Solo quita de esta clase) */}
                                    <button 
                                        onClick={() => handleDesinscribir(alum.matricula, grupo.id_profesor, alum.nombre)}
                                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
                                        title="Quitar alumno de esta clase (No borrar del sistema)"
                                    >
                                        <UserMinus size={18}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 text-sm italic py-4">Este profesor no tiene alumnos inscritos actualmente.</p>
                    )}
                </div>
            )}
          </div>
        ))}
        
        {grupos.length === 0 && (
            <div className="text-center p-12 text-slate-400 bg-white rounded-xl border border-dashed">
                No hay grupos o profesores registrados.
            </div>
        )}
      </div>
    </div>
  );
}