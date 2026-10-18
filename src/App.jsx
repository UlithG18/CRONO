import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { resetDB, loadData, subscribeCache } from './db';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import AspirantesPage from './pages/Aspirantes';
import ModelosPage from './pages/Modelos';
import ClientesPage from './pages/Clientes';
import NucleoPage from './pages/Nucleo';
import PortafolioPage from './pages/Portafolio';
import DocumentacionPage from './pages/Documentacion';
import ProduccionPage from './pages/Produccion';
import FinanzasPage from './pages/Finanzas';
import AcademiaPage from './pages/Academia';
import EvaluacionesPage from './pages/Evaluaciones';
import NotifNivelPage from './pages/NotifNivel';
import RRHHPage from './pages/RRHH';
import RecursosPage from './pages/Recursos';
import FormatosPage from './pages/Formatos';
import PrivadoPage from './pages/Privado';
import Workspace from './pages/Workspace';
import AdminIndex from './pages/AdminIndex';
import AdminDocumentos from './pages/AdminDocumentos';
import AdminContratos from './pages/AdminContratos';
import AdminJuntaOraculo from './pages/AdminJuntaOraculo';
import AdminRRHH from './pages/AdminRRHH';
import RequireAccess from './components/RequireAccess';
import GlobalLayout from './components/GlobalLayout';
import WorkspaceLayout from './components/WorkspaceLayout';

export default function App() {
  const { currentUser, logout } = useAuth();
  const [dataReady, setDataReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadData().then((result) => {
        if (!result) setDataError('No se pudieron cargar los datos del servidor.');
        setDataReady(true);
      });
    }
  }, [currentUser]);

  // Suscribirse a cambios de datos para refrescar las vistas
  useEffect(() => {
    return subscribeCache((version) => setDataVersion(version));
  }, []);

  if (!currentUser) {
    return <LoginPage />;
  }

  if (!dataReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-warm-canvas)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', textTransform: 'uppercase' }}>Cargando datos</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-smoke)', marginTop: '8px' }}>Conectando con Crono...</div>
        </div>
      </div>
    );
  }
  return (
    <Routes key={dataVersion}>
      <Route path="/" element={<Navigate to="/mi-espacio" replace />} />
      
      <Route path="/mi-espacio" element={<WorkspaceLayout />}>
        <Route index element={<Workspace />} />
      </Route>

      <Route path="/d/*" element={<GlobalLayout />}>
        <Route path="reclutamiento/aspirantes" element={
          <RequireAccess recurso="aspirantes"><AspirantesPage /></RequireAccess>
        } />
        <Route path="booking/modelos" element={
          <RequireAccess recurso="modelos"><ModelosPage /></RequireAccess>
        } />
        <Route path="booking/clientes" element={
          <RequireAccess recurso="clientes"><ClientesPage /></RequireAccess>
        } />
        <Route path="booking/portafolio" element={
          <RequireAccess recurso="modelos"><PortafolioPage /></RequireAccess>
        } />
        <Route path="booking/notifNivel" element={
          <RequireAccess recurso="modelos"><NotifNivelPage /></RequireAccess>
        } />
        <Route path="produccion/produccion" element={
          <RequireAccess recurso="produccion"><ProduccionPage /></RequireAccess>
        } />
        <Route path="produccion/recursos" element={
          <RequireAccess recurso="produccion"><RecursosPage /></RequireAccess>
        } />
        <Route path="academia/academia" element={
          <RequireAccess recurso="academia"><AcademiaPage /></RequireAccess>
        } />
        <Route path="academia/evaluaciones" element={
          <RequireAccess recurso="academia"><EvaluacionesPage /></RequireAccess>
        } />
        <Route path="finanzas/agencia" element={
          <RequireAccess recurso="finanzas"><FinanzasPage division="Agencia" /></RequireAccess>
        } />
        <Route path="finanzas/academia" element={
          <RequireAccess recurso="finanzas"><FinanzasPage division="Academia" /></RequireAccess>
        } />
        <Route path="admin/nucleo" element={
          <RequireAccess recurso="rrhh"><NucleoPage /></RequireAccess>
        } />
        <Route path="admin/rrhh" element={
          <RequireAccess recurso="rrhh"><RRHHPage /></RequireAccess>
        } />
        <Route path="admin/formatos" element={
          <RequireAccess recurso="formatos"><FormatosPage /></RequireAccess>
        } />
        <Route path="admin/documentacion" element={
          <RequireAccess recurso="formatos"><DocumentacionPage /></RequireAccess>
        } />

        {/* ===== MÓDULO ADMINISTRATIVO (según especificación) ===== */}
        <Route path="admin" element={
          <RequireAccess recursos={['documentos', 'contratos', 'rrhh']}><AdminIndex /></RequireAccess>
        } />

        {/* CEO y Dirección — Legal e institucional */}
        <Route path="admin/ceo-direccion/:seccion" element={
          <RequireAccess recurso="documentos"><AdminDocumentos /></RequireAccess>
        } />
        <Route path="admin/ceo-direccion/:seccion/:sub" element={
          <RequireAccess recurso="documentos"><AdminDocumentos /></RequireAccess>
        } />

        {/* Contratos firmados */}
        <Route path="admin/contratos" element={
          <RequireAccess recurso="contratos"><AdminContratos /></RequireAccess>
        } />
        <Route path="admin/contratos/:tipo" element={
          <RequireAccess recurso="contratos"><AdminContratos /></RequireAccess>
        } />

        {/* Formatos oficiales (repositorio de documentos) */}
        <Route path="admin/formatos/:seccion" element={
          <RequireAccess recurso="documentos"><AdminDocumentos /></RequireAccess>
        } />
        <Route path="admin/formatos/:seccion/:sub" element={
          <RequireAccess recurso="documentos"><AdminDocumentos /></RequireAccess>
        } />

        {/* Junta del Oráculo */}
        <Route path="admin/junta-oraculo/:seccion" element={
          <RequireAccess recurso="documentos"><AdminJuntaOraculo /></RequireAccess>
        } />
        <Route path="admin/junta-oraculo/:seccion/:sub" element={
          <RequireAccess recurso="documentos"><AdminJuntaOraculo /></RequireAccess>
        } />

        {/* Recursos Humanos */}
        <Route path="admin/recursos-humanos" element={
          <RequireAccess recurso="rrhh"><AdminRRHH /></RequireAccess>
        } />
        <Route path="admin/recursos-humanos/:seccion" element={
          <RequireAccess recurso="rrhh"><AdminRRHH /></RequireAccess>
        } />
      </Route>

      <Route path="/privado" element={<PrivadoPage />} />
      
      <Route path="*" element={<Navigate to="/mi-espacio" replace />} />
    </Routes>
  );
}
