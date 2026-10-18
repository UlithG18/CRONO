import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Header from './Header';
import Sidebar from './Sidebar';

export default function GlobalLayout() {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Sidebar
        rol={currentUser.rol}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          nombre={currentUser.nombre}
          rol={currentUser.rol}
          onLogout={logout}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onReset={() => { resetDB(); window.location.href = '/'; }}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function resetDB() {
  localStorage.clear();
  window.location.href = '/';
}
