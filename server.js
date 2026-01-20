require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { create } = require('@open-wa/wa-automate');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ⚙️ Información de la empresa
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
// 🛠️ FUNCIÓN PARA LIMPIAR SESIONES
// ============================================

function limpiarSesiones() {
  console.log('🧹 Limpiando sesiones anteriores...');
  
  // Carpetas a eliminar
  const carpetas = [
    '_IGNORE_FGYA-Bot',
    '.wwebjs_auth',
    path.join(__dirname, '_IGNORE_FGYA-Bot'),
    path.join(__dirname, '.wwebjs_auth')
  ];
  
  // Archivos a eliminar
  const archivos = [
    'FGYA-Bot.data.json',
    path.join(__dirname, 'FGYA-Bot.data.json'),
    'session.json',
    path.join(__dirname, 'session.json')
  ];
  
  let eliminados = 0;
  
  // Eliminar carpetas
  carpetas.forEach(carpeta => {
    if (fs.existsSync(carpeta)) {
      try {
        fs.rmSync(carpeta, { recursive: true, force: true });
        console.log(`✅ Eliminada carpeta: ${carpeta}`);
        eliminados++;
      } catch (err) {
        console.warn(`⚠️ No se pudo eliminar ${carpeta}:`, err.message);
      }
    }
  });
  
  // Eliminar archivos
  archivos.forEach(archivo => {
    if (fs.existsSync(archivo)) {
      try {
        fs.unlinkSync(archivo);
        console.log(`✅ Eliminado archivo: ${archivo}`);
        eliminados++;
      } catch (err) {
        console.warn(`⚠️ No se pudo eliminar ${archivo}:`, err.message);
      }
    }
  });
  
  if (eliminados > 0) {
    console.log(`✅ Total eliminado: ${eliminados} elementos`);
  } else {
    console.log('✅ No se encontraron sesiones antiguas');
  }
}

// ============================================
// 🚀 INICIAR WHATSAPP (SIN CHROME VISIBLE)
// ============================================

async function iniciarWhatsApp() {
  try {
    console.log('🚀 Iniciando WhatsApp Bot FGYA...');
    
    // Limpiar sesiones antes de iniciar (IMPORTANTE)
    limpiarSesiones();
    
    // CONFIGURACIÓN QUE SOLUCIONA EL TIMEOUT
    const launchConfig = {
      sessionId: 'FGYA-Bot',
      multiDevice: true,
      headless: true, // Sin ventana de Chrome
      qrTimeout: 60, // 60 segundos para QR
      authTimeout: 60, // 60 segundos para autenticación
      skipOwnMessages: false,
      logConsole: false,
      debug: false,
      cacheEnabled: false,
      useChrome: false, // No usar Chrome del sistema
      killProcessOnBrowserClose: true,
      restartOnCrash: true,
      throwErrorOnTosBlock: false,
      disableSpins: false,
      
      // Argumentos mínimos para evitar problemas
      chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote'
      ],
      
      // Callback para el QR
      onQr: (qr) => {
        console.log('\n=========================================');
        console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
        console.log('=========================================\n');
        
        // Mostrar QR en terminal si hay qrcode-terminal
        try {
          const qrcode = require('qrcode-terminal');
          qrcode.generate(qr, { small: true });
        } catch (err) {
          console.log('⚠️ Para ver el QR en terminal, instala: npm install qrcode-terminal');
          console.log('🔗 También puedes abrir esta URL en tu navegador:');
          console.log(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`);
        }
        
        console.log('\n⏰ Tienes 60 segundos para escanear...');
      },
      
      onLoadingScreen: (percent) => {
        console.log(`📱 Cargando WhatsApp: ${percent}%`);
      },
      
      onAuthentication: () => {
        console.log('✅ Autenticación exitosa! WhatsApp conectado.');
      }
    };
    
    console.log('⚙️ Configuración cargada. Iniciando conexión...');
    
    // Crear cliente
    const client = await create(launchConfig);
    
    console.log('🎉 WhatsApp conectado exitosamente!');
    
    // Manejar cambios de estado
    client.onStateChanged((state) => {
      console.log(`📱 Estado: ${state}`);
      
      switch(state) {
        case 'CONNECTED':
          console.log('✅ Conectado y listo para recibir mensajes');
          break;
        case 'CONFLICT':
          console.log('⚠️ Conflicto detectado, forzando refocus...');
          client.forceRefocus();
          break;
        case 'UNPAIRED':
          console.log('🔓 Necesitas escanear QR nuevamente');
          break;
        case 'DISCONNECTED':
          console.log('❌ Desconectado');
          break;
      }
    });
    
    // Iniciar el chatbot
    console.log('🤖 Iniciando sistema de chatbot...');
    require('./routes/chatbot')(client, empresaInfo);
    
    return client;
    
  } catch (error) {
    console.error('\n❌ ERROR al iniciar WhatsApp:', error.message);
    
    // Análisis específico para timeout
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      console.log('\n🔍 DIAGNÓSTICO: Timeout al conectar con WhatsApp Web');
      console.log('🔧 SOLUCIONES RECOMENDADAS:');
      console.log('1. Verifica tu conexión a internet');
      console.log('2. Intenta con estos cambios en la configuración:');
      console.log('   - Cambia headless: true a headless: false (temporalmente)');
      console.log('   - Aumenta qrTimeout y authTimeout a 120');
      console.log('3. Elimina manualmente la carpeta: _IGNORE_FGYA-Bot');
      console.log('4. Espera 5 minutos y vuelve a intentar');
    }
    
    // Reintentar en 30 segundos
    console.log('\n🔄 Reintentando en 30 segundos...');
    setTimeout(() => {
      console.log('🔄 Reiniciando WhatsApp...');
      iniciarWhatsApp();
    }, 30000);
    
    return null;
  }
}

// ============================================
// 📡 INICIAR SERVIDOR EXPRESS
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor FGYA corriendo en http://localhost:${PORT}`);
  console.log(`📅 ${new Date().toLocaleString()}`);
});

// Ruta de estado
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    service: 'FGYA WhatsApp Bot',
    version: '1.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Ruta para forzar limpieza
app.get('/clean', (req, res) => {
  limpiarSesiones();
  res.json({ message: 'Limpieza realizada', timestamp: new Date().toISOString() });
});

// Iniciar WhatsApp
iniciarWhatsApp();

// Manejo de errores globales
process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
});

// Manejar cierre limpio
process.on('SIGINT', () => {
  console.log('\n👋 Apagando servidor FGYA...');
  process.exit(0);
});