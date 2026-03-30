// ============================================
// 🧪 SCRIPT PARA PROBAR EL WEBHOOK DE POWER AUTOMATE
// ============================================
// Este script te permite validar si el webhook está funcionando

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

console.log("🧪 PROBANDO WEBHOOK DE POWER AUTOMATE\n");
console.log("=".repeat(60));

// Leer el webhook del .env
const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;

if (!webhookUrl) {
  console.error("❌ ERROR: No se encontró POWER_AUTOMATE_WEBHOOK_URL en .env");
  process.exit(1);
}

console.log("✅ Webhook encontrado:");
console.log(`   ${webhookUrl.substring(0, 50)}...`);
console.log("");

// Crear una tarea de prueba
const tareaPrueba = {
  tarea: {
    id: `prueba_${Date.now()}`,
    titulo: "🧪 TAREA DE PRUEBA - VALIDACIÓN",
    descripcion: "Esta es una tarea de prueba para validar que el webhook funciona correctamente",
    responsable: {
      nombre: "Equipo de Prueba",
      telefono: "(33) 1234-5678",
      email: "prueba@test.com"
    },
    vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    archivos: [],
    estatus: "Pendiente - PRUEBA",
    tema: "Validación de Sistema"
  },
  usuario: {
    whatsapp: "521234567890@c.us",
    nombre: "Usuario de Prueba"
  },
  timestamp: new Date().toISOString(),
  fuente: "Script de Validación",
  tipo: "Tarea de Prueba"
};

console.log("📤 Enviando tarea de prueba...\n");
console.log("Datos enviados:");
console.log(JSON.stringify(tareaPrueba, null, 2));
console.log("\n" + "=".repeat(60) + "\n");

// Enviar la tarea
async function probarWebhook() {
  try {
    const response = await axios.post(webhookUrl, tareaPrueba, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log("✅ ¡ÉXITO! El webhook respondió correctamente\n");
    console.log("📊 Detalles de la respuesta:");
    console.log(`   Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`   Tarea ID: ${tareaPrueba.tarea.id}`);
    console.log("");

    // Guardar log del resultado
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const resultadoPath = path.join(logsDir, `test-webhook-${Date.now()}.json`);
    const resultado = {
      timestamp: new Date().toISOString(),
      timestampLocal: new Date().toLocaleString('es-MX'),
      webhookUrl: webhookUrl.substring(0, 50) + "...",
      tareaEnviada: tareaPrueba,
      respuesta: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      }
    };

    fs.writeFileSync(resultadoPath, JSON.stringify(resultado, null, 2));
    console.log(`📝 Resultado guardado en: ${resultadoPath}\n`);

    console.log("=".repeat(60));
    console.log("\n🎯 CONCLUSIÓN:\n");
    console.log("✅ El webhook SÍ está funcionando");
    console.log("✅ La tarea fue enviada correctamente");
    console.log("✅ Power Automate la recibió (Status 202 = Aceptado)\n");
    
    console.log("📋 SIGUIENTE PASO:");
    console.log("   Ahora necesitas que alguien con acceso a Microsoft Lists");
    console.log("   te confirme que la tarea apareció en la lista.\n");
    console.log("   Busca esta tarea:");
    console.log(`   ID: ${tareaPrueba.tarea.id}`);
    console.log(`   Título: ${tareaPrueba.tarea.titulo}`);
    console.log("");

  } catch (err) {
    console.error("❌ ERROR al enviar al webhook:\n");
    console.error(`   Mensaje: ${err.message}`);
    
    if (err.response) {
      console.error(`\n📊 Respuesta del servidor:`);
      console.error(`   Status: ${err.response.status} ${err.response.statusText}`);
      console.error(`   Data:`, err.response.data);
    }

    if (err.code === 'ECONNABORTED') {
      console.error("\n⏱️  El webhook tardó mucho en responder (timeout)");
      console.error("   Esto puede significar que el URL no es válido");
    }

    // Guardar log del error
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const errorPath = path.join(logsDir, `test-webhook-ERROR-${Date.now()}.json`);
    const errorLog = {
      timestamp: new Date().toISOString(),
      timestampLocal: new Date().toLocaleString('es-MX'),
      webhookUrl: webhookUrl.substring(0, 50) + "...",
      error: {
        message: err.message,
        code: err.code,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : null
      }
    };

    fs.writeFileSync(errorPath, JSON.stringify(errorLog, null, 2));
    console.error(`\n📝 Error guardado en: ${errorPath}\n`);
  }
}

probarWebhook();
