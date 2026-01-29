/**
 * FAQ Handler para FGYA - Sistema de Respuestas Automáticas
 * 
 * OBJETIVO: Responder preguntas frecuentes SIN usar OpenAI (ahorro de costos)
 * REGLA DE ORO: Si el mensaje tiene palabras de URGENCIA o ACCIÓN → NO usar FAQ, dejar que la IA procese
 * 
 * Casos de uso:
 * - Horarios
 * - Ubicación  
 * - Contacto
 * - Servicios (overview general)
 * - Información de la empresa
 * - Preguntas sobre procesos (sin solicitar servicio)
 */

const fs = require('fs');
const path = require('path');

class FAQHandler {
    constructor() {
        // ============================================
        // PALABRAS QUE BLOQUEAN LAS RESPUESTAS AUTOMÁTICAS
        // Si aparecen, se debe usar IA para crear tarea
        // ============================================
        this.palabrasUrgencia = [
            'urgente', 'urgencia', 'emergencia', 
            'ya', 'hoy', 'ahorita', 'inmediato', 'rápido', 'pronto'
        ];

        this.palabrasAccion = [
            'necesito', 'requiero', 'solicito', 'quiero hacer',
            'ayuda con', 'apoyo con', 'generar', 'crear',
            'enviar', 'mandar', 'subir', 'cargar'
        ];

        // ============================================
        // INFORMACIÓN DE LA EMPRESA (FGYA)
        // ============================================
        this.empresaInfo = {
            nombre: "Figueroa González y Asociados, S.C.",
            nombreCorto: "FGYA",
            sitioWeb: "www.fgya.com.mx",
            emailGeneral: "alex@fgya.com.mx",
            telefonoGeneral: "(33) 3407 0123",
            horario: "Lunes a Viernes de 9:00 AM a 6:00 PM",
            direccion: "Tlaquepaque, Jalisco, México", // Ajustar si tienes la dirección exacta
            
            descripcion: "Somos una empresa especializada en servicios para el sector de hidrocarburos y petróleo. " +
                         "Contamos con certificaciones como Unidad de Inspección, Laboratorio de Ensayo, " +
                         "Laboratorio de Calibración y Terceros Autorizados.",
            
            serviciosPrincipales: [
                "Calibración (Tanques, Autotanques, Sondas)",
                "Ensayos (Hermeticidad, Integridad Mecánica, NOM-004)",
                "Unidades de Inspección (NOM-005-ASEA, NOM-016-CRE)",
                "Controles Volumétricos (Anexos 30, 31, 32)",
                "Terceros Autorizados (SASISOPA Comercial e Industrial)",
                "Auditorías Externas",
                "Sistemas de Gestión de Mediciones"
            ]
        };

        // ============================================
        // PREGUNTAS FRECUENTES (FAQs)
        // ============================================
        this.faqs = [
            // ========================================
            // FAQ 1: HORARIOS DE ATENCIÓN
            // ========================================
            {
                id: 'horarios',
                nombre: 'Horarios de Atención',
                prioridad: 1,
                
                // Palabras que activan esta FAQ
                palabrasClave: [
                    'horario', 'hora', 'horas',
                    'abren', 'cierran', 'abierto', 'cerrado',
                    'atienden', 'cuando atienden', 'a que hora'
                ],
                
                // Si el mensaje tiene estas palabras, NO usar FAQ
                palabrasBloqueo: ['urgente', 'necesito', 'requiero'],
                
                // Respuesta automática
                respuesta: () => `🕐 *Horario de Atención*

📅 *Lunes a Viernes:* 9:00 AM - 6:00 PM
🚫 *Sábados y Domingos:* Cerrado

📞 *Para emergencias o consultas urgentes:*
☎️ ${this.empresaInfo.telefonoGeneral}
📧 ${this.empresaInfo.emailGeneral}

💡 *Tip:* Si necesitas agendar un servicio, escribe "necesito [tipo de servicio]" y te asignaremos un especialista.`
            },

            // ========================================
            // FAQ 2: UBICACIÓN Y DIRECCIÓN
            // ========================================
            {
                id: 'ubicacion',
                nombre: 'Ubicación',
                prioridad: 2,
                
                palabrasClave: [
                    'ubicacion', 'ubicación', 'direccion', 'dirección',
                    'donde', 'dónde', 'están', 'estan', 'encuentran',
                    'como llego', 'cómo llego', 'ubicados'
                ],
                
                palabrasBloqueo: [],
                
                respuesta: () => `📍 *Nuestra Ubicación*

🏢 *${this.empresaInfo.nombre}*
📍 ${this.empresaInfo.direccion}

🌐 *Sitio web:* ${this.empresaInfo.sitioWeb}

📞 *Contacto:*
☎️ ${this.empresaInfo.telefonoGeneral}
📧 ${this.empresaInfo.emailGeneral}

🕐 *Horario:* ${this.empresaInfo.horario}

💡 *¿Necesitas más información?* Escribe tu consulta y te ayudaremos.`
            },

            // ========================================
            // FAQ 3: INFORMACIÓN GENERAL DE LA EMPRESA
            // ========================================
            {
                id: 'informacion_empresa',
                nombre: 'Información de la Empresa',
                prioridad: 3,
                
                palabrasClave: [
                    'que es fgya', 'qué es fgya', 'quien es fgya', 'quién es fgya',
                    'expliquen', 'explicar', 'informacion empresa', 'información empresa',
                    'de que es su empresa', 'que hace fgya', 'qué hace fgya',
                    'a que se dedican', 'a qué se dedican'
                ],
                
                palabrasBloqueo: ['necesito', 'requiero', 'solicito', 'urgente'],
                
                respuesta: () => `🏢 *${this.empresaInfo.nombreCorto} - Quiénes Somos*

${this.empresaInfo.descripcion}

✅ *Servicios que ofrecemos:*
${this.empresaInfo.serviciosPrincipales.map((s, i) => `${i + 1}. ${s}`).join('\n')}

📞 *Contacto:*
☎️ ${this.empresaInfo.telefonoGeneral}
📧 ${this.empresaInfo.emailGeneral}
🌐 ${this.empresaInfo.sitioWeb}

💡 *¿Te interesa algún servicio específico?* 
Escribe "necesito [tipo de servicio]" y te conectamos con el especialista adecuado.`
            },

            // ========================================
            // FAQ 4: SERVICIOS (SOLO INFORMACIÓN, NO SOLICITUD)
            // ========================================
            {
                id: 'servicios_info',
                nombre: 'Información de Servicios',
                prioridad: 4,
                
                palabrasClave: [
                    'que servicios ofrecen', 'qué servicios ofrecen',
                    'servicios', 'que hacen', 'qué hacen',
                    'que ofrecen', 'qué ofrecen', 'pueden hacer'
                ],
                
                // CRÍTICO: Si dice "necesito" o "requiero", NO responder FAQ
                palabrasBloqueo: [
                    'necesito', 'requiero', 'solicito', 'quiero hacer',
                    'urgente', 'ayuda con', 'apoyo con'
                ],
                
                respuesta: () => `🔧 *Nuestros Servicios Principales*

✅ *Calibración*
   • Tanques, Autotanques y Carrotanques
   • Sondas de nivel y temperatura
   • Medidas Volumétricas (Jarras 20L)

✅ *Ensayos*
   • Pruebas de Hermeticidad
   • Estudios de Integridad Mecánica
   • Recuperación de Vapores (NOM-004)

✅ *Unidades de Inspección*
   • NOM-005-ASEA-2016
   • NOM-016-CRE-2016
   • Controles Volumétricos (Anexo 30/31/32)

✅ *Terceros Autorizados*
   • SASISOPA Comercial e Industrial
   • Auditorías Externas
   • Sistemas de Gestión de Mediciones

📞 *Más información:*
👤 Francisco Ramírez - Atención a Clientes
📱 3313332696
📧 clientes@fgya.com.mx

💡 *Para solicitar un servicio específico:*
Escribe "necesito [tipo de servicio]" y te asignaremos un especialista.`
            },

            // ========================================
            // FAQ 5: CONTACTO GENERAL
            // ========================================
            {
                id: 'contacto',
                nombre: 'Información de Contacto',
                prioridad: 5,
                
                palabrasClave: [
                    'contacto', 'contactar', 'telefono', 'teléfono',
                    'email', 'correo', 'whatsapp',
                    'como los contacto', 'cómo los contacto',
                    'comunicar', 'como me comunico', 'cómo me comunico'
                ],
                
                // Si quieren hablar con especialista específico, NO usar FAQ
                palabrasBloqueo: [
                    'hablar con', 'quiero hablar', 'comunicar con',
                    'janeth', 'francisco', 'sara', 'aurora',
                    'ana paula', 'alfredo', 'alberto', 'noemí', 'noemi'
                ],
                
                respuesta: () => {
                    // Cargar especialistas
                    let especialistasTexto = '';
                    try {
                        const especialistasPath = path.join(__dirname, "..", "config", "especialistas.json");
                        if (fs.existsSync(especialistasPath)) {
                            const data = JSON.parse(fs.readFileSync(especialistasPath, "utf8"));
                            const especialistas = data.especialistas.filter(e => e.id !== 'default').slice(0, 8);
                            
                            especialistasTexto = especialistas.map(e => 
                                `• ${e.nombre} - ${e.telefono}`
                            ).join('\n');
                        }
                    } catch (err) {
                        console.warn("⚠️ No se pudieron cargar especialistas para FAQ contacto");
                    }

                    return `📞 *Contacto General*

🏢 *${this.empresaInfo.nombre}*

☎️ Teléfono: ${this.empresaInfo.telefonoGeneral}
📧 Email: ${this.empresaInfo.emailGeneral}
🌐 Sitio web: ${this.empresaInfo.sitioWeb}

🕐 Horario: ${this.empresaInfo.horario}

${especialistasTexto ? `👥 *Contactos por Área:*\n${especialistasTexto}\n\n` : ''}💡 *¿Quieres hablar con un especialista específico?*
Escribe "quiero hablar con [nombre]" y te conectamos.`;
                }
            },

            // ========================================
            // FAQ 6: COTIZACIONES (SOLO INFO, NO SOLICITUD)
            // ========================================
            {
                id: 'cotizaciones_info',
                nombre: 'Información sobre Cotizaciones',
                prioridad: 6,
                
                palabrasClave: [
                    'costo', 'costos', 'precio', 'precios',
                    'cuanto cuesta', 'cuánto cuesta',
                    'cuanto sale', 'cuánto sale',
                    'cotizacion', 'cotización', 'presupuesto'
                ],
                
                // Si quieren cotización específica, NO usar FAQ
                palabrasBloqueo: [
                    'necesito cotizacion', 'necesito cotización',
                    'requiero cotizacion', 'requiero cotización',
                    'solicito cotizacion', 'solicito cotización',
                    'quiero cotizar', 'urgente'
                ],
                
                respuesta: () => `💰 *Costos y Cotizaciones*

Nuestros precios varían según:
• Tipo de servicio requerido
• Ubicación del proyecto
• Urgencia y plazo de entrega
• Cantidad de equipos/unidades

📋 *Para recibir una cotización personalizada:*

👤 *Francisco Ramírez*
   Atención a Clientes y Cotizaciones
📱 3313332696
📧 clientes@fgya.com.mx

📝 *Información útil para cotizar:*
• Tipo de servicio específico
• Ubicación del servicio
• Cantidad de equipos/unidades
• Fecha deseada
• Cualquier especificación adicional

💡 *Solicita tu cotización escribiendo:*
"Necesito cotización para [tipo de servicio]"`
            },
        ];  // Cierra el array this.faqs

    }  // ← AGREGAR ESTA LLAVE - Cierra constructor()

    // ============================================
    // MÉTODO PRINCIPAL: Detectar si debe usar FAQ
    // ============================================
    debeResponderAutomaticamente(mensaje) {
        const mensajeLower = mensaje.toLowerCase().trim();

        // 1. Verificar si tiene palabras de URGENCIA
        if (this.tieneUrgencia(mensajeLower)) {
            console.log("🚫 FAQ bloqueada: Mensaje contiene palabras de urgencia");
            return { usarFAQ: false, razon: 'urgencia' };
        }

        // 2. Verificar si tiene palabras de ACCIÓN
        if (this.tieneAccion(mensajeLower)) {
            console.log("🚫 FAQ bloqueada: Mensaje contiene palabras de acción");
            return { usarFAQ: false, razon: 'accion' };
        }

        // 3. Buscar FAQ coincidente
        const faq = this.buscarFAQ(mensajeLower);
        
        if (faq) {
            console.log(`✅ FAQ encontrada: ${faq.nombre}`);
            return { usarFAQ: true, faq: faq };
        }

        console.log("ℹ️ No se encontró FAQ aplicable");
        return { usarFAQ: false, razon: 'no_coincide' };
    }

    // ============================================
    // Verificar si tiene palabras de urgencia
    // ============================================
    tieneUrgencia(mensajeLower) {
        return this.palabrasUrgencia.some(palabra => 
            mensajeLower.includes(palabra)
        );
    }

    // ============================================
    // Verificar si tiene palabras de acción
    // ============================================
    tieneAccion(mensajeLower) {
        return this.palabrasAccion.some(palabra => 
            mensajeLower.includes(palabra)
        );
    }

    // ============================================
    // Buscar FAQ que coincida con el mensaje
    // ============================================
    buscarFAQ(mensajeLower) {
        for (const faq of this.faqs) {
            // Verificar si tiene palabras de bloqueo específicas de esta FAQ
            if (faq.palabrasBloqueo && faq.palabrasBloqueo.length > 0) {
                const tieneBloqueo = faq.palabrasBloqueo.some(palabra =>
                    mensajeLower.includes(palabra.toLowerCase())
                );
                
                if (tieneBloqueo) {
                    console.log(`⚠️ FAQ "${faq.nombre}" bloqueada por palabras de bloqueo`);
                    continue;
                }
            }

            // Verificar si coincide con palabras clave
            const coincide = faq.palabrasClave.some(palabra =>
                mensajeLower.includes(palabra.toLowerCase())
            );

            if (coincide) {
                return faq;
            }
        }

        return null;
    }

    // ============================================
    // Obtener respuesta de FAQ
    // ============================================
    obtenerRespuesta(faq) {
        if (typeof faq.respuesta === 'function') {
            return faq.respuesta();
        }
        return faq.respuesta;
    }

    // ============================================
    // Método público para procesar mensaje
    // ============================================
    procesarMensaje(mensaje) {
        const resultado = this.debeResponderAutomaticamente(mensaje);

        if (resultado.usarFAQ && resultado.faq) {
            return {
                esRespuestaAutomatica: true,
                respuesta: this.obtenerRespuesta(resultado.faq),
                faqId: resultado.faq.id,
                faqNombre: resultado.faq.nombre
            };
        }

        return {
            esRespuestaAutomatica: false,
            razon: resultado.razon || 'no_aplicable'
        };
    }
}

module.exports = FAQHandler;
