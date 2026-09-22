import React from 'react';

const AsistenciasTable = ({ asistencias }) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white pt-3 pb-2 border-bottom">
        <h5 className="mb-0 fw-bold">Últimos Registros (Tiempo Real)</h5>
      </div>
      <div className="card-body p-0 table-responsive">
        <table className="table table-hover table-striped mb-0 text-start">
          <thead className="table-dark">
            <tr>
              <th className="ps-4">PIN</th>
              <th>Nombre</th>
              <th>Fecha y Hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.length === 0 && (
              <tr><td colSpan="4" className="text-center py-4 text-muted">Aún no hay registros de asistencia...</td></tr>
            )}
            {asistencias.map((registro, idx) => (
              <tr key={idx}>
                <td className="ps-4"><span className="badge bg-secondary">{registro.empleado_pin}</span></td>
                <td className="fw-bold">{registro.Empleado ? registro.Empleado.nombre : 'Desconocido'}</td>
                <td>{new Date(registro.tiempo_registro).toLocaleString()}</td>
                <td>
                  {registro.estado === '0' || registro.estado === 'Entrada' ? (
                    <span className="badge bg-success">Entrada</span>
                  ) : (
                    <span className="badge bg-danger">Salida / Otro</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AsistenciasTable;

