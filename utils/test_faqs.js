/**
 * SCRIPT DE PRUEBA - Sistema de FAQs FGYA
 * 
 * Prueba los casos reales del análisis de conversaciones
 */

const FAQManager = require('./faqManager');

// ============================================
// MENSAJES DE PRUEBA (DE CONVERSACIONES REALES)
// ============================================
const mensajesPrueba = [
    // FAQs Técnicas (de análisis real)
    {
        tipo: 'tecnica',
        mensaje: 'Hola, Nancy me pidió el Anexo 1 del permiso pero no sé qué es ni dónde conseguirlo',
        esperado: 'FAQ: anexo_1_permiso'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Necesito la NOM-016 o los informes de calidad? No entiendo si necesito ambos',
        esperado: 'FAQ: nom016_vs_informes'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Mi contador me pide los datos para el formato para poder subir los JSON al SAT, como lo hago?',
        esperado: 'FAQ: subir_json_sat'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Tengo una duda al subir la información en el portal OPE del transporte, lo recibido y lo entregado debe ser lo mismo?',
        esperado: 'FAQ: portal_ope'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Todos mis JSON de transportes están rechazados, que hago?',
        esperado: 'FAQ: json_rechazado'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Donde está mi carpeta SASISOPA? Ya tiene como 25 días',
        esperado: 'FAQ: rastreo_sasisopa'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Que me falta para completar el tramite?',
        esperado: 'FAQ: documentos_faltantes'
    },
    {
        tipo: 'tecnica',
        mensaje: 'No tengo los Dictámenes SCT porque no se realizaron, que hago?',
        esperado: 'FAQ: no_tengo_documento'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Para que necesitan las cartas porte?',
        esperado: 'FAQ: para_que_cartas_porte'
    },
    {
        tipo: 'tecnica',
        mensaje: 'Cuando estarán listos mis JSON del 2023 al 2025?',
        esperado: 'FAQ: tiempos_entrega'
    },

    // FAQs Generales
    {
        tipo: 'general',
        mensaje: 'Hola, que horarios tienen?',
        esperado: 'FAQ: horarios'
    },
    {
        tipo: 'general',
        mensaje: 'Donde están ubicados?',
        esperado: 'FAQ: ubicacion'
    },
    {
        tipo: 'general',
        mensaje: 'Que servicios ofrecen?',
        esperado: 'FAQ: servicios_info'
    },

    // Casos que deben ir a IA
    {
        tipo: 'ia',
        mensaje: 'URGENTE: Necesito hablar con Nancy Mercado ahora mismo',
        esperado: 'IA (urgencia detectada)'
    },
    {
        tipo: 'ia',
        mensaje: 'Necesito cotización para calibración de tanques en Guadalajara',
        esperado: 'IA (solicitud específica)'
    },
    {
        tipo: 'ia',
        mensaje: 'Llevo 8 días sin respuesta sobre mis JSON rechazados, nadie me ha respondido',
        esperado: 'IA (escalamiento requerido)'
    }
];

// ============================================
// EJECUTAR PRUEBAS
// ============================================
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║       🧪 PRUEBAS - SISTEMA DE FAQs FGYA              ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

const faqManager = new FAQManager();

console.log("🚀 Iniciando pruebas con mensajes reales del análisis...\n");

let aciertos = 0;
let totalPruebas = 0;

mensajesPrueba.forEach((prueba, index) => {
    totalPruebas++;
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`PRUEBA ${index + 1}/${mensajesPrueba.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Mensaje: "${prueba.mensaje}"`);
    console.log(`Esperado: ${prueba.esperado}\n`);

    const resultado = faqManager.procesarMensaje(prueba.mensaje);

    if (prueba.tipo === 'ia' && resultado.usarIA) {
        console.log("✅ CORRECTO: Detectó que debe usar IA\n");
        aciertos++;
    } else if (prueba.tipo === 'tecnica' && resultado.tipo === 'faq_tecnica') {
        console.log(`✅ CORRECTO: Detectó FAQ Técnica (${resultado.metadata.faqId})\n`);
        aciertos++;
    } else if (prueba.tipo === 'general' && resultado.tipo === 'faq_general') {
        console.log(`✅ CORRECTO: Detectó FAQ General (${resultado.metadata.faqId})\n`);
        aciertos++;
    } else {
        console.log(`❌ ERROR: Esperaba ${prueba.tipo} pero obtuvo ${resultado.tipo || 'IA'}\n`);
    }
});

// ============================================
// REPORTE FINAL
// ============================================
console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║              📊 RESULTADOS DE PRUEBAS                 ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

const porcentajeAciertos = (aciertos / totalPruebas * 100).toFixed(1);

console.log(`Total de pruebas: ${totalPruebas}`);
console.log(`Aciertos: ${aciertos}`);
console.log(`Errores: ${totalPruebas - aciertos}`);
console.log(`Precisión: ${porcentajeAciertos}%\n`);

if (porcentajeAciertos >= 90) {
    console.log("🎉 EXCELENTE: El sistema está funcionando correctamente\n");
} else if (porcentajeAciertos >= 70) {
    console.log("⚠️ ACEPTABLE: Revisar casos con error\n");
} else {
    console.log("❌ NECESITA AJUSTES: Revisar configuración de FAQs\n");
}

// ============================================
// ESTADÍSTICAS DEL SISTEMA
// ============================================
faqManager.imprimirReporte();
faqManager.listarTodasFAQs();

// ============================================
// EJEMPLO DE USO INDIVIDUAL
// ============================================
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          💡 EJEMPLO DE USO EN PRODUCCIÓN             ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

console.log("Código de ejemplo:\n");
console.log(`const FAQManager = require('./faqManager');
const faqManager = new FAQManager();

// En tu handler de WhatsApp:
async function manejarMensaje(mensaje, from) {
    const resultado = faqManager.procesarMensaje(mensaje);
    
    if (resultado.usarIA) {
        // Usar OpenAI para responder
        const respuestaIA = await openai.chat.completions.create({
            messages: [{ role: 'user', content: mensaje }],
            // ... tu configuración
        });
        
        enviarWhatsApp(from, respuestaIA.choices[0].message.content);
    } else {
        // Enviar respuesta automática de FAQ
        enviarWhatsApp(from, resultado.respuesta);
        
        // Opcional: Logging para mejorar
        console.log(\`FAQ usada: \${resultado.metadata.faqId}\`);
        console.log(\`Ahorro: $\${resultado.metadata.ahorro}\`);
    }
}
`);

console.log("════════════════════════════════════════════════════════\n");
