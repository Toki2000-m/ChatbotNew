/**
 * AUTO-RESPUESTAS CONTEXTUALES para FGYA
 * VERSIÓN 1.0 - Sistema de respuestas automáticas para clientes EXISTENTES
 * 
 * PROPÓSITO:
 * Responder automáticamente a mensajes repetitivos que NO requieren análisis de IA
 * pero SÍ crean la tarea en Microsoft Lists para seguimiento del especialista
 * 
 * DIFERENCIA CON faqHandler.js:
 * - faqHandler: Clientes nuevos preguntando info general (horarios, ubicación, etc.)
 *   → Responde preguntas basicas y tecnicas generales, NO crea tarea
 * 
 * - autoResponses: Clientes existentes en trámites activos (confirmaciones, seguimiento)
 *   → Responde confirmando + SIEMPRE crea tarea para especialista
 * 
 * EVIDENCIA DE LOS CHATS REALES:
 * ✅ "Ya subí la información" → Aparece 8+ veces en los chats
 * ✅ "Tienen fecha para los JSON?" → Aparece 5+ veces
 * ✅ "Me pueden enviar el link?" → Aparece 6+ veces
 * ✅ "Confirmo de recibido" → Aparece 12+ veces
 */

const fs = require('fs');
const path = require('path');

class AutoResponsesHandler {
    constructor() {
        this.especialistasData = null;
        this.cargarEspecialistas();

        // ============================================
        // CONFIGURACIÓN DE AUTO-RESPUESTAS
        // ============================================
        this.autoResponses = [

            // ========================================
            // AUTO-RESPUESTA 1: Cliente notifica que subió información
            // FRECUENCIA: MUY ALTA (8+ casos en los chats)
            // EJEMPLOS REALES:
            // - "Ya subí el año 2022" (Transportes Baporachic, 16/1/2026)
            // - "Listo ya se subió la información" (Transportes Baporachic, 26/1/2026)
            // ========================================
            {
                id: 'confirmacion_subida',
                nombre: 'Confirmación de Subida de Archivos',
                prioridad: 1,

                triggers: [
                    // Frases completas (mayor peso)
                    'ya subi la informacion',
                    'ya subí la información',
                    'ya esta subido',
                    'ya está subido',
                    'listo ya subi',
                    'listo ya subí',
                    'ya se subio',
                    'ya se subió',
                    'termine de subir',
                    'terminé de subir',
                    'acabo de subir',
                    'listo la informacion',
                    'listo la información',
                    'ya cargue',
                    'ya cargué',
                    'informacion subida',
                    'información subida',
                    'listo subido',
                    'ya esta en la nube',
                    'ya está en la nube'
                ],

                palabrasBloqueo: [
                    'error al subir',
                    'no puedo subir',
                    'problema para subir',
                    'ayuda para subir',
                    'como subo',
                    'cómo subo',
                    'donde subo',
                    'dónde subo'
                ],

                crearTarea: true,

                respuesta: (context) => {
                    return `✅ *Información Recibida*

Perfecto, he registrado que subiste la información.

Un especialista revisará y te contactará en las próximas 24 horas.

Si necesitas atención urgente, indícalo y te conectaremos de inmediato.

Gracias por tu paciencia. 🙏`;
                }
            },

            // ========================================
            // AUTO-RESPUESTA 2: Cliente pregunta por fecha/estatus de JSON
            // FRECUENCIA: ALTA (5+ casos en los chats)
            // EJEMPLOS REALES:
            // - "Tienen alguna fecha estimada para los JSON pendientes?" (Ma Eugenia, 29/12/2025)
            // - "Dando seguimiento. ¿Tendremos algún avance?" (Baporachic, 30/1/2026)
            // ========================================
            {
                id: 'consulta_fecha_json',
                nombre: 'Consulta Fecha JSON/XML',
                prioridad: 2,

                triggers: [
                    'fecha json',
                    'fecha para json',
                    'fecha estimada json',
                    'cuando json',
                    'cuándo json',
                    'fecha xml',
                    'cuando xml',
                    'cuándo xml',
                    'avance json',
                    'estatus json',
                    'como van json',
                    'cómo van json',
                    'json pendiente',
                    'xml pendiente',
                    'fecha para los json',
                    'tienen fecha json',
                    'alguna fecha json'
                ],

                palabrasBloqueo: [
                    'rechazado',
                    'rechazaron',
                    'error',
                    'problema',
                    'no funciona'
                ],

                crearTarea: true,

                respuesta: (context) => {
                    const especialista = context.especialista || {
                        nombre: 'Ing. Alberto Méndez',
                        email: 'alberto@fgya.com.mx',
                        telefono: '3346790303'
                    };

                    return `🔔 *Consulta sobre JSON/XML*

Hola ${context.nombreCliente || 'estimado cliente'},

He registrado su consulta sobre la **fecha estimada de entrega** de sus archivos JSON/XML.

📋 *Se ha creado una tarea para:*
👤 ${especialista.nombre}
📧 ${especialista.email}
📱 ${especialista.telefono || ''}

⏱️ *Tiempo de respuesta:*
Recibirá una actualización con la fecha estimada en un máximo de **24 horas**.

💡 *Mientras tanto:*
Si necesita información urgente, puede contactar directamente a ${especialista.nombre}.

Gracias por su paciencia! 🙏`;
                }
            },

            // ========================================
            // AUTO-RESPUESTA 3: Cliente solicita link/enlace para subir archivos
            // FRECUENCIA: MEDIA-ALTA (6+ casos en los chats)
            // EJEMPLOS REALES:
            // - "Por favor puede apoyarme con el link para subir mi información" (Arafath, 16/1/2026)
            // ========================================
            {
                id: 'solicitud_link',
                nombre: 'Solicitud de Link/Enlace',
                prioridad: 3,

                triggers: [
                    'link para subir',
                    'enlace para subir',
                    'liga para subir',
                    'donde subo',
                    'dónde subo',
                    'como subo',
                    'cómo subo',
                    'link informacion',
                    'link información',
                    'enlace informacion',
                    'enlace información',
                    'pueden enviar link',
                    'me envian link',
                    'me envían link',
                    'compartir link',
                    'compartir enlace',
                    'necesito link',
                    'necesito el link',
                    'requiero link'
                ],

                palabrasBloqueo: [
                    'no funciona link',
                    'error en link',
                    'problema con link'
                ],

                crearTarea: true,

                respuesta: (context) => {
                    return `🔗 *Enlace para Subir Información*

He registrado su solicitud del enlace para cargar su información.

📋 *Siguiente paso:*
Le enviaremos el enlace personalizado en las **próximas 2-4 horas**.

💡 *Instrucciones generales:*
- Organizar archivos por año y mes
- Subir únicamente los documentos solicitados
- Comprimir carpeta principal en .zip (si es necesario)

⏱️ *¿Por qué no envío el link ahora?*
Cada cliente tiene un enlace personalizado según su trámite específico.

Favor de confirmar cuando haya subido los documentos.

Quedo al pendiente! 📎`;
                }
            },

            // ========================================
            // AUTO-RESPUESTA 4: Cliente consulta estatus/avance general
            // FRECUENCIA: MEDIA (4+ casos en los chats)
            // EJEMPLOS REALES:
            // - "Dando seguimiento. ¿Tendremos algún avance?" (Baporachic, 30/1/2026)
            // - "Me podrás informar si estamos pendientes con algún documento" (Ma Eugenia, 27/1/2026)
            // ========================================
            {
                id: 'consulta_estatus',
                nombre: 'Consulta de Estatus/Avance',
                prioridad: 4,

                triggers: [
                    'estatus tramite',
                    'estatus trámite',
                    'status tramite',
                    'status trámite',
                    'avance tramite',
                    'avance trámite',
                    'como vamos',
                    'cómo vamos',
                    'seguimiento tramite',
                    'seguimiento trámite',
                    'dando seguimiento',
                    'tendremos avance',
                    'algun avance',
                    'algún avance',
                    'pendiente tramite',
                    'pendiente trámite',
                    'que falta',
                    'qué falta',
                    'tengo pendiente'
                ],

                palabrasBloqueo: [
                    'urgente',
                    'problema',
                    'error',
                    'rechazado'
                ],

                crearTarea: true,

                rrespuesta: (context) => {
                    return `📊 *Consulta de Estatus*

He registrado su solicitud de **actualización de estatus** de su trámite.

📋 *Lo que recibirá:*
- Documentación pendiente (si aplica)
- Avances realizados
- Siguiente(s) paso(s)

⏱️ *Tiempo de respuesta:*
Recibirá una actualización detallada en las **próximas 24 horas**.

💡 *Tip:*
Si tiene documentación pendiente de enviar, puede subirla mientras espera la respuesta.

Gracias por su seguimiento! 🙏`;
                }
            },

            // ========================================
            // AUTO-RESPUESTA 5: Cliente pregunta por documentación faltante/pendiente
            // FRECUENCIA: MEDIA (3+ casos en los chats)
            // EJEMPLOS REALES:
            // - "Me podrán apoyar con un resumen de lo que tenemos pendiente" (Baporachic, 27/1/2026)
            // - "Si hace falta algo" (Arafath, 28/1/2026)
            // ========================================
            {
                id: 'documentacion_pendiente',
                nombre: 'Consulta Documentación Pendiente',
                prioridad: 5,

                triggers: [
                    'que falta',
                    'qué falta',
                    'documentacion pendiente',
                    'documentación pendiente',
                    'que hace falta',
                    'qué hace falta',
                    'resumen pendiente',
                    'que tenemos pendiente',
                    'qué tenemos pendiente',
                    'falta algo',
                    'hace falta algo',
                    'documenta faltante',
                    'informacion faltante',
                    'información faltante',
                    'si hace falta',
                    'que me falta',
                    'qué me falta'
                ],

                palabrasBloqueo: [
                    'no tengo',
                    'urgente',
                    'problema',
                    'error'
                ],

                crearTarea: true,

                respuesta: (context) => {
                    return `📋 *Consulta - Documentación Pendiente*

He registrado su solicitud de resumen de documentación pendiente.

📊 *Lo que recibirá:*
- Lista detallada de documentos pendientes (si aplica)
- Documentos ya recibidos ✅
- Instrucciones para cada documento faltante
- Fechas límite (si aplican)

⏱️ *Tiempo de respuesta:*
Recibirá el resumen actualizado en las **próximas 12-24 horas**.

💡 *Importante:*
Si ya cuenta con algún documento, puede subirlo de inmediato para agilizar el proceso.

Quedamos al pendiente! 📎`;
                }
            },

            // ========================================
            // AUTO-RESPUESTA 6: Cliente solicita apoyo/ayuda general (sin especificar)
            // FRECUENCIA: BAJA-MEDIA (2-3 casos)
            // EJEMPLOS REALES:
            // - "Podrían apoyarme con los datos para el llenado" (Arafath, 30/12/2025)
            // ========================================
            {
                id: 'solicitud_apoyo_general',
                nombre: 'Solicitud de Apoyo General',
                prioridad: 6,

                triggers: [
                    'pueden apoyarme',
                    'podrian apoyarme',
                    'podrían apoyarme',
                    'me apoyan con',
                    'necesito apoyo',
                    'requiero apoyo',
                    'ayuda con',
                    'me ayudan con',
                    'pueden ayudarme',
                    'podrian ayudarme',
                    'podrían ayudarme'
                ],

                palabrasBloqueo: [
                    'urgente',
                    'emergencia',
                    'error',
                    'problema',
                    'no puedo',
                    'no funciona'
                ],

                crearTarea: true,

                respuesta: (context) => {
                    return `🤝 *Solicitud de Apoyo*

Por supuesto, con gusto le apoyamos.

📋 *Lo que recibirá:*
- Orientación específica para su caso
- Instrucciones detalladas
- Formatos o documentos necesarios (si aplican)

⏱️ *Tiempo de respuesta:*
Recibirá apoyo personalizado en las **próximas 2-4 horas**.

💡 *Para agilizar:*
Si puede compartir más detalles sobre lo que necesita, eso ayudará a darle una respuesta más rápida y precisa.

Quedamos atentos! 🙏`;
                }
            }

        ];  // Cierra array autoResponses

    }  // Cierra constructor

    // ============================================
    // CARGAR DATOS DE ESPECIALISTAS
    // ============================================
    cargarEspecialistas() {
        try {
            const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
            if (fs.existsSync(especialistasPath)) {
                const data = fs.readFileSync(especialistasPath, "utf8");
                this.especialistasData = JSON.parse(data);
                console.log("✅ Especialistas cargados para AutoResponses");
            } else {
                console.warn("⚠️ Archivo especialistas.json no encontrado");
            }
        } catch (error) {
            console.error("❌ Error cargando especialistas:", error);
        }
    }

    // ============================================
    // MÉTODO PRINCIPAL: Detectar si debe usar auto-respuesta
    // ============================================
    debeResponderAutomaticamente(mensaje) {
        const mensajeLower = mensaje.toLowerCase().trim();

        console.log(`\n🔍 [AutoResponses] Analizando: "${mensajeLower.substring(0, 60)}${mensajeLower.length > 60 ? '...' : ''}"`);

        // Buscar auto-respuesta coincidente
        const autoResp = this.buscarAutoRespuesta(mensajeLower);

        if (autoResp) {
            console.log(`✅ [AutoResponses] Encontrada: ${autoResp.nombre}`);
            return {
                usarAutoRespuesta: true,
                autoRespuesta: autoResp
            };
        }

        console.log("ℹ️ [AutoResponses] No se encontró auto-respuesta aplicable");
        return { usarAutoRespuesta: false };
    }

    // ============================================
    // BUSCAR AUTO-RESPUESTA COINCIDENTE
    // ============================================
    buscarAutoRespuesta(mensajeLower) {
        for (const autoResp of this.autoResponses) {
            // 1. Verificar palabras de bloqueo primero
            if (autoResp.palabrasBloqueo && autoResp.palabrasBloqueo.length > 0) {
                const tieneBloqueo = autoResp.palabrasBloqueo.some(palabra =>
                    mensajeLower.includes(palabra.toLowerCase())
                );

                if (tieneBloqueo) {
                    console.log(`   ⚠️ AutoRespuesta "${autoResp.nombre}" bloqueada`);
                    continue;
                }
            }

            // 2. Buscar triggers
            const coincide = autoResp.triggers.some(trigger =>
                mensajeLower.includes(trigger.toLowerCase())
            );

            if (coincide) {
                return autoResp;
            }
        }

        return null;
    }

    // ============================================
    // OBTENER RESPUESTA CON CONTEXTO
    // ============================================
    obtenerRespuesta(autoRespuesta, context = {}) {
        if (typeof autoRespuesta.respuesta === 'function') {
            return autoRespuesta.respuesta(context);
        }
        return autoRespuesta.respuesta;
    }

    // ============================================
    // MÉTODO PÚBLICO: Procesar mensaje
    // ============================================
    procesarMensaje(mensaje, context = {}) {
        const resultado = this.debeResponderAutomaticamente(mensaje);

        if (resultado.usarAutoRespuesta && resultado.autoRespuesta) {
            return {
                esAutoRespuesta: true,
                respuesta: this.obtenerRespuesta(resultado.autoRespuesta, context),
                autoRespuestaId: resultado.autoRespuesta.id,
                autoRespuestaNombre: resultado.autoRespuesta.nombre,
                crearTarea: resultado.autoRespuesta.crearTarea || false
            };
        }

        return {
            esAutoRespuesta: false
        };
    }
}

module.exports = AutoResponsesHandler;