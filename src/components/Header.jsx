import React from 'react';

const Header = ({ vista, setVista, totalEmpleados }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="text-primary fw-bold m-0">
        
        <span> <img src="favicon.svg" alt="" />  </span>
         Socotec Biométrico</h2>
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
          👥 Empleados ({totalEmpleados || 0})
        </button>
      </div>
    </div>
  );
};

export default Header;

