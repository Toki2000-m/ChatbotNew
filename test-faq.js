/**
 * Script de Pruebas - Sistema FAQ
 * 
 * Este script prueba todas las funcionalidades del sistema FAQ
 * sin necesidad de conectar WhatsApp
 */

const FAQHandler = require('./utils/faqHandler');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, emoji, mensaje) {
  console.log(`${color}${emoji} ${mensaje}${colors.reset}`);
}

// Inicializar FAQ Handler
const faqHandler = new FAQHandler();

console.log('\n' + '='.repeat(60));
console.log('🧪 PRUEBAS DEL SISTEMA FAQ - FGYA');
console.log('='.repeat(60) + '\n');

// ============================================
// CASOS DE PRUEBA
// ============================================
const casos = [
  // Casos que DEBEN usar FAQ
  {
    nombre: "Pregunta sobre horarios",
    mensaje: "Cuál es su horario de atención?",
    debeUsarFAQ: true,
    faqEsperado: 'horarios'
  },
  {
    nombre: "Pregunta sobre servicios",
    mensaje: "Que servicios ofrecen",
    debeUsarFAQ: true,
    faqEsperado: 'servicios_info'
  },
  {
    nombre: "Saludo simple",
    mensaje: "Hola buenas tardes",
    debeUsarFAQ: true,
    faqEsperado: 'saludos'
  },
  {
    nombre: "Pregunta sobre ubicación",
    mensaje: "Donde están ubicados",
    debeUsarFAQ: true,
    faqEsperado: 'ubicacion'
  },
  {
    nombre: "Pregunta sobre contacto",
    mensaje: "Cual es su teléfono",
    debeUsarFAQ: true,
    faqEsperado: 'contacto'
  },
  {
    nombre: "Pregunta sobre empresa",
    mensaje: "Me pueden explicar que es FGYA",
    debeUsarFAQ: true,
    faqEsperado: 'informacion_empresa'
  },
  {
    nombre: "Pregunta sobre costos",
    mensaje: "Cuanto cuesta una auditoría",
    debeUsarFAQ: true,
    faqEsperado: 'cotizaciones_info'
  },

  // Casos que NO DEBEN usar FAQ (deben usar IA)
  {
    nombre: "Solicitud urgente",
    mensaje: "Necesito una auditoría urgente",
    debeUsarFAQ: false,
    razonEsperada: 'urgencia'
  },
  {
    nombre: "Solicitud con 'necesito'",
    mensaje: "Necesito una factura",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Solicitud con 'requiero'",
    mensaje: "Requiero recuperación de cuenta ASEA",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Solicitud con 'apoyo'",
    mensaje: "Necesito apoyo con el portal de ASEA",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Quiere hablar con especialista",
    mensaje: "Quiero hablar con Janeth Bautista",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Solicitud de cotización específica",
    mensaje: "Necesito cotización para SASISOPA",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Pregunta con acción implícita",
    mensaje: "Quiero hacer una cotización",
    debeUsarFAQ: false,
    razonEsperada: 'accion'
  },
  {
    nombre: "Mensaje con 'ya'",
    mensaje: "Ya está la fecha límite para cargar archivo",
    debeUsarFAQ: false,
    razonEsperada: 'urgencia'
  }
];

// ============================================
// EJECUTAR PRUEBAS
// ============================================
let pasadas = 0;
let fallidas = 0;

casos.forEach((caso, index) => {
  console.log(`\n${'─'.repeat(60)}`);
  log(colors.blue, '📝', `Caso ${index + 1}: ${caso.nombre}`);
  log(colors.cyan, '💬', `Mensaje: "${caso.mensaje}"`);
  
  const resultado = faqHandler.procesarMensaje(caso.mensaje);
  
  // Verificar si el resultado coincide con lo esperado
  let exito = false;
  
  if (caso.debeUsarFAQ) {
    // Debe usar FAQ
    if (resultado.esRespuestaAutomatica) {
      if (caso.faqEsperado && resultado.faqId === caso.faqEsperado) {
        log(colors.green, '✅', `PASÓ: FAQ activada correctamente (${resultado.faqNombre})`);
        exito = true;
      } else if (!caso.faqEsperado) {
        log(colors.green, '✅', `PASÓ: FAQ activada (${resultado.faqNombre})`);
        exito = true;
      } else {
        log(colors.red, '❌', `FALLÓ: FAQ incorrecta. Esperado: ${caso.faqEsperado}, Obtenido: ${resultado.faqId}`);
      }
      
      // Mostrar preview de la respuesta
      if (resultado.respuesta) {
        const preview = resultado.respuesta.substring(0, 100).replace(/\n/g, ' ');
        log(colors.yellow, '📄', `Preview: ${preview}...`);
      }
    } else {
      log(colors.red, '❌', `FALLÓ: No usó FAQ. Razón: ${resultado.razon}`);
    }
  } else {
    // NO debe usar FAQ (debe usar IA)
    if (!resultado.esRespuestaAutomatica) {
      if (caso.razonEsperada && resultado.razon === caso.razonEsperada) {
        log(colors.green, '✅', `PASÓ: FAQ bloqueada correctamente (razón: ${resultado.razon})`);
        exito = true;
      } else if (!caso.razonEsperada) {
        log(colors.green, '✅', `PASÓ: FAQ bloqueada (razón: ${resultado.razon})`);
        exito = true;
      } else {
        log(colors.red, '❌', `FALLÓ: Razón incorrecta. Esperado: ${caso.razonEsperada}, Obtenido: ${resultado.razon}`);
      }
    } else {
      log(colors.red, '❌', `FALLÓ: Usó FAQ cuando NO debía (${resultado.faqNombre})`);
    }
  }
  
  if (exito) {
    pasadas++;
  } else {
    fallidas++;
  }
});

// ============================================
// RESUMEN DE RESULTADOS
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE PRUEBAS');
console.log('='.repeat(60));
console.log(`Total de casos: ${casos.length}`);
log(colors.green, '✅', `Pasadas: ${pasadas}`);
log(colors.red, '❌', `Fallidas: ${fallidas}`);
console.log(`Porcentaje de éxito: ${((pasadas / casos.length) * 100).toFixed(1)}%`);

if (fallidas === 0) {
  log(colors.green, '🎉', '¡TODAS LAS PRUEBAS PASARON!');
} else {
  log(colors.yellow, '⚠️', 'Algunas pruebas fallaron. Revisa los casos arriba.');
}

console.log('\n' + '='.repeat(60) + '\n');

// ============================================
// ESTIMACIÓN DE AHORROS
// ============================================
console.log('💰 ESTIMACIÓN DE AHORROS\n');

const costoPorMensajeIA = 0.003; // ~$0.003 USD por mensaje con gpt-4o-mini
const mensajesFAQPorDia = 50; // Estimado conservador
const diasPorMes = 30;

const mensajesFAQPorMes = mensajesFAQPorDia * diasPorMes;
const ahorroMensual = mensajesFAQPorMes * costoPorMensajeIA;
const ahorroAnual = ahorroMensual * 12;

console.log(`Si respondes ${mensajesFAQPorDia} preguntas FAQ por día:`);
console.log(`• Mensajes FAQ por mes: ${mensajesFAQPorMes}`);
console.log(`• Ahorro mensual: $${ahorroMensual.toFixed(2)} USD`);
console.log(`• Ahorro anual: $${ahorroAnual.toFixed(2)} USD`);
console.log(`• Reducción de llamadas a OpenAI: ~${((pasadas / casos.length) * 100).toFixed(0)}%`);

console.log('\n' + '='.repeat(60) + '\n');
