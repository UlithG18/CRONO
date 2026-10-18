import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import Header from './Header';

export default function WorkspaceLayout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="app-layout">
      <div className="main-content" style={{ marginLeft: 0 }}>
        <Header
          nombre={currentUser.nombre}
          rol={currentUser.rol}
          onLogout={logout}
          onReset={() => { localStorage.clear(); window.location.href = '/'; }}
          isWorkspace
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
