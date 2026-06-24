import React, { useState, useRef, useEffect } from 'react';
import TableResponsive from '../common/TableResponsive';
import useViewport from '../../hooks/useViewport';

const ActionCell = ({ children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { isMobile } = useViewport();

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // On mobile render a bottom sheet for easier tapping
  if (isMobile) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Actions"
        >
          ✕
        </button>
        {open && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
            <div className="fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 p-3 rounded-t-xl max-h-[60vh] overflow-auto">
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                {children}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Actions"
      >
        ✕
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const shortenId = (val) => {
  if (!val || typeof val !== 'string') return val ?? '—';
  if (val.length <= 12) return val;
  return `${val.slice(0, 6)}…${val.slice(-4)}`;
};

const DataTable = ({ columns, data, onRowClick }) => {
  const { isMobile } = useViewport();

  return (
    <TableResponsive>
      <table className="w-full min-w-[700px] table-fixed">
        <thead>
          <tr className="bg-white/95 border-b border-gray-200">
            {columns.map((column) => {
              const isActions = column.key === 'actions';
              return (
                <th
                  key={column.key}
                  className={`px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${isActions ? 'lg:sticky lg:right-0 lg:bg-white lg:z-20 lg:w-20' : 'sticky top-0 bg-white z-10'}`}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((column) => {
                const isActions = column.key === 'actions';
                let raw = column.render ? column.render(row[column.key], row) : (row[column.key] ?? '—');
                // default ID shortening for readability
                if (!column.render && column.key === 'id' && typeof row[column.key] === 'string') {
                  raw = <span title={row[column.key]} className="font-mono text-sm">{shortenId(row[column.key])}</span>;
                }
                return (
                  <td
                    key={column.key}
                    className={`px-3 sm:px-6 py-3 text-sm align-top ${isActions ? 'whitespace-nowrap lg:sticky lg:right-0 lg:bg-white lg:z-20 lg:w-20' : 'whitespace-normal break-words'}`}
                    {...(isActions ? { 'data-actions': true } : {})}
                  >
                    {isMobile && isActions ? <ActionCell>{raw}</ActionCell> : raw}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableResponsive>
  );
};

export default DataTable;
