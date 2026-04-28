import React, { useState, useEffect } from 'react';
//import { UserPlus, Edit, Save, X, Users, GraduationCap, Trash2, Monitor, Search, BookOpen, ArrowRight, FileBarChart } from 'lucide-react';
import {
  UserPlus,
  Edit,
  Save,
  X,
  Users,
  GraduationCap,
  Trash2,
  Monitor,
  Search,
  BookOpen,
  ArrowRight,
  FileBarChart,
  CalendarDays,
  CheckCircle2,
  Library,
  Layers3,
  ClipboardList,
  Clock3
} from 'lucide-react';
//import { Link } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import AdminReports from './AdminReports';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('profesores');
  const [listaProfesores, setListaProfesores] = useState([]);
  const [listaAlumnos, setListaAlumnos] = useState([]); 
  const [filtro, setFiltro] = useState("");
  

  const navigate = useNavigate();

  const [nuevoProfe, setNuevoProfe] = useState({ nombre: '', apellidos: '', shortname: '', num_empleado: '', email: '' });
  
  // Estado reutilizable para edición (funciona tanto para profes como alumnos)
  const [editando, setEditando] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});

  const [listaCuatrimestres, setListaCuatrimestres] = useState([]);
  const [nuevoCuatrimestre, setNuevoCuatrimestre] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: ''
    });

  const [editandoCuatrimestre, setEditandoCuatrimestre] = useState(null);
  const [cuatrimestreEditado, setCuatrimestreEditado] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: ''
   });

     const [listaMaterias, setListaMaterias] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);
  const [listaAsignaciones, setListaAsignaciones] = useState([]);
  const [listaHorarios, setListaHorarios] = useState([]);

  const [nuevaMateria, setNuevaMateria] = useState({
    clave: '',
    nombre: '',
    horas_asignatura: ''
  });

  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: '',
    turno: ''
  });

  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    id_profesor: '',
    id_cuatrimestre: '',
    id_materia: '',
    id_grupo: '',
    activo: 1
  });

  const [nuevoHorario, setNuevoHorario] = useState({
    id_asignacion: '',
    dia_semana: 'LUNES',
    hora_inicio: '',
    hora_fin: '',
    tipo_sesion: 'CLASE',
    aula: ''
  });

  const [editandoMateria, setEditandoMateria] = useState(null);
  const [materiaEditada, setMateriaEditada] = useState({
    clave: '',
    nombre: '',
    horas_asignatura: ''
  });

  const [editandoGrupo, setEditandoGrupo] = useState(null);
  const [grupoEditado, setGrupoEditado] = useState({
    nombre: '',
    turno: ''
  });

  const [editandoAsignacion, setEditandoAsignacion] = useState(null);
  const [asignacionEditada, setAsignacionEditada] = useState({
    id_profesor: '',
    id_cuatrimestre: '',
    id_materia: '',
    id_grupo: '',
    activo: 1
  });

  const [editandoHorario, setEditandoHorario] = useState(null);
  const [horarioEditado, setHorarioEditado] = useState({
    id_asignacion: '',
    dia_semana: 'LUNES',
    hora_inicio: '',
    hora_fin: '',
    tipo_sesion: 'CLASE',
    aula: ''
  });

    useEffect(() => {
    if (activeTab === 'profesores') cargarProfesores();
    if (activeTab === 'alumnos') cargarTodosLosAlumnos();
    if (activeTab === 'cuatrimestres') cargarCuatrimestres();
    if (activeTab === 'materias') cargarMaterias();
    if (activeTab === 'grupos') cargarGrupos();
    if (activeTab === 'asignaciones') {
      cargarAsignaciones();
      cargarProfesores();
      cargarCuatrimestres();
      cargarMaterias();
      cargarGrupos();
    }
    if (activeTab === 'horarios') {
      cargarHorarios();
      cargarAsignaciones();
    }

    setEditando(null);
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

  const cargarCuatrimestres = async () => {
  try {
    const res = await fetch('/api/admin/cuatrimestres');
    const data = await res.json();
    if (data.success) {
      setListaCuatrimestres(data.data || []);
    }
  } catch (e) {
    alert('Error cargando cuatrimestres');
  }
};

const handleCrearCuatrimestre = async (e) => {
  e.preventDefault();

  if (!nuevoCuatrimestre.nombre || !nuevoCuatrimestre.fecha_inicio || !nuevoCuatrimestre.fecha_fin) {
    return alert('Completa todos los campos del cuatrimestre');
  }

  try {
    const res = await fetch('/api/admin/cuatrimestres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoCuatrimestre)
    });

    const data = await res.json();

    if (data.success) {
      alert('Cuatrimestre creado correctamente');
      setNuevoCuatrimestre({ nombre: '', fecha_inicio: '', fecha_fin: '' });
      cargarCuatrimestres();
    } else {
      alert(data.message || data.error || 'No se pudo crear el cuatrimestre');
    }
  } catch (e) {
    alert('Error de conexión al crear cuatrimestre');
  }
};

const hacerCuatrimestreActual = async (id) => {
  try {
    const res = await fetch(`/api/admin/cuatrimestres/${id}/actual`, {
      method: 'PUT'
    });

    const data = await res.json();

    if (data.success) {
      alert('Cuatrimestre actual actualizado');
      cargarCuatrimestres();
    } else {
      alert(data.message || data.error || 'No se pudo actualizar');
    }
  } catch (e) {
    alert('Error de conexión al actualizar cuatrimestre');
  }
};


const iniciarEdicionCuatrimestre = (c) => {
  setEditandoCuatrimestre(c.id);
  setCuatrimestreEditado({
    nombre: c.nombre,
    fecha_inicio: c.fecha_inicio?.slice(0, 10) || '',
    fecha_fin: c.fecha_fin?.slice(0, 10) || ''
  });
};

const cancelarEdicionCuatrimestre = () => {
  setEditandoCuatrimestre(null);
  setCuatrimestreEditado({ nombre: '', fecha_inicio: '', fecha_fin: '' });
};

const guardarEdicionCuatrimestre = async (id) => {
  try {
    const res = await fetch(`/api/admin/cuatrimestres/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuatrimestreEditado)
    });

    const data = await res.json();

    if (data.success) {
      alert('Cuatrimestre actualizado correctamente');
      cancelarEdicionCuatrimestre();
      cargarCuatrimestres();
    } else {
      alert(data.message || data.error || 'No se pudo actualizar');
    }
  } catch (e) {
    alert('Error de conexión al actualizar cuatrimestre');
  }
};

const eliminarCuatrimestre = async (id) => {
  if (!window.confirm('¿Seguro que deseas eliminar este cuatrimestre?')) return;

  try {
    const res = await fetch(`/api/admin/cuatrimestres/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (data.success) {
      alert('Cuatrimestre eliminado correctamente');
      cargarCuatrimestres();
    } else {
      alert(data.message || data.error || 'No se pudo eliminar');
    }
  } catch (e) {
    alert('Error de conexión al eliminar cuatrimestre');
  }
};


  // =========================
  // MATERIAS
  // =========================
  const cargarMaterias = async () => {
    try {
      const res = await fetch('/api/admin/materias');
      const data = await res.json();
      if (data.success) setListaMaterias(data.data || []);
    } catch (e) {
      alert('Error cargando materias');
    }
  };

  const handleCrearMateria = async (e) => {
    e.preventDefault();
    if (!nuevaMateria.nombre) return alert('El nombre de la materia es obligatorio');

    try {
      const res = await fetch('/api/admin/materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaMateria)
      });

      const data = await res.json();
      if (data.success) {
        alert('Materia creada correctamente');
        setNuevaMateria({ clave: '', nombre: '', horas_asignatura: '' });
        cargarMaterias();
      } else {
        alert(data.message || data.error || 'No se pudo crear la materia');
      }
    } catch (e) {
      alert('Error de conexión al crear materia');
    }
  };

  const iniciarEdicionMateria = (m) => {
    setEditandoMateria(m.id_materia);
    setMateriaEditada({
      clave: m.clave || '',
      nombre: m.nombre || '',
      horas_asignatura: m.horas_asignatura || ''
    });
  };

  const cancelarEdicionMateria = () => {
    setEditandoMateria(null);
    setMateriaEditada({ clave: '', nombre: '', horas_asignatura: '' });
  };

  const guardarEdicionMateria = async (id) => {
    try {
      const res = await fetch(`/api/admin/materias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materiaEditada)
      });

      const data = await res.json();
      if (data.success) {
        alert('Materia actualizada correctamente');
        cancelarEdicionMateria();
        cargarMaterias();
      } else {
        alert(data.message || data.error || 'No se pudo actualizar la materia');
      }
    } catch (e) {
      alert('Error de conexión al actualizar materia');
    }
  };

  const eliminarMateria = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta materia?')) return;

    try {
      const res = await fetch(`/api/admin/materias/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Materia eliminada correctamente');
        cargarMaterias();
      } else {
        alert(data.message || data.error || 'No se pudo eliminar la materia');
      }
    } catch (e) {
      alert('Error de conexión al eliminar materia');
    }
  };

  // =========================
  // GRUPOS
  // =========================
  const cargarGrupos = async () => {
    try {
      const res = await fetch('/api/admin/grupos');
      const data = await res.json();
      if (data.success) setListaGrupos(data.data || []);
    } catch (e) {
      alert('Error cargando grupos');
    }
  };

  const handleCrearGrupo = async (e) => {
  e.preventDefault();

  if (!nuevoGrupo.nombre.trim()) {
    return alert('El nombre del grupo es obligatorio');
  }

  if (!nuevoGrupo.turno || nuevoGrupo.turno === 'Selecciona turno') {
    return alert('Debes seleccionar un turno válido');
  }

  try {
    const res = await fetch('/api/admin/grupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoGrupo)
    });

    const data = await res.json();
    if (data.success) {
      alert('Grupo creado correctamente');
      setNuevoGrupo({ nombre: '', turno: '' });
      cargarGrupos();
    } else {
      alert(data.message || data.error || 'No se pudo crear el grupo');
    }
  } catch (e) {
    alert('Error de conexión al crear grupo');
  }
};

  const iniciarEdicionGrupo = (g) => {
    setEditandoGrupo(g.id_grupo);
    setGrupoEditado({
      nombre: g.nombre || '',
      turno: g.turno || ''
    });
  };

  const cancelarEdicionGrupo = () => {
    setEditandoGrupo(null);
    setGrupoEditado({ nombre: '', turno: '' });
  };

  const guardarEdicionGrupo = async (id) => {
  if (!grupoEditado.nombre.trim()) {
    return alert('El nombre del grupo es obligatorio');
  }

  if (!grupoEditado.turno || grupoEditado.turno === 'Selecciona turno') {
    return alert('Debes seleccionar un turno válido');
  }

  try {
    const res = await fetch(`/api/admin/grupos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grupoEditado)
    });

    const data = await res.json();
    if (data.success) {
      alert('Grupo actualizado correctamente');
      cancelarEdicionGrupo();
      cargarGrupos();
    } else {
      alert(data.message || data.error || 'No se pudo actualizar el grupo');
    }
  } catch (e) {
    alert('Error de conexión al actualizar grupo');
  }
};

  const eliminarGrupo = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este grupo?')) return;

    try {
      const res = await fetch(`/api/admin/grupos/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Grupo eliminado correctamente');
        cargarGrupos();
      } else {
        alert(data.message || data.error || 'No se pudo eliminar el grupo');
      }
    } catch (e) {
      alert('Error de conexión al eliminar grupo');
    }
  };

  // =========================
  // ASIGNACIONES
  // =========================
  const cargarAsignaciones = async () => {
    try {
      const res = await fetch('/api/admin/asignaciones');
      const data = await res.json();
      if (data.success) setListaAsignaciones(data.data || []);
    } catch (e) {
      alert('Error cargando asignaciones');
    }
  };

  const handleCrearAsignacion = async (e) => {
    e.preventDefault();

    if (!nuevaAsignacion.id_profesor || !nuevaAsignacion.id_cuatrimestre || !nuevaAsignacion.id_materia || !nuevaAsignacion.id_grupo) {
      return alert('Completa todos los campos de la asignación');
    }

    try {
      const res = await fetch('/api/admin/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaAsignacion,
          activo: Number(nuevaAsignacion.activo)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Asignación creada correctamente');
        setNuevaAsignacion({
          id_profesor: '',
          id_cuatrimestre: '',
          id_materia: '',
          id_grupo: '',
          activo: 1
        });
        cargarAsignaciones();
      } else {
        alert(data.message || data.error || 'No se pudo crear la asignación');
      }
    } catch (e) {
      alert('Error de conexión al crear asignación');
    }
  };

  const iniciarEdicionAsignacion = (a) => {
    setEditandoAsignacion(a.id_asignacion);
    setAsignacionEditada({
      id_profesor: a.id_profesor,
      id_cuatrimestre: a.id_cuatrimestre,
      id_materia: a.id_materia,
      id_grupo: a.id_grupo,
      activo: Number(a.activo)
    });
  };

  const cancelarEdicionAsignacion = () => {
    setEditandoAsignacion(null);
    setAsignacionEditada({
      id_profesor: '',
      id_cuatrimestre: '',
      id_materia: '',
      id_grupo: '',
      activo: 1
    });
  };

  const guardarEdicionAsignacion = async (id) => {
    try {
      const res = await fetch(`/api/admin/asignaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...asignacionEditada,
          activo: Number(asignacionEditada.activo)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Asignación actualizada correctamente');
        cancelarEdicionAsignacion();
        cargarAsignaciones();
      } else {
        alert(data.message || data.error || 'No se pudo actualizar la asignación');
      }
    } catch (e) {
      alert('Error de conexión al actualizar asignación');
    }
  };

  const eliminarAsignacion = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta asignación?')) return;

    try {
      const res = await fetch(`/api/admin/asignaciones/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Asignación eliminada correctamente');
        cargarAsignaciones();
      } else {
        alert(data.message || data.error || 'No se pudo eliminar la asignación');
      }
    } catch (e) {
      alert('Error de conexión al eliminar asignación');
    }
  };

  // =========================
  // HORARIOS
  // =========================
  const cargarHorarios = async () => {
    try {
      const res = await fetch('/api/admin/horarios');
      const data = await res.json();
      if (data.success) setListaHorarios(data.data || []);
    } catch (e) {
      alert('Error cargando horarios');
    }
  };

  const handleCrearHorario = async (e) => {
    e.preventDefault();

    if (!nuevoHorario.id_asignacion || !nuevoHorario.dia_semana || !nuevoHorario.hora_inicio || !nuevoHorario.hora_fin || !nuevoHorario.tipo_sesion) {
      return alert('Completa todos los campos del horario');
    }

    try {
      const res = await fetch('/api/admin/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoHorario)
      });

      const data = await res.json();
      if (data.success) {
        alert('Horario creado correctamente');
        setNuevoHorario({
          id_asignacion: '',
          dia_semana: 'LUNES',
          hora_inicio: '',
          hora_fin: '',
          tipo_sesion: 'CLASE',
          aula: ''
        });
        cargarHorarios();
      } else {
        alert(data.message || data.error || 'No se pudo crear el horario');
      }
    } catch (e) {
      alert('Error de conexión al crear horario');
    }
  };

  const iniciarEdicionHorario = (h) => {
    setEditandoHorario(h.id_horario);
    setHorarioEditado({
      id_asignacion: h.id_asignacion,
      dia_semana: h.dia_semana,
      hora_inicio: String(h.hora_inicio).slice(0, 5),
      hora_fin: String(h.hora_fin).slice(0, 5),
      tipo_sesion: h.tipo_sesion,
      aula: h.aula || ''
    });
  };

  const cancelarEdicionHorario = () => {
    setEditandoHorario(null);
    setHorarioEditado({
      id_asignacion: '',
      dia_semana: 'LUNES',
      hora_inicio: '',
      hora_fin: '',
      tipo_sesion: 'CLASE',
      aula: ''
    });
  };

  const guardarEdicionHorario = async (id) => {
    try {
      const res = await fetch(`/api/horarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horarioEditado)
      });

      const data = await res.json();
      if (data.success) {
        alert('Horario actualizado correctamente');
        cancelarEdicionHorario();
        cargarHorarios();
      } else {
        alert(data.message || data.error || 'No se pudo actualizar el horario');
      }
    } catch (e) {
      alert('Error de conexión al actualizar horario');
    }
  };

  const eliminarHorario = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este horario?')) return;

    try {
      const res = await fetch(`/api/horarios/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Horario eliminado correctamente');
        cargarHorarios();
      } else {
        alert(data.message || data.error || 'No se pudo eliminar el horario');
      }
    } catch (e) {
      alert('Error de conexión al eliminar horario');
    }
  };


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
      <div className="flex gap-4 border-b pb-1 overflow-x-auto flex-wrap">
        <button
            onClick={() => setActiveTab('profesores')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'profesores'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <GraduationCap size={20} /> Profesores
        </button>

        <button
            onClick={() => setActiveTab('alumnos')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'alumnos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Users size={20} /> Catálogo Alumnos
        </button>

        <button
            onClick={() => navigate('/admin/sessions')}
            className="flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap bg-white text-slate-600 hover:bg-slate-50"
        >
            <Monitor size={20} /> Sesiones
        </button>

        <button
            onClick={() => setActiveTab('afluencia')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'afluencia'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <FileBarChart size={20} /> Reporte Afluencia
        </button>

        <button
            onClick={() => setActiveTab('cuatrimestres')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'cuatrimestres'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <CalendarDays size={20} /> Cuatrimestres
        </button>

        <button
            onClick={() => setActiveTab('materias')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'materias'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Library size={20} /> Materias
        </button>

        <button
            onClick={() => setActiveTab('grupos')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'grupos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Layers3 size={20} /> Grupos
        </button>

        <button
            onClick={() => setActiveTab('asignaciones')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'asignaciones'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <ClipboardList size={20} /> Asignaciones
        </button>

        <button
            onClick={() => setActiveTab('horarios')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'horarios'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Clock3 size={20} /> Horarios
        </button>
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

      {/* --- TAB: CUATRIMESTRES --- */}
      {activeTab === 'cuatrimestres' && (
     <div className="space-y-8 animate-fade-in-up">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarDays className="text-emerald-600" />
            Registrar Nuevo Cuatrimestre
        </h2>

        <form onSubmit={handleCrearCuatrimestre} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
            className="border p-2 rounded"
            placeholder="Nombre (Ej: Ene-Abr 2026)"
            value={nuevoCuatrimestre.nombre}
            onChange={(e) => setNuevoCuatrimestre({ ...nuevoCuatrimestre, nombre: e.target.value })}
            required
            />

            <div className="flex flex-col">
            <label className="text-sm text-slate-500 mb-1">Fecha inicio</label>
            <input
                type="date"
                className="border p-2 rounded"
                value={nuevoCuatrimestre.fecha_inicio}
                onChange={(e) => setNuevoCuatrimestre({ ...nuevoCuatrimestre, fecha_inicio: e.target.value })}
                required
            />
            </div>

            <div className="flex flex-col">
            <label className="text-sm text-slate-500 mb-1">Fecha fin</label>
            <input
                type="date"
                className="border p-2 rounded"
                value={nuevoCuatrimestre.fecha_fin}
                onChange={(e) => setNuevoCuatrimestre({ ...nuevoCuatrimestre, fecha_fin: e.target.value })}
                required
            />
            </div>

            <button className="md:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-bold transition shadow-md">
            Guardar Cuatrimestre
            </button>
        </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Cuatrimestres Registrados</h2>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
            {listaCuatrimestres.length} registros
            </span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 uppercase text-slate-600">
                <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Inicio</th>
                <th className="p-3">Fin</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
                </tr>
            </thead>
                <tbody className="divide-y divide-slate-100">
                    {listaCuatrimestres.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                        {editandoCuatrimestre === c.id ? (
                            <>
                            <td className="p-3">
                                <input
                                className="border p-2 rounded w-full"
                                value={cuatrimestreEditado.nombre}
                                onChange={(e) =>
                                    setCuatrimestreEditado({ ...cuatrimestreEditado, nombre: e.target.value })
                                }
                                />
                            </td>
                            <td className="p-3">
                                <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={cuatrimestreEditado.fecha_inicio}
                                onChange={(e) =>
                                    setCuatrimestreEditado({ ...cuatrimestreEditado, fecha_inicio: e.target.value })
                                }
                                />
                            </td>
                            <td className="p-3">
                                <input
                                type="date"
                                className="border p-2 rounded w-full"
                                value={cuatrimestreEditado.fecha_fin}
                                onChange={(e) =>
                                    setCuatrimestreEditado({ ...cuatrimestreEditado, fecha_fin: e.target.value })
                                }
                                />
                            </td>
                            <td className="p-3">
                                {Number(c.es_actual) === 1 ? 'Actual' : 'Histórico'}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                                <button
                                onClick={() => guardarEdicionCuatrimestre(c.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                >
                                Guardar
                                </button>
                                <button
                                onClick={cancelarEdicionCuatrimestre}
                                className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                >
                                Cancelar
                                </button>
                            </td>
                            </>
                        ) : (
                            <>
                            <td className="p-3 font-semibold">{c.nombre}</td>
                            <td className="p-3">{new Date(c.fecha_inicio).toLocaleDateString()}</td>
                            <td className="p-3">{new Date(c.fecha_fin).toLocaleDateString()}</td>
                            <td className="p-3">
                                {Number(c.es_actual) === 1 ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                    <CheckCircle2 size={14} /> Actual
                                </span>
                                ) : (
                                <span className="inline-flex items-center bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                    Histórico
                                </span>
                                )}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                                {Number(c.es_actual) !== 1 && (
                                <button
                                    onClick={() => hacerCuatrimestreActual(c.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                >
                                    Marcar actual
                                </button>
                                )}

                                <button
                                onClick={() => iniciarEdicionCuatrimestre(c)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                >
                                Editar
                                </button>

                                {Number(c.es_actual) !== 1 && (
                                <button
                                    onClick={() => eliminarCuatrimestre(c.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                >
                                    Eliminar
                                </button>
                                )}
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


      {/* --- TAB: MATERIAS --- */}
      {activeTab === 'materias' && (
       <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Library className="text-emerald-600" />
                Registrar Nueva Materia
            </h2>

            <form onSubmit={handleCrearMateria} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                className="border p-2 rounded"
                placeholder="Clave (Ej: MAT101)"
                value={nuevaMateria.clave}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, clave: e.target.value })}
                />
                <input
                className="border p-2 rounded"
                placeholder="Nombre de la materia"
                value={nuevaMateria.nombre}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })}
                required
                />
                <input
                type="number"
                className="border p-2 rounded"
                placeholder="Horas de asignatura"
                value={nuevaMateria.horas_asignatura}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, horas_asignatura: e.target.value })}
                />
                <button className="md:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-bold transition shadow-md">
                Guardar Materia
                </button>
            </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Materias Registradas</h2>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                {listaMaterias.length} registros
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 uppercase text-slate-600">
                    <tr>
                    <th className="p-3">Clave</th>
                    <th className="p-3">Materia</th>
                    <th className="p-3">Horas</th>
                    <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {listaMaterias.map((m) => (
                    <tr key={m.id_materia} className="hover:bg-slate-50">
                        {editandoMateria === m.id_materia ? (
                        <>
                            <td className="p-3">
                            <input className="border p-2 rounded w-full" value={materiaEditada.clave} onChange={(e) => setMateriaEditada({ ...materiaEditada, clave: e.target.value })} />
                            </td>
                            <td className="p-3">
                            <input className="border p-2 rounded w-full" value={materiaEditada.nombre} onChange={(e) => setMateriaEditada({ ...materiaEditada, nombre: e.target.value })} />
                            </td>
                            <td className="p-3">
                            <input type="number" className="border p-2 rounded w-full" value={materiaEditada.horas_asignatura} onChange={(e) => setMateriaEditada({ ...materiaEditada, horas_asignatura: e.target.value })} />
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => guardarEdicionMateria(m.id_materia)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Guardar</button>
                            <button onClick={cancelarEdicionMateria} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                            </td>
                        </>
                        ) : (
                        <>
                            <td className="p-3 font-semibold">{m.clave || '-'}</td>
                            <td className="p-3">{m.nombre}</td>
                            <td className="p-3">{m.horas_asignatura || '-'}</td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => iniciarEdicionMateria(m)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Editar</button>
                            <button onClick={() => eliminarMateria(m.id_materia)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Eliminar</button>
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

      {/* --- TAB: GRUPOS */}
      {activeTab === 'grupos' && (
       <div className="space-y-8 animate-fade-in-up">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers3 className="text-emerald-600" />
            Registrar Nuevo Grupo
        </h2>

        <form onSubmit={handleCrearGrupo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
            className="border p-2 rounded"
            placeholder="Nombre del grupo (Ej: LTI-401)"
            value={nuevoGrupo.nombre}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
            required
            />
            <select
                className="border p-2 rounded"
                value={nuevoGrupo.turno}
                onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, turno: e.target.value })}
                >
                <option value=""disabled>Selecciona turno</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
            </select>
            <button className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-bold transition shadow-md">
            Guardar Grupo
            </button>
        </form>
        </div>

    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Grupos Registrados</h2>
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
          {listaGrupos.length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 uppercase text-slate-600">
            <tr>
              <th className="p-3">Grupo</th>
              <th className="p-3">Turno</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaGrupos.map((g) => (
              <tr key={g.id_grupo} className="hover:bg-slate-50">
                {editandoGrupo === g.id_grupo ? (
                  <>
                    <td className="p-3">
                      <input className="border p-2 rounded w-full" value={grupoEditado.nombre} onChange={(e) => setGrupoEditado({ ...grupoEditado, nombre: e.target.value })} />
                    </td>
                    <td className="p-3">
                      <select
                        className="border p-2 rounded w-full"
                        value={grupoEditado.turno}
                        onChange={(e) => setGrupoEditado({ ...grupoEditado, turno: e.target.value })}
                        >
                        <option value=""disabled>Selecciona turno</option>
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                      </select>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button onClick={() => guardarEdicionGrupo(g.id_grupo)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Guardar</button>
                      <button onClick={cancelarEdicionGrupo} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-semibold">{g.nombre}</td>
                    <td className="p-3">{g.turno || '-'}</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button onClick={() => iniciarEdicionGrupo(g)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Editar</button>
                      <button onClick={() => eliminarGrupo(g.id_grupo)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Eliminar</button>
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

      {/* --- TAB ASIGNACIONES --- */}
       {activeTab === 'asignaciones' && (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ClipboardList className="text-emerald-600" />
                Registrar Nueva Asignación
            </h2>

            <form onSubmit={handleCrearAsignacion} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <select className="border p-2 rounded" value={nuevaAsignacion.id_profesor} onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, id_profesor: e.target.value })}>
                <option value="">Profesor</option>
                {listaProfesores.map((p) => (
                    <option key={p.id_profesor} value={p.id_profesor}>
                    {p.nombre} {p.apellidos}
                    </option>
                ))}
                </select>

                <select className="border p-2 rounded" value={nuevaAsignacion.id_cuatrimestre} onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, id_cuatrimestre: e.target.value })}>
                <option value="">Cuatrimestre</option>
                {listaCuatrimestres.map((c) => (
                    <option key={c.id} value={c.id}>
                    {c.nombre}
                    </option>
                ))}
                </select>

                <select className="border p-2 rounded" value={nuevaAsignacion.id_materia} onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, id_materia: e.target.value })}>
                <option value="">Materia</option>
                {listaMaterias.map((m) => (
                    <option key={m.id_materia} value={m.id_materia}>
                    {m.nombre}
                    </option>
                ))}
                </select>

                <select className="border p-2 rounded" value={nuevaAsignacion.id_grupo} onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, id_grupo: e.target.value })}>
                <option value="">Grupo</option>
                {listaGrupos.map((g) => (
                    <option key={g.id_grupo} value={g.id_grupo}>
                    {g.nombre}
                    </option>
                ))}
                </select>

                <select className="border p-2 rounded" value={nuevaAsignacion.activo} onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, activo: e.target.value })}>
                <option value={1}>Activa</option>
                <option value={0}>Inactiva</option>
                </select>

                <button className="md:col-span-2 xl:col-span-5 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-bold transition shadow-md">
                Guardar Asignación
                </button>
            </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Asignaciones Registradas</h2>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                {listaAsignaciones.length} registros
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 uppercase text-slate-600">
                    <tr>
                    <th className="p-3">Profesor</th>
                    <th className="p-3">Cuatrimestre</th>
                    <th className="p-3">Materia</th>
                    <th className="p-3">Grupo</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {listaAsignaciones.map((a) => (
                    <tr key={a.id_asignacion} className="hover:bg-slate-50">
                        {editandoAsignacion === a.id_asignacion ? (
                        <>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={asignacionEditada.id_profesor} onChange={(e) => setAsignacionEditada({ ...asignacionEditada, id_profesor: e.target.value })}>
                                {listaProfesores.map((p) => (
                                <option key={p.id_profesor} value={p.id_profesor}>
                                    {p.nombre} {p.apellidos}
                                </option>
                                ))}
                            </select>
                            </td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={asignacionEditada.id_cuatrimestre} onChange={(e) => setAsignacionEditada({ ...asignacionEditada, id_cuatrimestre: e.target.value })}>
                                {listaCuatrimestres.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                                ))}
                            </select>
                            </td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={asignacionEditada.id_materia} onChange={(e) => setAsignacionEditada({ ...asignacionEditada, id_materia: e.target.value })}>
                                {listaMaterias.map((m) => (
                                <option key={m.id_materia} value={m.id_materia}>
                                    {m.nombre}
                                </option>
                                ))}
                            </select>
                            </td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={asignacionEditada.id_grupo} onChange={(e) => setAsignacionEditada({ ...asignacionEditada, id_grupo: e.target.value })}>
                                {listaGrupos.map((g) => (
                                <option key={g.id_grupo} value={g.id_grupo}>
                                    {g.nombre}
                                </option>
                                ))}
                            </select>
                            </td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={asignacionEditada.activo} onChange={(e) => setAsignacionEditada({ ...asignacionEditada, activo: e.target.value })}>
                                <option value={1}>Activa</option>
                                <option value={0}>Inactiva</option>
                            </select>
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => guardarEdicionAsignacion(a.id_asignacion)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Guardar</button>
                            <button onClick={cancelarEdicionAsignacion} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                            </td>
                        </>
                        ) : (
                        <>
                            <td className="p-3">{a.profesor}</td>
                            <td className="p-3">{a.cuatrimestre}</td>
                            <td className="p-3">{a.materia}</td>
                            <td className="p-3">{a.grupo}</td>
                            <td className="p-3">
                            {Number(a.activo) === 1 ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Activa</span>
                            ) : (
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Inactiva</span>
                            )}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => iniciarEdicionAsignacion(a)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Editar</button>
                            <button onClick={() => eliminarAsignacion(a.id_asignacion)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Eliminar</button>
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
    

      {/* --- TAB HORARIOS --- */}
      {activeTab === 'horarios' && (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock3 className="text-emerald-600" />
                Registrar Nuevo Horario
            </h2>

            <form onSubmit={handleCrearHorario} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <select className="border p-2 rounded" value={nuevoHorario.id_asignacion} onChange={(e) => setNuevoHorario({ ...nuevoHorario, id_asignacion: e.target.value })}>
                <option value="">Asignación</option>
                {listaAsignaciones.map((a) => (
                    <option key={a.id_asignacion} value={a.id_asignacion}>
                    {a.profesor} | {a.materia} | {a.grupo}
                    </option>
                ))}
                </select>

                <select className="border p-2 rounded" value={nuevoHorario.dia_semana} onChange={(e) => setNuevoHorario({ ...nuevoHorario, dia_semana: e.target.value })}>
                <option value="LUNES">LUNES</option>
                <option value="MARTES">MARTES</option>
                <option value="MIERCOLES">MIERCOLES</option>
                <option value="JUEVES">JUEVES</option>
                <option value="VIERNES">VIERNES</option>
                <option value="SABADO">SABADO</option>
                </select>

                <select className="border p-2 rounded" value={nuevoHorario.tipo_sesion} onChange={(e) => setNuevoHorario({ ...nuevoHorario, tipo_sesion: e.target.value })}>
                <option value="CLASE">CLASE</option>
                <option value="ASESORIA">ASESORIA</option>
                </select>

                <input type="time" className="border p-2 rounded" value={nuevoHorario.hora_inicio} onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })} />
                <input type="time" className="border p-2 rounded" value={nuevoHorario.hora_fin} onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_fin: e.target.value })} />
                <input className="border p-2 rounded" placeholder="Aula / Espacio" value={nuevoHorario.aula} onChange={(e) => setNuevoHorario({ ...nuevoHorario, aula: e.target.value })} />

                <button className="md:col-span-2 xl:col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-bold transition shadow-md">
                Guardar Horario
                </button>
            </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Horarios Registrados</h2>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                {listaHorarios.length} registros
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 uppercase text-slate-600">
                    <tr>
                    <th className="p-3">Profesor</th>
                    <th className="p-3">Materia</th>
                    <th className="p-3">Grupo</th>
                    <th className="p-3">Día</th>
                    <th className="p-3">Inicio</th>
                    <th className="p-3">Fin</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Aula</th>
                    <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {listaHorarios.map((h) => (
                    <tr key={h.id_horario} className="hover:bg-slate-50">
                        {editandoHorario === h.id_horario ? (
                        <>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={horarioEditado.id_asignacion} onChange={(e) => setHorarioEditado({ ...horarioEditado, id_asignacion: e.target.value })}>
                                {listaAsignaciones.map((a) => (
                                <option key={a.id_asignacion} value={a.id_asignacion}>
                                    {a.profesor} | {a.materia} | {a.grupo}
                                </option>
                                ))}
                            </select>
                            </td>
                            <td className="p-3 text-slate-400">—</td>
                            <td className="p-3 text-slate-400">—</td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={horarioEditado.dia_semana} onChange={(e) => setHorarioEditado({ ...horarioEditado, dia_semana: e.target.value })}>
                                <option value="LUNES">LUNES</option>
                                <option value="MARTES">MARTES</option>
                                <option value="MIERCOLES">MIERCOLES</option>
                                <option value="JUEVES">JUEVES</option>
                                <option value="VIERNES">VIERNES</option>
                                <option value="SABADO">SABADO</option>
                            </select>
                            </td>
                            <td className="p-3">
                            <input type="time" className="border p-2 rounded w-full" value={horarioEditado.hora_inicio} onChange={(e) => setHorarioEditado({ ...horarioEditado, hora_inicio: e.target.value })} />
                            </td>
                            <td className="p-3">
                            <input type="time" className="border p-2 rounded w-full" value={horarioEditado.hora_fin} onChange={(e) => setHorarioEditado({ ...horarioEditado, hora_fin: e.target.value })} />
                            </td>
                            <td className="p-3">
                            <select className="border p-2 rounded w-full" value={horarioEditado.tipo_sesion} onChange={(e) => setHorarioEditado({ ...horarioEditado, tipo_sesion: e.target.value })}>
                                <option value="CLASE">CLASE</option>
                                <option value="ASESORIA">ASESORIA</option>
                            </select>
                            </td>
                            <td className="p-3">
                            <input className="border p-2 rounded w-full" value={horarioEditado.aula} onChange={(e) => setHorarioEditado({ ...horarioEditado, aula: e.target.value })} />
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => guardarEdicionHorario(h.id_horario)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Guardar</button>
                            <button onClick={cancelarEdicionHorario} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                            </td>
                        </>
                        ) : (
                        <>
                            <td className="p-3">{h.profesor}</td>
                            <td className="p-3">{h.materia}</td>
                            <td className="p-3">{h.grupo}</td>
                            <td className="p-3">{h.dia_semana}</td>
                            <td className="p-3">{String(h.hora_inicio).slice(0, 5)}</td>
                            <td className="p-3">{String(h.hora_fin).slice(0, 5)}</td>
                            <td className="p-3">{h.tipo_sesion}</td>
                            <td className="p-3">{h.aula || '-'}</td>
                            <td className="p-3 text-right flex justify-end gap-2">
                            <button onClick={() => iniciarEdicionHorario(h)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Editar</button>
                            <button onClick={() => eliminarHorario(h.id_horario)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Eliminar</button>
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

      {/* --- TAB: AFLUENCIA --- */}
      {activeTab === 'afluencia' && <div className="animate-fade-in-up"><AdminReports /></div>}

    </div>
  );
}