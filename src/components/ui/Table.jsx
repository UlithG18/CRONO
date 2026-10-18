import React, { useState, useMemo } from 'react';

export function Table({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No hay registros disponibles.',
  className = '',
  pageSize = 10,
  enablePagination = true,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') {
        const comp = aVal.localeCompare(String(bVal));
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, enablePagination]);

  const handleHeaderClick = (col) => {
    const key = col.key || col.accessorKey;
    if (!key || col.sortable === false) return;

    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const startRecord = data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, data.length);

  return (
    <div className={`crono-table-wrapper ${className}`.trim()}>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="crono-table">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const key = col.key || col.accessorKey;
                const isSorted = sortKey === key;
                return (
                  <th
                    key={key || idx}
                    style={{
                      width: col.width || col.size || 'auto',
                      textAlign: col.align || 'left',
                      cursor: col.sortable !== false ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    className="crono-th"
                    onClick={() => handleHeaderClick(col)}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{col.header || col.title}</span>
                      {isSorted && (
                        <span style={{ fontSize: '10px', color: 'var(--color-carbon-black)' }}>
                          {sortOrder === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="crono-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || row.persona_id || rIdx}
                  className={`crono-tr ${onRowClick ? 'clickable' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, cIdx) => {
                    const key = col.key || col.accessorKey;
                    let cellContent;
                    if (col.render) {
                      cellContent = col.render(row[key], row, rIdx);
                    } else {
                      const rawVal = row[key];
                      cellContent = rawVal != null ? String(rawVal) : '—';
                    }
                    return (
                      <td
                        key={key || cIdx}
                        style={{ textAlign: col.align || 'left' }}
                        className={`crono-td ${col.mono ? 'mono' : ''}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación Profesional */}
      {enablePagination && data.length > pageSize && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            backgroundColor: 'var(--color-paper-white)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-smoke)',
          }}
        >
          <div>
            Mostrando <strong>{startRecord}</strong> - <strong>{endRecord}</strong> de <strong>{data.length}</strong> registros
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid var(--color-ash)' }}
            >
              &larr; Anterior
            </button>

            <span style={{ color: 'var(--color-carbon-black)', fontWeight: 600 }}>
              Pág. {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid var(--color-ash)' }}
            >
              Siguiente &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;