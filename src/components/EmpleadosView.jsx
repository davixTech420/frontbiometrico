import React from 'react';
import { createEmpleado } from '../services/api';

const EmpleadosView = ({ empleados, onEmpleadoAdded }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Guardando...';

    const payload = {
      pin: form.pin.value,
      nombre: form.nombre.value,
      privilegio: form.privilegio.value
    };

    try {
      await createEmpleado(payload);
      form.reset();
      onEmpleadoAdded(); // Refresca la tabla
      alert('¡Empleado creado! El reloj lo descargará en unos segundos.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el empleado.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Crear Empleado';
    }
  };

  return (
    <>
      {/* Formulario */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white pt-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold">➕ Agregar Nuevo Empleado</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label">PIN (ID Reloj)</label>
              <input type="number" name="pin" className="form-control" placeholder="Ej: 101" required />
            </div>
            <div className="col-md-5">
              <label className="form-label">Nombre Completo</label>
              <input type="text" name="nombre" className="form-control" placeholder="Ej: Juan Pérez" required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Privilegio</label>
              <select name="privilegio" className="form-select" required>
                <option value="0">Usuario</option>
                <option value="14">Administrador</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-success w-100 fw-bold">Crear</button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Empleados */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white pt-3 pb-2 border-bottom">
          <h5 className="mb-0 fw-bold">Directorio de Empleados</h5>
        </div>
        <div className="card-body p-0 table-responsive">
          <table className="table table-hover table-striped mb-0 text-start">
            <thead className="table-dark">
              <tr>
                <th className="ps-4">PIN (ID Reloj)</th>
                <th>Nombre del Empleado</th>
                <th>Privilegio</th>
              </tr>
            </thead>
            <tbody>
              {empleados.length === 0 && (
                <tr><td colSpan="3" className="text-center py-4 text-muted">Aún no hay empleados registrados...</td></tr>
              )}
              {empleados.map((emp) => (
                <tr key={emp.pin}>
                  <td className="ps-4"><span className="badge bg-secondary">{emp.pin}</span></td>
                  <td className="fw-bold">{emp.nombre}</td>
                  <td>{emp.privilegio === '14' ? 'Administrador' : 'Usuario'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default EmpleadosView;

