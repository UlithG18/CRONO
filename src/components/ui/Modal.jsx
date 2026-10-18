import React from 'react';
import { Button } from './Button';

// Contenedor de ventana superpuesta. Usa las clases ya existentes de la
// interfaz y añade solo la cabecera y el pie, que se repetían en cada vista.
export function Modal({ eyebrow, title, onClose, children, maxWidth = '600px', footer }) {
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            {eyebrow && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', letterSpacing: '1px' }}>
                {eyebrow}
              </div>
            )}
            <h3 style={{ marginTop: eyebrow ? '6px' : 0 }}>{title}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>

        {children}

        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmación previa a una eliminación. No se usa un borrado directo: cada
// operación destructiva debe describir qué se va a perder.
export function ConfirmDialog({
  open,
  title,
  mensaje,
  detalle,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  cargando = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={cargando ? () => {} : onCancel} maxWidth="460px">
      <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{mensaje}</p>

      {detalle && (
        <ul style={{ fontSize: '12px', color: 'var(--color-slate)', marginTop: '10px', paddingLeft: '18px' }}>
          {detalle.map((linea) => <li key={linea} style={{ marginBottom: '4px' }}>{linea}</li>)}
        </ul>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '14px', padding: '10px 12px', fontSize: '12px',
            border: '1px solid var(--color-ash)', borderRadius: '6px',
            backgroundColor: 'var(--color-paper-white)', color: 'var(--color-carbon-black)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
        <Button variant="ghost" onClick={onCancel} disabled={cargando}>{cancelLabel}</Button>
        <Button variant="danger" onClick={onConfirm} disabled={cargando}>
          {cargando ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default Modal;
