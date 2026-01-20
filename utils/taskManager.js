// ============================================
// 📋 TaskManager Optimizado
// ============================================

const fs = require("fs");
const path = require("path");

// Configuración optimizada
const TASK_STORAGE_PATH = path.join(__dirname, "..", "data", "tareas.json");
if (!fs.existsSync(path.dirname(TASK_STORAGE_PATH))) {
  fs.mkdirSync(path.dirname(TASK_STORAGE_PATH), { recursive: true });
}

// Mensajes que NO generan tareas
const MENSAJES_INNECESARIOS = [
  "ok", "okay", "gracias", "thank", "thanks", "hola", "hi", "hello",
  "buen día", "buenas", "adiós", "bye", "perfecto", "excelente", "genial",
  "👍", "👌", "✅", "🙏", "sí", "si", "no", "vale", "de acuerdo"
];

// Función mejorada para detectar mensajes innecesarios
function esMensajeInnecesario(texto) {
  if (!texto || typeof texto !== "string") return true;
  
  const limpio = texto.trim().toLowerCase();
  if (limpio.length < 2) return true;
  
  // Lista exacta
  if (MENSAJES_INNECESARIOS.includes(limpio)) return true;
  
  // Solo emojis
  if (/^[\u{1F300}-\u{1F9FF}\s]+$/u.test(limpio)) return true;
  
  return false;
}

// Función MEJORADA para extraer tema y especialista
function extraerTemaYEspecialista(texto, especialistas) {
  const textoLower = texto.toLowerCase();
  
  // 1. Buscar por nombre de especialista primero (más preciso)
  for (const esp of especialistas) {
    if (esp.id === 'default') continue;
    
    const nombreLower = esp.nombre.toLowerCase();
    if (textoLower.includes(nombreLower)) {
      return {
        tema: esp.especialidades[0] || "Consulta Especializada",
        especialistaId: esp.id,
        especialista: esp,
        confianza: 0.9
      };
    }
  }
  
  // 2. Buscar por palabras clave
  for (const esp of especialistas) {
    if (esp.id === 'default') continue;
    
    for (const palabra of esp.palabrasClave || []) {
      if (!palabra) continue;
      if (textoLower.includes(palabra.toLowerCase())) {
        return {
          tema: esp.especialidades[0] || "Consulta Relacionada",
          especialistaId: esp.id,
          especialista: esp,
          confianza: 0.7
        };
      }
    }
  }
  
  // 3. Detección de temas generales
  if (textoLower.includes("cotiz") || textoLower.includes("precio")) {
    return { tema: "Cotización", especialistaId: "default", especialista: null, confianza: 0.6 };
  }
  if (textoLower.includes("cita") || textoLower.includes("agendar")) {
    return { tema: "Cita", especialistaId: "default", especialista: null, confianza: 0.6 };
  }
  if (textoLower.includes("factur") || textoLower.includes("pago")) {
    return { tema: "Facturación", especialistaId: "janeth-bautista", especialista: null, confianza: 0.7 };
  }
  if (textoLower.includes("xml") || textoLower.includes("json") || textoLower.includes("sat")) {
    return { tema: "Archivos XML/JSON SAT", especialistaId: "alberto-mendez", especialista: null, confianza: 0.8 };
  }
  
  // 4. Por defecto
  return { tema: "Consulta General", especialistaId: "default", especialista: null, confianza: 0.3 };
}

// Cargar tareas
function cargarTareas() {
  try {
    if (fs.existsSync(TASK_STORAGE_PATH)) {
      return JSON.parse(fs.readFileSync(TASK_STORAGE_PATH, "utf8"));
    }
  } catch (err) {}
  return { tareas: [], grupos: [] };
}

// Guardar tareas
function guardarTareas(data) {
  try {
    fs.writeFileSync(TASK_STORAGE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("❌ Error guardando tareas:", err.message);
    return false;
  }
}

// Función PRINCIPAL mejorada
function procesarMensaje(texto, userId, nombreUsuario = null, tieneArchivo = false, archivoInfo = null) {
  // 1. Validar mensaje
  if (esMensajeInnecesario(texto)) {
    return {
      necesitaTarea: false,
      razon: "mensaje_innecesario",
      grupo: null,
      tarea: null,
      especialista: null
    };
  }
  
  // 2. Cargar datos
  const data = cargarTareas();
  let especialistas = [];
  
  try {
    const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
    if (fs.existsSync(especialistasPath)) {
      especialistas = JSON.parse(fs.readFileSync(especialistasPath, "utf8")).especialistas || [];
    }
  } catch (err) {
    console.error("⚠️ Error cargando especialistas:", err.message);
  }
  
  // 3. Extraer tema y especialista (MEJORADO)
  const { tema, especialistaId, especialista } = extraerTemaYEspecialista(texto, especialistas);
  
  console.log(`🎯 Tema detectado: ${tema} | Especialista: ${especialista?.nombre || especialistaId}`);
  
  // 4. Buscar grupo existente para este usuario y tema
  let grupoExistente = null;
  const ahora = Date.now();
  const ventanaAgrupacion = 30 * 60 * 1000; // 30 minutos
  
  for (const grupo of data.grupos) {
    if (grupo.userId === userId && grupo.tema === tema) {
      const tiempoTranscurrido = ahora - grupo.ultimoMensaje;
      if (tiempoTranscurrido <= ventanaAgrupacion) {
        grupoExistente = grupo;
        break;
      }
    }
  }
  
  // 5. Crear mensaje
  const mensaje = {
    texto: texto,
    timestamp: ahora,
    nombreUsuario: nombreUsuario,
    tieneArchivo: tieneArchivo,
    archivo: archivoInfo
  };
  
  // 6. Manejar grupo
  if (grupoExistente) {
    // Agregar mensaje al grupo existente
    grupoExistente.mensajes.push(mensaje);
    grupoExistente.ultimoMensaje = ahora;
    
    // Crear tarea si hay suficientes mensajes o tiempo transcurrido
    if (grupoExistente.mensajes.length >= 2) {
      return crearTareaDesdeGrupo(grupoExistente, especialista || especialistas.find(e => e.id === 'default'));
    }
    
    guardarTareas(data);
    
    return {
      necesitaTarea: false,
      razon: "agregado_a_grupo_existente",
      grupo: grupoExistente,
      tarea: null,
      especialista: especialista
    };
  } else {
    // Crear nuevo grupo
    const nuevoGrupo = {
      id: `grupo_${ahora}_${Math.random().toString(36).substr(2, 6)}`,
      userId: userId,
      tema: tema,
      especialistaId: especialistaId,
      especialista: especialista?.nombre || "Equipo General",
      mensajes: [mensaje],
      primerMensaje: ahora,
      ultimoMensaje: ahora,
      necesitaTarea: true
    };
    
    data.grupos.push(nuevoGrupo);
    guardarTareas(data);
    
    // Para mensajes claramente importantes, crear tarea inmediatamente
    if (tema !== "Consulta General" && especialistaId !== 'default') {
      return crearTareaDesdeGrupo(nuevoGrupo, especialista || especialistas.find(e => e.id === especialistaId));
    }
    
    return {
      necesitaTarea: false,
      razon: "nuevo_grupo_creado",
      grupo: nuevoGrupo,
      tarea: null,
      especialista: especialista
    };
  }
}

// Función para crear tarea desde grupo
function crearTareaDesdeGrupo(grupo, especialistaInfo) {
  const especialista = especialistaInfo || {
    id: "default",
    nombre: "Equipo General",
    telefono: "(33) 3407 0123",
    email: "alex@fgya.com.mx"
  };
  
  const tarea = {
    id: `tarea_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    grupoId: grupo.id,
    titulo: grupo.tema || "Tarea General",
    descripcion: grupo.mensajes.map(m => m.texto).join("\n\n"),
    responsable: {
      id: especialista.id,
      nombre: especialista.nombre,
      telefono: especialista.telefono,
      email: especialista.email
    },
    vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estatus: "Pendiente",
    fechaCreacion: new Date().toISOString(),
    usuario: {
      whatsappId: grupo.userId,
      nombre: grupo.mensajes[0]?.nombreUsuario || "Usuario"
    }
  };
  
  // Guardar tarea
  const data = cargarTareas();
  data.tareas.push(tarea);
  grupo.necesitaTarea = false;
  grupo.tareaId = tarea.id;
  
  guardarTareas(data);
  
  console.log(`✅ Tarea creada: ${tarea.id} | Responsable: ${tarea.responsable.nombre}`);
  
  return {
    necesitaTarea: true,
    razon: "tarea_creada",
    grupo: grupo,
    tarea: tarea,
    especialista: especialista
  };
}

// Obtener especialista por ID
function obtenerEspecialistaPorId(id) {
  try {
    const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
    if (fs.existsSync(especialistasPath)) {
      const especialistas = JSON.parse(fs.readFileSync(especialistasPath, "utf8")).especialistas || [];
      return especialistas.find(e => e.id === id) || null;
    }
  } catch (err) {}
  return null;
}

// Exportar funciones
module.exports = {
  procesarMensaje,
  esMensajeInnecesario,
  cargarTareas,
  guardarTareas,
  obtenerEspecialistaPorId,
  extraerTemaYEspecialista
};