// src/services/api.js
const API_URL = 'http://localhost:8085/api';

/**
 * Obtiene la lista de asistencias desde el backend.
 */
export const getAsistencias = async () => {
  const res = await fetch(`${API_URL}/asistencias`);
  if (!res.ok) throw new Error('Error al obtener asistencias');
  return res.json();
};

/**
 * Obtiene la lista de empleados desde el backend.
 */
export const getEmpleados = async () => {
  const res = await fetch(`${API_URL}/empleados`);
  if (!res.ok) throw new Error('Error al obtener empleados');
  return res.json();
};

/**
 * Crea un nuevo empleado.
 */
export const createEmpleado = async (empleadoData) => {
  const res = await fetch(`${API_URL}/empleados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(empleadoData)
  });
  if (!res.ok) throw new Error('Error al crear empleado');
  return res.json();
};

