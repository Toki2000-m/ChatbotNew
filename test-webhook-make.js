// ============================================
// 🧪 SCRIPT DE PRUEBA - Webhook Make → Google Sheets
// FGYA WhatsApp Bot
// ============================================
// Uso: node test-webhook-make.js
// ============================================

require("dotenv").config();
const axios = require("axios");

const WEBHOOK_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.error("❌ ERROR: POWER_AUTOMATE_WEBHOOK_URL no está en tu .env");
  console.error("   Asegúrate de tener la URL del webhook de Make en .env");
  process.exit(1);
}

console.log("╔════════════════════════════════════════════════════╗");
console.log("║   🧪 PRUEBAS DE WEBHOOK MAKE → GOOGLE SHEETS      ║");
console.log("╚════════════════════════════════════════════════════╝\n");
console.log(`🔗 Webhook URL: ${WEBHOOK_URL.substring(0, 50)}...\n`);

// ============================================
// PAYLOADS DE PRUEBA
// ============================================

const pruebas = [
  {
    nombre: "1. Soporte básico (flujo de soporte manual)",
    payload: {
      usuario: {
        nombre: "Juan Pérez (PRUEBA)",
        email: "juan.prueba@test.com",
        telefono: "3310000001",
        whatsapp: "523310000001@c.us",
        descripción: "Prueba: No puedo subir mis JSON al portal SAT"
      },
      timestamp: new Date().toISOString(),
      fuente: "WhatsApp Bot",
      tipo: "Solicitud de Soporte"
    }
  },
  {
    nombre: "2. Tarea automática (taskManager → Make)",
    payload: {
      tarea: {
        id: `tarea_TEST_${Date.now()}`,
        titulo: "Archivos XML/JSON SAT",
        descripcion: "Prueba: Cliente necesita ayuda con sus JSON rechazados en el SAT",
        responsable: {
          nombre: "Alberto Méndez",
          telefono: "3332250942",
          email: "alberto@fgya.com.mx"
        },
        vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        archivos: [],
        estatus: "Pendiente",
        tema: "XML/JSON SAT",
        prioridad: {
          nivel: "MEDIA",
          etiqueta: "📋 Normal",
          accion: "Atender en horario normal"
        }
      },
      usuario: {
        whatsapp: "523310000002@c.us",
        nombre: "María González (PRUEBA)"
      },
      timestamp: new Date().toISOString(),
      fuente: "WhatsApp Bot",
      tipo: "Tarea"
    }
  },
  {
    nombre: "3. Tarea URGENTE (alta prioridad)",
    payload: {
      tarea: {
        id: `tarea_URGENTE_${Date.now()}`,
        titulo: "SASISOPA - Permiso urgente",
        descripcion: "Prueba: URGENTE - Cliente tiene auditoría mañana y necesita carpeta SASISOPA",
        responsable: {
          nombre: "Janeth Silva",
          telefono: "3321571469",
          email: "janeth.silva@fgya.com.mx"
        },
        vencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        archivos: [],
        estatus: "Pendiente Urgente",
        tema: "SASISOPA",
        prioridad: {
          nivel: "ALTA",
          etiqueta: "🔴 Urgente",
          accion: "Atender inmediatamente"
        }
      },
      usuario: {
        whatsapp: "523310000003@c.us",
        nombre: "Carlos Ramírez (PRUEBA URGENTE)"
      },
      timestamp: new Date().toISOString(),
      fuente: "WhatsApp Bot",
      tipo: "Tarea"
    }
  }
];

// ============================================
// EJECUTAR PRUEBAS
// ============================================

async function ejecutarPrueba(prueba) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🧪 ${prueba.nombre}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log("📤 Enviando payload:\n", JSON.stringify(prueba.payload, null, 2));

  try {
    const respuesta = await axios.post(WEBHOOK_URL, prueba.payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    });

    console.log(`\n✅ ÉXITO - Status: ${respuesta.status}`);
    if (respuesta.data) {
      console.log("📥 Respuesta:", JSON.stringify(respuesta.data, null, 2));
    }
    console.log("\n👉 Revisa tu Google Sheet - debe aparecer una fila nueva\n");
    return true;

  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`);

    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(`   Respuesta: ${JSON.stringify(err.response.data)}`);
    } else if (err.code === "ECONNABORTED") {
      console.error("   ⏱️ Timeout - Make tardó más de 15s en responder");
      console.error("   Verifica que el escenario de Make esté ACTIVO (no pausado)");
    } else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      console.error("   🌐 No se pudo conectar - Verifica la URL del webhook");
    }

    console.log("");
    return false;
  }
}

async function main() {
  let exitosos = 0;

  for (const prueba of pruebas) {
    const ok = await ejecutarPrueba(prueba);
    if (ok) exitosos++;
    // Pausa entre pruebas para no saturar Make
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║                 📊 RESULTADOS                      ║");
  console.log("╚════════════════════════════════════════════════════╝\n");
  console.log(`✅ Exitosos: ${exitosos}/${pruebas.length}`);
  console.log(`❌ Fallidos: ${pruebas.length - exitosos}/${pruebas.length}\n`);

  if (exitosos === pruebas.length) {
    console.log("🎉 Todo funciona. Revisa tu Google Sheet para ver las 3 filas nuevas.");
  } else {
    console.log("⚠️  Algunos envíos fallaron. Revisa:");
    console.log("   1. Que el escenario de Make esté ACTIVO (no pausado)");
    console.log("   2. Que POWER_AUTOMATE_WEBHOOK_URL en .env sea correcto");
    console.log("   3. Que el módulo de Google Sheets en Make esté configurado");
  }
}

main();