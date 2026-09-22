import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Clock, LayoutDashboard, Sun, Moon, 
  Search, Plus, Menu, X, CheckCircle, Edit2, Trash2, ArrowRight, AlertTriangle, FileText, FileSpreadsheet
} from 'lucide-react';

// --- SERVICIOS API ---
const API_URL = 'http://localhost:8085/api';
const fetchAPI = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) throw new Error('Error en la petición');
  return res.json();
};

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  
  // --- ESTADOS DE DATOS ---
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);

  // --- ESTADOS DE REPORTES ---
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  // --- ESTADOS UI (CRUD y Filtros) ---
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ pin: '', nombre: '', privilegio: '0' });

  // --- MODAL PERSONALIZADO ---
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });

  // --- EFECTOS ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [emps, asists] = await Promise.all([
        fetchAPI('/empleados'),
        fetchAPI('/asistencias')
      ]);
      setEmpleados(emps);
      setAsistencias(asists);
    } catch (error) {
      console.error("Error conectando al backend", error);
    }
  };

  const showModal = (type, title, message, onConfirm = null) => {
    setModal({ isOpen: true, type, title, message, onConfirm });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- LÓGICA DE CRUD ---
  const handleSaveEmpleado = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing ? `/empleados/${formData.pin}` : '/empleados';
      
      await fetchAPI(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setShowAddForm(false);
      setIsEditing(false);
      setFormData({ pin: '', nombre: '', privilegio: '0' });
      loadData();
      showModal('alert', '¡Éxito!', 'El empleado fue guardado correctamente en el sistema y se enviará al reloj.');
    } catch (error) {
      showModal('alert', 'Error', 'Ocurrió un problema al guardar el empleado.');
    }
  };

  const handleEditClick = (emp) => {
    setFormData({ pin: emp.pin, nombre: emp.nombre, privilegio: emp.privilegio });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDeleteClick = (pin) => {
    showModal(
      'confirm', 
      'Confirmar Eliminación', 
      `¿Estás totalmente seguro de que deseas eliminar al empleado con PIN ${pin}? Esta acción lo borrará de la base de datos y del reloj biométrico.`,
      async () => {
        try {
          await fetchAPI(`/empleados/${pin}`, { method: 'DELETE' });
          loadData();
          showModal('alert', 'Eliminado', 'El empleado ha sido eliminado exitosamente.');
        } catch (error) {
          showModal('alert', 'Error', 'Hubo un error al intentar eliminar al empleado.');
        }
      }
    );
  };

  // --- LÓGICA DE EXPORTACIÓN ---
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const data = await fetchAPI(`/reporte?startDate=${reportStartDate}&endDate=${reportEndDate}`);
      
      if (data.length === 0) {
        showModal('alert', 'Sin Datos', 'No hay registros en el rango seleccionado.');
        setIsExporting(false);
        return;
      }

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Reporte de Asistencias (Entradas y Salidas)', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Desde: ${reportStartDate}  Hasta: ${reportEndDate}`, 14, 30);

        const tableColumn = ["PIN", "Empleado", "Fecha", "Entrada", "Salida"];
        const tableRows = data.map(item => [item.pin, item.nombre, item.fecha, item.entrada, item.salida]);

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 10 },
          headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`Reporte_Asistencias_${reportStartDate}.pdf`);
      } 
      else if (format === 'excel') {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
          'PIN': item.pin,
          'Nombre del Empleado': item.nombre,
          'Fecha': item.fecha,
          'Hora Entrada': item.entrada,
          'Hora Salida': item.salida
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
        
        // Ajustar ancho de columnas
        worksheet['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        
        XLSX.writeFile(workbook, `Reporte_Asistencias_${reportStartDate}.xlsx`);
      }
    } catch (error) {
      console.error(error);
      showModal('alert', 'Error', 'No se pudo generar el reporte. Verifica tu conexión.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- FILTROS (Manejo local seguro) ---
  const filteredEmpleados = useMemo(() => 
    empleados.filter(e => 
      (e.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
      String(e.pin || '').includes(search)
    ),
    [empleados, search]
  );
  
  const filteredAsistencias = useMemo(() => 
    asistencias.filter(a => 
      (a.Empleado?.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
      String(a.empleado_pin || '').includes(search)
    ),
    [asistencias, search]
  );

  // --- COMPONENTES UI REUTILIZABLES ---
  const NavItem = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => { setView(id); setSidebarOpen(false); setSearch(''); setShowAddForm(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        view === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium tracking-wide">{label}</span>
    </button>
  );

  const StatCard = ({ title, value, icon: Icon, color, bgAccent }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center space-x-5 animate-fade-in hover:shadow-md transition-shadow duration-300">
      <div className={`p-4 rounded-2xl ${bgAccent} ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon size={28} className={color.replace('text-', 'fill-current text-')} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 transition-colors duration-500 font-sans text-gray-900 dark:text-gray-100">
      
      {/* --- MODAL GLOBAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 transform animate-slide-up">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 rounded-full ${modal.type === 'confirm' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                {modal.type === 'confirm' ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modal.title}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {modal.message}
            </p>
            <div className="flex justify-end space-x-3">
              {modal.type === 'confirm' && (
                <button 
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg ${
                  modal.type === 'confirm' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {modal.type === 'confirm' ? 'Sí, Eliminar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10 mt-2 px-2">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center space-x-2">
              <span className="bg-blue-600 dark:bg-blue-500 rounded-lg p-1">
                <CheckCircle size={20} className="text-white" />
              </span>
              <span>CRM Panel</span>
            </h1>
            <button className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-3 flex-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
            <NavItem icon={Users} label="Empleados" id="empleados" />
            <NavItem icon={Clock} label="Asistencias" id="asistencias" />
          </nav>
          
          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-700">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-950 transition-all shadow-inner"
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-blue-500" />}
              <span className="font-medium">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOPBAR */}
        <header className="h-24 px-8 flex items-center justify-between z-40 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize tracking-tight">
              {view}
            </h2>
          </div>
          
          {view !== 'dashboard' && (
            <div className="relative w-72 max-w-md hidden sm:block animate-fade-in">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por PIN o Nombre..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 rounded-2xl text-sm transition-all dark:text-white placeholder-gray-400 outline-none"
              />
            </div>
          )}
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 animate-fade-in pb-24">
          
          {/* VISTA: DASHBOARD */}
          {view === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Empleados" 
                  value={empleados.length} 
                  icon={Users} 
                  color="text-blue-600 dark:text-blue-400"
                  bgAccent="bg-blue-100 dark:bg-blue-500" 
                />
                <StatCard 
                  title="Asistencias Hoy" 
                  value={asistencias.filter(a => new Date(a.tiempo_registro).toDateString() === new Date().toDateString()).length} 
                  icon={Clock} 
                  color="text-emerald-600 dark:text-emerald-400"
                  bgAccent="bg-emerald-100 dark:bg-emerald-500" 
                />
                <StatCard 
                  title="Último Registro" 
                  value={asistencias[0] ? new Date(asistencias[0].tiempo_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} 
                  icon={CheckCircle} 
                  color="text-indigo-600 dark:text-indigo-400"
                  bgAccent="bg-indigo-100 dark:bg-indigo-500" 
                />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-50 dark:border-slate-700/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Actividad Reciente</h3>
                  <button onClick={() => setView('asistencias')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center hover:bg-blue-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                    Ver historial completo <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody>
                      {asistencias.slice(0, 5).map((a, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors group">
                          <td className="p-5">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-inner">
                                {a.Empleado?.nombre?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{a.Empleado?.nombre || 'Desconocido'}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">PIN: {a.empleado_pin}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-gray-500 dark:text-gray-400 font-medium text-right">
                            {new Date(a.tiempo_registro).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: EMPLEADOS */}
          {view === 'empleados' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up flex flex-col h-full max-w-7xl mx-auto">
              <div className="p-6 border-b border-gray-50 dark:border-slate-700/50 flex flex-wrap gap-4 justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Directorio del Personal</h3>
                <button 
                  onClick={() => {
                    if(showAddForm && !isEditing) { setShowAddForm(false); } 
                    else { setFormData({ pin: '', nombre: '', privilegio: '0' }); setIsEditing(false); setShowAddForm(true); }
                  }}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-medium"
                >
                  {showAddForm && !isEditing ? <X size={18} /> : <Plus size={18} />}
                  <span>{showAddForm && !isEditing ? 'Cancelar' : 'Nuevo Empleado'}</span>
                </button>
              </div>
              
              {showAddForm && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700/50 animate-fade-in shadow-inner">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">{isEditing ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}</h4>
                  <form onSubmit={handleSaveEmpleado} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">PIN (Reloj)</label>
                      <input required type="number" disabled={isEditing} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:opacity-50" placeholder="Ej: 101" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Nombre Completo</label>
                      <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Rol de Acceso</label>
                      <select value={formData.privilegio} onChange={e => setFormData({...formData, privilegio: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                        <option value="0">Usuario Regular</option>
                        <option value="14">Administrador</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
                      <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                        Cancelar
                      </button>
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center">
                        <CheckCircle size={18} className="mr-2" />
                        {isEditing ? 'Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 shadow-sm border-b border-gray-100 dark:border-slate-700/50">
                    <tr>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">PIN</th>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Empleado</th>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {filteredEmpleados.length === 0 ? (
                      <tr><td colSpan="4" className="p-12 text-center text-gray-400 dark:text-gray-500 font-medium">No se encontraron empleados</td></tr>
                    ) : (
                      filteredEmpleados.map((emp) => (
                        <tr key={emp.pin} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="p-5">
                            <span className="bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 py-1.5 px-3 rounded-lg text-sm font-bold shadow-sm">{emp.pin}</span>
                          </td>
                          <td className="p-5 font-bold text-gray-900 dark:text-white">{emp.nombre || 'Desconocido'}</td>
                          <td className="p-5">
                            {emp.privilegio === '14' ? 
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">Administrador</span> : 
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 border border-gray-200 dark:border-slate-600">Usuario</span>
                            }
                          </td>
                          <td className="p-5 text-right space-x-1">
                            <button onClick={() => handleEditClick(emp)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteClick(emp.pin)} className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA: ASISTENCIAS */}
          {view === 'asistencias' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up flex flex-col h-full max-w-7xl mx-auto">
              <div className="p-6 border-b border-gray-50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex flex-wrap lg:flex-nowrap justify-between items-center gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registro de Asistencias</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sincronización en tiempo real con el reloj.</p>
                </div>
                
                {/* --- SECCIÓN DE REPORTES --- */}
                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">Desde:</span>
                    <input 
                      type="date" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="text-sm p-2 rounded-xl border-none ring-1 ring-gray-200 dark:ring-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Hasta:</span>
                    <input 
                      type="date" 
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="text-sm p-2 rounded-xl border-none ring-1 ring-gray-200 dark:ring-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-500/20 text-sm font-medium"
                    >
                      <FileText size={16} />
                      <span>PDF</span>
                    </button>
                    <button 
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                      className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-sm font-medium"
                    >
                      <FileSpreadsheet size={16} />
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 shadow-sm border-b border-gray-100 dark:border-slate-700/50">
                    <tr>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Empleado</th>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                      <th className="p-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {filteredAsistencias.length === 0 ? (
                      <tr><td colSpan="3" className="p-12 text-center text-gray-400 dark:text-gray-500 font-medium">No hay registros recientes</td></tr>
                    ) : (
                      filteredAsistencias.map((registro, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center space-x-4">
                              <span className="bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-xs py-1.5 px-2.5 rounded-lg font-bold shadow-sm">{registro.empleado_pin}</span>
                              <span className="font-bold text-gray-900 dark:text-white">{registro.Empleado?.nombre || 'Desconocido'}</span>
                            </div>
                          </td>
                          <td className="p-5 text-gray-600 dark:text-gray-300 font-medium">
                            {new Date(registro.tiempo_registro).toLocaleString()}
                          </td>
                          <td className="p-5">
                            {registro.estado === '0' || registro.estado === 'Entrada' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500"></span> Entrada
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shadow-sm shadow-rose-500"></span> Salida
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
