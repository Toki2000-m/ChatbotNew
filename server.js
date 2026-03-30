require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ⚙️ Información de la empresa (sin cambios)
const empresaInfo = {
  nombre: "Figueroa González y Asociados, S.C. (FGYA)",
  marcaCorta: "FGYA",
  certificaciones: ["ISO 9001:2015"],
  servicios: [
    "Unidades de Inspección (NOM-005-ASEA-2016, NOM-016-CRE-2016, Controles Volumétricos)",
    "Certificación de Controles Volumétricos (Anexo 30/31/32)",
    "Auditorías (incluye SASISOPA y auditorías externas)",
    "Laboratorio de Ensayo (p. ej. Recuperación de Vapores NOM-004-ASEA-2017)",
    "Laboratorio de Calibración (sondas de nivel/temperatura, medidas volumétricas 20L)",
    "Integridad mecánica de tanques y pruebas de hermeticidad",
    "SASISOPA Comercial e Industrial",
    "Sistemas de Gestión de Mediciones",
    "Calibración / Cubicación de Tanques",
    "Estudios de Tierras Físicas y Pararrayos"
  ],
  serviciosEspecializados: [
    "Consultoría especializada en hidrocarburos",
    "Gestión de permisos para gasolineras y estaciones de servicio",
    "Análisis y comparación de precios de combustibles",
    "Documentación regulatoria energética",
    "Asesoría legal para el sector petrolero",
    "Estudios de mercado de combustibles",
    "Gestión de licencias de distribución",
    "Consultoría en eficiencia energética",
  ],
  nuestrasEspecialidades: [
    "Permisos PL / (Pemex Lubricantes)",
    "Regulación CRE (Comisión Reguladora de Energía)",
    "Normativas SENER (Secretaría de Energía)",
    "Precios de gasolina y diésel",
    "Análisis de mercado de combustibles",
    "Documentación para importación/exportación de hidrocarburos",
  ],
  sector: "Hidrocarburos (inspección, ensayos, auditoría, calibración, certificación e integridad mecánica)",
  horario: "Lunes a Viernes de 9:00 am a 6:00 pm",
  contacto: "(33) 3407 0123 | alex@fgya.com.mx",
  direccion: "Zapopan, Jalisco",
  sitioWeb: "https://fgya.com.mx/"
};

// ============================================
// 🔧 WRAPPER DE COMPATIBILIDAD
// ============================================
function crearClienteCompatible(wwejsClient) {
  return {

    sendText: async (to, text) => {
      return await wwejsClient.sendMessage(to, text);
    },

    onMessage: (callback) => {
      wwejsClient.on('message', async (msg) => {

        // ⛔ Filtro 1: ignorar mensajes de estados/historias
        // Los estados llegan con from terminado en @broadcast o status@broadcast
        if (msg.from === 'status@broadcast') return;
        if (msg.from && msg.from.includes('@broadcast')) return;

        // ⛔ Filtro 2: ignorar mensajes históricos (más de 30 segundos)
        const ahora = Math.floor(Date.now() / 1000);
        if (ahora - msg.timestamp > 30) return;

        // ⛔ Filtro 3: ignorar tipos que no son mensajes reales
        const tiposIgnorar = ['e2e_notification', 'notification_template', 'call_log', 'protocol'];
        if (tiposIgnorar.includes(msg.type)) return;

        try {
          const chat = await msg.getChat();

          // Adaptar mensaje al formato @open-wa que espera tu chatbot.js
          const mensajeAdaptado = {
            body: msg.body || '',
            caption: msg.body || '',
            from: msg.from,
            fromMe: msg.fromMe,
            type: msg.type,
            id: msg.id._serialized || msg.id,
            timestamp: msg.timestamp,

            // Grupos
            isGroupMsg: chat.isGroup || false,
            chatId: msg.from,
            author: msg.author || msg.from,
            chat: { isGroup: chat.isGroup },

            // Archivos — hasMedia es el flag correcto en wwejs
            hasMedia: msg.hasMedia,
            isMedia: msg.hasMedia,
            mimetype: msg.hasMedia ? (msg._data?.mimetype || null) : null,
            filename: msg.hasMedia ? (msg._data?.filename || null) : null,
            mediaType: msg.hasMedia ? msg.type : null,

            // ✅ Guardamos referencia al msg original para poder descargar
            _originalMsg: msg,
          };

          await callback(mensajeAdaptado);
        } catch (err) {
          console.error('⚠️ Error adaptando mensaje:', err.message);
        }
      });
    },

    // ✅ FIX: ahora usa _originalMsg para descargar correctamente
    decryptMedia: async (message) => {
      const originalMsg = message._originalMsg;
      if (!originalMsg) throw new Error('Mensaje sin referencia original');
      const media = await originalMsg.downloadMedia();
      if (!media || !media.data) throw new Error('No se pudo descargar el archivo');
      // Devolver Buffer igual que @open-wa
      return Buffer.from(media.data, 'base64');
    },

    downloadMedia: async (messageId) => {
      throw new Error('Usa decryptMedia en su lugar');
    },

    getContact: async (id) => {
      try {
        const contact = await wwejsClient.getContactById(id);
        return {
          name: contact.name || contact.pushname || null,
          pushname: contact.pushname || null,
          number: contact.number || null,
          id: { _serialized: id }
        };
      } catch (err) {
        return null;
      }
    },

    getChatById: async (id) => {
      try {
        const chat = await wwejsClient.getChatById(id);
        return {
          name: chat.name || null,
          description: chat.description || null,
          isGroup: chat.isGroup || false,
          id: { _serialized: id },
          groupMetadata: chat.groupMetadata || null
        };
      } catch (err) {
        return null;
      }
    },

    getAllChats: async () => {
      try {
        const chats = await wwejsClient.getChats();
        return chats.map(c => ({
          id: { _serialized: c.id._serialized },
          name: c.name || null,
          isGroup: c.isGroup || false
        }));
      } catch (err) {
        return [];
      }
    },

    onStateChanged: (callback) => {
      wwejsClient.on('change_state', callback);
    },

    forceRefocus: () => {
      console.log('ℹ️ forceRefocus ignorado (no disponible en whatsapp-web.js)');
    },

    _wwejsClient: wwejsClient
  };
}

// ============================================
// 🚀 INICIAR WHATSAPP
// ============================================
async function iniciarWhatsApp() {
  try {
    console.log('🚀 Iniciando WhatsApp Bot FGYA...');

    const wwejsClient = new Client({
      authStrategy: new LocalAuth({ clientId: 'FGYA-Bot' }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote'
        ]
      }
    });

    wwejsClient.on('qr', (qr) => {
      console.log('\n=========================================');
      console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
      console.log('=========================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n⏰ Tienes tiempo para escanear...');
    });

    wwejsClient.on('authenticated', () => {
      console.log('✅ Autenticación exitosa! Sesión guardada.');
    });

    wwejsClient.on('auth_failure', (msg) => {
      console.error('❌ Error de autenticación:', msg);
      setTimeout(() => iniciarWhatsApp(), 30000);
    });

    wwejsClient.on('ready', () => {
      console.log('🎉 WhatsApp conectado exitosamente!');

      const client = crearClienteCompatible(wwejsClient);

      client.onStateChanged((state) => {
        console.log(`📱 Estado: ${state}`);
        if (state === 'CONFLICT') client.forceRefocus();
      });

      console.log('🤖 Iniciando sistema de chatbot...');
      require('./routes/chatbot')(client, empresaInfo);
    });

    wwejsClient.on('disconnected', (reason) => {
      console.log('❌ Desconectado:', reason);
      console.log('🔄 Reintentando en 30 segundos...');
      setTimeout(() => iniciarWhatsApp(), 30000);
    });

    console.log('⚙️ Configuración cargada. Iniciando conexión...');
    await wwejsClient.initialize();

    return wwejsClient;

  } catch (error) {
    console.error('\n❌ ERROR al iniciar WhatsApp:', error.message);
    console.log('\n🔄 Reintentando en 30 segundos...');
    setTimeout(() => iniciarWhatsApp(), 30000);
    return null;
  }
}

// ============================================
// 📡 SERVIDOR EXPRESS (sin cambios)
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor FGYA corriendo en http://localhost:${PORT}`);
  console.log(`📅 ${new Date().toLocaleString()}`);
});

app.get('/status', (req, res) => {
  res.json({ status: 'running', service: 'FGYA WhatsApp Bot', version: '2.0', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/clean', (req, res) => {
  res.json({ message: 'Limpieza no necesaria con whatsapp-web.js', timestamp: new Date().toISOString() });
});

iniciarWhatsApp();

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
});

process.on('SIGINT', () => {
  console.log('\n👋 Apagando servidor FGYA...');
  process.exit(0);
});