import { useEffect, useState } from 'react';
import './App.css'; // Mantenemos tu archivo de estilos original

function App() {
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [vista, setVista] = useState('asistencias'); // 'asistencias' o 'empleados'

  // Función para obtener datos del backend
  const fetchData = async () => {
    try {
      const resAsistencias = await fetch('http://localhost:8085/api/asistencias');
      const dataAsistencias = await resAsistencias.json();
      setAsistencias(dataAsistencias);

      const resEmpleados = await fetch('http://localhost:8085/api/empleados');
      const dataEmpleados = await resEmpleados.json();
      setEmpleados(dataEmpleados);
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
    }
  };

  // Se ejecuta al cargar la página
  useEffect(() => {
    fetchData();
    const intervalo = setInterval(fetchData, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="container-fluid bg-light min-vh-100 p-4" style={{ color: '#333' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold m-0">🛡️ Socotec Biométrico</h2>
        <div>
          <button 
            className={`btn me-2 ${vista === 'asistencias' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVista('asistencias')}
          >
            ⏱️ Asistencias
          </button>
          <button 
            className={`btn ${vista === 'empleados' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVista('empleados')}
          >
            👥 Empleados ({empleados.length || 0})
          </button>
        </div>
      </div>

      {/* VISTA ASISTENCIAS */}
      {vista === 'asistencias' && (
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
      )}

      {/* VISTA EMPLEADOS */}
      {vista === 'empleados' && (
        <>
          {/* Formulario para agregar empleado */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-3 pb-2 border-bottom">
              <h5 className="mb-0 fw-bold">➕ Agregar Nuevo Empleado</h5>
            </div>
            <div className="card-body">
              <form 
                onSubmit={async (e) => {
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
                    const res = await fetch('http://localhost:8085/api/empleados', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                      form.reset();
                      fetchData(); // Recargamos la tabla
                      alert('¡Empleado creado! El reloj lo descargará en unos segundos.');
                    } else {
                      alert('Error al guardar el empleado.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Falla de red al intentar crear el empleado.');
                  } finally {
                    btn.disabled = false;
                    btn.innerText = 'Crear Empleado';
                  }
                }}
                className="row g-3"
              >
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
      )}
    </div>
  );
}

export default App;
