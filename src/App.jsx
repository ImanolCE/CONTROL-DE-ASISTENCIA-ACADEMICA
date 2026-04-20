import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Componentes/Sidebar';
import AdminLayout from './Layouts/AdminLayout';
import Dashboard from './Pages/Dashboard';
import Reports from './Pages/Reports';
import MyStudents from './Pages/MyStudents';
import Login from './Pages/Login';
import Admin from './Pages/Admin';
import ClassesAdmin from './Pages/ClassesAdmin';


import './index.css';


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ====== Estado global de cuatrimestre (Profesor) ======
  const [cuatrimestres, setCuatrimestres] = useState([]);
  const [cuatrimestreId, setCuatrimestreId] = useState(null);
  const [loadingCuatrimestre, setLoadingCuatrimestre] = useState(false);

  const isAdmin = useMemo(() => user?.num_empleado === 'ADMIN', [user]);

  const handleLogin = (data) => {
    setUser(data);
    setIsLoggedIn(true);
    navigate(data.num_empleado === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario_classaccess');
    setUser(null);
    setIsLoggedIn(false);

    // limpiamos estados del cuatrimestre por seguridad
    setCuatrimestres([]);
    setCuatrimestreId(null);

    navigate('/login');
  };

  // Cargar cuatrimestres + seleccionar el actual (default) cuando entra Profesor
  useEffect(() => {
    const loadCuatrimestres = async () => {
      if (!isLoggedIn || !user || isAdmin) return;

      setLoadingCuatrimestre(true);
      try {
        const storageKey = `classaccess_cuatrimestre_${user.id_profesor}`;
        const savedId = localStorage.getItem(storageKey);

        // 1) Traer lista
        const listRes = await fetch('/api/cuatrimestres');
        const listJson = await listRes.json();
        const list = Array.isArray(listJson?.data) ? listJson.data : (Array.isArray(listJson) ? listJson : []);
        setCuatrimestres(list);

        // 2) Traer actual
        const actualRes = await fetch('/api/cuatrimestres/actual');
        const actualJson = await actualRes.json();
        const actualId = actualJson?.data?.id ?? actualJson?.id ?? null;

        // 3) Resolver selección (primero lo guardado si existe en lista, si no el actual, si no el primero)
        const listIds = new Set(list.map(c => String(c.id)));
        const finalId =
          (savedId && listIds.has(String(savedId))) ? savedId :
          (actualId && listIds.has(String(actualId))) ? actualId :
          (list[0]?.id ?? null);

        setCuatrimestreId(finalId ? Number(finalId) : null);
        if (finalId) localStorage.setItem(storageKey, String(finalId));
      } catch (e) {
        console.error('Error cargando cuatrimestres:', e);
      } finally {
        setLoadingCuatrimestre(false);
      }
    };

    loadCuatrimestres();
  }, [isLoggedIn, user, isAdmin]);

  // Persistir cambio manual (Profesor)
  const onChangeCuatrimestre = (newId) => {
    if (!user) return;
    const storageKey = `classaccess_cuatrimestre_${user.id_profesor}`;
    setCuatrimestreId(Number(newId));
    localStorage.setItem(storageKey, String(newId));
  };

  return (
    <>
      {isLoggedIn ? (
        isAdmin ? (
          <AdminLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/clases" element={<ClassesAdmin />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
          </AdminLayout>
        ) : (
          <div className="flex min-h-screen bg-slate-100 text-slate-900">
            <Sidebar
              user={user}
              onLogout={handleLogout}
              cuatrimestreId={cuatrimestreId}
              cuatrimestres={cuatrimestres}
              loadingCuatrimestre={loadingCuatrimestre}
            />
            <main className="flex-1 p-8 ml-64">
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    user ? (
                      <Dashboard
                        user={user}
                        cuatrimestres={cuatrimestres}
                        cuatrimestreId={cuatrimestreId}
                        onChangeCuatrimestre={onChangeCuatrimestre}
                        loadingCuatrimestre={loadingCuatrimestre}
                      />
                    ) : (
                      <div>Cargando...</div>
                    )
                  }
                />
                <Route
                  path="/reports"
                  element={
                    user ? (
                      <Reports
                        user={user}
                        cuatrimestres={cuatrimestres}
                        cuatrimestreId={cuatrimestreId}
                        onChangeCuatrimestre={onChangeCuatrimestre}
                        loadingCuatrimestre={loadingCuatrimestre}
                      />
                    ) : (
                      <div>Cargando...</div>
                    )
                  }
                />
                <Route
                  path="/my-students"
                  element={
                    user ? (
                      <MyStudents
                        user={user}
                        cuatrimestres={cuatrimestres}
                        cuatrimestreId={cuatrimestreId}
                        onChangeCuatrimestre={onChangeCuatrimestre}
                        loadingCuatrimestre={loadingCuatrimestre}
                      />
                    ) : (
                      <div>Cargando...</div>
                    )
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        )
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  );
}
