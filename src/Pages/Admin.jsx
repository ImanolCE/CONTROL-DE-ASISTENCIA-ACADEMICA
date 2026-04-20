import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Save, X, Users, GraduationCap, Trash2, Monitor, Search, BookOpen, ArrowRight, FileBarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminReports from './AdminReports';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('profesores');
  const [listaProfesores, setListaProfesores] = useState([]);
  const [listaAlumnos, setListaAlumnos] = useState([]); 
  const [filtro, setFiltro] = useState("");

  const [nuevoProfe, setNuevoProfe] = useState({ nombre: '', apellidos: '', shortname: '', num_empleado: '', email: '' });
  
  // Estado reutilizable para edición (funciona tanto para profes como alumnos)
  const [editando, setEditando] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});

  useEffect(() => {
    if (activeTab === 'profesores') cargarProfesores();
    if (activeTab === 'alumnos') cargarTodosLosAlumnos();
    setEditando(null); // Limpiar edición al cambiar de pestaña
  }, [activeTab]);

  const cargarProfesores = async () => { 
    try { 
        // 🔥 ACTUALIZADO: Ruta relativa
        const res = await fetch('/api/admin/profesores'); 
        const data = await res.json(); 
        if (data.data) setListaProfesores(data.data); 
    } catch(e) {}
  };
  
  const cargarTodosLosAlumnos = async () => { 
    try { 
        // 🔥 ACTUALIZADO: Ruta relativa
        const res = await fetch('/api/admin/todos-alumnos'); 
        const data = await res.json(); 
        if (data.data) setListaAlumnos(data.data); 
    } catch(e) {}
  };

  const handleCrearProfe = async (e) => {
    e.preventDefault();
    if (nuevoProfe.num_empleado.length !== 6) return alert("El número de empleado debe tener 6 dígitos.");
    try {
        // 🔥 ACTUALIZADO: Ruta relativa
        const res = await fetch('/api/profesores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoProfe) });
        const data = await res.json();
        if (data.success) { 
            alert("Profesor creado!"); 
            setNuevoProfe({ nombre: '', apellidos: '', shortname: '', num_empleado: '', email: '' }); 
            cargarProfesores(); 
        } else alert("Error: " + data.error);
    } catch (e) { alert("Error de conexión"); }
  };

  const handleEliminar = async (id, tipo) => {
    if (!window.confirm("¿Eliminar registro?")) return;
    // 🔥 ACTUALIZADO: Rutas relativas en el ternario
    const endpoint = tipo === 'profesor' ? `/api/admin/eliminar-profesor/${id}` : `/api/admin/eliminar-alumno/${id}`; 
    try {
        const res = await fetch(endpoint, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { 
            alert("Eliminado."); 
            tipo === 'profesor' ? cargarProfesores() : cargarTodosLosAlumnos(); 
        }
    } catch (e) { alert("Error al eliminar"); }
  };

  // Guardar edición de ALUMNO
  const guardarEdicionAlumno = async () => {
    if (!(/^20\d{8}$/.test(datosEditados.matricula))) return alert("Matrícula inválida.");
    try {
        // 🔥 ACTUALIZADO: Ruta relativa
        const res = await fetch('/api/admin/editar-alumno', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosEditados) });
        if ((await res.json()).success) { alert("Alumno actualizado"); setEditando(null); cargarTodosLosAlumnos(); }
    } catch (e) { alert("Error"); }
  };

  // Guardar edición de PROFESOR
  const guardarEdicionProfe = async () => {
    if (datosEditados.num_empleado.length < 5) return alert("Num. Empleado inválido");
    try {
        // 🔥 ACTUALIZADO: Ruta relativa
        const res = await fetch('/api/admin/editar-profesor', { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(datosEditados) 
        });
        const data = await res.json();
        if (data.success) { 
            alert("Profesor actualizado"); 
            setEditando(null); 
            cargarProfesores(); 
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) { alert("Error de conexión"); }
  };

  const alumnosFiltrados = listaAlumnos.filter(a => a.nombre.toLowerCase().includes(filtro.toLowerCase()) || a.matricula.includes(filtro));

  return (
    <div className="space-y-6 animate-fade-in p-4 max-w-6xl mx-auto">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-slate-500">Gestión General del Sistema</p>
        </div>
        
        <Link to="/admin/clases" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105">
            <BookOpen size={20}/> Gestión de Grupos <ArrowRight size={18}/>
        </Link>
      </div>
      
      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-4 border-b pb-1 overflow-x-auto">
        <button onClick={() => setActiveTab('profesores')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${activeTab==='profesores'?'bg-blue-600 text-white shadow-md':'bg-white text-slate-600 hover:bg-slate-50'}`}><GraduationCap size={20}/> Profesores</button>
        <button onClick={() => setActiveTab('alumnos')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${activeTab==='alumnos'?'bg-blue-600 text-white shadow-md':'bg-white text-slate-600 hover:bg-slate-50'}`}><Users size={20}/> Catálogo Alumnos</button>
        <button onClick={() => setActiveTab('afluencia')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${activeTab==='afluencia'?'bg-indigo-600 text-white shadow-md':'bg-white text-slate-600 hover:bg-slate-50'}`}><FileBarChart size={20}/> Reporte Afluencia</button>
      </div>

      {/* --- TAB: PROFESORES --- */}
      {activeTab === 'profesores' && (
        <div className="space-y-8 animate-fade-in-up">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><UserPlus className="text-blue-600"/> Registrar Nuevo Profesor</h2>
             <form onSubmit={handleCrearProfe} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border p-2 rounded" placeholder="Nombre(s)" required value={nuevoProfe.nombre} onChange={e=>setNuevoProfe({...nuevoProfe, nombre: e.target.value})}/>
                <input className="border p-2 rounded" placeholder="Apellidos" required value={nuevoProfe.apellidos} onChange={e=>setNuevoProfe({...nuevoProfe, apellidos: e.target.value})}/>
                <div className="flex flex-col"><input className="border p-2 rounded" placeholder="Nombre Pantalla (Ej: ProfeJuan)" maxLength={10} value={nuevoProfe.shortname} onChange={e=>setNuevoProfe({...nuevoProfe, shortname: e.target.value})}/><span className="text-xs text-slate-400 ml-1">Máx 10 letras (IoT)</span></div>
                <input className="border p-2 rounded" placeholder="Num. Empleado (6 dígitos)" required maxLength={6} value={nuevoProfe.num_empleado} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setNuevoProfe({...nuevoProfe, num_empleado: val}); }}/>
                <input className="border p-2 rounded" placeholder="Email" type="email" value={nuevoProfe.email} onChange={e=>setNuevoProfe({...nuevoProfe, email: e.target.value})}/>
                <button className="col-span-1 md:col-span-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded font-bold transition shadow-md">Guardar Profesor</button>
             </form>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold mb-4 text-slate-800">Profesores Registrados</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 uppercase text-slate-600">
                        <tr><th>ID Emp.</th><th>Nombre(s)</th><th>Apellidos</th><th>Pantalla</th><th>Email</th><th className="text-right">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {listaProfesores.map(p=>(
                            <tr key={p.id_profesor} className="hover:bg-slate-50">
                                {editando === p.id_profesor ? (
                                    <>
                                            <td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.num_empleado} onChange={e=>setDatosEditados({...datosEditados, num_empleado:e.target.value})}/></td>
                                            <td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.nombre} onChange={e=>setDatosEditados({...datosEditados, nombre:e.target.value})}/></td>
                                            <td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.apellidos} onChange={e=>setDatosEditados({...datosEditados, apellidos:e.target.value})}/></td>
                                            <td className="p-2"><input className="border p-1 w-full rounded" maxLength={10} value={datosEditados.shortname} onChange={e=>setDatosEditados({...datosEditados, shortname:e.target.value})}/></td>
                                            <td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.email} onChange={e=>setDatosEditados({...datosEditados, email:e.target.value})}/></td>
                                            <td className="p-2 text-right flex justify-end gap-2">
                                                <button onClick={guardarEdicionProfe}><Save size={18} className="text-green-600"/></button>
                                                <button onClick={()=>setEditando(null)}><X size={18} className="text-red-600"/></button>
                                            </td>
                                    </>
                                ) : (
                                    <>
                                            <td className="px-4 py-3 font-bold text-slate-700">{p.num_empleado}</td>
                                            <td className="px-4 py-3">{p.nombre}</td>
                                            <td className="px-4 py-3">{p.apellidos}</td>
                                            <td className="px-4 py-3"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-mono">{p.shortname || '-'}</span></td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{p.email}</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={()=>{setEditando(p.id_profesor); setDatosEditados({...p});}} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                                <button onClick={()=>handleEliminar(p.id_profesor, 'profesor')} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                            </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
           </div>
        </div>
      )}

      {/* --- TAB: ALUMNOS --- */}
      {activeTab === 'alumnos' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-2"><Search className="text-slate-400" /><input type="text" placeholder="Buscar por nombre o matrícula..." className="w-full outline-none text-slate-700" value={filtro} onChange={e => setFiltro(e.target.value)}/></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-bold text-slate-800">Directorio General</h2><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">{alumnosFiltrados.length} Alumnos</span></div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 uppercase sticky top-0"><tr><th>Matrícula</th><th>Tarjeta</th><th>Nombre</th><th className="text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {alumnosFiltrados.map(a => (
                            <tr key={a.id_alumno} className="hover:bg-slate-50">
                                {editando === a.id_alumno ? (
                                    <><td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.matricula} onChange={e=>setDatosEditados({...datosEditados, matricula:e.target.value})}/></td><td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.rfid_uid} onChange={e=>setDatosEditados({...datosEditados, rfid_uid:e.target.value})}/></td><td className="p-2"><input className="border p-1 w-full rounded" value={datosEditados.nombre} onChange={e=>setDatosEditados({...datosEditados, nombre:e.target.value})}/></td><td className="text-right flex justify-end gap-1"><button onClick={guardarEdicionAlumno}><Save size={16} className="text-green-600"/></button><button onClick={()=>setEditando(null)}><X size={16} className="text-red-600"/></button></td></>
                                ) : (
                                    <><td className="px-4 py-2 font-bold">{a.matricula}</td><td className="px-4 py-2 font-mono text-xs text-blue-600 bg-blue-50 w-fit rounded px-2">{a.rfid_uid||'No'}</td><td>{a.nombre}</td><td className="text-right flex justify-end gap-2"><button onClick={()=>{setEditando(a.id_alumno); setDatosEditados({...a});}} className="text-blue-500 hover:text-blue-700"><Edit size={16}/></button><button onClick={()=>handleEliminar(a.id_alumno, 'alumno')} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td></>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: AFLUENCIA --- */}
      {activeTab === 'afluencia' && <div className="animate-fade-in-up"><AdminReports /></div>}

    </div>
  );
}