import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  BookOpen,
  Users,
  PlusCircle,
} from "lucide-react";

const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function Classes({
  user,
  cuatrimestres = [],
  cuatrimestreId,
  onChangeCuatrimestre,
  loadingCuatrimestre = false,
}) {
  const [horarios, setHorarios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingHorario, setSavingHorario] = useState(false);

  const horarioVacio = {
    id_asignacion: "",
    dia_semana: "LUNES",
    tipo_sesion: "CLASE",
    hora_inicio: "",
    hora_fin: "",
    aula: "",
  };

  const [nuevoHorario, setNuevoHorario] = useState(horarioVacio);
  const [editandoHorario, setEditandoHorario] = useState(null);
  const [horarioEditado, setHorarioEditado] = useState(horarioVacio);

  const leerRespuestaJSON = async (res, nombreRuta) => {
    const texto = await res.text();

    try {
      const data = JSON.parse(texto);

      if (!res.ok) {
        throw new Error(data.message || data.error || `Error HTTP en ${nombreRuta}`);
      }

      return data;
    } catch (e) {
      throw new Error(
        `La ruta ${nombreRuta} no devolvió JSON válido. Respuesta: ${texto.substring(0, 150)}`
      );
    }
  };

  const cargarAsignaciones = async () => {
    if (!user?.id_profesor || !cuatrimestreId) {
      setAsignaciones([]);
      return;
    }

    try {
      const ruta = `/api/profesor/${user.id_profesor}/asignaciones?cuatrimestreId=${encodeURIComponent(
        cuatrimestreId
      )}`;
      const res = await fetch(ruta);
      const data = await leerRespuestaJSON(res, ruta);
      setAsignaciones(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error cargando asignaciones del profesor:", error);
      setAsignaciones([]);
    }
  };

  const cargarHorarios = async () => {
    if (!user?.id_profesor || !cuatrimestreId) {
      setHorarios([]);
      return;
    }

    try {
      const ruta = `/api/profesor/${user.id_profesor}/horarios?cuatrimestreId=${encodeURIComponent(
        cuatrimestreId
      )}`;
      const res = await fetch(ruta);
      const data = await leerRespuestaJSON(res, ruta);
      setHorarios(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error cargando horarios del profesor:", error);
      setHorarios([]);
    }
  };

  const cargarDispositivos = async () => {
    try {
      const ruta = `/api/dispositivos`;
      const res = await fetch(ruta);
      const data = await leerRespuestaJSON(res, ruta);
      setDispositivos(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
      setDispositivos([]);
    }
  };

  const cargarTodo = async () => {
    if (!user?.id_profesor) {
      setAsignaciones([]);
      setHorarios([]);
      return;
    }

    try {
      setLoading(true);
      await Promise.all([cargarAsignaciones(), cargarHorarios(), cargarDispositivos()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cuatrimestreId]);

  const handleCrearHorario = async (e) => {
    e.preventDefault();

    if (
      !nuevoHorario.id_asignacion ||
      !nuevoHorario.dia_semana ||
      !nuevoHorario.hora_inicio ||
      !nuevoHorario.hora_fin ||
      !nuevoHorario.tipo_sesion
    ) {
      return alert("Completa todos los campos obligatorios del horario");
    }

    try {
      setSavingHorario(true);

      const ruta = `/api/profesor/${user.id_profesor}/horarios`;
      const res = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoHorario),
      });

      const data = await leerRespuestaJSON(res, ruta);

      if (data.success) {
        alert("Horario creado correctamente");
        setNuevoHorario(horarioVacio);
        await Promise.all([cargarHorarios(), cargarAsignaciones()]);
      } else {
        alert(data.message || data.error || "No se pudo crear el horario");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error de conexión al crear horario");
    } finally {
      setSavingHorario(false);
    }
  };

  const iniciarEdicionHorario = (horario) => {
    setEditandoHorario(horario.id_horario);
    setHorarioEditado({
      id_asignacion: horario.id_asignacion ? String(horario.id_asignacion) : "",
      dia_semana: horario.dia_semana || "LUNES",
      tipo_sesion: horario.tipo_sesion || "CLASE",
      hora_inicio: horario.hora_inicio?.slice?.(0, 5) || "",
      hora_fin: horario.hora_fin?.slice?.(0, 5) || "",
      aula: horario.aula || "",
    });
  };

  const cancelarEdicionHorario = () => {
    setEditandoHorario(null);
    setHorarioEditado(horarioVacio);
  };

  const guardarEdicionHorario = async (id_horario) => {
    if (
      !horarioEditado.id_asignacion ||
      !horarioEditado.dia_semana ||
      !horarioEditado.hora_inicio ||
      !horarioEditado.hora_fin ||
      !horarioEditado.tipo_sesion
    ) {
      return alert("Completa todos los campos obligatorios del horario");
    }

    try {
      const ruta = `/api/profesor/${user.id_profesor}/horarios/${id_horario}`;
      const res = await fetch(ruta, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horarioEditado),
      });

      const data = await leerRespuestaJSON(res, ruta);

      if (data.success) {
        alert("Horario actualizado correctamente");
        cancelarEdicionHorario();
        await Promise.all([cargarHorarios(), cargarAsignaciones()]);
      } else {
        alert(data.message || data.error || "No se pudo actualizar el horario");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error de conexión al actualizar horario");
    }
  };

  const eliminarHorario = async (id_horario) => {
    if (!window.confirm("¿Seguro que deseas eliminar este horario?")) return;

    try {
      const ruta = `/api/profesor/${user.id_profesor}/horarios/${id_horario}`;
      const res = await fetch(ruta, {
        method: "DELETE",
      });

      const data = await leerRespuestaJSON(res, ruta);

      if (data.success) {
        alert("Horario eliminado correctamente");
        await Promise.all([cargarHorarios(), cargarAsignaciones()]);
      } else {
        alert(data.message || data.error || "No se pudo eliminar el horario");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error de conexión al eliminar horario");
    }
  };

  const bloquesPorDia = useMemo(() => {
    const mapa = {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
      SABADO: [],
    };

    horarios.forEach((h) => {
      if (mapa[h.dia_semana]) mapa[h.dia_semana].push(h);
    });

    Object.keys(mapa).forEach((dia) => {
      mapa[dia].sort((a, b) => {
        const ah = a.hora_inicio || "";
        const bh = b.hora_inicio || "";
        return ah.localeCompare(bh);
      });
    });

    return mapa;
  }, [horarios]);

  const cuatrimestreActual = cuatrimestres.find((c) => String(c.id) === String(cuatrimestreId));

  const asignacionesActivas = asignaciones.filter((a) => Number(a.activo) === 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mi Horario Semanal</h1>
        <p className="text-slate-500 mt-1">
          Consulta tus clases y asesorías asignadas por cuatrimestre.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Filtro
            </p>
            <h2 className="text-2xl font-bold text-slate-900">Cuatrimestre</h2>
            <p className="text-slate-500">
              Selecciona el cuatrimestre para consultar tu calendario semanal.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cuatrimestre
            </label>
            <select
              className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
              value={cuatrimestreId || ""}
              onChange={(e) => onChangeCuatrimestre?.(e.target.value)}
              disabled={loadingCuatrimestre}
            >
              <option value="" disabled>
                Selecciona cuatrimestre
              </option>
              {cuatrimestres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Mis asignaciones</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
            {asignaciones.length} asignaciones
          </span>
        </div>

        {loading ? (
          <p className="text-slate-400 italic">Cargando asignaciones...</p>
        ) : asignaciones.length === 0 ? (
          <p className="text-slate-400 italic text-center py-8">
            No tienes asignaciones registradas para este cuatrimestre.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3">Materia</th>
                  <th className="text-left px-4 py-3">Grupo</th>
                  <th className="text-left px-4 py-3">Cuatrimestre</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a) => (
                  <tr key={a.id_asignacion} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.materia}</td>
                    <td className="px-4 py-3">{a.grupo}</td>
                    <td className="px-4 py-3">{a.cuatrimestre}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          Number(a.activo) === 1
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {Number(a.activo) === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form
        onSubmit={handleCrearHorario}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle size={20} className="text-slate-400" />
          <h2 className="text-2xl font-bold text-slate-900">Registrar horario</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.id_asignacion}
            onChange={(e) =>
              setNuevoHorario({ ...nuevoHorario, id_asignacion: e.target.value })
            }
          >
            <option value="" disabled>
              Selecciona asignación
            </option>
            {asignacionesActivas.map((a) => (
              <option key={a.id_asignacion} value={a.id_asignacion}>
                {a.materia} | {a.grupo}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.dia_semana}
            onChange={(e) =>
              setNuevoHorario({ ...nuevoHorario, dia_semana: e.target.value })
            }
          >
            <option value="LUNES">LUNES</option>
            <option value="MARTES">MARTES</option>
            <option value="MIERCOLES">MIERCOLES</option>
            <option value="JUEVES">JUEVES</option>
            <option value="VIERNES">VIERNES</option>
            <option value="SABADO">SABADO</option>
          </select>

          <select
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.tipo_sesion}
            onChange={(e) =>
              setNuevoHorario({ ...nuevoHorario, tipo_sesion: e.target.value })
            }
          >
            <option value="CLASE">CLASE</option>
            <option value="ASESORIA">ASESORIA</option>
          </select>

          <input
            type="time"
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.hora_inicio}
            onChange={(e) =>
              setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })
            }
          />

          <input
            type="time"
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.hora_fin}
            onChange={(e) =>
              setNuevoHorario({ ...nuevoHorario, hora_fin: e.target.value })
            }
          />

          <select
            className="border border-slate-300 rounded-xl px-4 py-3 bg-white"
            value={nuevoHorario.aula}
            onChange={(e) => setNuevoHorario({ ...nuevoHorario, aula: e.target.value })}
          >
            <option value="" disabled>
              Selecciona salón
            </option>
            {dispositivos.map((d) => (
              <option key={d.id_dispositivo} value={d.nombre_salon}>
                {d.nombre_salon}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={savingHorario}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
        >
          {savingHorario ? "Guardando..." : "Guardar horario"}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock3 size={20} className="text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Mis horarios registrados</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
            {horarios.length} bloques
          </span>
        </div>

        {horarios.length === 0 ? (
          <p className="text-slate-400 italic">No hay horarios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3">Materia</th>
                  <th className="text-left px-4 py-3">Grupo</th>
                  <th className="text-left px-4 py-3">Día</th>
                  <th className="text-left px-4 py-3">Inicio</th>
                  <th className="text-left px-4 py-3">Fin</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Aula</th>
                  <th className="text-left px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id_horario} className="border-t border-slate-100">
                    {editandoHorario === h.id_horario ? (
                      <>
                        <td className="px-3 py-3">
                          <select
                            className="border p-2 rounded w-full"
                            value={horarioEditado.id_asignacion}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                id_asignacion: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Selecciona asignación
                            </option>
                            {asignacionesActivas.map((a) => (
                              <option key={a.id_asignacion} value={a.id_asignacion}>
                                {a.materia} | {a.grupo}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3 text-slate-400">—</td>

                        <td className="px-3 py-3">
                          <select
                            className="border p-2 rounded w-full"
                            value={horarioEditado.dia_semana}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                dia_semana: e.target.value,
                              })
                            }
                          >
                            {DIAS_ORDEN.map((dia) => (
                              <option key={dia} value={dia}>
                                {dia}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="time"
                            className="border p-2 rounded w-full"
                            value={horarioEditado.hora_inicio}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                hora_inicio: e.target.value,
                              })
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="time"
                            className="border p-2 rounded w-full"
                            value={horarioEditado.hora_fin}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                hora_fin: e.target.value,
                              })
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <select
                            className="border p-2 rounded w-full"
                            value={horarioEditado.tipo_sesion}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                tipo_sesion: e.target.value,
                              })
                            }
                          >
                            <option value="CLASE">CLASE</option>
                            <option value="ASESORIA">ASESORIA</option>
                          </select>
                        </td>

                        <td className="px-3 py-3">
                          <select
                            className="border p-2 rounded w-full"
                            value={horarioEditado.aula}
                            onChange={(e) =>
                              setHorarioEditado({
                                ...horarioEditado,
                                aula: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Selecciona salón
                            </option>
                            {dispositivos.map((d) => (
                              <option key={d.id_dispositivo} value={d.nombre_salon}>
                                {d.nombre_salon}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              onClick={() => guardarEdicionHorario(h.id_horario)}
                              type="button"
                            >
                              Guardar
                            </button>
                            <button
                              className="bg-slate-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              onClick={cancelarEdicionHorario}
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{h.materia}</td>
                        <td className="px-4 py-3">{h.grupo}</td>
                        <td className="px-4 py-3">{h.dia_semana}</td>
                        <td className="px-4 py-3">{String(h.hora_inicio).slice(0, 5)}</td>
                        <td className="px-4 py-3">{String(h.hora_fin).slice(0, 5)}</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {h.tipo_sesion}
                          </span>
                        </td>
                        <td className="px-4 py-3">{h.aula || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              className="bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              type="button"
                              onClick={() => iniciarEdicionHorario(h)}
                            >
                              Editar
                            </button>
                            <button
                              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                              type="button"
                              onClick={() => eliminarHorario(h.id_horario)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Calendario semanal</h2>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
            {horarios.length} bloques
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DIAS_ORDEN.map((dia) => (
            <div
              key={dia}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50"
            >
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-100">
                <h3 className="font-bold text-slate-900">{dia}</h3>
              </div>

              <div className="p-4 space-y-3 min-h-[130px]">
                {bloquesPorDia[dia]?.length ? (
                  bloquesPorDia[dia].map((bloque) => (
                    <div
                      key={bloque.id_horario}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-blue-500" />
                          <p className="font-bold text-slate-900">{bloque.materia}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {bloque.tipo_sesion}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock3 size={15} className="text-slate-400" />
                          <span>
                            {String(bloque.hora_inicio).slice(0, 5)} -{" "}
                            {String(bloque.hora_fin).slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={15} className="text-slate-400" />
                          <span>{bloque.grupo}</span>
                        </div>
                        <div>
                          <span className="font-medium">Aula:</span>{" "}
                          {bloque.aula || "Sin asignar"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Sin bloques asignados.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cuatrimestreActual && (
        <div className="text-sm text-slate-400">
          Cuatrimestre consultado: <span className="font-medium">{cuatrimestreActual.nombre}</span>
        </div>
      )}
    </div>
  );
}