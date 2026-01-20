// ============================================
// 👥 Gestor de Grupos de WhatsApp - Sistema de Desactivación/Reactivación de IA
// ============================================

const fs = require("fs");
const path = require("path");

// === Configuración ===
const GROUPS_STORAGE_PATH = path.join(__dirname, "..", "data", "grupos-whatsapp.json");
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos

// Asegurar que el directorio data existe
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// === Estados de grupos ===
const GROUP_STATES = {
  IA_ACTIVA: 'ia_activa',
  ESPECIALISTA_ACTIVO: 'especialista_activo',
  IA_REACTIVADA: 'ia_reactivada'
};

// === Cargar grupos desde archivo ===
function cargarGrupos() {
  try {
    if (fs.existsSync(GROUPS_STORAGE_PATH)) {
      const data = fs.readFileSync(GROUPS_STORAGE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("❌ Error al cargar grupos:", err.message);
  }
  return { grupos: [] };
}

// === Guardar grupos en archivo ===
function guardarGrupos(data) {
  try {
    fs.writeFileSync(GROUPS_STORAGE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("❌ Error al guardar grupos:", err.message);
    return false;
  }
}

// === Obtener información del grupo (nombre y miembros) ===
async function obtenerInfoGrupo(client, grupoId) {
  try {
    let nombreGrupo = "Grupo Desconocido";
    let participantes = [];
    
    // Método 1: getGroupInfo
    if (typeof client.getGroupInfo === 'function') {
      try {
        const info = await client.getGroupInfo(grupoId);
        if (info) {
          nombreGrupo = info.name || info.subject || nombreGrupo;
          participantes = info.participants || info.members || participantes;
          console.log(`✅ Info obtenida para grupo ${grupoId}: ${nombreGrupo}`);
        }
      } catch (err) {
        console.warn("⚠️ Error con getGroupInfo:", err.message);
      }
    }
    
    // Método 2: groupMetadata (alias común)
    else if (typeof client.groupMetadata === 'function') {
      try {
        const metadata = await client.groupMetadata(grupoId);
        if (metadata) {
          nombreGrupo = metadata.subject || metadata.name || nombreGrupo;
          participantes = metadata.participants || metadata.members || participantes;
        }
      } catch (err) {
        console.warn("⚠️ Error con groupMetadata:", err.message);
      }
    }
    
    // Método 3: getGroupMetadata
    else if (typeof client.getGroupMetadata === 'function') {
      try {
        const metadata = await client.getGroupMetadata(grupoId);
        if (metadata) {
          nombreGrupo = metadata.subject || metadata.name || nombreGrupo;
          participantes = metadata.participants || metadata.members || participantes;
        }
      } catch (err) {
        console.warn("⚠️ Error con getGroupMetadata:", err.message);
      }
    }
    
    return {
      nombre: nombreGrupo,
      participantes: participantes,
      timestamp: Date.now()
    };
    
  } catch (err) {
    console.error("❌ Error al obtener información del grupo:", err.message);
    return {
      nombre: "Grupo Desconocido",
      participantes: [],
      timestamp: Date.now()
    };
  }
}

// === Obtener link de invitación de grupo (versión mejorada) ===
async function obtenerLinkInvitacionGrupo(client, grupoId) {
  try {
    console.log(`🔍 Intentando obtener link para grupo: ${grupoId}`);
    
    // Intentar obtener primero la información del grupo
    const grupoInfo = await obtenerInfoGrupo(client, grupoId);
    
    // Método 1: getGroupInviteLink (método directo)
    if (typeof client.getGroupInviteLink === 'function') {
      try {
        console.log("🔗 Usando getGroupInviteLink...");
        const link = await client.getGroupInviteLink(grupoId);
        
        if (link && typeof link === 'string') {
          if (link.includes('chat.whatsapp.com')) {
            console.log(`✅ Link obtenido: ${link}`);
            return link;
          }
        }
        
        // Si devuelve un objeto, buscar la propiedad link
        if (link && typeof link === 'object') {
          const possibleLink = link.link || link.invite || link.inviteLink;
          if (possibleLink && typeof possibleLink === 'string' && possibleLink.includes('chat.whatsapp.com')) {
            console.log(`✅ Link obtenido de objeto: ${possibleLink}`);
            return possibleLink;
          }
        }
      } catch (err) {
        console.warn("⚠️ getGroupInviteLink falló:", err.message);
      }
    }
    
    // Método 2: generar link mediante revokeInvite
    if (typeof client.revokeGroupInviteLink === 'function' || typeof client.revokeInvite === 'function') {
      try {
        console.log("🔄 Generando nuevo link con revoke...");
        
        // Primero revocar cualquier link existente (esto genera uno nuevo)
        if (typeof client.revokeGroupInviteLink === 'function') {
          await client.revokeGroupInviteLink(grupoId);
        } else if (typeof client.revokeInvite === 'function') {
          await client.revokeInvite(grupoId);
        }
        
        // Esperar un momento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Luego intentar obtener el link con getGroupInviteLink
        if (typeof client.getGroupInviteLink === 'function') {
          const newLink = await client.getGroupInviteLink(grupoId);
          if (newLink && typeof newLink === 'string' && newLink.includes('chat.whatsapp.com')) {
            console.log(`✅ Nuevo link generado: ${newLink}`);
            return newLink;
          }
        }
      } catch (err) {
        console.warn("⚠️ Error al generar nuevo link:", err.message);
      }
    }
    
    // Método 3: getGroupInfo y extraer link
    if (typeof client.getGroupInfo === 'function') {
      try {
        console.log("ℹ️ Buscando link en groupInfo...");
        const groupInfo = await client.getGroupInfo(grupoId);
        
        if (groupInfo) {
          // Buscar link en diferentes propiedades posibles
          const possibleLink = 
            groupInfo.inviteLink || 
            groupInfo.groupInviteLink || 
            groupInfo.invite || 
            groupInfo.link;
            
          if (possibleLink && typeof possibleLink === 'string' && possibleLink.includes('chat.whatsapp.com')) {
            console.log(`✅ Link encontrado en groupInfo: ${possibleLink}`);
            return possibleLink;
          }
          
          // Si no hay link, intentar generar uno con fetchGroupInfoFromWA
          if (typeof client.fetchGroupInfoFromWA === 'function') {
            try {
              const waInfo = await client.fetchGroupInfoFromWA(grupoId);
              if (waInfo && waInfo.inviteLink) {
                console.log(`✅ Link obtenido de fetchGroupInfoFromWA: ${waInfo.inviteLink}`);
                return waInfo.inviteLink;
              }
            } catch (fetchErr) {
              console.warn("⚠️ fetchGroupInfoFromWA falló:", fetchErr.message);
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ Error con getGroupInfo:", err.message);
      }
    }
    
    console.warn("⚠️ No se pudo obtener link de invitación con los métodos disponibles");
    console.log(`📋 Métodos disponibles en client: ${Object.keys(client).filter(k => typeof client[k] === 'function').join(', ')}`);
    
    return null;
    
  } catch (err) {
    console.error("❌ Error crítico al obtener link de invitación:", err.message);
    console.error(err.stack);
    return null;
  }
}

// === Generar o actualizar link de invitación (versión simplificada) ===
async function generarLinkInvitacion(client, grupoId) {
  try {
    console.log(`🔗 Generando link para grupo ${grupoId}...`);
    
    // Primero intentar obtener información del grupo
    const infoGrupo = await obtenerInfoGrupo(client, grupoId);
    console.log(`📋 Nombre del grupo: ${infoGrupo.nombre}`);
    
    // Intentar obtener link existente
    let link = await obtenerLinkInvitacionGrupo(client, grupoId);
    
    if (link) {
      console.log(`✅ Link obtenido: ${link}`);
      return link;
    }
    
    // Si no hay link, mostrar métodos alternativos
    console.log("⚠️ No se pudo obtener link. Métodos disponibles:");
    
    // Listar métodos relacionados con grupos
    const metodosGrupo = Object.keys(client).filter(k => 
      typeof client[k] === 'function' && 
      (k.toLowerCase().includes('group') || k.toLowerCase().includes('invite'))
    );
    console.log(`🔧 Métodos de grupo disponibles: ${metodosGrupo.join(', ')}`);
    
    return null;
    
  } catch (err) {
    console.error("❌ Error al generar link de invitación:", err.message);
    return null;
  }
}

// === Crear grupo de WhatsApp (versión mejorada) ===
async function crearGrupoWhatsApp(client, especialistaId, especialistaWhatsApp, nombreEspecialista) {
  try {
    console.log(`👥 Creando/verificando grupo para especialista: ${nombreEspecialista}...`);
    
    // Verificar si ya existe un grupo para este especialista
    const grupoExistente = obtenerGrupoPorEspecialista(especialistaId);
    if (grupoExistente) {
      console.log(`✅ Grupo existente encontrado para ${nombreEspecialista}`);
      
      // Obtener información actual del grupo (incluyendo nombre)
      try {
        const infoGrupo = await obtenerInfoGrupo(client, grupoExistente.id);
        if (infoGrupo.nombre !== "Grupo Desconocido") {
          grupoExistente.nombre = infoGrupo.nombre;
          console.log(`📋 Nombre actualizado: ${infoGrupo.nombre}`);
        }
      } catch (infoErr) {
        console.warn("⚠️ No se pudo obtener información del grupo:", infoErr.message);
      }
      
      // Actualizar link de invitación si no existe
      if (!grupoExistente.inviteLink) {
        console.log("🔗 Generando link de invitación para grupo existente...");
        const link = await generarLinkInvitacion(client, grupoExistente.id);
        if (link) {
          grupoExistente.inviteLink = link;
          grupoExistente.linkActualizado = new Date().toISOString();
          
          const data = cargarGrupos();
          const grupoIndex = data.grupos.findIndex(g => g.id === grupoExistente.id);
          if (grupoIndex !== -1) {
            data.grupos[grupoIndex] = grupoExistente;
            guardarGrupos(data);
          }
          
          console.log(`✅ Link actualizado: ${link}`);
        }
      }
      
      return grupoExistente;
    }
    
    // Verificar si el número del especialista es válido
    if (!especialistaWhatsApp || !especialistaWhatsApp.includes('@')) {
      console.error(`❌ Número de especialista inválido: ${especialistaWhatsApp}`);
      return null;
    }
    
    // Crear nuevo grupo
    const nombreGrupo = `FGYA - ${nombreEspecialista}`;
    console.log(`🆕 Creando nuevo grupo: ${nombreGrupo}`);
    
    let grupoId = null;
    let nombreGrupoCreado = nombreGrupo;
    
    // Intentar diferentes métodos para crear grupo
    try {
      // Método 1: createGroup
      if (typeof client.createGroup === 'function') {
        console.log("🔄 Usando createGroup...");
        try {
          const result = await client.createGroup(nombreGrupo, [especialistaWhatsApp]);
          grupoId = result.gid || result.id || result;
          
          // Obtener nombre real del grupo
          const infoGrupo = await obtenerInfoGrupo(client, grupoId);
          nombreGrupoCreado = infoGrupo.nombre;
          
          console.log(`✅ Grupo creado: ${grupoId} - Nombre: ${nombreGrupoCreado}`);
        } catch (createErr) {
          console.error("❌ Error con createGroup:", createErr.message);
          throw createErr;
        }
      }
      // Método 2: createNewGroup
      else if (typeof client.createNewGroup === 'function') {
        console.log("🔄 Usando createNewGroup...");
        const result = await client.createNewGroup(nombreGrupo, [especialistaWhatsApp]);
        grupoId = result.gid || result.id || result;
        
        // Obtener nombre real del grupo
        const infoGrupo = await obtenerInfoGrupo(client, grupoId);
        nombreGrupoCreado = infoGrupo.nombre;
        
        console.log(`✅ Grupo creado: ${grupoId} - Nombre: ${nombreGrupoCreado}`);
      }
      // Método 3: groupCreate
      else if (typeof client.groupCreate === 'function') {
        console.log("🔄 Usando groupCreate...");
        const result = await client.groupCreate(nombreGrupo, [especialistaWhatsApp]);
        grupoId = result.gid || result.id || result;
        
        // Obtener nombre real del grupo
        const infoGrupo = await obtenerInfoGrupo(client, grupoId);
        nombreGrupoCreado = infoGrupo.nombre;
        
        console.log(`✅ Grupo creado: ${grupoId} - Nombre: ${nombreGrupoCreado}`);
      }
      else {
        console.error("❌ No se encontró método para crear grupos");
        console.log(`🔧 Métodos disponibles: ${Object.keys(client).filter(k => typeof client[k] === 'function').join(', ')}`);
        return null;
      }
    } catch (err) {
      console.error("❌ Error crítico al crear grupo:", err.message);
      console.error("Stack trace:", err.stack);
      return null;
    }
    
    if (!grupoId) {
      console.error("❌ No se pudo obtener el ID del grupo creado");
      return null;
    }
    
    // Esperar un momento para que el grupo se estabilice
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generar link de invitación
    let inviteLink = null;
    try {
      inviteLink = await generarLinkInvitacion(client, grupoId);
      if (inviteLink) {
        console.log(`✅ Link generado: ${inviteLink}`);
      } else {
        console.warn("⚠️ No se pudo generar link de invitación");
      }
    } catch (linkErr) {
      console.warn("⚠️ Error al generar link:", linkErr.message);
    }
    
    // Registrar el grupo en nuestro sistema
    const grupo = {
      id: grupoId,
      nombre: nombreGrupoCreado,
      especialistaId: especialistaId,
      especialistaWhatsApp: especialistaWhatsApp,
      especialistaNombre: nombreEspecialista,
      inviteLink: inviteLink,
      linkActualizado: inviteLink ? new Date().toISOString() : null,
      estado: GROUP_STATES.IA_ACTIVA,
      fechaCreacion: new Date().toISOString(),
      ultimaActividadEspecialista: null,
      ultimaActividadIA: Date.now(),
      timerReactivarIA: null,
      infoActualizada: new Date().toISOString()
    };
    
    const data = cargarGrupos();
    data.grupos.push(grupo);
    guardarGrupos(data);
    
    console.log(`✅ Grupo registrado exitosamente:`);
    console.log(`   ID: ${grupoId}`);
    console.log(`   Nombre: ${nombreGrupoCreado}`);
    console.log(`   Especialista: ${nombreEspecialista}`);
    console.log(`   Estado: ${grupo.estado}`);
    if (inviteLink) {
      console.log(`   Link: ${inviteLink}`);
    }
    
    return grupo;
    
  } catch (err) {
    console.error("❌ Error general al crear grupo:", err.message);
    console.error("Stack trace:", err.stack);
    return null;
  }
}

// === Obtener nombre del grupo desde WhatsApp ===
async function obtenerNombreGrupo(client, grupoId) {
  try {
    const info = await obtenerInfoGrupo(client, grupoId);
    return info.nombre;
  } catch (err) {
    console.error("❌ Error al obtener nombre del grupo:", err.message);
    return "Grupo Desconocido";
  }
}

// === Obtener grupo por ID ===
function obtenerGrupoPorId(grupoId) {
  const data = cargarGrupos();
  return data.grupos.find(g => g.id === grupoId);
}

// === Obtener grupo por cliente ===
function obtenerGrupoPorCliente(clienteId) {
  const data = cargarGrupos();
  // Buscar grupo activo más reciente para este cliente
  return data.grupos
    .filter(g => g.clienteId === clienteId)
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0];
}

// === Obtener grupo por especialista ===
function obtenerGrupoPorEspecialista(especialistaId) {
  const data = cargarGrupos();
  // Buscar grupo activo para este especialista
  return data.grupos.find(g => 
    g.especialistaId === especialistaId && 
    (g.estado === GROUP_STATES.IA_ACTIVA || 
     g.estado === GROUP_STATES.ESPECIALISTA_ACTIVO || 
     g.estado === GROUP_STATES.IA_REACTIVADA)
  );
}

// === Verificar si un número es especialista ===
function esEspecialista(remitenteId, especialistaWhatsApp) {
  return remitenteId === especialistaWhatsApp;
}

// === Verificar si la IA está activa en un grupo ===
function isIAActiva(grupoId) {
  const grupo = obtenerGrupoPorId(grupoId);
  if (!grupo) return true; // Si no hay grupo registrado, IA está activa por defecto
  
  return grupo.estado === GROUP_STATES.IA_ACTIVA || grupo.estado === GROUP_STATES.IA_REACTIVADA;
}

// === Desactivar IA cuando especialista envía mensaje ===
function desactivarIA(grupoId, especialistaId) {
  const data = cargarGrupos();
  const grupo = data.grupos.find(g => g.id === grupoId);
  
  if (!grupo) {
    console.warn(`⚠️ Grupo ${grupoId} no encontrado para desactivar IA`);
    return false;
  }
  
  // Actualizar estado
  grupo.estado = GROUP_STATES.ESPECIALISTA_ACTIVO;
  grupo.ultimaActividadEspecialista = Date.now();
  
  // Limpiar timer de reactivación si existe
  if (grupo.timerReactivarIA) {
    clearTimeout(grupo.timerReactivarIA);
    grupo.timerReactivarIA = null;
  }
  
  guardarGrupos(data);
  console.log(`🔇 IA desactivada en grupo ${grupoId} - Especialista activo: ${especialistaId}`);
  return true;
}

// === Programar reactivación de IA después de 5 minutos ===
function programarReactivacionIA(grupoId, callback) {
  const data = cargarGrupos();
  const grupo = data.grupos.find(g => g.id === grupoId);
  
  if (!grupo) {
    console.warn(`⚠️ Grupo ${grupoId} no encontrado para programar reactivación`);
    return null;
  }
  
  // Limpiar timer anterior si existe
  if (grupo.timerReactivarIA) {
    clearTimeout(grupo.timerReactivarIA);
  }
  
  // Programar reactivación después de 5 minutos
  const timer = setTimeout(() => {
    const grupoActualizado = obtenerGrupoPorId(grupoId);
    if (grupoActualizado && grupoActualizado.estado === GROUP_STATES.ESPECIALISTA_ACTIVO) {
      // Verificar si el especialista sigue inactivo
      const tiempoInactivo = Date.now() - (grupoActualizado.ultimaActividadEspecialista || 0);
      
      if (tiempoInactivo >= INACTIVITY_TIMEOUT) {
        // Reactivar IA
        grupoActualizado.estado = GROUP_STATES.IA_REACTIVADA;
        grupoActualizado.ultimaActividadIA = Date.now();
        grupoActualizado.timerReactivarIA = null;
        
        const dataUpdate = cargarGrupos();
        const grupoIndex = dataUpdate.grupos.findIndex(g => g.id === grupoId);
        if (grupoIndex !== -1) {
          dataUpdate.grupos[grupoIndex] = grupoActualizado;
          guardarGrupos(dataUpdate);
        }
        
        console.log(`🔊 IA reactivada automáticamente en grupo ${grupoId} después de 5 minutos de inactividad`);
        
        // Ejecutar callback si se proporciona
        if (callback) {
          callback(grupoActualizado);
        }
      }
    }
  }, INACTIVITY_TIMEOUT);
  
  grupo.timerReactivarIA = timer;
  guardarGrupos(data);
  
  console.log(`⏰ Reactivación de IA programada para grupo ${grupoId} en 5 minutos`);
  return timer;
}

// === Actualizar actividad del especialista ===
function actualizarActividadEspecialista(grupoId) {
  const data = cargarGrupos();
  const grupo = data.grupos.find(g => g.id === grupoId);
  
  if (!grupo) return false;
  
  grupo.ultimaActividadEspecialista = Date.now();
  grupo.estado = GROUP_STATES.ESPECIALISTA_ACTIVO;
  
  // Reprogramar reactivación
  if (grupo.timerReactivarIA) {
    clearTimeout(grupo.timerReactivarIA);
  }
  grupo.timerReactivarIA = null;
  
  guardarGrupos(data);
  return true;
}

// === Actualizar información del grupo ===
async function actualizarInfoGrupo(client, grupoId) {
  try {
    const info = await obtenerInfoGrupo(client, grupoId);
    const data = cargarGrupos();
    const grupo = data.grupos.find(g => g.id === grupoId);
    
    if (grupo) {
      grupo.nombre = info.nombre;
      grupo.infoActualizada = new Date().toISOString();
      guardarGrupos(data);
      console.log(`✅ Información actualizada para grupo ${grupoId}: ${info.nombre}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error("❌ Error al actualizar información del grupo:", err.message);
    return false;
  }
}

// === Limpiar grupos antiguos ===
function limpiarGruposAntiguos() {
  const data = cargarGrupos();
  const ahora = Date.now();
  const unDia = 24 * 60 * 60 * 1000;
  
  data.grupos = data.grupos.filter(grupo => {
    const fechaCreacion = new Date(grupo.fechaCreacion).getTime();
    const tiempoTranscurrido = ahora - fechaCreacion;
    
    // Mantener grupos activos o creados en las últimas 24 horas
    return tiempoTranscurrido < unDia || grupo.estado !== GROUP_STATES.IA_REACTIVADA;
  });
  
  guardarGrupos(data);
  console.log(`🧹 Limpieza: ${data.grupos.length} grupos activos`);
}

// Ejecutar limpieza cada 6 horas
setInterval(limpiarGruposAntiguos, 6 * 60 * 60 * 1000);

// Inicializar archivo si no existe
if (!fs.existsSync(GROUPS_STORAGE_PATH)) {
  guardarGrupos({ grupos: [] });
  console.log("📁 Archivo de grupos creado");
}

module.exports = {
  crearGrupoWhatsApp,
  obtenerGrupoPorId,
  obtenerGrupoPorCliente,
  obtenerGrupoPorEspecialista,
  obtenerLinkInvitacionGrupo,
  generarLinkInvitacion,
  obtenerInfoGrupo,
  obtenerNombreGrupo,
  actualizarInfoGrupo,
  esEspecialista,
  isIAActiva,
  desactivarIA,
  programarReactivacionIA,
  actualizarActividadEspecialista,
  GROUP_STATES,
  INACTIVITY_TIMEOUT
};