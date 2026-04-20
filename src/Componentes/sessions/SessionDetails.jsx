// src/Componentes/sessions/SessionDetails.jsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserCheck, UserX } from 'lucide-react';

const mockStudents = [
    { id: 1, name: 'Juan Pérez', present: true },
    { id: 2, name: 'María García', present: true },
    { id: 3, name: 'Carlos López', present: false },
    { id: 4, name: 'Ana Martínez', present: true },
];

export default function SessionDetails({ session }) {
  if (!session) return null;

  const fecha = new Date(session.fecha_inicio);

  return (
    <div className="p-6">
        <div className="mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Detalle de Sesión</h2>
            <p className="text-slate-500">
                {session.clase_nombre} - {format(fecha, "EEEE dd 'de' MMMM", { locale: es })}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold">Inicio</p>
                <p className="text-lg font-medium">{format(fecha, "HH:mm a")}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold">Grupo</p>
                <p className="text-lg font-medium">{session.clase_grupo}</p>
            </div>
        </div>

        <h3 className="font-semibold text-lg mb-3">Lista de Asistencia (Simulada)</h3>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600">
                    <tr>
                        <th className="px-4 py-2">Alumno</th>
                        <th className="px-4 py-2 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mockStudents.map(st => (
                        <tr key={st.id}>
                            <td className="px-4 py-3 font-medium">{st.name}</td>
                            <td className="px-4 py-3 text-center">
                                {st.present ? (
                                    <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                        <UserCheck size={14} className="mr-1"/> Presente
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                        <UserX size={14} className="mr-1"/> Ausente
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}