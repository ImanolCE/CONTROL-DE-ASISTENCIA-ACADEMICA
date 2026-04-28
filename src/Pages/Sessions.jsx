// src/Pages/Sessions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Sessions({
  user,
  cuatrimestres,
  cuatrimestreId,
  onChangeCuatrimestre,
  loadingCuatrimestre,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const cuatriNombre = useMemo(() => {
    const found = (cuatrimestres || []).find((c) => Number(c.id) === Number(cuatrimestreId));
    return found?.nombre || "";
  }, [cuatrimestres, cuatrimestreId]);

  useEffect(() => {
    const load = async () => {
      if (!user || !cuatrimestreId) return;

      setLoading(true);
      setError("");
      try {
        //const res = await fetch(`/api/sesiones?cuatrimestre=${cuatrimestreId}`);
        const isAdmin = user?.num_empleado === "ADMIN";

        const query = isAdmin
          ? `/api/sesiones?cuatrimestre=${cuatrimestreId}`
          : `/api/sesiones?cuatrimestre=${cuatrimestreId}&id_profesor=${user.id_profesor}`;

        const res = await fetch(query);

        const json = await res.json();

        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "No se pudo cargar sesiones");
        }

        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setRows([]);
        setError(e.message || "Error cargando sesiones");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, cuatrimestreId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sesiones</h1>
          <p className="text-slate-600">
            Cuatrimestre: <span className="font-medium">{cuatriNombre || "—"}</span>
          </p>
        </div>

        {/* Selector cuatrimestre (reutiliza tu estado global) */}
        <div className="min-w-[260px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Cuatrimestre</label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
            value={cuatrimestreId ?? ""}
            onChange={(e) => onChangeCuatrimestre?.(e.target.value)}
            disabled={loadingCuatrimestre}
          >
            {(cuatrimestres || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {loadingCuatrimestre && (
            <p className="text-xs text-slate-500 mt-1">Cargando cuatrimestres...</p>
          )}
        </div>
      </div>

      {/* Estado */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {loading ? "Cargando..." : `Total: ${rows.length}`}
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Profesor</th>
                <th className="text-left px-4 py-3">Inicio</th>
                <th className="text-left px-4 py-3">Fin</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay sesiones para este cuatrimestre.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id_sesion} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{s.id_sesion}</td>
                    <td className="px-4 py-3 font-medium">{s.tipo_sesion}</td>
                    <td className="px-4 py-3">
                      {s.nombre} {s.apellidos}{" "}
                      <span className="text-slate-500">({s.shortname})</span>
                    </td>
                    <td className="px-4 py-3">{formatDate(s.fecha_inicio)}</td>
                    <td className="px-4 py-3">{formatDate(s.fecha_fin)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          s.estado === "ACTIVA"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs hover:bg-slate-800"
                        //onClick={() => navigate(`/sessions/${s.id_sesion}`)}
                        onClick={() =>
                          navigate(
                            user?.num_empleado === "ADMIN"
                              ? `/admin/sessions/${s.id_sesion}`
                              : `/sessions/${s.id_sesion}`
                          )
                        }
                      >
                        Ver detalle
                      </button>
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

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}