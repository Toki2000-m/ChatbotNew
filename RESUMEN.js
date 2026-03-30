#!/usr/bin/env node

console.log("\n");
console.log("=".repeat(70));
console.log("🔍 RESUMEN: ¿DÓNDE ESTÁN LAS TAREAS?");
console.log("=".repeat(70));
console.log("\n");

console.log("📊 LO QUE SABEMOS:\n");
console.log("✅ 1. Tu código SÍ está enviando tareas");
console.log("      - Línea 700 de chatbot.js llama a enviarTareaAPowerAutomate()");
console.log("      - Status 202 = Power Automate las recibió\n");

console.log("✅ 2. El webhook está configurado:");
console.log("      - POWER_AUTOMATE_WEBHOOK_URL en .env");
console.log("      - https://default29060bace6f1409c91d169b9bae950.78...\n");

console.log("❓ 3. LO QUE NO SABEMOS (y NECESITAS averiguar):\n");
console.log("   a) ¿A qué lista de Microsoft Lists llegan las tareas?");
console.log("      → Pregunta: '¿Cuál es el nombre de la lista?'\n");

console.log("   b) ¿Quién tiene acceso a esa lista?");
console.log("      → Los especialistas deberían tener acceso\n");

console.log("   c) ¿Cómo se notifica a los especialistas?");
console.log("      → ¿Email? ¿Teams? ¿Otro sistema?\n");

console.log("=".repeat(70));
console.log("\n🎯 PARA VALIDAR QUE LAS TAREAS LLEGAN:\n");

console.log("OPCIÓN 1: Ejecuta el script de prueba");
console.log("   $ node test-webhook.js");
console.log("   (Esto enviará una tarea de prueba)\n");

console.log("OPCIÓN 2: Pídele a sistemas que busque estas tareas:");
console.log("   - tarea_1770338847429_5574fy");
console.log("   - tarea_1770338850050_w0c9ra");
console.log("   - tarea_1770338851245_6ooma7");
console.log("   (Enviadas el 6 de febrero a las 00:47 GMT)\n");

console.log("OPCIÓN 3: Pídele acceso de LECTURA a la lista");
console.log("   (Solo para validar, sin modificar nada)\n");

console.log("=".repeat(70));
console.log("\n📧 Copia este mensaje y envíaselo:\n");
console.log("   → Ver archivo: MENSAJE-PARA-SISTEMAS.txt\n");

console.log("=".repeat(70));
console.log("\n💡 MIENTRAS TANTO:\n");
console.log("Tu código SÍ está funcionando.");
console.log("El problema es que no tienes acceso para VERIFICAR el destino.\n");
console.log("Necesitas que alguien con acceso a Microsoft Lists te ayude.\n");
console.log("=".repeat(70));
console.log("\n");
