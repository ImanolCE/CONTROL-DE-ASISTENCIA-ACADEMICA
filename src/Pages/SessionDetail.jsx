// src/Pages/SessionDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/sesiones/${id}/asistencias`);
        const json = await res.json();

        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "No se pudo cargar asistencias");
        }

        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setRows([]);
        setError(e.message || "Error cargando asistencias");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Detalle de sesión</h1>
          <p className="text-slate-600">Sesión #{id}</p>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => navigate("/sessions")}
          >
            Volver
          </button>

          {/* PDF lo dejamos para el final */}
          <button
            className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
            disabled
            title="PDF se implementa al final"
          >
            Generar PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">{loading ? "Cargando..." : `Total: ${rows.length}`}</p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Matrícula</th>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="text-left px-4 py-3">Método</th>
                <th className="text-left px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay asistencias registradas para esta sesión.
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id_asistencia_alum} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{a.matricula}</td>
                    <td className="px-4 py-3">{a.hora_llegada || "—"}</td>
                    <td className="px-4 py-3">{a.metodo}</td>
                    <td className="px-4 py-3">{formatDate(a.created_at)}</td>
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