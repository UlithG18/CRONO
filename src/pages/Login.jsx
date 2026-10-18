import React, { useState } from 'react';
import { useAuth } from '../auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const { loginWithCredentials, loginAsRole, requestPasswordReset, resetPassword, staffList } = useAuth();

  const [mode, setMode] = useState('credentials'); // 'credentials' | 'roles' | 'recovery'
  const [email, setEmail] = useState('jun@crono.com');
  const [password, setPassword] = useState('crono2026');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para recuperación de contraseña
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: pedir email, 2: ingresar código y nueva clave
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Credenciales inválidas.');
    }
    setLoading(false);
  };

  const handleRoleSelect = async (rol) => {
    setErrorMessage('');
    setLoading(true);
    const res = await loginAsRole(rol);
    if (!res.success) {
      setErrorMessage(res.error || 'Error al iniciar sesión con este rol.');
    }
    setLoading(false);
  };

  const handleRequestCode = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = requestPasswordReset(recoveryEmail);
    if (res.success) {
      setGeneratedCode(res.code);
      setRecoveryStep(2);
      setSuccessMessage(`Código generado para ${res.nombre}: ${res.code}`);
    } else {
      setErrorMessage(res.error);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = resetPassword(recoveryEmail, inputCode, newPassword);
    if (res.success) {
      setSuccessMessage('Contraseña restablecida con éxito. Puedes iniciar sesión ahora.');
      setMode('credentials');
      setPassword(newPassword);
      setEmail(recoveryEmail);
      setRecoveryStep(1);
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-editorial-wrapper">
        {/* Columna Editorial Izquierda */}
        <div className="login-editorial-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="role-tag-mint">PROD READY</span>
            <span className="header-meta-pill">RBAC 10 ROLES</span>
          </div>

          <h1 className="login-brand-display">
            CRONO<br />SYSTEM
          </h1>

          <p className="login-tagline">
            Plataforma operativa centralizada para Crono Agency &amp; Crono Models.
          </p>

          <div className="login-meta-block">
            <div className="login-meta-row">
              <span>UNIDAD DE NEGOCIO 01</span>
              <span>CRONO AGENCY (TALENTO &amp; BOOKING)</span>
            </div>
            <div className="login-meta-row">
              <span>UNIDAD DE NEGOCIO 02</span>
              <span>CRONO MODELS (ACADEMIA DE MODELAJE)</span>
            </div>
            <div className="login-meta-row">
              <span>SEGURIDAD</span>
              <span>AUTH DIRECTA &bull; ROW-LEVEL SECURITY</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--color-smoke)', lineHeight: 1.6 }}>
            Acceso administrativo restringido a personal autorizado. Cada perfil cuenta con permisos
            estrictamente segmentados según la matriz institucional de autorización.
          </p>
        </div>

        {/* Columna Tarjeta Derecha */}
        <div className="login-card-container">
          {/* Navegación por Píldoras de Modo */}
          {mode !== 'recovery' && (
            <div className="login-tabs-pill">
              <button
                type="button"
                className={`login-tab-btn ${mode === 'credentials' ? 'active' : ''}`}
                onClick={() => { setMode('credentials'); setErrorMessage(''); }}
              >
                Ingreso por Credenciales
              </button>
              <button
                type="button"
                className={`login-tab-btn ${mode === 'roles' ? 'active' : ''}`}
                onClick={() => { setMode('roles'); setErrorMessage(''); }}
              >
                Directorio de Roles (10)
              </button>
            </div>
          )}

          {/* Notificaciones de Error o Éxito */}
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-mint" style={{ marginBottom: '16px' }}>
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODO 1: Ingreso por Credenciales */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>ACCESO OPERATIVO</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-smoke)' }}>
                  Ingresa tu correo institucional y contraseña de acceso.
                </p>
              </div>

              <Input
                id="email"
                name="email"
                label="Correo Institucional"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@crono.com"
                required
                style={{ marginBottom: '16px' }}
              />

              <Input
                id="password"
                name="password"
                label="Contraseña de Acceso"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ marginBottom: '8px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', padding: 0 }}
                  onClick={() => {
                    setMode('recovery');
                    setRecoveryEmail(email);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                ENTRAR AL SISTEMA
              </Button>

              {/* Caja de Ayuda Rápida para Pruebas */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '14px',
                  backgroundColor: 'var(--color-mist-gray)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-ash)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', marginBottom: '4px' }}>
                  CUENTA DE ADMINISTRADOR POR DEFECTO:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-carbon-black)', fontWeight: 600 }}>
                  jun.osorio@crono.com &bull; clave: crono2026
                </div>
              </div>
            </form>
          )}

          {/* MODO 2: Selector Rápido de 10 Roles */}
          {mode === 'roles' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>DIRECTORIO DE ROLES</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-smoke)' }}>
                  Selecciona cualquiera de las 10 identidades autorizadas del staff para verificar su matriz de permisos.
                </p>
              </div>

              <div className="staff-roles-scroll">
                {staffList.map((member) => {
                  const isDueno = member.rol === 'Dueño';
                  return (
                    <div
                      key={member.persona_id}
                      className="staff-role-item"
                      onClick={() => handleRoleSelect(member.rol)}
                    >
                      <div className="staff-role-info">
                        <div className="staff-role-name">{member.nombre}</div>
                        <div className="staff-role-meta">
                          {member.correo} &bull; ID #{member.persona_id}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={isDueno ? 'role-tag-yellow' : 'role-tag-mint'}>
                          {member.rol}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          Acceder &rarr;
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODO 3: Recuperación de Contraseña */}
          {mode === 'recovery' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '26px', marginBottom: '4px' }}>RECUPERAR CONTRASEÑA</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-smoke)' }}>
                  Generación segura de credenciales para el personal de Crono.
                </p>
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleRequestCode}>
                  <Input
                    id="recovery-email"
                    name="recoveryEmail"
                    label="Correo Registrado de Staff"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="usuario@crono.com"
                    required
                    style={{ marginBottom: '20px' }}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    style={{ width: '100%', marginBottom: '12px' }}
                  >
                    SOLICITAR CÓDIGO DE VERIFICACIÓN
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    style={{ width: '100%' }}
                    onClick={() => { setMode('credentials'); setErrorMessage(''); }}
                  >
                    Volver a Inicio de Sesión
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit}>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-mist-gray)',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                    }}
                  >
                    Código de verificación: <strong>{generatedCode}</strong>
                  </div>

                  <Input
                    id="input-code"
                    name="inputCode"
                    label="Código de Verificación"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="CR-XXXXXX"
                    required
                    style={{ marginBottom: '16px' }}
                  />

                  <Input
                    id="new-password"
                    name="newPassword"
                    label="Nueva Contraseña (mínimo 6 caracteres)"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ marginBottom: '20px' }}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    style={{ width: '100%', marginBottom: '12px' }}
                  >
                    ESTABLECER NUEVA CONTRASEÑA
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    style={{ width: '100%' }}
                    onClick={() => { setMode('credentials'); setErrorMessage(''); }}
                  >
                    Cancelar
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}