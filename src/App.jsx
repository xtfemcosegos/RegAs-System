import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, ChevronLeft, ChevronRight, 
  Clock, MapPin, Briefcase, Plus, X, 
  Settings, Save, Trash2, Layout, Grid, Menu,
  Repeat, Edit2, AlertCircle, Coffee, Sparkles,
  Zap, Gift, RefreshCw, BookTemplate, CalendarDays, 
  Timer, LogIn, UserX, ChevronDown, ChevronUp, CloudDownload,
  ArrowLeft, Home, Search, Filter, MoreHorizontal, AlertTriangle, FileText, Ban, Palmtree,
  ClipboardList, CheckSquare, Clock3, Flag, Phone, Mail, User, HeartPulse, CreditCard, Building,
  CheckCircle, XCircle
} from 'lucide-react';

// --- UTILIDADES ---
const formatDateKey = (date) => date.toISOString().split('T')[0];

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
};

// Determina el color del borde de la foto según el estado del empleado
const getStatusBorderColor = (assignment, shiftDef) => {
    if (shiftDef.category === 'absence') return 'border-red-500 shadow-sm shadow-red-200'; // Faltó
    if (shiftDef.category === 'work' && assignment.Entrada && assignment.Entrada !== '') return 'border-emerald-500 shadow-sm shadow-emerald-200'; // Presente
    return 'border-gray-300'; // Descanso o No ha llegado
};

// --- FIX DE IMÁGENES: RUTA RELATIVA EXPLÍCITA ---
// Usamos "./" para forzar la búsqueda en el directorio actual (la carpeta del repositorio)
// Esto soluciona problemas en GitHub Pages donde "FP/" podría buscarse en la raíz del dominio.
const getImagePath = (id) => {
    return `./FP/${id}.jpg`;
};

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// --- DATOS POR DEFECTO ---
const DEFAULT_STRUCTURE = [
  {
    id: 'cat_edificios',
    name: 'Edificios Corporativos',
    areas: [
      { id: 'area_edison', name: 'Complejo Edison' },
      { id: 'area_michelena', name: 'Edificio Michelena' },
      { id: 'area_simon', name: 'Edificio Simón Bolívar' }
    ]
  },
  {
    id: 'cat_estacionamientos',
    name: 'Accesos y Estacionamientos',
    areas: [
      { id: 'area_carranza', name: 'Acceso Carranza' },
      { id: 'area_un', name: 'Acceso U.N' }
    ]
  },
  {
    id: 'cat_general',
    name: 'Personal General',
    areas: [
      { id: 'area_cce', name: 'Centro de Control' },
      { id: 'area_encargado_caseta', name: 'Encargado de Caseta' },
      { id: 'area_encargado', name: 'Encargado de Turno' },
      { id: 'area_rondinero', name: 'Patrullaje / Rondín' }
    ]
  }
];

const DEFAULT_SHIFTS = [
  { id: 'shift_off', name: 'Descanso', code: 'OFF', color: 'bg-gray-100 text-gray-400 border-gray-200', category: 'rest', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
  { id: 'shift_m8', name: 'Matutino', code: 'M8', color: 'bg-white text-blue-700 border-l-4 border-l-blue-600 border-y border-r border-gray-200', category: 'work', hours: 8, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '07:00', endTime: '15:00' },
  { id: 'shift_v8', name: 'Vespertino', code: 'V8', color: 'bg-white text-orange-700 border-l-4 border-l-orange-500 border-y border-r border-gray-200', category: 'work', hours: 8, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '14:00', endTime: '22:00' },
  { id: 'shift_n12', name: 'Nocturno', code: 'N12', color: 'bg-slate-800 text-white border-slate-900', category: 'work', hours: 12, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '19:00', endTime: '07:00' },
  { id: 'shift_d12', name: 'Día Largo', code: 'D12', color: 'bg-white text-emerald-800 border-l-4 border-l-emerald-600 border-y border-r border-gray-200', category: 'work', hours: 12, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '07:00', endTime: '19:00' },
  { id: 'shift_falta', name: 'Falta Injustificada', code: 'FI', color: 'bg-red-50 text-red-700 border-red-200', category: 'absence', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
  { id: 'shift_permiso', name: 'Permiso', code: 'PER', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', category: 'absence', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
  { id: 'shift_inc', name: 'Incapacidad', code: 'INC', color: 'bg-purple-50 text-purple-700 border-purple-200', category: 'absence', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
  { id: 'shift_suspension', name: 'Suspensión', code: 'SUS', color: 'bg-gray-800 text-white border-gray-900', category: 'absence', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
  { id: 'shift_vac', name: 'Vacaciones', code: 'VAC', color: 'bg-sky-50 text-sky-700 border-sky-200', category: 'absence', hours: 0, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' },
];

const COLOR_OPTIONS = [
  { label: 'Gris Corporativo', value: 'bg-gray-100 text-gray-600 border-gray-200' },
  { label: 'Azul Institucional', value: 'bg-white text-blue-800 border-l-4 border-l-blue-700 border-y border-r border-gray-200' },
  { label: 'Verde Éxito', value: 'bg-white text-emerald-800 border-l-4 border-l-emerald-600 border-y border-r border-gray-200' },
  { label: 'Naranja Alerta', value: 'bg-white text-orange-800 border-l-4 border-l-orange-500 border-y border-r border-gray-200' },
  { label: 'Rojo Urgente', value: 'bg-white text-red-800 border-l-4 border-l-red-600 border-y border-r border-gray-200' },
  { label: 'Negro Solido', value: 'bg-slate-900 text-white border-black' },
  { label: 'Plata Metálico', value: 'bg-slate-200 text-slate-800 border-slate-300' },
  { label: 'Amarillo Preventivo', value: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
];

// --- COMPONENTE PRINCIPAL ---
const App = () => {
  // --- ESTADO ---
  const [view, setView] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Datos Persistentes
  const [staff, setStaff] = useState(() => JSON.parse(localStorage.getItem('planner_staff_v2')) || []);
  const [structure, setStructure] = useState(() => JSON.parse(localStorage.getItem('planner_structure')) || DEFAULT_STRUCTURE);
  const [shiftTypes, setShiftTypes] = useState(() => JSON.parse(localStorage.getItem('planner_shifts')) || DEFAULT_SHIFTS);
  const [assignments, setAssignments] = useState(() => JSON.parse(localStorage.getItem('planner_assignments_v2')) || {});
  const [savedPatterns, setSavedPatterns] = useState(() => JSON.parse(localStorage.getItem('planner_patterns')) || []);

  // Modales y UI
  const [editingCell, setEditingCell] = useState(null); 
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  
  // Sistema de Notificaciones y Confirmación
  const [toast, setToast] = useState(null); 
  const [confirmModal, setConfirmModal] = useState(null); 

  // Estado del Generador de Patrones
  const [selectedStaffForPattern, setSelectedStaffForPattern] = useState(null);
  const [patternSequence, setPatternSequence] = useState([]);
  const [patternStartDate, setPatternStartDate] = useState(formatDateKey(new Date()));
  const [patternRangeType, setPatternRangeType] = useState('months'); 
  const [patternRangeValue, setPatternRangeValue] = useState(1); 
  const [patTempShiftId, setPatTempShiftId] = useState('');
  const [patTempCount, setPatTempCount] = useState(2);
  const [patTempArea, setPatTempArea] = useState('Sin Asignar');
  const [patSaveName, setPatSaveName] = useState('');

  // Estado de Configuración
  const [configTab, setConfigTab] = useState('staff');
  const [newCatName, setNewCatName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [editingShiftId, setEditingShiftId] = useState(null);
  
  // Estado de Expediente (Personal)
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({});
  
  // Estado de Edición de Turnos
  const [uiTotalHours, setUiTotalHours] = useState(8); 
  const [shiftForm, setShiftForm] = useState({ 
    name: '', code: '', color: COLOR_OPTIONS[1].value, category: 'work',
    hours: 8, extraHours: 0, holidayHours: 0, recoveryHours: 0,
    startTime: '00:00', endTime: '00:00'
  });

  // --- PERSISTENCIA ---
  useEffect(() => { localStorage.setItem('planner_staff_v2', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { localStorage.setItem('planner_assignments_v2', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('planner_structure', JSON.stringify(structure)); }, [structure]);
  useEffect(() => { localStorage.setItem('planner_shifts', JSON.stringify(shiftTypes)); }, [shiftTypes]);
  useEffect(() => { localStorage.setItem('planner_patterns', JSON.stringify(savedPatterns)); }, [savedPatterns]);

  // Auto-cierre de Toasts
  useEffect(() => {
      if(toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const showToast = (msg, type='success') => setToast({ message: msg, type });

  // --- SINCRONIZACIÓN INICIAL ---
  useEffect(() => { fetchStaffFromCloud(true); }, []);

  // --- HELPERS DE DATOS ---
  const getAssignment = (staffId, dateStr) => {
    const defaultData = { 
        shiftId: 'shift_off', 
        Key: `${staffId}_${dateStr}`, Fecha: dateStr, ID: staffId, Nombre: staff.find(s => s.id === staffId)?.name || 'Desconocido',
        Turno: 'OFF', Caseta: 'Sin Asignar', Entrada: '', Salida: '', Fes: 0, TiEx: 0, Rec: 0, Ret: 0,
        Comentario: '', Ausentismo: '', Motivo: '', Tasks: []
    };
    const saved = assignments[`${staffId}_${dateStr}`];
    if (saved && !saved.Tasks) saved.Tasks = [];
    return saved || defaultData;
  };

  const getShiftDef = (shiftId) => shiftTypes.find(s => s.id === shiftId) || shiftTypes[0];

  const saveAssignmentRecord = (staffId, dateStr, overrides = {}) => {
      const person = staff.find(s => s.id === staffId);
      const existing = getAssignment(staffId, dateStr);
      
      const targetShiftId = overrides.shiftId || existing.shiftId;
      const shiftDef = getShiftDef(targetShiftId);

      const finalArea = overrides.area !== undefined ? overrides.area : existing.Caseta;
      const finalRet = overrides.ret !== undefined ? overrides.ret : existing.Ret;
      const finalComments = overrides.comments !== undefined ? overrides.comments : existing.Comentario;
      const finalMotivo = overrides.motivo !== undefined ? overrides.motivo : existing.Motivo;
      const finalTasks = overrides.tasks !== undefined ? overrides.tasks : existing.Tasks;
      
      const finalEntrada = overrides.entrada !== undefined ? overrides.entrada : (existing.Entrada || '');
      const finalSalida = overrides.salida !== undefined ? overrides.salida : (existing.Salida || '');

      const finalFes = overrides.fes !== undefined ? overrides.fes : (existing.Key ? existing.Fes : shiftDef.holidayHours);
      const finalTiEx = overrides.tiEx !== undefined ? overrides.tiEx : (existing.Key ? existing.TiEx : shiftDef.extraHours);
      const finalRec = overrides.rec !== undefined ? overrides.rec : (existing.Key ? existing.Rec : shiftDef.recoveryHours);

      const newRecord = {
          shiftId: targetShiftId,
          Key: `${staffId}_${dateStr}`,
          Fecha: dateStr,
          ID: staffId,
          Nombre: person ? person.name : 'Desconocido',
          Turno: shiftDef.code,
          Caseta: shiftDef.category === 'rest' ? 'Descanso' : finalArea,
          Entrada: finalEntrada,
          Salida: finalSalida,
          Fes: parseInt(finalFes) || 0,
          TiEx: parseInt(finalTiEx) || 0,
          Rec: parseInt(finalRec) || 0,
          Ret: parseInt(finalRet) || 0,
          Comentario: finalComments,
          Ausentismo: shiftDef.category === 'absence' ? shiftDef.name : '',
          Motivo: shiftDef.category === 'absence' ? (finalMotivo || shiftDef.name) : '',
          Tasks: finalTasks
      };
      setAssignments(prev => ({ ...prev, [`${staffId}_${dateStr}`]: newRecord }));
  };
  
  const getTotalHours = (s) => (s.hours || 0) + (s.extraHours || 0) + (s.holidayHours || 0) + (s.recoveryHours || 0);

  const nextPeriod = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };
  const prevPeriod = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  // --- GESTIÓN DE PERSONAL (EXPEDIENTE) ---
  const createNewStaff = () => {
      setStaffForm({
          id: '', name: '', dob: '', bloodType: '',
          phone: '', email: '', address: '',
          emergencyName: '', emergencyPhone: '',
          hireDate: '', nss: '', curp: '', rfc: '', position: 'Guardia'
      });
      setSelectedStaffId('NEW');
  };

  const saveStaffMember = () => {
      if (!staffForm.id || !staffForm.name) return showToast("ID y Nombre obligatorios", 'error');
      if (selectedStaffId === 'NEW' && staff.some(s => s.id === staffForm.id)) return showToast("El ID ya existe", 'error');
      
      setStaff(prev => {
          if (selectedStaffId === 'NEW') return [...prev, staffForm];
          return prev.map(s => s.id === selectedStaffId ? { ...s, ...staffForm } : s);
      });
      showToast("Empleado guardado correctamente");
      setSelectedStaffId(null);
  };

  const promptDeleteStaff = (id) => {
      setConfirmModal({
          title: 'Eliminar Empleado',
          message: '¿Está seguro de eliminar este expediente y todo su historial? Esta acción es irreversible.',
          onConfirm: () => {
              setStaff(prev => prev.filter(s => String(s.id) !== String(id)));
              setSelectedStaffId(null);
              setStaffForm({});
              setConfirmModal(null);
              showToast("Empleado eliminado");
          }
      });
  };

  const fetchStaffFromCloud = async (silent = false) => {
    setIsLoadingStaff(true);
    try {
        const response = await fetch('https://default3b2cbccb81bb44a2a19a2386bb3606.02.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/097a63200e254f4db1c47d052f2613ef/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4GE6KXcJvL1j7ih9cl-ubC93RoycRieLuJuz2DdbFU4', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Mode: 'ElementosPP' })
        });
        if (!response.ok) throw new Error('Error de conexión');
        const data = await response.json();
        if (data.Usuarios && Array.isArray(data.Usuarios)) {
            setStaff(prevStaff => {
                const newStaff = [...prevStaff];
                data.Usuarios.forEach(u => {
                    const existingIndex = newStaff.findIndex(s => s.id == u.ID);
                    if (existingIndex >= 0) { 
                        newStaff[existingIndex] = { ...newStaff[existingIndex], name: u.Nombre }; 
                    } else { 
                        newStaff.push({ id: String(u.ID), name: u.Nombre }); 
                    }
                });
                return newStaff;
            });
            if(!silent) showToast(`Sincronización: ${data.Usuarios.length} registros.`);
        }
    } catch (error) { console.error("Error API:", error); if(!silent) showToast('Error: ' + error.message, 'error'); } finally { setIsLoadingStaff(false); }
  };
  
  // --- CONFIGURACIÓN DE ÁREAS Y TURNOS ---
  const addCategory = () => { if(newCatName.trim()) setStructure([...structure, { id: `cat_${Date.now()}`, name: newCatName, areas: [] }]); setNewCatName(''); };
  
  const promptDeleteCategory = (catId) => {
      setConfirmModal({
          title: 'Eliminar Categoría',
          message: '¿Borrar esta categoría y todas sus áreas?',
          onConfirm: () => {
              setStructure(structure.filter(c => c.id !== catId));
              setConfirmModal(null);
          }
      });
  };

  const addArea = (catId) => { if(newAreaName.trim()) setStructure(structure.map(c => c.id===catId ? {...c, areas:[...c.areas, {id:`area_${Date.now()}`, name:newAreaName}]} : c)); setNewAreaName(''); };
  const deleteArea = (catId, areaId) => setStructure(structure.map(c => c.id===catId ? {...c, areas:c.areas.filter(a=>a.id!==areaId)} : c));

  const updateShiftHours = (field, value) => {
    const newVal = parseFloat(value) || 0;
    const currentTotal = field === 'total' ? newVal : uiTotalHours;
    const extra = field === 'extraHours' ? newVal : shiftForm.extraHours;
    const holiday = field === 'holidayHours' ? newVal : shiftForm.holidayHours;
    const recup = field === 'recoveryHours' ? newVal : shiftForm.recoveryHours;
    let regular = currentTotal - extra - holiday - recup;
    if (regular < 0) regular = 0;
    if (field === 'total') setUiTotalHours(newVal);
    setShiftForm(prev => ({ ...prev, [field === 'total' ? 'dummy' : field]: newVal, hours: regular }));
  };

  const handleSaveShift = () => {
    if (!shiftForm.name.trim() || !shiftForm.code.trim()) return showToast("Datos incompletos", 'error');
    const newShift = editingShiftId 
      ? { ...shiftTypes.find(s=>s.id===editingShiftId), ...shiftForm, code: shiftForm.code.substring(0,4).toUpperCase() }
      : { id: `shift_${Date.now()}`, ...shiftForm, code: shiftForm.code.substring(0,4).toUpperCase() };
    if (editingShiftId) setShiftTypes(shiftTypes.map(s => s.id === editingShiftId ? newShift : s));
    else setShiftTypes([...shiftTypes, newShift]);
    setEditingShiftId(null); setUiTotalHours(8);
    setShiftForm({ name: '', code: '', color: COLOR_OPTIONS[1].value, category: 'work', hours: 8, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' });
    showToast("Turno guardado");
  };

  const handleEditClick = (shift) => {
    setEditingShiftId(shift.id);
    const total = (shift.hours || 0) + (shift.extraHours || 0) + (shift.holidayHours || 0) + (shift.recoveryHours || 0);
    setUiTotalHours(total);
    setShiftForm({ ...shiftTypes.find(s => s.id === shift.id) });
  };
  
  const handleCancelEdit = () => { setEditingShiftId(null); setUiTotalHours(8); setShiftForm({ name: '', code: '', color: COLOR_OPTIONS[1].value, category: 'work', hours: 8, extraHours: 0, holidayHours: 0, recoveryHours: 0, startTime: '00:00', endTime: '00:00' }); };
  const handleDeleteShift = (id) => { 
      if (id === 'shift_off') return showToast("El descanso no se puede borrar", 'error'); 
      setConfirmModal({
          title: 'Eliminar Turno',
          message: '¿Estás seguro de eliminar este turno del catálogo?',
          onConfirm: () => {
              setShiftTypes(shiftTypes.filter(s => s.id !== id));
              setConfirmModal(null);
          }
      });
  };

  // --- GENERADOR DE PATRONES ---
  const openPatternModal = (staffId, startDate = null) => { 
      setSelectedStaffForPattern(staffId); setPatternSequence([]); setPatTempShiftId(shiftTypes[1]?.id || shiftTypes[0].id); 
      setPatTempArea('Sin Asignar');
      if (startDate) setPatternStartDate(startDate);
      setPatternRangeType('months'); setPatternRangeValue(1); setShowPatternModal(true); 
  };
  
  const addToSequence = () => { 
      if(patTempShiftId) {
          setPatternSequence([...patternSequence, { 
              shiftId: patTempShiftId, 
              count: parseInt(patTempCount) || 1,
              area: patTempArea 
          }]); 
      }
  };
  
  const savePatternTemplate = () => { if(!patSaveName.trim()) return showToast("Escribe un nombre", 'error'); if(patternSequence.length === 0) return showToast("Secuencia vacía", 'error'); setSavedPatterns([...savedPatterns, { id: Date.now(), name: patSaveName, sequence: patternSequence }]); setPatSaveName(''); showToast("Plantilla Guardada"); };
  const deletePatternTemplate = (id) => { 
      setConfirmModal({
          title: 'Borrar Plantilla',
          message: '¿Deseas eliminar esta plantilla de rol?',
          onConfirm: () => {
              setSavedPatterns(savedPatterns.filter(p => p.id !== id));
              setConfirmModal(null);
          }
      });
  };

  const applyPattern = () => {
    if (!selectedStaffForPattern || patternSequence.length === 0) return;
    let flatSequence = []; 
    patternSequence.forEach(step => { 
        for(let i=0; i<step.count; i++) {
            flatSequence.push({ shiftId: step.shiftId, area: step.area }); 
        }
    });
    
    const [y, m, d] = patternStartDate.split('-').map(Number);
    let iterDate = new Date(y, m-1, d); let endDate = new Date(iterDate);
    if (patternRangeType === 'weeks') { endDate.setDate(endDate.getDate() + (patternRangeValue * 7) - 1); } 
    else if (patternRangeType === 'months') { endDate.setMonth(endDate.getMonth() + patternRangeValue); endDate.setDate(endDate.getDate() - 1); } 
    
    let seqIndex = 0;
    while (iterDate <= endDate) {
      const step = flatSequence[seqIndex % flatSequence.length];
      saveAssignmentRecord(selectedStaffForPattern, formatDateKey(iterDate), { shiftId: step.shiftId, area: step.area });
      iterDate.setDate(iterDate.getDate() + 1); seqIndex++;
    }
    setShowPatternModal(false); showToast("Rol y ubicaciones aplicados correctamente.");
  };

  // --- UI COMPONENTS ---
  const EditFormContent = ({ isMobile }) => {
    if (!editingCell) return null;
    const { staffId, dateStr } = editingCell;
    const person = staff.find(s => s.id === staffId);
    const data = getAssignment(staffId, dateStr);
    const currentShift = getShiftDef(data.shiftId);
    
    const [showShiftSelector, setShowShiftSelector] = useState(false);
    const [showAbsenceMenu, setShowAbsenceMenu] = useState(false);
    const [showExtras, setShowExtras] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ type: 'Inicio', time: '', desc: '' });

    const isCheckedIn = data.Entrada && data.Entrada !== '';
    const isToday = dateStr === formatDateKey(new Date());
    
    const borderColor = getStatusBorderColor(data, currentShift);

    const handleAddTask = () => {
        if (!newTask.desc.trim()) return showToast("Escribe una descripción", 'error');
        const taskTime = newTask.time || new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
        const taskItem = { id: Date.now(), ...newTask, time: taskTime, completed: false };
        const updatedTasks = [...(data.Tasks || []), taskItem];
        saveAssignmentRecord(staffId, dateStr, { tasks: updatedTasks });
        setNewTask({ type: 'Inicio', time: '', desc: '' });
        setShowTaskForm(false);
    };

    const handleDeleteTask = (taskId) => {
        const updatedTasks = data.Tasks.filter(t => t.id !== taskId);
        saveAssignmentRecord(staffId, dateStr, { tasks: updatedTasks });
    };

    return (
      <div className={`flex flex-col h-full bg-white relative ${isMobile ? 'rounded-t-2xl shadow-2xl' : ''}`}>
        <div className="bg-slate-900 p-6 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-full border-4 overflow-hidden bg-slate-800 ${borderColor}`}>
                    <img src={getImagePath(person.id)} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{person?.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider"><Clock size={12}/> {dateStr}</div>
                 </div>
             </div>
             <button onClick={() => setEditingCell(null)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar relative">
            <button onClick={() => openPatternModal(staffId, dateStr)} className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg shadow-sm font-bold hover:bg-slate-100 hover:border-slate-400 flex items-center justify-center gap-2 text-sm transition-all"><CalendarDays size={18}/> Asignar Rol / Patrón</button>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold uppercase text-slate-400">Turno Actual</label>
                    <button onClick={() => setShowShiftSelector(!showShiftSelector)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">{showShiftSelector ? 'Cancelar' : 'Cambiar'} <Edit2 size={12}/></button>
                </div>
                {showShiftSelector ? (
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {shiftTypes.map(st => (
                            <button key={st.id} onClick={() => { 
                                saveAssignmentRecord(staffId, dateStr, { shiftId: st.id, entrada: '', salida: '' }); 
                                setShowShiftSelector(false); 
                            }} className={`p-3 rounded-lg text-sm border transition-all text-left flex items-center gap-3 ${data.shiftId === st.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                <div className={`w-3 h-3 rounded-sm ${st.color.split(' ')[0]}`}></div>
                                <span className="font-semibold text-slate-700 flex-1">{st.name}</span>
                                <span className="text-xs text-slate-400 font-mono">{st.code}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg shadow-inner ${currentShift.color}`}>{currentShift.code}</div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                {currentShift.name}
                                {data.TiEx > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">TEx</span>}
                                {data.Rec > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">TxT</span>}
                                {data.Ret > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Ret</span>}
                            </div>
                            <div className="text-xs text-slate-500 flex gap-2 mt-0.5">{currentShift.startTime} - {currentShift.endTime} • {getTotalHours(currentShift)}h</div>
                        </div>
                    </div>
                )}
            </div>

            {isToday && currentShift.category === 'work' && (
                <>
                    <div className="flex gap-3">
                        <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { entrada: new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'}) }); }} className={`flex-1 p-4 rounded-lg font-bold text-sm flex flex-col items-center gap-2 border transition-all ${isCheckedIn ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600'}`}>
                            <LogIn size={20} className={isCheckedIn ? "text-emerald-500" : "text-slate-400"}/><span className="text-center">{isCheckedIn ? 'Entrada OK' : 'Registrar Entrada'}</span>
                        </button>
                        <button onClick={() => setShowAbsenceMenu(!showAbsenceMenu)} className={`flex-1 p-4 rounded-lg font-bold text-sm flex flex-col items-center gap-2 border transition-all ${showAbsenceMenu ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-600'}`}>
                            <UserX size={20} className={showAbsenceMenu ? "text-red-500" : "text-slate-400"}/><span className="text-center">Ausentismo</span>
                        </button>
                        <button onClick={() => setShowExtras(!showExtras)} className={`w-14 p-4 rounded-lg flex items-center justify-center border transition-all ${showExtras ? 'bg-slate-800 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}>
                            <Plus size={24}/>
                        </button>
                    </div>

                    {showAbsenceMenu && (
                        <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 fade-in">
                            <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { shiftId: shiftTypes.find(s=>s.code==='FI')?.id || 'shift_falta', motivo: 'Falta Injustificada' }); setShowAbsenceMenu(false); }} className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-2"><Ban size={14}/> Falta Injustificada</button>
                            <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { shiftId: shiftTypes.find(s=>s.code==='PER')?.id || 'shift_permiso', motivo: 'Permiso' }); setShowAbsenceMenu(false); }} className="p-3 bg-yellow-50 border border-yellow-100 rounded text-yellow-700 text-xs font-bold hover:bg-yellow-100 flex items-center gap-2"><FileText size={14}/> Permiso</button>
                            <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { shiftId: shiftTypes.find(s=>s.code==='INC')?.id || 'shift_inc', motivo: 'Incapacidad' }); setShowAbsenceMenu(false); }} className="p-3 bg-purple-50 border border-purple-100 rounded text-purple-700 text-xs font-bold hover:bg-purple-100 flex items-center gap-2"><AlertTriangle size={14}/> Incapacidad</button>
                            <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { shiftId: shiftTypes.find(s=>s.code==='SUS')?.id || 'shift_suspension', motivo: 'Suspensión' }); setShowAbsenceMenu(false); }} className="p-3 bg-gray-100 border border-gray-200 rounded text-gray-700 text-xs font-bold hover:bg-gray-200 flex items-center gap-2"><AlertCircle size={14}/> Suspensión</button>
                            <button onClick={() => { saveAssignmentRecord(staffId, dateStr, { shiftId: shiftTypes.find(s=>s.code==='VAC')?.id || 'shift_vac', motivo: 'Vacaciones' }); setShowAbsenceMenu(false); }} className="col-span-2 p-3 bg-sky-50 border border-sky-100 rounded text-sky-700 text-xs font-bold hover:bg-sky-100 flex items-center gap-2 justify-center"><Palmtree size={14}/> Vacaciones</button>
                        </div>
                    )}
                </>
            )}

            {isCheckedIn && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="flex-1 mr-4"><label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">Hora Entrada</label><input type="time" className="w-full p-2 rounded border-emerald-300 border text-emerald-900 font-mono bg-white" value={data.Entrada || ''} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { entrada: e.target.value })} /></div>
                        <div className="flex items-center gap-2 mb-2"><input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={data.Ret > 0} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { ret: e.target.checked ? 15 : 0 })} /><label className="text-sm font-bold text-emerald-800">Retardo</label></div>
                    </div>
                    {data.Ret > 0 && (<div><label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">Minutos</label><input type="number" className="w-full p-2 rounded border-emerald-300 border bg-white" value={data.Ret} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { ret: e.target.value })} /></div>)}
                </div>
            )}

            {showExtras && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 animate-in slide-in-from-bottom-2 fade-in">
                     <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">Incidencias y Extras</h4>
                     <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] font-bold text-slate-500 block mb-1">T. Extra</label><input type="number" className="w-full p-2 border border-slate-200 rounded text-sm text-center" value={data.TiEx || ''} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { tiEx: e.target.value })} /></div>
                        <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Festivo</label><input type="number" className="w-full p-2 border border-slate-200 rounded text-sm text-center" value={data.Fes || ''} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { fes: e.target.value })} /></div>
                        <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Recup.</label><input type="number" className="w-full p-2 border border-slate-200 rounded text-sm text-center" value={data.Rec || ''} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { rec: e.target.value })} /></div>
                     </div>
                </div>
            )}

            {currentShift.category === 'work' && (
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Asignación de Caseta</label>
                <select className="w-full border-slate-300 border rounded-lg p-2.5 bg-white text-sm text-slate-700 font-medium shadow-sm" value={data.Caseta} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { area: e.target.value })}>
                  <option value="Sin Asignar">-- General / Sin Asignar --</option>
                  {structure.map(cat => (<optgroup key={cat.id} label={cat.name}>{cat.areas.map(area => (<option key={area.id} value={area.name}>{area.name}</option>))}</optgroup>))}
                </select>
              </div>
            )}

            <div>
                 <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold uppercase text-slate-400 block">Consignas y Tareas</label>
                     <button onClick={() => setShowTaskForm(true)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Nueva</button>
                 </div>
                 <div className="space-y-2">
                    {data.Tasks && data.Tasks.length > 0 ? data.Tasks.map(t => (
                        <div key={t.id} className="bg-white border border-slate-200 p-2 rounded flex gap-2 items-start shadow-sm">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${t.type === 'Inicio' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-700 flex justify-between">
                                    <span>{t.type} {t.time}</span>
                                    <button onClick={() => handleDeleteTask(t.id)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                                </div>
                                <p className="text-sm text-slate-600 leading-snug mt-1">{t.desc}</p>
                            </div>
                        </div>
                    )) : <p className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded text-center border border-dashed border-slate-200">Sin consignas asignadas</p>}
                 </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Notas Generales</label>
              <textarea className="w-full border-slate-300 border rounded-lg p-3 text-sm shadow-sm h-20 resize-none" placeholder="Comentarios..." value={data.Comentario} onChange={(e) => saveAssignmentRecord(staffId, dateStr, { comments: e.target.value })} />
            </div>
            <div className="h-10"></div>
            
            {showTaskForm && (
                <div className="absolute inset-0 bg-white z-50 p-6 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ClipboardList/> Asignar Consigna</h4>
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Tipo de Hora</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setNewTask({...newTask, type: 'Inicio'})} className={`flex-1 py-2 text-xs font-bold rounded ${newTask.type === 'Inicio' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Hora Inicio</button>
                                <button onClick={() => setNewTask({...newTask, type: 'Vencimiento'})} className={`flex-1 py-2 text-xs font-bold rounded ${newTask.type === 'Vencimiento' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Vencimiento</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Hora (Opcional)</label>
                            <input type="time" className="w-full border p-3 rounded-lg bg-slate-50 font-bold" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Descripción de la Tarea</label>
                            <textarea className="w-full border p-3 rounded-lg h-32 resize-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Detalles de la consigna..." value={newTask.desc} onChange={e => setNewTask({...newTask, desc: e.target.value})} autoFocus></textarea>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowTaskForm(false)} className="flex-1 py-3 text-slate-500 font-bold border rounded-lg">Cancelar</button>
                        <button onClick={handleAddTask} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-lg">Asignar</button>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-white"><button onClick={() => setEditingCell(null)} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors">Guardar y Cerrar</button></div>
      </div>
    );
  };

  const DayView = () => {
    const dateKey = formatDateKey(currentDate);
    const grouped = useMemo(() => {
      const groups = {};
      staff.forEach(person => {
        const assign = getAssignment(person.id, dateKey);
        const shiftDef = getShiftDef(assign.shiftId);
        let groupKey = assign.Caseta || 'Sin Asignar';
        if (shiftDef.category === 'rest') groupKey = '_descanso';
        else if (shiftDef.category === 'absence') groupKey = '_ausentismo';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push({ ...person, assignment: assign, shiftDef });
      });
      return groups;
    }, [staff, assignments, currentDate, shiftTypes]);
    const sortedKeys = Object.keys(grouped).sort((a, b) => { if (a === '_ausentismo') return 1; if (b === '_ausentismo') return -1; if (a === '_descanso') return 1; if (b === '_descanso') return -1; return a.localeCompare(b); });
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
        {sortedKeys.map(key => {
            const isDescanso = key === '_descanso'; const isAusentismo = key === '_ausentismo'; 
            let title = key; let headerColor = "bg-white text-slate-800 border-b border-slate-100"; let icon = <MapPin size={16} className="text-slate-400"/>;
            if (isDescanso) { title = 'Descansos'; headerColor = "bg-slate-100 text-slate-500 border-b border-slate-200"; icon = <Coffee size={16}/>; }
            else if (isAusentismo) { title = 'Ausentismos'; headerColor = "bg-red-50 text-red-700 border-b border-red-100"; icon = <AlertCircle size={16}/>; }
            return (
              <div key={key} className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden h-fit">
                <div className={`p-3 font-bold flex justify-between items-center text-sm ${headerColor}`}><span className="flex items-center gap-2 uppercase tracking-wide">{icon}{title}</span><span className="bg-slate-200/50 px-2 py-0.5 rounded text-xs">{grouped[key].length}</span></div>
                <div className="p-2 space-y-2">{grouped[key].map(p => {
                    const borderColor = getStatusBorderColor(p.assignment, p.shiftDef);
                    return (
                        <div key={p.id} onClick={() => setEditingCell({ staffId: p.id, dateStr: dateKey })} className="p-2 rounded border border-transparent hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-center group bg-white shadow-sm relative">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full border-2 overflow-hidden bg-slate-100 ${borderColor}`}>
                                    <img src={getImagePath(p.id)} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-700 text-sm leading-none">{p.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-1 flex gap-1 items-center">
                                        {p.shiftDef.category==='work' && <span>{p.shiftDef.name} • {getTotalHours(p.shiftDef)}h</span>}
                                        {p.assignment.TiEx > 0 && <span className="bg-amber-100 text-amber-700 px-1 rounded-[2px] font-bold">TEx</span>}
                                        {p.assignment.Rec > 0 && <span className="bg-emerald-100 text-emerald-700 px-1 rounded-[2px] font-bold">TxT</span>}
                                        {p.assignment.Ret > 0 && <span className="bg-red-100 text-red-700 px-1 rounded-[2px] font-bold">Ret</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded border ${p.shiftDef.color}`}>{p.shiftDef.code}</span>
                                {p.assignment.Tasks && p.assignment.Tasks.length > 0 && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded flex items-center gap-0.5"><CheckSquare size={8}/> {p.assignment.Tasks.length}</span>}
                            </div>
                        </div>
                    );
                })}</div>
              </div>
            );
        })}
      </div>
    );
  };

  const WeekView = () => {
    const start = getStartOfWeek(currentDate); const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
      <div className="flex-1 overflow-hidden flex flex-col h-full bg-white relative">
        <div className="overflow-auto custom-scrollbar flex-1 relative">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-20 shadow-sm">
                    <tr>
                        <th className="px-4 py-3 font-bold sticky left-0 top-0 z-30 bg-slate-50 border-r border-b border-slate-200 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Personal</th>
                        {weekDays.map(day => (
                            <th key={day} className={`px-2 py-2 text-center border-l border-b border-slate-200 min-w-[80px] bg-slate-50 ${day.toDateString()===new Date().toDateString()?'bg-blue-50 text-blue-700':''}`}>
                                {day.toLocaleDateString('es-ES',{weekday:'short'})} 
                                <span className="text-lg block font-bold text-slate-800">{day.getDate()}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {staff.map(person => {
                        const currentDayAssign = getAssignment(person.id, formatDateKey(currentDate));
                        const currentDayShift = getShiftDef(currentDayAssign.shiftId);
                        const borderColor = getStatusBorderColor(currentDayAssign, currentDayShift);

                        return (
                            <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2 font-medium text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] h-16">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border-2 overflow-hidden bg-slate-100 flex-shrink-0 ${borderColor}`}>
                                            <img src={getImagePath(person.id)} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm">{person.name}</div>
                                            <button onClick={()=>openPatternModal(person.id)} className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-0.5"><Repeat size={10}/> Rol</button>
                                        </div>
                                    </div>
                                </td>
                                {weekDays.map(day => { 
                                    const ds=formatDateKey(day); 
                                    const as=getAssignment(person.id,ds); 
                                    const sd=getShiftDef(as.shiftId); 
                                    return (
                                        <td key={ds} onClick={()=>setEditingCell({staffId:person.id,dateStr:ds})} className="border-l border-slate-100 cursor-pointer p-1 h-16 relative hover:brightness-95 transition bg-white">
                                            <div className={`w-full h-full rounded flex flex-col items-center justify-center border text-xs ${sd.category==='rest'?'bg-slate-50 text-slate-300 border-transparent': sd.color}`}>
                                                {sd.code}
                                                {as.Tasks && as.Tasks.length > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>}
                                            </div>
                                        </td>
                                    ); 
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-800 font-sans flex flex-col overflow-hidden relative">
      {/* GLOBAL TOAST & MODAL OVERLAYS */}
      {toast && (
          <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
              {toast.type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
              <span className="font-bold text-sm">{toast.message}</span>
          </div>
      )}

      {confirmModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 transform scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-center mb-4 text-red-500"><AlertTriangle size={48}/></div>
                  <h3 className="text-xl font-bold text-center text-slate-800 mb-2">{confirmModal.title}</h3>
                  <p className="text-center text-slate-500 text-sm mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                      <button onClick={confirmModal.onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">Sí, Eliminar</button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER SILVER & BLACK */}
      <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-6">
            <a href="https://cicxtfemco.online" className="flex items-center gap-2 text-slate-500 hover:text-black transition-colors font-medium text-sm group">
                <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-black group-hover:text-white transition-colors"><ArrowLeft size={16} /></div>
                <span className="hidden md:inline">Volver al Portal</span>
            </a>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Briefcase className="text-slate-800" size={20}/> Gestor de Turnos <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded font-mono">PRO</span></h1>
        </div>
        <div className="flex items-center gap-3">
             <div className="hidden md:flex bg-slate-100 rounded-lg p-1 gap-1">
                {['day','week','month'].map(v => <button key={v} onClick={()=>setView(v)} className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${view===v ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}</button>)}
             </div>
             <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-1">
                <button onClick={prevPeriod} className="p-2 text-slate-400 hover:text-black"><ChevronLeft size={18}/></button>
                <span className="text-sm font-bold w-32 text-center">{view==='month'?currentDate.toLocaleDateString('es-ES',{month:'long',year:'numeric'}):currentDate.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
                <button onClick={nextPeriod} className="p-2 text-slate-400 hover:text-black"><ChevronRight size={18}/></button>
             </div>
             {/* BOTON DE CONFIGURACIÓN UNIFICADO */}
             <button onClick={()=>setShowConfigModal(true)} className="bg-black text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><Settings size={18}/> Sistema</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 overflow-hidden bg-slate-50/50 flex flex-col ${view === 'week' ? '' : 'overflow-y-auto'}`}>
          {view === 'day' && <DayView />}
          {view === 'week' && <WeekView />}
          {view === 'month' && <div className="p-6 overflow-y-auto"><div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d=><div key={d} className="bg-slate-100 py-2 text-center text-xs font-bold uppercase text-slate-500">{d}</div>)}{getDaysInMonth(currentDate).map(d => { const isT=d.toDateString()===new Date().toDateString(); return (<div key={d} onClick={()=>{setCurrentDate(d);setView('day')}} className={`bg-white min-h-[100px] p-2 hover:bg-slate-50 cursor-pointer flex flex-col justify-between ${isT?'ring-inset ring-2 ring-blue-500':''}`}><span className={`font-bold text-sm ${isT?'text-blue-600':''}`}>{d.getDate()}</span></div>)})}</div></div>}
        </main>
        {editingCell && (<aside className="hidden lg:flex w-96 flex-col border-l border-slate-200 bg-white shadow-xl z-40 animate-in slide-in-from-right duration-200"><EditFormContent isMobile={false} /></aside>)}
      </div>

      {/* MOBILE MODAL */}
      {editingCell && (<div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm" onClick={()=>setEditingCell(null)}><div className="w-full h-[85vh] bg-white rounded-t-2xl overflow-hidden" onClick={e=>e.stopPropagation()}><EditFormContent isMobile={true}/></div></div>)}

      {/* UNIFIED CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={()=>setShowConfigModal(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="bg-slate-100 border-b border-slate-200 p-4 flex justify-between items-center"><h3 className="font-bold text-lg">Centro de Control y Configuración</h3><button onClick={()=>setShowConfigModal(false)}><X/></button></div>
                <div className="flex border-b border-slate-200 bg-white px-2 pt-2">
                    <button onClick={()=>setConfigTab('staff')} className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${configTab==='staff'?'border-black text-black':'border-transparent text-slate-400 hover:text-slate-600'}`}><Users size={16}/> Personal (RRHH)</button>
                    <button onClick={()=>setConfigTab('areas')} className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${configTab==='areas'?'border-black text-black':'border-transparent text-slate-400 hover:text-slate-600'}`}><Building size={16}/> Áreas y Estructura</button>
                    <button onClick={()=>setConfigTab('shifts')} className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${configTab==='shifts'?'border-black text-black':'border-transparent text-slate-400 hover:text-slate-600'}`}><Clock3 size={16}/> Catálogo de Turnos</button>
                </div>
                
                <div className="flex-1 overflow-hidden bg-slate-50">
                    {/* STAFF TAB - EXPEDIENTE */}
                    {configTab === 'staff' && (
                        <div className="flex h-full">
                            <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex gap-2">
                                        <button onClick={() => fetchStaffFromCloud()} className="p-2 border rounded hover:bg-slate-100"><CloudDownload size={18}/></button>
                                        <button onClick={createNewStaff} className="flex-1 bg-black text-white rounded font-bold text-sm flex items-center justify-center gap-2"><Plus size={16}/> Nuevo Elemento</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-2 space-y-1">
                                    {staff.map(s => (
                                        <div key={s.id} onClick={() => { setSelectedStaffId(s.id); setStaffForm(s); }} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${selectedStaffId === s.id ? 'bg-slate-100 border-slate-300 border shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0"><img src={getImagePath(s.id)} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} className="w-full h-full object-cover" /></div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-sm truncate text-slate-800">{s.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{s.position || 'Guardia'} • {s.id}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 overflow-auto p-8">
                                {selectedStaffId ? (
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-2xl font-bold text-slate-800">{selectedStaffId === 'NEW' ? 'Nuevo Expediente' : 'Expediente del Empleado'}</h2>
                                            {selectedStaffId !== 'NEW' && <button onClick={() => promptDeleteStaff(selectedStaffId)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><Trash2 size={14}/> Eliminar</button>}
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-600 text-sm flex items-center gap-2"><User size={16}/> Información Personal</div>
                                            <div className="p-6 grid grid-cols-2 gap-4">
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                                                    <input className="w-full border p-2 rounded bg-slate-50 font-medium" value={staffForm.name || ''} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">No. Socio (ID)</label>
                                                    <input className="w-full border p-2 rounded bg-slate-50 font-mono" value={staffForm.id || ''} onChange={e => setStaffForm({...staffForm, id: e.target.value})} disabled={selectedStaffId !== 'NEW'} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Nacimiento</label>
                                                    <input type="date" className="w-full border p-2 rounded" value={staffForm.dob || ''} onChange={e => setStaffForm({...staffForm, dob: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Sangre</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.bloodType || ''} onChange={e => setStaffForm({...staffForm, bloodType: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-600 text-sm flex items-center gap-2"><Phone size={16}/> Contacto y Emergencia</div>
                                            <div className="p-6 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Móvil</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.phone || ''} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.email || ''} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección Particular</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.address || ''} onChange={e => setStaffForm({...staffForm, address: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contacto Emergencia</label>
                                                    <input className="w-full border p-2 rounded" placeholder="Nombre familiar" value={staffForm.emergencyName || ''} onChange={e => setStaffForm({...staffForm, emergencyName: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tel. Emergencia</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.emergencyPhone || ''} onChange={e => setStaffForm({...staffForm, emergencyPhone: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-600 text-sm flex items-center gap-2"><Briefcase size={16}/> Información Laboral</div>
                                            <div className="p-6 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Puesto</label>
                                                    <input className="w-full border p-2 rounded" value={staffForm.position || ''} onChange={e => setStaffForm({...staffForm, position: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Ingreso</label>
                                                    <input type="date" className="w-full border p-2 rounded" value={staffForm.hireDate || ''} onChange={e => setStaffForm({...staffForm, hireDate: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">NSS</label>
                                                    <input className="w-full border p-2 rounded font-mono" value={staffForm.nss || ''} onChange={e => setStaffForm({...staffForm, nss: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">CURP</label>
                                                    <input className="w-full border p-2 rounded font-mono" value={staffForm.curp || ''} onChange={e => setStaffForm({...staffForm, curp: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">RFC</label>
                                                    <input className="w-full border p-2 rounded font-mono" value={staffForm.rfc || ''} onChange={e => setStaffForm({...staffForm, rfc: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button onClick={saveStaffMember} className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transform transition active:scale-95">Guardar Cambios</button>
                                        </div>
                                        <div className="h-12"></div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Users size={64} className="mb-4 text-slate-300"/>
                                        <p className="text-lg font-medium">Selecciona un empleado para ver su expediente</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {configTab === 'areas' && (
                        <div className="flex gap-6 h-full p-6">
                            <div className="w-1/3 bg-white border border-slate-200 rounded-lg flex flex-col"><div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-xs uppercase text-slate-500">Categorías</div><div className="p-3 flex gap-2"><input className="flex-1 border p-2 rounded text-sm" placeholder="Nueva..." value={newCatName} onChange={e=>setNewCatName(e.target.value)}/><button onClick={addCategory} className="bg-black text-white p-2 rounded"><Plus size={16}/></button></div><div className="flex-1 overflow-auto">{structure.map(c=>(<div key={c.id} onClick={()=>setSelectedCatId(c.id)} className={`p-3 border-b flex justify-between cursor-pointer ${selectedCatId===c.id?'bg-slate-100 font-bold':''}`}>{c.name} <Trash2 size={14} onClick={(e)=>{e.stopPropagation();promptDeleteCategory(c.id)}} className="text-slate-300 hover:text-red-500"/></div>))}</div></div>
                            <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4">
                                {selectedCatId ? (<><h4 className="font-bold mb-4">{structure.find(c=>c.id===selectedCatId)?.name}</h4><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1 text-sm" placeholder="Nombre de Área" value={newAreaName} onChange={e=>setNewAreaName(e.target.value)} /><button onClick={()=>addArea(selectedCatId)} className="bg-black text-white px-4 rounded text-sm font-bold">Agregar</button></div><div className="grid grid-cols-2 gap-3">{structure.find(c=>c.id===selectedCatId)?.areas.map(a=>(<div key={a.id} className="border p-2 rounded flex justify-between items-center bg-slate-50"><span className="text-sm">{a.name}</span><button onClick={()=>deleteArea(selectedCatId,a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></div>))}</div></>) : <p className="text-slate-400 text-center mt-10">Selecciona una categoría</p>}
                            </div>
                        </div>
                    )}
                    {configTab === 'shifts' && (
                         <div className="bg-white border border-slate-200 rounded-lg p-6 m-6">
                            <div className="flex justify-between mb-6">
                                <h4 className="font-bold text-lg">{editingShiftId?'Editar Turno':'Crear Nuevo Turno'}</h4>
                                {editingShiftId && <button onClick={handleCancelEdit} className="text-sm text-red-500 underline">Cancelar Edición</button>}
                            </div>
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="col-span-2"><label className="text-xs font-bold text-slate-500">Nombre</label><input className="w-full border p-2 rounded" value={shiftForm.name} onChange={e=>setShiftForm({...shiftForm,name:e.target.value})}/></div>
                                <div><label className="text-xs font-bold text-slate-500">Código (4 letras)</label><input className="w-full border p-2 rounded font-mono uppercase" maxLength={4} value={shiftForm.code} onChange={e=>setShiftForm({...shiftForm,code:e.target.value})}/></div>
                                <div><label className="text-xs font-bold text-slate-500">Color / Estilo</label><select className="w-full border p-2 rounded" value={shiftForm.color} onChange={e=>setShiftForm({...shiftForm,color:e.target.value})}>{COLOR_OPTIONS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                            </div>
                            <div className="flex justify-end mb-8"><button onClick={handleSaveShift} className="bg-black text-white px-6 py-2 rounded font-bold">{editingShiftId?'Actualizar':'Guardar Turno'}</button></div>
                            <div className="grid grid-cols-3 gap-4 border-t pt-6">
                                {shiftTypes.map(st => (
                                    <div key={st.id} className="border rounded p-3 flex justify-between items-center hover:shadow-md transition cursor-pointer" onClick={()=>handleEditClick(st)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 flex items-center justify-center font-bold text-xs border rounded ${st.color}`}>{st.code}</div>
                                            <div><div className="font-bold text-sm">{st.name}</div><div className="text-xs text-slate-400">{st.startTime}-{st.endTime}</div></div>
                                        </div>
                                        <button onClick={(e) => {e.stopPropagation(); handleDeleteShift(st.id)}} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* PATTERN MODAL IMPROVED */}
      {showPatternModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={()=>setShowPatternModal(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Repeat size={18}/> Generador de Roles</h3><button onClick={()=>setShowPatternModal(false)}><X/></button></div>
                <div className="p-6 space-y-4">
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Agregar Paso a la Secuencia</label>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500">Turno</label>
                                <select className="w-full border p-2 rounded text-sm" value={patTempShiftId} onChange={e=>setPatTempShiftId(e.target.value)}>{shiftTypes.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500">Área / Caseta (Opcional)</label>
                                <select className="w-full border p-2 rounded text-sm" value={patTempArea} onChange={e=>setPatTempArea(e.target.value)}>
                                    <option value="Sin Asignar">Sin Asignar</option>
                                    {structure.map(cat => (<optgroup key={cat.id} label={cat.name}>{cat.areas.map(area => (<option key={area.id} value={area.name}>{area.name}</option>))}</optgroup>))}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] font-bold text-slate-500">Días</label>
                                <input type="number" className="w-full border p-2 rounded text-sm text-center" value={patTempCount} onChange={e=>setPatTempCount(e.target.value)}/>
                            </div>
                            <button onClick={addToSequence} className="bg-slate-800 text-white p-2 rounded font-bold hover:bg-black"><Plus size={18}/></button>
                        </div>
                     </div>

                     <div className="bg-white border border-slate-200 rounded min-h-[80px] p-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {patternSequence.length===0?<span className="text-slate-300 text-sm italic w-full text-center py-4">Secuencia vacía...</span>:patternSequence.map((s,i)=>(
                            <div key={i} className="bg-slate-50 border px-3 py-1 rounded text-xs flex flex-col items-start gap-1 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{getShiftDef(s.shiftId).code}</span>
                                    <span className="bg-slate-200 px-1 rounded text-[10px]">x{s.count}</span>
                                    <button onClick={()=>{const n=[...patternSequence];n.splice(i,1);setPatternSequence(n)}} className="text-red-500 hover:bg-red-50 rounded-full"><X size={12}/></button>
                                </div>
                                <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{s.area}</span>
                            </div>
                        ))}
                     </div>

                     <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div><label className="text-xs font-bold text-slate-500">Fecha Inicio</label><input type="date" className="w-full border p-2 rounded" value={patternStartDate} onChange={e=>setPatternStartDate(e.target.value)}/></div>
                        <div><label className="text-xs font-bold text-slate-500">Duración</label><div className="flex gap-1"><button onClick={()=>{setPatternRangeType('weeks');setPatternRangeValue(1)}} className={`flex-1 border rounded text-xs font-bold ${patternRangeType==='weeks'?'bg-black text-white':'bg-white'}`}>1 Sem</button><button onClick={()=>{setPatternRangeType('months');setPatternRangeValue(1)}} className={`flex-1 border rounded text-xs font-bold ${patternRangeType==='months'?'bg-black text-white':'bg-white'}`}>1 Mes</button></div></div>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                         <div className="flex gap-2">
                             <input className="border p-2 rounded text-xs" placeholder="Guardar plantilla como..." value={patSaveName} onChange={e=>setPatSaveName(e.target.value)}/>
                             <button onClick={savePatternTemplate} className="bg-slate-100 hover:bg-slate-200 p-2 rounded"><Save size={16}/></button>
                         </div>
                         <button onClick={applyPattern} className="bg-emerald-600 text-white px-6 py-2 rounded font-bold hover:bg-emerald-700">Aplicar Rol</button>
                     </div>
                     {savedPatterns.length > 0 && <div className="border-t pt-2"><p className="text-xs font-bold text-slate-400 mb-2">Plantillas Guardadas:</p><div className="flex gap-2 flex-wrap">{savedPatterns.map(p=>(<button key={p.id} onClick={()=>setPatternSequence(p.sequence)} className="text-xs border px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-2">{p.name} <Trash2 size={10} onClick={(e)=>{e.stopPropagation();deletePatternTemplate(p.id)}}/></button>))}</div></div>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
