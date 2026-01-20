// ============================================
// 🤖 Chatbot FGYA con OpenAI + Google Drive + Notificaciones a Especialistas
// VERSIÓN MEJORADA - Registro automático de grupos
// ============================================

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { google } = require("googleapis");
const OpenAI = require("openai").default;
const axios = require("axios");
const taskManager = require("../utils/taskManager");
const groupManager = require("../utils/groupManager");

// === Verificar clave de OpenAI ===
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: No se detectó la API key de OpenAI");
  process.exit(1);
}
console.log("✅ Clave OpenAI detectada correctamente");

// === Inicializar cliente de OpenAI ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === CONFIGURACIÓN DE NOTIFICACIONES A ESPECIALISTAS ===
const TELEFONOS_NOTIFICACION = {
  "alberto-mendez": "3332250942", // Notificaciones para Alberto Méndez
  "janeth-silva": "3321571469",   // Janeth Silva
  "noemi-hernandez": "3313078636", // Noemí Hernández
  "francisco-ramirez": "3313332696", // Francisco Ramírez
  "sara-lopez": "3311101036",     // Sara López
  "aurora-chavira": "3317490504", // Aurora Chavira
  "ana-paula-figueroa": "3329499077", // Ana Paula Figueroa
  "alfredo-zamudio": "3318647476", // Alfredo Zamudio
  "janeth-bautista": "3328339619", // Janeth Bautista
  "default": "(33) 3407 0123"      // Equipo General
};

// Función para obtener número de notificación del especialista
function obtenerTelefonoNotificacion(especialistaId) {
  return TELEFONOS_NOTIFICACION[especialistaId] || TELEFONOS_NOTIFICACION["default"];
}

// === FUNCIÓN PARA REGISTRAR GRUPO AUTOMÁTICAMENTE ===
async function registrarGrupoAutomaticamente(client, grupoId) {
  try {
    console.log(`🔄 Intentando registrar grupo automáticamente: ${grupoId}`);
    
    // 1. Intentar obtener información del grupo
    let grupoInfo = null;
    try {
      grupoInfo = await client.getChatById(grupoId);
      console.log(`ℹ️ Información del grupo obtenida: ${grupoInfo.name || 'Sin nombre'}`);
    } catch (err) {
      console.warn(`⚠️ No se pudo obtener información del grupo: ${err.message}`);
      
      // Intentar con método alternativo
      try {
        const chats = await client.getAllChats();
        grupoInfo = chats.find(chat => chat.id._serialized === grupoId);
      } catch (err2) {
        console.warn(`⚠️ No se pudo obtener información del grupo (método alternativo): ${err2.message}`);
      }
    }
    
    // 2. Buscar especialistas disponibles
    let especialistaAsignado = null;
    let especialistasDisponibles = [];
    
    try {
      const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
      if (fs.existsSync(especialistasPath)) {
        const especialistasData = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
        especialistasDisponibles = especialistasData.especialistas.filter(e => e.id !== 'default');
        
        // Asignar un especialista por defecto (el primero disponible)
        if (especialistasDisponibles.length > 0) {
          especialistaAsignado = especialistasDisponibles[0];
          console.log(`✅ Asignando especialista por defecto: ${especialistaAsignado.nombre}`);
        }
      }
    } catch (err) {
      console.error("⚠️ Error al cargar especialistas:", err.message);
    }
    
    // 3. Crear registro del grupo
    const nuevoGrupo = {
      id: grupoId,
      nombre: grupoInfo?.name || `Grupo ${grupoId.substring(0, 8)}...`,
      descripcion: grupoInfo?.description || "Grupo registrado automáticamente",
      especialistaId: especialistaAsignado?.id || "default",
      especialistaWhatsApp: especialistaAsignado?.telefono ? 
        especialistaAsignado.telefono.replace(/[^0-9]/g, '') + '@c.us' : 
        null,
      especialistaNombre: especialistaAsignado?.nombre || "Equipo General",
      tema: grupoInfo?.name || "Consultas generales",
      fechaCreacion: new Date().toISOString(),
      fechaRegistro: new Date().toISOString(),
      estado: "activo",
      iaActiva: true,
      ultimaActividad: new Date().toISOString(),
      participantes: [],
      inviteLink: null,
      linkActualizado: null,
      esAutomatico: true  // Marcar como registro automático
    };
    
    // 4. Intentar obtener participantes
    try {
      const participants = await client.getChatById(grupoId);
      if (participants && participants.groupMetadata && participants.groupMetadata.participants) {
        nuevoGrupo.participantes = participants.groupMetadata.participants.map(p => ({
          id: p.id._serialized,
          nombre: p.name || p.pushname || `Usuario ${p.id.user}`,
          esAdmin: p.isAdmin || false
        }));
        console.log(`✅ ${nuevoGrupo.participantes.length} participantes identificados`);
      }
    } catch (err) {
      console.warn(`⚠️ No se pudieron obtener participantes: ${err.message}`);
    }
    
    // 5. Guardar en el sistema de grupos
    const resultado = groupManager.registrarGrupo(nuevoGrupo);
    
    if (resultado) {
      console.log(`✅ Grupo registrado automáticamente: ${grupoId}`);
      console.log(`   Nombre: ${nuevoGrupo.nombre}`);
      console.log(`   Especialista: ${nuevoGrupo.especialistaNombre}`);
      console.log(`   Tema: ${nuevoGrupo.tema}`);
      
      // 6. Enviar notificación al especialista asignado
      if (especialistaAsignado) {
        const telefonoNotificacion = obtenerTelefonoNotificacion(especialistaAsignado.id);
        if (telefonoNotificacion) {
          const mensajeNotificacion = `🎯 *NUEVO GRUPO REGISTRADO AUTOMÁTICAMENTE* 🎯\n\n` +
            `Se ha registrado un nuevo grupo de WhatsApp para ti:\n\n` +
            `📛 *Nombre del grupo:* ${nuevoGrupo.nombre}\n` +
            `📋 *Descripción:* ${nuevoGrupo.descripcion}\n` +
            `👥 *Participantes:* ${nuevoGrupo.participantes.length}\n` +
            `🔗 *ID del grupo:* ${grupoId}\n\n` +
            `📞 *Tus datos de contacto:*\n` +
            `👤 ${especialistaAsignado.nombre}\n` +
            `📱 ${especialistaAsignado.telefono || telefonoNotificacion}\n` +
            `📧 ${especialistaAsignado.email || 'No especificado'}\n\n` +
            `✅ *Acción requerida:*\n` +
            `1. Revisa los mensajes en el grupo\n` +
            `2. Atiende las consultas\n` +
            `3. Mantén activa la comunicación\n\n` +
            `*Fecha:* ${new Date().toLocaleString('es-MX')}`;
          
          let numeroNotificacion = telefonoNotificacion;
          if (!numeroNotificacion.includes('@c.us')) {
            numeroNotificacion = numeroNotificacion.replace(/[^0-9]/g, '');
            numeroNotificacion = numeroNotificacion.includes('52') ? numeroNotificacion : `52${numeroNotificacion}`;
            numeroNotificacion = `${numeroNotificacion}@c.us`;
          }
          
          try {
            await client.sendText(numeroNotificacion, mensajeNotificacion);
            console.log(`✅ Notificación enviada a ${especialistaAsignado.nombre}`);
          } catch (notifErr) {
            console.warn(`⚠️ No se pudo enviar notificación: ${notifErr.message}`);
          }
        }
      }
      
      // 7. Enviar mensaje de bienvenida al grupo
      try {
        await client.sendText(
          grupoId,
          `👋 *¡Hola a todos!*\n\n` +
          `Soy el asistente virtual de ${process.env.EMPRESA_NOMBRE || "FGYA"}. ` +
          `He detectado que este grupo no estaba registrado en nuestro sistema, así que lo he registrado automáticamente.\n\n` +
          `📋 *Información del grupo:*\n` +
          `• Nombre: ${nuevoGrupo.nombre}\n` +
          `• Especialista asignado: ${nuevoGrupo.especialistaNombre}\n` +
          `• Tema: ${nuevoGrupo.tema}\n\n` +
          `🤖 *Funciones disponibles:*\n` +
          `• Puedo responder preguntas generales\n` +
          `• Puedo procesar archivos y guardarlos en la nube\n` +
          `• Puedo conectarles con especialistas\n` +
          `• Puedo crear tareas y seguimientos\n\n` +
          `💬 *¿En qué puedo ayudarlos hoy?*`
        );
        console.log(`✅ Mensaje de bienvenida enviado al grupo`);
      } catch (welcomeErr) {
        console.warn(`⚠️ No se pudo enviar mensaje de bienvenida: ${welcomeErr.message}`);
      }
      
      return nuevoGrupo;
    } else {
      console.error(`❌ No se pudo registrar el grupo automáticamente`);
      return null;
    }
    
  } catch (err) {
    console.error(`❌ Error en registro automático de grupo: ${err.message}`);
    console.error(`   Stack trace:`, err.stack);
    return null;
  }
}

// === SISTEMA DE NOTIFICACIONES A ESPECIALISTAS ===
async function enviarNotificacionEspecialista(client, especialistaInfo, datosNotificacion) {
  try {
    // Obtener número del especialista para notificación
    const telefonoNotificacion = obtenerTelefonoNotificacion(especialistaInfo.id);
    
    if (!telefonoNotificacion) {
      console.error(`❌ No se encontró número de notificación para ${especialistaInfo.nombre}`);
      return false;
    }
    
    // Formatear número de WhatsApp (agregar @c.us si no lo tiene)
    let numeroWhatsApp = telefonoNotificacion;
    if (!numeroWhatsApp.includes('@c.us')) {
      // Limpiar número (eliminar espacios, paréntesis, guiones)
      numeroWhatsApp = numeroWhatsApp.replace(/[^0-9]/g, '');
      numeroWhatsApp = numeroWhatsApp.includes('52') ? numeroWhatsApp : `52${numeroWhatsApp}`;
      numeroWhatsApp = `${numeroWhatsApp}@c.us`;
    }
    
    console.log(`📱 Enviando notificación a ${especialistaInfo.nombre}: ${numeroWhatsApp}`);
    
    // Crear mensaje de notificación
    const mensajeNotificacion = `🔔 *NUEVO MENSAJE PENDIENTE* 🔔\n\n` +
      `👤 *Cliente solicitando:*\n` +
      `📛 Nombre: ${datosNotificacion.nombreCliente || 'Cliente'}\n` +
      `📱 Teléfono: ${datosNotificacion.telefonoCliente || 'No disponible'}\n` +
      `💬 Mensaje: "${datosNotificacion.mensaje.substring(0, 100)}${datosNotificacion.mensaje.length > 100 ? '...' : ''}"\n\n` +
      `🎯 *Información del caso:*\n` +
      `📋 Tema: ${datosNotificacion.tema || 'Consulta general'}\n` +
      `🏢 Área: ${especialistaInfo.especialidades?.join(', ') || 'Atención al cliente'}\n\n` +
      `📍 *Acción requerida:*\n` +
      `• ${datosNotificacion.grupoId ? `Revisar mensaje en el grupo: ${datosNotificacion.grupoId}` : 'Contactar al cliente directamente'}\n` +
      `• Responder lo antes posible\n\n` +
      `⏰ *Fecha/Hora:* ${new Date().toLocaleString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n\n` +
      `📞 *Contacto del cliente:*\n` +
      `WhatsApp: ${datosNotificacion.whatsappCliente || 'Mismo número'}\n\n` +
      `✅ *Tu información de contacto:*\n` +
      `👤 ${especialistaInfo.nombre}\n` +
      `📱 ${especialistaInfo.telefono}\n` +
      `📧 ${especialistaInfo.email || 'No especificado'}`;
    
    // Enviar notificación por WhatsApp
    await client.sendText(numeroWhatsApp, mensajeNotificacion);
    
    // También enviar un recordatorio más corto después de 1 minuto
    setTimeout(async () => {
      try {
        const recordatorio = `⏰ *Recordatorio*\n\n` +
          `Tienes un mensaje pendiente de ${datosNotificacion.nombreCliente || 'un cliente'}.\n` +
          `"${datosNotificacion.mensaje.substring(0, 50)}${datosNotificacion.mensaje.length > 50 ? '...' : ''}"\n\n` +
          `Por favor, atiende esta solicitud.`;
        
        await client.sendText(numeroWhatsApp, recordatorio);
        console.log(`✅ Recordatorio enviado a ${especialistaInfo.nombre}`);
      } catch (err) {
        console.warn(`⚠️ No se pudo enviar recordatorio a ${especialistaInfo.nombre}:`, err.message);
      }
    }, 60000); // 1 minuto
    
    console.log(`✅ Notificación enviada exitosamente a ${especialistaInfo.nombre}`);
    return true;
    
  } catch (err) {
    console.error(`❌ Error al enviar notificación a ${especialistaInfo.nombre}:`, err.message);
    return false;
  }
}

// === Función para notificar a todos los especialistas relevantes ===
async function notificarEspecialistasRelevantes(client, mensaje, userId, nombreUsuario, especialistaAsignado) {
  try {
    console.log(`🔔 Procesando notificaciones para especialistas...`);
    
    // Cargar lista de especialistas
    const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
    if (!fs.existsSync(especialistasPath)) {
      console.warn("⚠️ Archivo de especialistas no encontrado, no se enviarán notificaciones");
      return;
    }
    
    const especialistasData = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
    const especialistas = especialistasData.especialistas || [];
    
    // Datos del cliente
    let datosCliente = {
      nombreCliente: nombreUsuario || 'Cliente',
      whatsappCliente: userId,
      telefonoCliente: null,
      mensaje: mensaje,
      grupoId: null,
      tema: null
    };
    
    // Obtener teléfono del cliente si es posible
    try {
      const contact = await client.getContact(userId);
      if (contact && contact.number) {
        datosCliente.telefonoCliente = contact.number;
      }
    } catch (contactErr) {
      console.warn("⚠️ No se pudo obtener teléfono del cliente:", contactErr.message);
    }
    
    // Buscar grupos donde el cliente esté participando
    try {
      const grupos = require("../utils/groupManager").cargarGrupos();
      const grupoCliente = grupos.grupos.find(g => 
        g.participantes && g.participantes.some(p => p.id === userId)
      );
      
      if (grupoCliente) {
        datosCliente.grupoId = grupoCliente.id;
        datosCliente.tema = grupoCliente.tema || grupoCliente.nombre;
      }
    } catch (grupoErr) {
      console.warn("⚠️ No se pudo buscar información de grupos:", grupoErr.message);
    }
    
    // 1. Notificar al especialista asignado específicamente (si existe)
    if (especialistaAsignado && especialistaAsignado.id !== 'default') {
      console.log(`📞 Notificando al especialista asignado: ${especialistaAsignado.nombre}`);
      await enviarNotificacionEspecialista(client, especialistaAsignado, datosCliente);
    }
    
    // 2. Buscar especialistas cuyas palabras clave coincidan con el mensaje
    const mensajeLower = mensaje.toLowerCase();
    let especialistasRelevantes = [];
    
    for (const especialista of especialistas) {
      // Saltar el especialista default y el que ya fue notificado
      if (especialista.id === 'default' || 
          (especialistaAsignado && especialista.id === especialistaAsignado.id)) {
        continue;
      }
      
      // Buscar coincidencias con palabras clave
      const palabrasClave = especialista.palabrasClave || [];
      const especialidades = especialista.especialidades || [];
      
      // Verificar si alguna palabra clave o especialidad está en el mensaje
      const tieneCoincidencia = palabrasClave.some(palabra => 
        palabra && mensajeLower.includes(palabra.toLowerCase())
      ) || especialidades.some(especialidad => 
        especialidad && mensajeLower.includes(especialidad.toLowerCase())
      );
      
      if (tieneCoincidencia) {
        especialistasRelevantes.push(especialista);
      }
    }
    
    // 3. Notificar a especialistas relevantes encontrados
    if (especialistasRelevantes.length > 0) {
      console.log(`📢 Encontrados ${especialistasRelevantes.length} especialistas relevantes para el mensaje`);
      
      for (const especialista of especialistasRelevantes) {
        // Esperar 500ms entre notificaciones para no saturar
        await new Promise(resolve => setTimeout(resolve, 500));
        await enviarNotificacionEspecialista(client, especialista, datosCliente);
      }
    }
    
    // 4. Notificar al equipo general si no hay especialistas específicos
    if (!especialistaAsignado || especialistaAsignado.id === 'default') {
      const equipoGeneral = especialistas.find(e => e.id === 'default');
      if (equipoGeneral) {
        console.log(`📢 Notificando al equipo general`);
        await new Promise(resolve => setTimeout(resolve, 500));
        await enviarNotificacionEspecialista(client, equipoGeneral, datosCliente);
      }
    }
    
    console.log(`✅ Proceso de notificaciones completado`);
    
  } catch (err) {
    console.error(`❌ Error en notificarEspecialistasRelevantes:`, err.message);
  }
}

// === Autenticación con Google Drive (OAuth2) ===
const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials", "client_secret.json");
const TOKEN_PATH = path.join(__dirname, "..", "credentials", "tokens.json");

function getDriveClient() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error("❌ ERROR: No se encontró client_secret.json en credentials/");
      return null;
    }
    if (!fs.existsSync(TOKEN_PATH)) {
      console.error("❌ ERROR: No se encontró tokens.json en credentials/");
      return null;
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);
    
    // Configurar refresh automático de tokens
    oAuth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // Guardar el nuevo refresh_token si se proporciona
        token.refresh_token = tokens.refresh_token;
      }
      // Actualizar tokens guardados
      Object.assign(token, tokens);
      try {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
        console.log("🔄 Tokens de Google Drive actualizados automáticamente");
      } catch (writeErr) {
        console.error("⚠️ Error al guardar tokens actualizados:", writeErr.message);
      }
    });
    
    return google.drive({ version: "v3", auth: oAuth2Client });
  } catch (err) {
    console.error("❌ Error al inicializar Google Drive:", err.message);
    return null;
  }
}

let drive = getDriveClient();
if (!drive) {
  console.warn("⚠️ ADVERTENCIA: Google Drive no está disponible. Las funciones de subida de archivos no funcionarán.");
}

// === Subir archivo a Drive ===
async function subirAGoogleDrive(filePath, fileName, mimeType) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  try {
    if (!drive) {
      console.error("❌ Google Drive no está inicializado");
      return null;
    }

    if (!folderId) {
      console.error("❌ GOOGLE_DRIVE_FOLDER_ID no está configurado en .env");
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.error(`❌ El archivo ${filePath} no existe`);
      return null;
    }

    const fileMetadata = { 
      name: fileName, 
      parents: folderId ? [folderId] : [] 
    };
    const media = { 
      mimeType: mimeType || 'application/octet-stream', 
      body: fs.createReadStream(filePath) 
    };
    
    const res = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });
    
    const link = res.data.webViewLink || res.data.webContentLink;
    console.log(`📤 Archivo subido a Drive: ${fileName} - ID: ${res.data.id}`);
    return link;
  } catch (err) {
    if (err.code === 401 || (err.response && err.response.status === 401) || 
        (err.message && err.message.includes('invalid_grant'))) {
      console.warn("⚠️ Token expirado, intentando refrescar...");
      
      try {
        drive = getDriveClient();
        
        if (drive && folderId) {
          const fileMetadata = { 
            name: fileName, 
            parents: folderId ? [folderId] : [] 
          };
          const media = { 
            mimeType: mimeType || 'application/octet-stream', 
            body: fs.createReadStream(filePath) 
          };
          
          const res = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id, webViewLink, webContentLink",
          });
          
          const link = res.data.webViewLink || res.data.webContentLink;
          console.log(`📤 Archivo subido a Drive (después de refresh): ${fileName} - ID: ${res.data.id}`);
          return link;
        }
      } catch (retryErr) {
        console.error("❌ Error al reintentar después de refresh:", retryErr.message);
      }
    }
    
    console.error("❌ Error al subir a Drive:", err.message);
    if (err.response && err.response.data) {
      try {
        console.error("Detalles del error:", JSON.stringify(err.response.data, null, 2));
      } catch (stringifyErr) {
        console.error("Detalles del error (sin formato):", err.response.data);
      }
    }
    if (err.code) {
      console.error("Código de error:", err.code);
    }
    
    if (err.message && err.message.includes('invalid_grant')) {
      console.error("\n💡 SOLUCIÓN: El token de Google Drive ha expirado.");
      console.error("   Ejecuta: node drive-auth.js");
      console.error("   Esto regenerará los tokens necesarios.\n");
    }
    
    return null;
  }
}

// === Sistema de gestión de estados de conversación ===
const userStates = new Map();

const SUPPORT_STATES = {
  IDLE: 'idle',
  ASKING_NAME: 'asking_name',
  ASKING_PHONE: 'asking_phone',
  ASKING_EMAIL: 'asking_email',
  ASKING_DESCRIPTION: 'asking_description',
  COMPLETED: 'completed'
};

// === Clasificador de intención mejorado ===
async function classifyIntent(texto) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Clasifica el mensaje y determina si requiere una tarea. Categorías: InformacionServicios, Cotizacion, Cita, Soporte, Ayuda, Dudas, Tarea, Otros. " +
            "Si el mensaje requiere acción, seguimiento o asignación a un especialista, clasifícalo como 'Tarea'. " +
            "Si es solo un saludo, agradecimiento o mensaje corto sin contenido sustancial, clasifícalo como 'Otros' con baja confianza. " +
            "Devuelve SOLO un JSON válido con el formato: {\"label\": \"categoria\", \"confidence\": 0.0-1.0, \"requiereTarea\": true/false}",
        },
        { role: "user", content: texto },
      ],
    });
    
    const content = completion.choices[0].message.content.trim();
    
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.requiereTarea === undefined) {
        result.requiereTarea = ["Tarea", "Cotizacion", "Cita", "Soporte", "Ayuda"].includes(result.label);
      }
      return result;
    }
    
    const result = JSON.parse(content);
    if (result.requiereTarea === undefined) {
      result.requiereTarea = ["Tarea", "Cotizacion", "Cita", "Soporte", "Ayuda"].includes(result.label);
    }
    return result;
  } catch (err) {
    console.error("❌ Error en classifyIntent:", err.message);
    return { label: "Otros", confidence: 0, requiereTarea: false };
  }
}

// === Función para enviar datos a Power Automate (Soporte) ===
async function enviarAPowerAutomate(datosUsuario) {
  try {
    const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error("❌ POWER_AUTOMATE_WEBHOOK_URL no está configurado en .env");
      return false;
    }

    const payload = {
      usuario: {
        nombre: datosUsuario.nombre || '',
        email: datosUsuario.email || '',
        telefono: datosUsuario.telefono || '',
        whatsapp: datosUsuario.whatsappId || '',
        descripción: datosUsuario.descripcion || ''
      },
      timestamp: new Date().toISOString(),
      fuente: "WhatsApp Bot",
      tipo: "Solicitud de Soporte"
    };

    console.log("📤 Enviando datos a Power Automate:", JSON.stringify(payload, null, 2));

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log("✅ Datos enviados exitosamente a Power Automate. Status:", response.status);
    return true;
  } catch (err) {
    console.error("❌ Error al enviar datos a Power Automate:", err.message);
    if (err.response) {
      console.error("Respuesta del servidor:", err.response.data);
    }
    return false;
  }
}

// === Función para enviar tarea a Power Automate (Microsoft Lists) ===
async function enviarTareaAPowerAutomate(tarea) {
  try {
    const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error("❌ POWER_AUTOMATE_WEBHOOK_URL no está configurado en .env");
      return false;
    }

    const payload = {
      tarea: {
        id: tarea.id,
        titulo: tarea.titulo || "Tarea General",
        descripcion: tarea.descripcion || "",
        responsable: {
          nombre: tarea.responsable?.nombre || "Equipo General",
          telefono: tarea.responsable?.telefono || "",
          email: tarea.responsable?.email || ""
        },
        vencimiento: tarea.vencimiento || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        archivos: tarea.archivos || [],
        estatus: tarea.estatus || "Pendiente",
        tema: tarea.titulo || "General"
      },
      usuario: {
        whatsapp: tarea.usuario?.whatsappId || "",
        nombre: tarea.usuario?.nombre || "Usuario"
      },
      timestamp: new Date().toISOString(),
      fuente: "WhatsApp Bot",
      tipo: "Tarea"
    };

    console.log("📤 Enviando tarea a Power Automate:", JSON.stringify(payload, null, 2));

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log("✅ Tarea enviada exitosamente a Power Automate. Status:", response.status);
    return true;
  } catch (err) {
    console.error("❌ Error al enviar tarea a Power Automate:", err.message);
    if (err.response) {
      console.error("Respuesta del servidor:", err.response.data);
    }
    return false;
  }
}

// === Función para generar mensaje de notificación con IA ===
async function generarMensajeNotificacionIA(empresaInfo, datosCliente, especialistaInfo, grupoId) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Eres un asistente que genera mensajes profesionales de notificación para especialistas de ${empresaInfo.nombre}.

Genera un mensaje claro y conciso que informe al especialista que ha recibido una solicitud en un grupo de WhatsApp. El mensaje debe ser profesional pero amigable.

Formato del mensaje:
- Debe mencionar que recibió un mensaje en el grupo
- Debe solicitar que responda dentro del grupo
- Debe incluir información relevante del cliente
- Debe ser breve y directo

Usa emojis apropiados y mantén un tono profesional.`
        },
        {
          role: "user",
          content: `Genera un mensaje de notificación para ${especialistaInfo.nombre} informándole que:

- Cliente: ${datosCliente.nombre || 'Cliente'}
- Consulta: ${datosCliente.consulta || datosCliente.descripcion || 'Sin descripción'}
- Grupo ID: ${grupoId}

El mensaje debe indicar que recibió un mensaje en el grupo y que debe responder dentro de ese grupo.`
        }
      ],
      max_tokens: 200
    });
    
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("⚠️ Error al generar mensaje con IA, usando mensaje por defecto:", err.message);
    return `🔔 *Nueva Solicitud de Contacto*\n\n` +
      `Has recibido un mensaje en el grupo ${grupoId}. Te solicitamos responder dentro de ese grupo.\n\n` +
      `👤 *Cliente:* ${datosCliente.nombre || 'Cliente'}\n` +
      `📋 *Consulta:* ${datosCliente.consulta || datosCliente.descripcion || 'Sin descripción'}`;
  }
}

// === Función para obtener o crear grupo y enviar link ===
async function obtenerOcrearGrupoEspecialista(client, especialistaId, datosCliente, empresaInfo) {
  try {
    console.log(`🔍 Buscando grupo para especialista: ${especialistaId}`);
    
    let especialistaInfo = null;
    let especialistaWhatsApp = null;
    
    try {
      const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
      if (fs.existsSync(especialistasPath)) {
        const especialistasData = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
        especialistaInfo = especialistasData.especialistas.find(e => e.id === especialistaId);
        
        if (!especialistaInfo) {
          console.warn(`⚠️ Especialista ${especialistaId} no encontrado en especialistas.json`);
        }
      } else {
        console.warn(`⚠️ Archivo especialistas.json no encontrado`);
      }
    } catch (err) {
      console.error("⚠️ Error al cargar información del especialista:", err.message);
    }

    const nombreEspecialista = especialistaInfo?.nombre || especialistaId;
    
    especialistaWhatsApp = process.env.ESPECIALISTA_NUMERO;
    
    if (!especialistaWhatsApp) {
      const envKey = `ESPECIALISTA_${especialistaId.toUpperCase().replace(/-/g, '_')}_WHATSAPP`;
      especialistaWhatsApp = process.env[envKey];
    }
    
    if (!especialistaWhatsApp) {
      console.warn(`⚠️ No se encontró número de WhatsApp para especialista: ${especialistaId}`);
      return { success: false, grupo: null, inviteLink: null, error: 'no_whatsapp' };
    }

    if (!especialistaWhatsApp.includes('@c.us')) {
      console.error(`❌ Formato incorrecto del número de WhatsApp: ${especialistaWhatsApp}`);
      return { success: false, grupo: null, inviteLink: null, error: 'invalid_format' };
    }
    
    let grupo = groupManager.obtenerGrupoPorEspecialista(especialistaId);
    
    if (grupo) {
      console.log(`✅ Grupo existente encontrado para ${nombreEspecialista}: ${grupo.id}`);
      
      if (!grupo.inviteLink) {
        console.log(`🔄 Generando link de invitación para grupo existente...`);
        const link = await groupManager.generarLinkInvitacion(client, grupo.id);
        if (link) {
          grupo.inviteLink = link;
          grupo.linkActualizado = new Date().toISOString();
          
          try {
            const fs = require("fs");
            const path = require("path");
            const GROUPS_STORAGE_PATH = path.join(__dirname, "..", "data", "grupos-whatsapp.json");
            
            if (fs.existsSync(GROUPS_STORAGE_PATH)) {
              const data = JSON.parse(fs.readFileSync(GROUPS_STORAGE_PATH, "utf8"));
              const grupoIndex = data.grupos.findIndex(g => g.id === grupo.id);
              if (grupoIndex !== -1) {
                data.grupos[grupoIndex] = grupo;
                fs.writeFileSync(GROUPS_STORAGE_PATH, JSON.stringify(data, null, 2), "utf8");
                console.log(`✅ Link de invitación actualizado para grupo ${grupo.id}`);
              }
            }
          } catch (err) {
            console.warn("⚠️ No se pudo guardar actualización del link:", err.message);
          }
        }
      }
      
      return { 
        success: true, 
        grupo: grupo, 
        inviteLink: grupo.inviteLink,
        esNuevo: false
      };
    }
    
    console.log(`🆕 Creando nuevo grupo único para ${nombreEspecialista}...`);
    grupo = await groupManager.crearGrupoWhatsApp(
      client,
      especialistaId,
      especialistaWhatsApp,
      nombreEspecialista
    );
    
    if (!grupo) {
      console.error("❌ No se pudo crear el grupo de WhatsApp");
      return { success: false, grupo: null, inviteLink: null, error: 'create_failed' };
    }
    
    // NOTIFICACIÓN ESPECIAL: Enviar notificación al número de notificación
    try {
      const telefonoNotificacion = obtenerTelefonoNotificacion(especialistaId);
      if (telefonoNotificacion) {
        const mensajeNotificacionEspecial = `🎯 *NUEVO GRUPO CREADO* 🎯\n\n` +
          `Se ha creado un nuevo grupo de WhatsApp para ti:\n\n` +
          `👤 *Especialista:* ${nombreEspecialista}\n` +
          `📋 *Nombre del grupo:* ${grupo.nombre}\n` +
          `🔗 *Link de invitación:* ${grupo.inviteLink || 'Generando...'}\n\n` +
          `👥 *Cliente que solicitó:*\n` +
          `📛 Nombre: ${datosCliente.nombre || 'Cliente'}\n` +
          `📱 WhatsApp: ${datosCliente.whatsappId || 'No disponible'}\n` +
          `💬 Consulta: "${datosCliente.consulta || datosCliente.descripcion || 'Sin descripción'.substring(0, 100)}"\n\n` +
          `📞 *Tus datos de contacto:*\n` +
          `👤 ${especialistaInfo?.nombre || nombreEspecialista}\n` +
          `📱 ${especialistaInfo?.telefono || telefonoNotificacion}\n` +
          `📧 ${especialistaInfo?.email || 'No especificado'}\n\n` +
          `✅ *Acción requerida:*\n` +
          `1. Únete al grupo usando el link\n` +
          `2. Saluda al cliente\n` +
          `3. Resuelve su consulta`;
        
        let numeroNotificacion = telefonoNotificacion;
        if (!numeroNotificacion.includes('@c.us')) {
          numeroNotificacion = numeroNotificacion.replace(/[^0-9]/g, '');
          numeroNotificacion = numeroNotificacion.includes('52') ? numeroNotificacion : `52${numeroNotificacion}`;
          numeroNotificacion = `${numeroNotificacion}@c.us`;
        }
        
        await client.sendText(numeroNotificacion, mensajeNotificacionEspecial);
        console.log(`✅ Notificación especial enviada a ${numeroNotificacion}`);
      }
    } catch (notifErr) {
      console.warn("⚠️ No se pudo enviar notificación especial:", notifErr.message);
    }
    
    console.log(`✅ Grupo único creado exitosamente para ${nombreEspecialista}`);
    return { 
      success: true, 
      grupo: grupo, 
      inviteLink: grupo.inviteLink,
      esNuevo: true
    };
    
  } catch (err) {
    console.error(`❌ Error al obtener/crear grupo para especialista ${especialistaId}:`, err.message);
    console.error(`   Stack trace:`, err.stack);
    return { success: false, grupo: null, inviteLink: null, error: err.message };
  }
}

// === Función para iniciar el flujo de soporte ===
async function iniciarFlujoSoporte(client, userId, empresaInfo) {
  userStates.set(userId, {
    state: SUPPORT_STATES.ASKING_NAME,
    datos: {
      whatsappId: userId
    }
  });

  await client.sendText(
    userId,
    `🆘 *Solicitud de Soporte*\n\n` +
    `Entiendo que necesitas ayuda. Para poder asistirte mejor, necesito algunos datos:\n\n` +
    `Por favor, proporciona tu *nombre completo*:`
  );
}

// === Función para procesar el flujo de soporte ===
async function procesarFlujoSoporte(client, userId, texto, empresaInfo) {
  const userState = userStates.get(userId);
  
  if (!userState) {
    return false;
  }

  const { state, datos } = userState;

  switch (state) {
    case SUPPORT_STATES.ASKING_NAME:
      datos.nombre = texto.trim();
      userState.state = SUPPORT_STATES.ASKING_PHONE;
      await client.sendText(
        userId,
        `✅ Gracias, ${datos.nombre}.\n\n` +
        `Ahora necesito tu *número de teléfono* (puede ser el mismo de WhatsApp o uno alternativo):`
      );
      return true;

    case SUPPORT_STATES.ASKING_PHONE:
      datos.telefono = texto.trim();
      userState.state = SUPPORT_STATES.ASKING_EMAIL;
      await client.sendText(
        userId,
        `✅ Teléfono registrado: ${datos.telefono}\n\n` +
        `Ahora necesito tu *correo electrónico*:`
      );
      return true;

    case SUPPORT_STATES.ASKING_EMAIL:
      datos.email = texto.trim();
      userState.state = SUPPORT_STATES.ASKING_DESCRIPTION;
      await client.sendText(
        userId,
        `✅ Email registrado: ${datos.email}\n\n` +
        `Por último, describe brevemente el *problema o consulta* que necesitas resolver:`
      );
      return true;

    case SUPPORT_STATES.ASKING_DESCRIPTION:
      datos.descripcion = texto.trim();
      userState.state = SUPPORT_STATES.COMPLETED;
      
      const enviado = await enviarAPowerAutomate(datos);
      
      if (enviado) {
        await client.sendText(
          userId,
          `✅ *Solicitud de Soporte Registrada*\n\n` +
          `Tus datos han sido enviados correctamente:\n` +
          `• Nombre: ${datos.nombre}\n` +
          `• Teléfono: ${datos.telefono}\n` +
          `• Email: ${datos.email}\n` +
          `• Descripción: ${datos.descripcion}\n\n` +
          `Un administrador se pondrá en contacto contigo pronto.\n\n` +
          `Si tienes alguna otra consulta, puedes escribirme normalmente.`
        );
      } else {
        await client.sendText(
          userId,
          `⚠️ Hubo un problema al registrar tu solicitud. Por favor, contacta directamente al: ${empresaInfo.contacto || "soporte"}\n\n` +
          `O intenta nuevamente más tarde.`
        );
      }
      
      userStates.delete(userId);
      return true;

    default:
      return false;
  }
}

// === Chatbot principal ===
module.exports = (client, empresaInfo) => {
  if (!client) {
    console.error("❌ ERROR: El cliente de WhatsApp no está disponible");
    return;
  }

  if (!empresaInfo) {
    console.error("❌ ERROR: La información de la empresa no está disponible");
    return;
  }

  console.log("🔔 Sistema de notificaciones a especialistas activado");
  console.log("🔄 Sistema de registro automático de grupos ACTIVADO");
  console.log("📱 Números de notificación configurados:");
  Object.entries(TELEFONOS_NOTIFICACION).forEach(([id, telefono]) => {
    console.log(`   • ${id}: ${telefono}`);
  });

  client.onMessage(async (message) => {
    if (!message) {
      console.warn("⚠️ Mensaje nulo recibido");
      return;
    }

    if (message.fromMe) {
      return;
    }

    // === DETECCIÓN DE GRUPOS ===
    const esGrupo = message.isGroupMsg || message.chat?.isGroup || false;
    const grupoId = esGrupo ? (message.chatId || message.from) : null;
    
    if (esGrupo && grupoId) {
      console.log(`👥 Mensaje recibido en grupo: ${grupoId}`);
      
      // Verificar si el grupo está registrado
      let grupo = groupManager.obtenerGrupoPorId(grupoId);
      
      if (!grupo) {
        console.log(`⚠️ Grupo ${grupoId} no está registrado en nuestro sistema`);
        console.log(`🔄 Intentando registro automático...`);
        
        // Intentar registrar el grupo automáticamente
        grupo = await registrarGrupoAutomaticamente(client, grupoId);
        
        if (!grupo) {
          console.log(`❌ No se pudo registrar el grupo automáticamente`);
          return;
        }
        
        console.log(`✅ Grupo registrado automáticamente: ${grupo.nombre}`);
      } else {
        console.log(`✅ Grupo registrado encontrado: ${grupo.nombre || grupo.id}`);
      }
      
      // Procesar mensaje en grupo registrado
      const remitenteId = message.author || message.from;
      const esEspecialista = groupManager.esEspecialista(remitenteId, grupo.especialistaWhatsApp);
      
      if (esEspecialista) {
        console.log(`👤 Mensaje de especialista detectado en grupo ${grupoId}`);
        
        groupManager.actualizarActividadEspecialista(grupoId);
        
        if (groupManager.isIAActiva(grupoId)) {
          groupManager.desactivarIA(grupoId, grupo.especialistaId);
          
          groupManager.programarReactivacionIA(grupoId, async (grupoReactivated) => {
            try {
              await client.sendText(
                grupoId,
                `🤖 La IA se ha reactivado. Estoy aquí para ayudarte si necesitas algo más.`
              );
            } catch (err) {
              console.warn("⚠️ No se pudo enviar mensaje de reactivación:", err.message);
            }
          });
        }
        
        console.log(`🔇 IA desactivada - No se responderá al mensaje del especialista`);
        return;
      }
      
      if (!groupManager.isIAActiva(grupoId)) {
        console.log(`🔇 IA desactivada en grupo ${grupoId} - No se responderá`);
        return;
      }
      
      console.log(`🔊 IA activa en grupo ${grupoId} - Procesando mensaje`);
    }

    if (esGrupo && !grupoId) {
      return;
    }

    try {
      // 📎 Detectar si el mensaje contiene archivo
      const tieneArchivo = 
        message.mimetype || 
        message.isMedia || 
        message.type === 'image' || 
        message.type === 'video' || 
        message.type === 'audio' || 
        message.type === 'document' || 
        message.type === 'ptt' ||
        message.hasMedia;

      if (tieneArchivo) {
        console.log("📥 Archivo detectado - Tipo:", message.type || message.mimetype);
        
        try {
          // Descargar archivo
          let buffer;
          
          if (typeof client.decryptMedia === 'function') {
            try {
              buffer = await client.decryptMedia(message);
            } catch (decryptErr) {
              console.error("❌ Error con decryptMedia:", decryptErr.message);
            }
          }
          
          if (!buffer && message.id && typeof client.downloadMedia === 'function') {
            try {
              buffer = await client.downloadMedia(message.id);
            } catch (downloadErr) {
              console.error("❌ Error con downloadMedia:", downloadErr.message);
            }
          }
          
          if (!buffer && typeof client.downloadFile === 'function') {
            try {
              buffer = await client.downloadFile(message);
            } catch (downloadErr) {
              console.error("❌ Error con downloadFile:", downloadErr.message);
            }
          }
          
          if (!buffer) {
            throw new Error(`No se encontró método de descarga disponible.`);
          }

          if (!buffer || buffer.length === 0) {
            console.error("❌ Buffer vacío o nulo");
            await client.sendText(
              message.from,
              "❌ No pude descargar el archivo. Por favor, intenta reenviarlo como documento."
            );
            return;
          }

          const mimeType = message.mimetype || message.mediaType || 'application/octet-stream';
          const extension = mime.extension(mimeType) || 
                          (message.filename ? path.extname(message.filename).slice(1) : 'bin');
          
          const originalName = message.filename || message.caption || '';
          const fileName = originalName 
            ? `${path.parse(originalName).name}_${Date.now()}.${extension}`
            : `FGYA_${Date.now()}.${extension}`;

          const uploadsDir = path.join(__dirname, "..", "uploads");

          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const filePath = path.join(uploadsDir, fileName);
          
          fs.writeFileSync(filePath, buffer);
          console.log(`✅ Archivo guardado temporalmente: ${filePath} (${buffer.length} bytes)`);

          const link = await subirAGoogleDrive(filePath, fileName, mimeType);
          
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (unlinkErr) {
            console.warn("⚠️ No se pudo eliminar el archivo temporal:", unlinkErr.message);
          }

          const destinoArchivo = esGrupo ? grupoId : message.from;
          if (link) {
            await client.sendText(
              destinoArchivo,
              `📁 ✅ Tu archivo fue recibido y almacenado correctamente en la nube:\n\n🔗 ${link}\n\nNombre: ${fileName}`
            );
          } else {
            await client.sendText(
              destinoArchivo,
              "❌ Hubo un error al guardar tu archivo en Google Drive. Por favor, contacta con soporte técnico."
            );
          }

          const caption = (message.caption || '').trim();
          if (caption) {
            console.log(`💬 Procesando caption del archivo: ${caption.substring(0, 50)}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const resultadoTarea = taskManager.procesarMensaje(
                caption,
                message.from,
                null,
                true,
                {
                  nombre: fileName,
                  link: link,
                  tipo: mimeType
                }
              );

              if (resultadoTarea.necesitaTarea && resultadoTarea.tarea) {
                await enviarTareaAPowerAutomate(resultadoTarea.tarea);
                console.log(`✅ Tarea creada y enviada: ${resultadoTarea.tarea.id}`);
              }

              let clasificacion = { label: "Otros", confidence: 0, requiereTarea: false };
              try {
                clasificacion = await classifyIntent(caption);
                console.log(`🧭 Etiqueta del caption: ${clasificacion.label} (confianza: ${clasificacion.confidence})`);
              } catch (err) {
                console.error("⚠️ Error en clasificación del caption:", err.message);
              }

              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: `Eres el asistente virtual de ${empresaInfo.nombre} (${empresaInfo.marcaCorta}).

${empresaInfo.nombre} es una empresa especializada en:
${empresaInfo.sector}

Servicios principales:
${empresaInfo.servicios.map(s => `- ${s}`).join('\n')}

Información de contacto:
- Teléfono: ${empresaInfo.contacto}
- Horario: ${empresaInfo.horario}
- Sitio web: ${empresaInfo.sitioWeb}

Responde con un tono profesional, amable y claro. Si el usuario pregunta sobre servicios, cotizaciones o citas, proporciona información útil y orienta sobre cómo pueden contactar directamente.`,
                  },
                  { role: "user", content: caption },
                ],
                temperature: 0.7,
                max_tokens: 500,
              });

              const respuesta = completion.choices[0].message.content;
              console.log(`✅ Respuesta generada para caption: ${respuesta.substring(0, 50)}...`);
              
              const destinoRespuesta = esGrupo ? grupoId : message.from;
              await client.sendText(destinoRespuesta, respuesta);
              
              // 🔔 NOTIFICAR A ESPECIALISTAS sobre el caption del archivo
              if (clasificacion.requiereTarea || clasificacion.confidence > 0.5) {
                let nombreUsuario = null;
                try {
                  const contact = await client.getContact(message.from);
                  nombreUsuario = contact?.name || contact?.pushname || null;
                } catch (contactErr) {}
                
                // Buscar especialista asignado para notificar
                let especialistaAsignado = null;
                if (resultadoTarea) {
                  if (resultadoTarea.especialista) {
                    especialistaAsignado = resultadoTarea.especialista;
                  } else if (resultadoTarea.tarea && resultadoTarea.tarea.responsable) {
                    especialistaAsignado = {
                      id: resultadoTarea.tarea.responsable.id,
                      nombre: resultadoTarea.tarea.responsable.nombre,
                      telefono: resultadoTarea.tarea.responsable.telefono,
                      email: resultadoTarea.tarea.responsable.email
                    };
                  }
                }
                
                // Notificar a especialistas relevantes
                await notificarEspecialistasRelevantes(client, caption, message.from, nombreUsuario, especialistaAsignado);
              }
            } catch (captionErr) {
              console.error("⚠️ Error al procesar caption:", captionErr.message);
            }
          } else {
            const resultadoTarea = taskManager.procesarMensaje(
              `Archivo recibido: ${fileName}`,
              message.from,
              null,
              true,
              {
                nombre: fileName,
                link: link,
                tipo: mimeType
              }
            );

            if (resultadoTarea.necesitaTarea && resultadoTarea.tarea) {
              await enviarTareaAPowerAutomate(resultadoTarea.tarea);
            }
          }
        } catch (err) {
          console.error("⚠️ Error al descargar o subir archivo:", err);
          await client.sendText(
            message.from,
            `❌ No se pudo procesar tu archivo.\n\nError: ${err.message}\n\nPor favor, intenta enviarlo nuevamente o contacta con soporte.`
          );
        }
        return;
      }

      // 💬 Si el mensaje es texto
      const texto = (message.body || message.caption || '').trim();
      
      if (!texto) {
        console.log("⚠️ Mensaje vacío recibido");
        return;
      }

      console.log(`💬 Mensaje de texto recibido: ${texto.substring(0, 50)}...`);

      const userId = esGrupo ? (message.author || message.from) : message.from;
      const grupo = esGrupo ? groupManager.obtenerGrupoPorId(grupoId) : null;

      // 🔍 Verificar si el usuario está en un flujo de soporte activo
      const estaEnFlujoSoporte = userStates.has(userId);
      
      if (estaEnFlujoSoporte) {
        const procesado = await procesarFlujoSoporte(client, userId, texto, empresaInfo);
        if (procesado) {
          return;
        }
      }

      // 🚫 Verificar si es mensaje innecesario
      if (taskManager.esMensajeInnecesario(texto)) {
        console.log("🚫 Mensaje innecesario detectado, respondiendo brevemente sin crear tarea");
        await client.sendText(
          message.from,
          "¡Gracias! 😊 ¿En qué más puedo ayudarte?"
        );
        return;
      }

      // 📋 Procesar mensaje con sistema de gestión de tareas
      let nombreUsuario = null;
      try {
        const contact = await client.getContact(message.from);
        nombreUsuario = contact?.name || contact?.pushname || null;
      } catch (contactErr) {}
      
      let resultadoTarea = null;
      try {
        resultadoTarea = taskManager.procesarMensaje(
          texto,
          userId,
          nombreUsuario,
          false,
          null
        );

        console.log(`📋 Resultado procesamiento: ${resultadoTarea.razon}`);

        if (resultadoTarea.necesitaTarea && resultadoTarea.tarea) {
          const enviado = await enviarTareaAPowerAutomate(resultadoTarea.tarea);
          if (enviado) {
            console.log(`✅ Tarea creada y enviada a Microsoft Lists: ${resultadoTarea.tarea.id}`);
            console.log(`   Responsable: ${resultadoTarea.tarea.responsable.nombre}`);
            console.log(`   Tema: ${resultadoTarea.tarea.titulo}`);
          }
        }
      } catch (taskErr) {
        console.error("⚠️ Error al procesar mensaje con taskManager:", taskErr.message);
      }

      // 📋 Obtener información del especialista asignado
      let especialistaAsignado = null;
      if (resultadoTarea) {
        if (resultadoTarea.especialista) {
          especialistaAsignado = resultadoTarea.especialista;
        } else if (resultadoTarea.tarea && resultadoTarea.tarea.responsable) {
          especialistaAsignado = {
            id: resultadoTarea.tarea.responsable.id,
            nombre: resultadoTarea.tarea.responsable.nombre,
            telefono: resultadoTarea.tarea.responsable.telefono,
            email: resultadoTarea.tarea.responsable.email
          };
        } else if (resultadoTarea.grupo) {
          let especialistas = [];
          try {
            const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
            if (fs.existsSync(especialistasPath)) {
              const especialistasData = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
              especialistas = especialistasData.especialistas || [];
            }
          } catch (err) {
            console.error("⚠️ Error al cargar especialistas:", err.message);
          }
          
          especialistaAsignado = especialistas.find(e => e.id === resultadoTarea.grupo.especialistaId);
        }
        
        if (especialistaAsignado) {
          console.log(`👤 Especialista asignado: ${especialistaAsignado.nombre} (${resultadoTarea.grupo?.tema || resultadoTarea.tarea?.titulo || 'Tema'})`);
        }
      }

      // 🔔 NOTIFICAR A ESPECIALISTAS RELEVANTES (después de procesar el mensaje)
      try {
        // Solo notificar si el mensaje requiere acción
        let clasificacion = { label: "Otros", confidence: 0, requiereTarea: false };
        
        // Intentar clasificar el mensaje
        try {
          clasificacion = await classifyIntent(texto);
          console.log(`🧭 Etiqueta: ${clasificacion.label} (confianza: ${clasificacion.confidence}, requiereTarea: ${clasificacion.requiereTarea})`);
        } catch (err) {
          console.error("⚠️ Error en clasificación, continuando con respuesta estándar:", err.message);
          // Asegurar que clasificacion tenga valores por defecto
          clasificacion = { label: "Otros", confidence: 0, requiereTarea: false };
        }
        
        // Asegurarse de que clasificacion tiene las propiedades necesarias
        if (!clasificacion || typeof clasificacion !== 'object') {
          clasificacion = { label: "Otros", confidence: 0, requiereTarea: false };
        }
        
        // Notificar si requiere tarea o tiene alta confianza
        if ((clasificacion.requiereTarea || clasificacion.confidence > 0.5) || (resultadoTarea && resultadoTarea.necesitaTarea)) {
          console.log(`🔔 Notificando especialistas sobre mensaje importante...`);
          await notificarEspecialistasRelevantes(client, texto, userId, nombreUsuario, especialistaAsignado);
        }
      } catch (notifErr) {
        console.error("⚠️ Error al notificar especialistas:", notifErr.message);
      }

      // 🔍 DETECTAR ESPECIALISTA MENCIONADO
      const textoLowerContacto = texto.toLowerCase();
      let especialistaMencionado = null;
      
      try {
        const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
        if (fs.existsSync(especialistasPath)) {
          const especialistasData = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
          const especialistas = especialistasData.especialistas || [];
          
          console.log(`🔍 Buscando especialista mencionado en mensaje: "${texto}"`);
          
          for (const esp of especialistas) {
            if (esp.id === 'default') continue;
            
            const nombreLower = esp.nombre.toLowerCase().trim();
            if (textoLowerContacto.includes(nombreLower)) {
              especialistaMencionado = esp;
              console.log(`✅ Especialista mencionado detectado (coincidencia exacta): ${esp.nombre} (${esp.id})`);
              break;
            }
          }
          
          if (!especialistaMencionado) {
            const palabrasMensaje = textoLowerContacto.split(/\s+/).filter(p => p.length > 2);
            let mejorCoincidencia = null;
            let mejorPuntuacion = 0;
            
            for (const esp of especialistas) {
              if (esp.id === 'default') continue;
              
              const nombreLower = esp.nombre.toLowerCase();
              const nombrePalabras = nombreLower.split(/\s+/);
              let puntuacion = 0;
              
              for (const nombrePalabra of nombrePalabras) {
                if (palabrasMensaje.some(palabra => 
                  palabra.includes(nombrePalabra) || nombrePalabra.includes(palabra)
                )) {
                  puntuacion++;
                }
              }
              
              if (puntuacion === nombrePalabras.length && puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorCoincidencia = esp;
              }
            }
            
            if (mejorCoincidencia) {
              especialistaMencionado = mejorCoincidencia;
              console.log(`✅ Especialista encontrado por coincidencia parcial: ${especialistaMencionado.nombre} (${especialistaMencionado.id})`);
            }
          }
          
          if (!especialistaMencionado) {
            console.log(`⚠️ No se encontró especialista específico mencionado en el mensaje`);
          }
        }
      } catch (err) {
        console.error("⚠️ Error al buscar especialista mencionado:", err.message);
      }
      
      if (especialistaMencionado) {
        if (!especialistaAsignado || especialistaAsignado.id === 'default') {
          especialistaAsignado = especialistaMencionado;
          console.log(`✅ Especialista actualizado para respuesta: ${especialistaAsignado.nombre} (${especialistaAsignado.id})`);
        } else {
          console.log(`ℹ️ Especialista ya asignado (${especialistaAsignado.nombre}), manteniendo asignación`);
        }
      }

      // 🆘 Si la intención es Soporte o Ayuda, iniciar flujo de soporte
      const textoLower = texto.toLowerCase();
      const palabrasSoporte = ['soporte', 'ayuda', 'necesito ayuda', 'necesito soporte', 'problema', 'tengo un problema', 'asistencia'];
      const tienePalabraSoporte = palabrasSoporte.some(palabra => textoLower.includes(palabra));
      
      // IMPORTANTE: Asegurar que clasificacion esté definida antes de usarla
      let clasificacionFinal = { label: "Otros", confidence: 0, requiereTarea: false };
      try {
        clasificacionFinal = await classifyIntent(texto);
        console.log(`🧭 Clasificación final: ${clasificacionFinal.label} (confianza: ${clasificacionFinal.confidence})`);
      } catch (err) {
        console.error("⚠️ Error en clasificación final, usando valores por defecto:", err.message);
      }
      
      // Usar clasificacionFinal en lugar de una variable posiblemente no definida
      if ((clasificacionFinal.label === "Soporte" || clasificacionFinal.label === "Ayuda" || tienePalabraSoporte) && 
          (clasificacionFinal.confidence > 0.5 || tienePalabraSoporte)) {
        await iniciarFlujoSoporte(client, userId, empresaInfo);
        return;
      }

      // Generar respuesta con OpenAI
      let mensajeSistema = `Eres el asistente virtual de ${empresaInfo.nombre} (${empresaInfo.marcaCorta}).

${empresaInfo.nombre} es una empresa especializada en:
${empresaInfo.sector}

Servicios principales:
${empresaInfo.servicios.map(s => `- ${s}`).join('\n')}

Información de contacto:
- Teléfono: ${empresaInfo.contacto}
- Horario: ${empresaInfo.horario}
- Sitio web: ${empresaInfo.sitioWeb}`;

      if (especialistaAsignado) {
        const especialidadesTexto = especialistaAsignado.especialidades 
          ? especialistaAsignado.especialidades.slice(0, 3).join(', ') + (especialistaAsignado.especialidades.length > 3 ? '...' : '')
          : 'Consultas especializadas';
        
        mensajeSistema += `\n\n👤 *Información del especialista disponible:*
- Nombre: ${especialistaAsignado.nombre}
- Teléfono: ${especialistaAsignado.telefono}
- Email: ${especialistaAsignado.email}
- Especialidades: ${especialidadesTexto}

IMPORTANTE: Si el usuario menciona a ${especialistaAsignado.nombre} o quiere hablar con él/ella, confirma que ${especialistaAsignado.nombre} está disponible y puede ayudarle. Responde de manera positiva y profesional. Menciona que puede contactar directamente a ${especialistaAsignado.nombre} al ${especialistaAsignado.telefono} o ${especialistaAsignado.email}.`;
      } else {
        mensajeSistema += `\n\nResponde con un tono profesional, amable y claro. Si el usuario pregunta sobre servicios, cotizaciones o citas, proporciona información útil y orienta sobre cómo pueden contactar directamente.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: mensajeSistema,
          },
          { role: "user", content: texto },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      let respuesta = completion.choices[0].message.content;
      console.log(`✅ Respuesta generada: ${respuesta.substring(0, 50)}...`);
      
      // Agregar información del especialista al final de la respuesta si está asignado
      if (especialistaAsignado) {
        respuesta += `\n\n👤 *Información de contacto especializado:*
📞 ${especialistaAsignado.nombre}
📱 Teléfono: ${especialistaAsignado.telefono}
📧 Email: ${especialistaAsignado.email}

${resultadoTarea && resultadoTarea.necesitaTarea && resultadoTarea.tarea ? '✅ Tu solicitud ha sido registrada y se asignará al especialista indicado.' : '📋 Tu solicitud está siendo procesada. El especialista se pondrá en contacto contigo pronto.'}

💬 *¿Deseas que el especialista te contacte directamente?*
Escribe "contactar" o "quiero hablar con ${especialistaAsignado.nombre}" y te conectaremos.`;
      }
      
      const destinoRespuesta = esGrupo ? grupoId : message.from;
      await client.sendText(destinoRespuesta, respuesta);
      
      // 🔔 Detectar si el cliente quiere contactar con el especialista
      const textoLowerContacto2 = texto.toLowerCase();
      let quiereContactar = textoLowerContacto2.includes('contactar') || 
                             textoLowerContacto2.includes('quiero hablar') || 
                             textoLowerContacto2.includes('hablar con') ||
                             textoLowerContacto2.includes('conectar') ||
                             textoLowerContacto2.includes('necesito hablar') ||
                             textoLowerContacto2.includes('hablar');
      
      let especialistaParaContactar = especialistaAsignado || especialistaMencionado;
      
      if (especialistaParaContactar && !quiereContactar) {
        const nombreLower = especialistaParaContactar.nombre.toLowerCase();
        if (textoLowerContacto2.includes(nombreLower)) {
          quiereContactar = true;
          console.log(`✅ Especialista mencionado directamente, activando contacto: ${especialistaParaContactar.nombre}`);
        } else {
          const primerNombre = nombreLower.split(' ')[0];
          if (textoLowerContacto2.includes(primerNombre) && primerNombre.length > 3) {
            quiereContactar = true;
            console.log(`✅ Primer nombre del especialista mencionado, activando contacto: ${especialistaParaContactar.nombre}`);
          }
        }
      }
      
      if (quiereContactar && especialistaParaContactar) {
        console.log(`📞 Cliente quiere contactar con especialista: ${especialistaParaContactar.nombre}`);
        
        let datosCliente = {
          whatsappId: userId,
          nombre: nombreUsuario || 'Cliente',
          telefono: null,
          email: null,
          consulta: texto
        };
        
        try {
          const contact = await client.getContact(userId);
          if (contact) {
            datosCliente.nombre = contact.name || contact.pushname || datosCliente.nombre;
            datosCliente.telefono = contact.number || null;
          }
        } catch (contactErr) {
          console.warn("⚠️ No se pudo obtener información del contacto:", contactErr.message);
        }
        
        const resultado = await obtenerOcrearGrupoEspecialista(client, especialistaParaContactar.id, datosCliente, empresaInfo);
        
        if (resultado.success && resultado.inviteLink) {
          const mensajeLink = `✅ *Contacto con ${especialistaParaContactar.nombre}*\n\n` +
            `He encontrado el grupo de WhatsApp para *${especialistaParaContactar.nombre}*.\n\n` +
            `🔗 *Únete al grupo usando este link:*\n${resultado.inviteLink}\n\n` +
            `💬 Una vez que te unas, podrás comunicarte directamente con el especialista.\n\n` +
            `📋 *Información del especialista:*\n` +
            `👤 ${especialistaParaContactar.nombre}\n` +
            `📱 ${especialistaParaContactar.telefono}\n` +
            `📧 ${especialistaParaContactar.email}`;
          
          await client.sendText(message.from, mensajeLink);
          
          // NOTIFICACIÓN ESPECIAL al número de notificación
          try {
            const telefonoNotificacion = obtenerTelefonoNotificacion(especialistaParaContactar.id);
            if (telefonoNotificacion) {
              const notificacionGrupo = `🎯 *CLIENTE ESPERANDO EN GRUPO* 🎯\n\n` +
                `Un cliente se ha unido a tu grupo y está esperando tu respuesta:\n\n` +
                `👤 *Cliente:* ${datosCliente.nombre || 'Cliente'}\n` +
                `📱 WhatsApp: ${datosCliente.whatsappId}\n` +
                `📞 Teléfono: ${datosCliente.telefono || 'Mismo WhatsApp'}\n` +
                `💬 Consulta: "${datosCliente.consulta.substring(0, 150)}${datosCliente.consulta.length > 150 ? '...' : ''}"\n\n` +
                `📍 *Enlace del grupo:* ${resultado.inviteLink}\n\n` +
                `⏰ *Por favor:*\n` +
                `1. Ingresa al grupo\n` +
                `2. Saluda al cliente\n` +
                `3. Atiende su consulta\n\n` +
                `*Fecha:* ${new Date().toLocaleString('es-MX')}`;
              
              let numeroNotificacion = telefonoNotificacion;
              if (!numeroNotificacion.includes('@c.us')) {
                numeroNotificacion = numeroNotificacion.replace(/[^0-9]/g, '');
                numeroNotificacion = numeroNotificacion.includes('52') ? numeroNotificacion : `52${numeroNotificacion}`;
                numeroNotificacion = `${numeroNotificacion}@c.us`;
              }
              
              await client.sendText(numeroNotificacion, notificacionGrupo);
              console.log(`✅ Notificación de grupo enviada a ${numeroNotificacion}`);
            }
          } catch (notifErr) {
            console.warn("⚠️ No se pudo enviar notificación especial del grupo:", notifErr.message);
          }
          
        } else if (resultado.success && !resultado.inviteLink) {
          await client.sendText(
            message.from,
            `✅ *Grupo encontrado*\n\n` +
            `Existe un grupo para *${especialistaParaContactar.nombre}*, pero no se pudo generar el link de invitación.\n\n` +
            `Por favor, contacta directamente a:\n` +
            `📞 ${especialistaParaContactar.nombre}\n` +
            `📱 ${especialistaParaContactar.telefono}\n` +
            `📧 ${especialistaParaContactar.email}`
          );
        } else {
          await client.sendText(
            message.from,
            `⚠️ No se pudo acceder al grupo del especialista en este momento.\n\n` +
            `Por favor, contacta directamente a:\n` +
            `📞 ${especialistaParaContactar.nombre}\n` +
            `📱 ${especialistaParaContactar.telefono}\n` +
            `📧 ${especialistaParaContactar.email}`
          );
        }
      } else if (quiereContactar && !especialistaParaContactar) {
        await client.sendText(
          message.from,
          `⚠️ No pude identificar a qué especialista te refieres.\n\n` +
          `Por favor, menciona el nombre completo del especialista, por ejemplo:\n` +
          `"quiero hablar con Janeth Bautista"\n\n` +
          `O escribe sobre tu consulta y te asignaremos al especialista adecuado.`
        );
      }
    } catch (err) {
      console.error("❌ Error general en chatbot:", err);
      console.error("Stack trace:", err.stack);
      
      try {
        await client.sendText(
          message.from,
          "❌ Hubo un problema al procesar tu mensaje. Por favor, intenta nuevamente más tarde o contacta directamente al: " + (empresaInfo.contacto || "soporte")
        );
      } catch (sendErr) {
        console.error("❌ Error al enviar mensaje de error:", sendErr);
      }
    }
  });
};