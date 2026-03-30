/**
 * FAQ Handler para FGYA - Sistema de Respuestas Automáticas
 * VERSIÓN ULTRA MEJORADA - Con coincidencia flexible anti-errores
 * 
 * OBJETIVO: Responder preguntas frecuentes SIN usar OpenAI (ahorro de costos)
 * REGLA DE ORO: Si el mensaje tiene palabras de URGENCIA o ACCIÓN → NO usar FAQ, dejar que la IA procese
 * 
 * MEJORAS EN ESTA VERSIÓN:
 * - Tolerancia a errores ortográficos (orario, ubicasion, telefono)
 * - Detección sin acentos (donde, que, horario)
 * - Coincidencia por palabras sueltas (no frases completas)
 * - Sistema de puntuación inteligente
 * - Logging detallado para debugging
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
            'ya', 'hoy', 'ahorita', 'inmediato', 'rapido', 'rápido', 'pronto'
        ];

        this.palabrasAccion = [
            'necesito', 'requiero', 'solicito', 'quiero que hagan',
            'ayuda para', 'apoyo para', 'cotizar', 'presupuesto'
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
            direccion: "Tlaquepaque, Jalisco, México",

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

                // PALABRAS CLAVE PRINCIPALES (se buscan sueltas)
                palabrasClave: [
                    // Horario (con errores)
                    'horario', 'horarios', 'orario', 'orarios', 'orarrio', 'horarios',
                    
                    // Hora (todas las variaciones)
                    'hora', 'horas', 'hrs', 'ora', 'oras', 'hr',
                    
                    // Abren (con errores)
                    'abren', 'habren', 'habran', 'avren', 'abre', 'habre',
                    
                    // Cierran (con errores)
                    'cierran', 'sierran', 'cieran', 'sieran', 'cierra', 'sierra',
                    
                    // Atienden (con errores)
                    'atienden', 'hatienden', 'atiendem', 'atiende',
                    
                    // Atención (con errores)
                    'atencion', 'atención', 'atension', 'atension', 'hatencion',
                    
                    // Cuando (sin acento)
                    'cuando', 'cuándo', 'cuanto', 'kwando'
                ],

                // FRASES COMPLETAS (se buscan exactas)
                frasesCompletas: [
                    // Frases correctas
                    'a que hora', 'a qué hora', 'que hora', 'qué hora',
                    'horario de atencion', 'horario de atención',
                    
                    // Frases con errores comunes
                    'a ki hora', 'aki hora', 'a q hora', 'q hora',
                    'k hora', 'ke hora', 'akioras', 'a ki oras',
                    'aki oras', 'a k hora', 'aq hora', 'aque hora',
                    
                    // Abren/cierran
                    'a que hora abren', 'a que hora cierran',
                    'a que hora habren', 'a que hora sierran',
                    'aki oras abren', 'aki oras sierran',
                    'k ora abren', 'k ora sierran',
                    
                    // Atienden
                    'cuando atienden', 'cuándo atienden',
                    'a que hora atienden', 'aki oras atienden'
                ],

                palabrasBloqueo: ['urgente', 'necesito', 'requiero', 'cita'],

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
                    // Ubicación (con errores)
                    'ubicacion', 'ubicación', 'ubicasion', 'ubicasión', 'ubikacion',
                    'ubicacion', 'huvicacion',
                    
                    // Dirección (con errores)
                    'direccion', 'dirección', 'direcion', 'direcion', 'direccion',
                    'direecion', 'direxion',
                    
                    // Dónde (sin acento y errores)
                    'donde', 'dónde', 'onde', 'donде', 'adonde', 'adónde',
                    
                    // Está/están (sin acento)
                    'esta', 'está', 'estan', 'están', 'sta', 'tan',
                    
                    // Empresa/oficina
                    'empresa', 'ofisina', 'oficina', 'ofisina',
                    
                    // Llego/llegar
                    'llego', 'llegar', 'yego', 'yegar'
                ],

                frasesCompletas: [
                    // Correcto
                    'donde esta', 'dónde está', 'donde estan', 'dónde están',
                    
                    // Con errores
                    'onde sta', 'onde esta', 'onde estan',
                    'donde sta', 'adonde sta', 'adonde esta',
                    
                    // Cómo llego
                    'como llego', 'cómo llego', 'komo llego', 'como yego',
                    
                    // Ubicación/dirección
                    'ubicacion empresa', 'ubicacion de la empresa',
                    'direccion empresa', 'direcion empresa'
                ],

                // CRÍTICO: Evitar confusiones con otras FAQs
                palabrasBloqueo: [
                    'carpeta', 'sasisopa', 'archivo', 'documento',
                    'requisitos', 'cubicacion', 'cubicación', 'json',
                    'xml', 'sat', 'dictamen', 'certificado'
                ],

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
                    // FGYA
                    'fgya', 'figueroa', 'figeroa', 'figueroa',
                    
                    // Información
                    'informacion', 'información', 'info', 'imformacion', 'imformación',
                    
                    // Empresa/compañía
                    'empresa', 'compañia', 'compania', 'compañía', 'konpañia',
                    
                    // Qué (todas las variaciones)
                    'que', 'qué', 'ke', 'q', 'k',
                    
                    // Quién
                    'quien', 'quién', 'kien', 'kién',
                    
                    // Dedican/hacen/trata
                    'dedican', 'hacen', 'asen', 'trata', 'dedika'
                ],

                frasesCompletas: [
                    // Correcto
                    'que es fgya', 'qué es fgya', 'quien es fgya', 'quién es fgya',
                    
                    // Con errores
                    'q es fgya', 'ke es fgya', 'k es fgya',
                    'kien es fgya', 'q es figueroa', 'ke es figueroa',
                    
                    // Dedican/hacen
                    'que hacen', 'qué hacen', 'q hacen', 'ke hacen',
                    'que asen', 'k asen',
                    'a que se dedican', 'a q se dedican', 'aq se dedican',
                    
                    // Información
                    'informacion empresa', 'info empresa', 'imformacion empresa'
                ],

                palabrasBloqueo: ['necesito', 'requiero', 'solicito', 'urgente', 'cotizar'],

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
                    'servicios', 'servicio', 'servisios',
                    'ofrecen', 'ofrecemos',
                    'hacen', 'pueden',
                    'lista', 'cuales', 'cuáles'
                ],

                frasesCompletas: [
                    'que servicios',
                    'qué servicios',
                    'servicios disponibles',
                    'lista de servicios'
                ],

                palabrasBloqueo: [
                    'necesito', 'requiero', 'solicito', 'quiero hacer',
                    'urgente', 'ayuda con', 'apoyo con', 'cotizar'
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
                    // Contacto
                    'contacto', 'contactar', 'contakto', 'kontacto', 'kontakto',
                    
                    // Teléfono (muchas variaciones)
                    'telefono', 'teléfono', 'tel', 'telefono', 'fono', 'fonos',
                    'numero', 'número', 'num', 'numeros', 'números',
                    
                    // Email/correo
                    'email', 'correo', 'mail', 'correeo', 'imail', 'e-mail',
                    
                    // Comunicar
                    'comunicar', 'comunicarse', 'komunicar', 'comunico'
                ],

                frasesCompletas: [
                    // Correcto
                    'contacto general', 'como contactar', 'cómo contactar',
                    
                    // Con errores
                    'komo contactar', 'como kontaktar', 'komo kontaktar',
                    
                    // Teléfono
                    'telefono general', 'tel general', 'numero general',
                    'telefono de contacto', 'tel de contacto',
                    
                    // Correo
                    'correo general', 'mail general', 'email general'
                ],

                palabrasBloqueo: [
                    'hablar con', 'quiero hablar', 'comunicar con',
                    'janeth', 'francisco', 'sara', 'aurora',
                    'ana paula', 'alfredo', 'alberto', 'noemí', 'noemi',
                    'especialista'
                ],

                respuesta: () => {
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
                    // Costos/precios
                    'costos', 'costo', 'kostos', 'kosto',
                    'precio', 'precios', 'presio', 'presios',
                    
                    // Cuánto (todas las variaciones)
                    'cuanto', 'cuánto', 'kwanto', 'kuanto', 'cuato', 'quanto',
                    
                    // Cuesta/vale/cobran
                    'cuesta', 'kuesta', 'vale', 'bale',
                    'cobran', 'kobran', 'cobras',
                    
                    // Información
                    'informacion', 'información', 'info'
                ],

                frasesCompletas: [
                    // Correcto
                    'cuanto cuesta', 'cuánto cuesta', 'cuanto vale', 'cuánto vale',
                    
                    // Con errores
                    'kwanto cuesta', 'kuanto cuesta', 'cuato cuesta',
                    'kwanto kuesta', 'kuanto kuesta', 'quanto cuesta',
                    'cuanto bale', 'kwanto bale',
                    
                    // Costos/precios
                    'costos generales', 'kostos generales',
                    'precios generales', 'presios generales',
                    'cuanto cobran', 'kwanto cobran', 'kuanto kobran'
                ],

                palabrasBloqueo: [
                    'necesito cotizacion',
                    'necesito cotización',
                    'requiero cotizacion',
                    'solicito cotizacion',
                    'quiero cotizar',
                    'urgente'
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

            // ========================================
            // FAQ 7: QUÉ ES EL ANEXO 1 DEL PERMISO
            // ========================================
            {
                id: 'anexo_1_permiso',
                nombre: 'Qué es el Anexo 1 del Permiso',
                prioridad: 7,

                palabrasClave: [
                    'anexo', 'permiso', 'cre',
                    'que', 'qué', 'ke'
                ],

                frasesCompletas: [
                    'anexo 1',
                    'anexo uno',
                    'anexo del permiso',
                    'que es anexo'
                ],

                palabrasBloqueo: ['necesito', 'no encuentro', 'no tengo', 'ayuda con'],

                respuesta: () => `📄 *Anexo 1 del Permiso CRE*

Es un documento que viene con tu permiso de la CRE (Comisión Reguladora de Energía).

📋 *¿Qué contiene?*
- Características técnicas de tu autotanque
- Capacidad autorizada  
- Productos que puedes transportar

📍 *¿Dónde lo consigo?*
1. Revisa los documentos que te dio la CRE cuando te dieron tu permiso
2. Si no lo encuentras, descárgalo del portal de la CRE:
   https://www.gob.mx/cre

💡 *¿Para qué lo necesitamos?*
Para verificar que los datos de tu NOM-016 coincidan con tu permiso oficial.

🆘 *¿No lo encuentras?*
Escribe: "no encuentro Anexo 1 del permiso" para ayuda personalizada.`
            },

            // ========================================
            // FAQ 8: INFORMES DE CALIDAD DE ORIGEN
            // ========================================
            {
                id: 'informes_calidad_origen',
                nombre: 'Informes de Calidad de Origen',
                prioridad: 8,

                palabrasClave: [
                    'informes', 'informe',
                    'calidad', 'kalidad',
                    'origen', 'orígen'
                ],

                frasesCompletas: [
                    'informes calidad',
                    'informes de calidad',
                    'calidad de origen',
                    'donde consigo informes'
                ],

                palabrasBloqueo: ['necesito ayuda', 'no tengo', 'urgente', 'ayuda con'],

                respuesta: () => `🔬 *Informes de Calidad de Origen*

Son certificados que te da tu **PROVEEDOR** de combustible (Pemex, Gas Bienestar, etc.)

📋 *¿Qué certifican?*
Que el combustible que te vendieron cumple con las especificaciones de calidad (no está adulterado)

📅 *¿Cuándo los necesitas?*
- 1 informe del 1er semestre (Enero-Junio)
- 1 informe del 2do semestre (Julio-Diciembre)  
- Por cada año
- Por cada producto (Diesel, Gasolina, etc.)

📍 *¿Cómo los consigo?*
Pídelos directamente a tu proveedor:
- Pemex: Solicita a tu distribuidor
- Gas Bienestar: En tu portal de cliente
- Otros: A tu distribuidor directo

💡 *Tip:* Algunos proveedores los envían automáticamente por correo cada semestre.

🆘 *¿Tu proveedor no te los da?*
Escribe: "ayuda con informes de calidad" para asesoría personalizada.`
            },

            // ========================================
            // FAQ 9: POR QUÉ NECESITAN CARTAS PORTE
            // ========================================
            {
                id: 'cartas_porte_necesarias',
                nombre: 'Por qué necesitan Cartas Porte',
                prioridad: 9,

                palabrasClave: [
                    'cartas', 'carta', 'porte',
                    'por', 'que', 'qué', 'porke', 'xq',
                    'necesitan', 'piden', 'sirven'
                ],

                frasesCompletas: [
                    'cartas porte',
                    'carta porte',
                    'por que necesitan',
                    'para que sirven',
                    'que son cartas'
                ],

                palabrasBloqueo: ['no tengo', 'necesito generar', 'ayuda con', 'urgente'],

                respuesta: () => `🚛 *¿Por qué necesitan mis Cartas Porte?*

Las Cartas Porte son la **materia prima** para generar tus archivos JSON/XML de Control Volumétrico.

📊 *El proceso:*
1. Tú generas Cartas Porte cada vez que transportas (obligatorio SAT)
2. FGYA toma esas Cartas Porte (XML)
3. Las procesamos y generamos JSON/XML de Control Volumétrico
4. Esos JSON se suben al SAT
5. Con eso cumples el Anexo 30/31/32

📁 *¿Qué necesitamos exactamente?*
- Todas las Cartas Porte en formato **XML**
- De enero a diciembre del año que estamos certificando
- Organizadas por mes

💡 *¿No generaste Cartas Porte en algún mes?*
Si no tuviste operaciones (no transportaste nada), solo avísanos y se reporta como "Sin operación"

🔧 *¿No sabes generar Cartas Porte?*
Escribe: "ayuda con Cartas Porte" para orientación del Ing. Alberto.`
            },

            // ========================================
            // FAQ 10: QUÉ HACER SI NO TENGO DOCUMENTO
            // ========================================
            {
                id: 'no_tengo_documento',
                nombre: 'No Tengo un Documento',
                prioridad: 10,

                palabrasClave: [
                    'no', 'tengo', 'cuento',
                    'documento', 'dokumento',
                    'que', 'qué', 'hacer'
                ],

                frasesCompletas: [
                    'no tengo',
                    'no cuento',
                    'que hago si',
                    'qué hago si',
                    'no realice'
                ],

                palabrasBloqueo: ['urgente', 'necesito tramitar ahora', 'ayuda urgente'],

                respuesta: () => `📄 *No Tengo un Documento - ¿Qué Hago?*

Primero, identifica **QUÉ tipo** de documento es:

📋 *OPCIÓN 1: Documento Alternativo*
Algunos documentos tienen equivalentes:
- NOM-016 ⟷ Informes de Calidad de Origen  
- Uno u otro sirve (no necesitas ambos)

📋 *OPCIÓN 2: Documento que Debiste Tramitar*
Ejemplo: Dictámenes SCT
→ Son trámites que debiste hacer en su momento
→ Podemos ayudarte a tramitarlos ahora

📋 *OPCIÓN 3: Documento que No Aplica*  
Ejemplo: Si no operaste en diciembre
→ No hay Cartas Porte de diciembre
→ Solo informas "Sin operación ese mes"

💬 *¿Cómo saber cuál es mi caso?*
Escribe: "no tengo [nombre del documento]"

Ejemplos:
- "no tengo Dictámenes SCT"
- "no tengo NOM-016 del 2022"
- "no tengo informes de calidad"

→ Tu especialista te dirá qué hacer en tu caso específico.`
            },

            // ========================================
            // FAQ 11: QUÉ ES EL PORTAL OPE
            // ========================================
            {
                id: 'portal_ope',
                nombre: 'Qué es el Portal OPE',
                prioridad: 11,

                palabrasClave: [
                    'portal', 'ope',
                    'que', 'qué', 'ke',
                    'es', 'transporte'
                ],

                frasesCompletas: [
                    'portal ope',
                    'que es ope',
                    'qué es ope',
                    'portal transporte'
                ],

                palabrasBloqueo: ['error', 'no puedo', 'ayuda con', 'urgente'],

                respuesta: () => `🌐 *Portal OPE - Control Volumétrico*

OPE = Obligaciones de Pemex Expendio

Es el portal donde se suben los reportes de Control Volumétrico de **TRANSPORTE**.

📋 *¿Para qué sirve?*
Es donde reportas cada mes:
- Cuánto combustible recibiste
- Cuánto entregaste
- El balance debe cuadrar

⚖️ *Pregunta frecuente:*
"¿Lo recibido y lo entregado debe ser lo mismo?"

**RESPUESTA:**
- Lo RECIBIDO: Combustible que cargaste en tu autotanque
- Lo ENTREGADO: Combustible que vendiste/entregaste  
- Deben ser prácticamente iguales (pequeñas diferencias por merma son normales)

📚 *¿Necesitas manual?*
Escribe: "manual portal OPE" y te lo compartimos

🆘 *¿Tienes error específico en el portal?*
Escribe: "error en portal OPE: [descripción]" para ayuda del Ing. Alberto.`
            },

            // ========================================
            // FAQ 12: CÓMO SUBIR JSON AL SAT
            // ========================================
            {
                id: 'como_subir_json_sat',
                nombre: 'Cómo Subir JSON al SAT',
                prioridad: 12,

                palabrasClave: [
                    'subir', 'subo', 'como', 'cómo',
                    'json', 'xml', 'sat',
                    'formato', 'proceso'
                ],

                frasesCompletas: [
                    'subir json',
                    'como subir',
                    'cómo subir',
                    'json sat',
                    'xml sat'
                ],

                palabrasBloqueo: ['error', 'rechazado', 'no puedo', 'ayuda con'],

                respuesta: () => `📤 *Cómo Subir JSON/XML al SAT*

Hay 2 sistemas diferentes (no confundir):

1️⃣ *Portal SAT (Controles Volumétricos)*
Para: Anexo 30/31/32
URL: https://www.sat.gob.mx
→ Sección: Mi Portal > Controles Volumétricos

2️⃣ *Portal ASEA*
Para: Reportes mensuales de operación  
URL: https://tramites.asea.gob.mx

📋 *Pasos generales (SAT):*
1. Entra con tu e.firma
2. Ve a "Controles Volumétricos"
3. Selecciona mes y año
4. Sube archivo JSON que FGYA te generó
5. Valida que no tenga errores
6. Envía

⚠️ *Errores comunes:*
- "Formato inválido" → El archivo JSON está mal generado
- "Datos inconsistentes" → Hay errores en las cifras
- "Fuera de plazo" → Se pasó la fecha límite

💡 *¿FGYA genera los JSON?*
SÍ, nosotros generamos tus archivos JSON/XML basados en tus Cartas Porte.
Tú solo tienes que subirlos al SAT.

🔧 *Si tienes error específico:*
Escribe: "error al subir JSON: [descripción]" para ayuda del Ing. Alberto.`
            },

            // ========================================
            // FAQ 13: POR QUÉ FUE RECHAZADO MI JSON
            // ========================================
            {
                id: 'json_rechazado',
                nombre: 'Por qué fue rechazado mi JSON',
                prioridad: 13,

                palabrasClave: [
                    'rechazado', 'rechazaron', 'rechazo',
                    'json', 'invalido', 'inválido',
                    'por', 'que', 'qué', 'porke'
                ],

                frasesCompletas: [
                    'json rechazado',
                    'rechazaron json',
                    'por que rechazo',
                    'json invalido'
                ],

                palabrasBloqueo: ['necesito revisar', 'ayuda con', 'urgente'],

                respuesta: () => `❌ *JSON Rechazado - Causas Comunes*

*1. Error de Formato*
- El archivo no es un JSON válido
- Estructura incorrecta
→ FGYA debe regenerarlo

*2. Datos Inconsistentes*
- Los números no cuadran
- Fechas incorrectas
- RFC no coincide
→ FGYA debe corregir datos fuente

*3. Cartas Porte Incompletas*
- Falta información obligatoria en las Cartas Porte
- Datos vacíos o nulos
→ Necesitas regenerar las Cartas Porte correctas

*4. Fuera de Plazo*
- Se subió después de la fecha límite
→ Proceso de aclaración con SAT

*5. Duplicado*
- Ya existe un reporte para ese período
→ Primero cancelar el anterior

🔍 *Para saber TU causa específica:*
Escribe: "necesito revisar JSON rechazados"
Comparte screenshot del error del SAT
→ Ing. Alberto identificará el problema exacto

⏱️ *¿Cuánto tardan en corregirlo?*
- Si es error de formato: 1-3 días
- Si faltan datos: Depende de conseguir la info`
            },

            // ========================================
            // FAQ 14: REQUISITOS ESPECÍFICOS DE CUBICACIÓN (CAMPO)
            // ========================================
            {
                id: 'requisitos_cubicacion',
                nombre: 'Requisitos Cubicación/Calibración',
                prioridad: 14,

                palabrasClave: [
                    'requisitos', 'rekisitos',
                    'cubicacion', 'cubicación', 'kubicacion',
                    'calibracion', 'calibración',
                    'tanques', 'tanke',
                    'protocolo', 'condiciones',
                    'visita', 'wisita'
                ],

                frasesCompletas: [
                    'requisitos cubicacion',
                    'requisitos calibracion',
                    'protocolo visita',
                    'condiciones visita',
                    'que necesito'
                ],

                palabrasBloqueo: [],

                respuesta: () => `🛠️ *Protocolo y Requisitos: Cubicación de Tanques*

Para la visita técnica de calibración/cubicación, es **indispensable** cumplir con lo siguiente antes de que llegue el ingeniero:

1️⃣ *Nivel del Tanque:* Debe tener **mínimo el 30%** de su capacidad total.

2️⃣ *Venta Cerrada:* Se debe suspender el despacho en el tanque donde se trabajará.

3️⃣ *Seguridad:* Verificar que los tubos de descarga salgan fácilmente (no estén atascados).

4️⃣ *Personal:* Debe estar presente su personal de mantenimiento para retirar tubos y sondas.

⚠️ *Importante:* Si al llegar la brigada no se cumplen estas condiciones, el servicio podría cancelarse o reagendarse.

📞 *¿Necesitas agendar servicio?*
Contacta a:
👤 Sara López
📱 3311101036
📧 sara@fgya.com.mx`
            },

            // ========================================
            // FAQ 15: DÓNDE ESTÁ MI CARPETA SASISOPA
            // ========================================
            {
                id: 'carpeta_sasisopa',
                nombre: 'Dónde está mi Carpeta SASISOPA',
                prioridad: 15,

                palabrasClave: [
                    'carpeta', 'karpeta',
                    'sasisopa', 'sasisopa',
                    'donde', 'dónde', 'onde',
                    'esta', 'está',
                    'encuentro', 'llega', 'llegó'
                ],

                frasesCompletas: [
                    'carpeta sasisopa',
                    'donde carpeta',
                    'dónde está',
                    'no llega',
                    'rastrear carpeta'
                ],

                palabrasBloqueo: [],

                respuesta: () => `📦 *Carpeta SASISOPA - Envío Físico*

La carpeta SASISOPA se envía por **PAQUETERÍA (FedEx)** porque contiene documentos impresos y firmados.

⏱️ *Tiempo de entrega:*
- 5-10 días hábiles después de completar el trámite
- Zonas remotas: hasta 15 días

📍 *¿Cómo saber si ya se envió?*
Escribe: "rastrear carpeta SASISOPA" y te damos el número de guía FedEx

📄 *¿Qué contiene la carpeta?*
- Certificado SASISOPA impreso
- Formatos firmados
- Bitácoras y registros
- Manual de procedimientos

❓ *¿Ya pasaron más de 15 días?*
Escribe: "carpeta SASISOPA retrasada" para que Sara López rastree tu paquete

💡 *Mientras llega:*
Puedes solicitar la versión digital para ir trabajando:
Escribe: "necesito SASISOPA digital mientras llega físico"

📞 *Contacto:*
👤 Sara López
📱 3311101036
📧 sara@fgya.com.mx`
            }

        ];  // Cierra el array this.faqs

    }  // Cierra constructor()

    // ============================================
    // NORMALIZAR TEXTO (quitar acentos, etc.)
    // ============================================
    normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")  // Quita acentos
            .trim();
    }

    // ============================================
    // MÉTODO PRINCIPAL: Detectar si debe usar FAQ
    // ============================================
    debeResponderAutomaticamente(mensaje) {
        const mensajeLower = mensaje.toLowerCase().trim();
        const mensajeNormalizado = this.normalizarTexto(mensaje);

        // 1. Verificar si tiene palabras de URGENCIA
        if (this.tieneUrgencia(mensajeNormalizado)) {
            console.log("🚫 FAQ bloqueada: Mensaje contiene palabras de urgencia");
            return { usarFAQ: false, razon: 'urgencia' };
        }

        // 2. Verificar si tiene palabras de ACCIÓN
        if (this.tieneAccion(mensajeNormalizado)) {
            console.log("🚫 FAQ bloqueada: Mensaje contiene palabras de acción");
            return { usarFAQ: false, razon: 'accion' };
        }

        // 3. Buscar FAQ coincidente (con sistema de puntuación)
        const faq = this.buscarFAQ(mensajeLower, mensajeNormalizado);

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
    tieneUrgencia(mensajeNormalizado) {
        return this.palabrasUrgencia.some(palabra => {
            const palabraNormalizada = this.normalizarTexto(palabra);
            return mensajeNormalizado.includes(palabraNormalizada);
        });
    }

    // ============================================
    // Verificar si tiene palabras de acción
    // ============================================
    tieneAccion(mensajeNormalizado) {
        return this.palabrasAccion.some(palabra => {
            const palabraNormalizada = this.normalizarTexto(palabra);
            return mensajeNormalizado.includes(palabraNormalizada);
        });
    }

    // ============================================
    // Buscar FAQ que coincida con el mensaje
    // NUEVO: Sistema de coincidencia flexible
    // ============================================
    buscarFAQ(mensajeLower, mensajeNormalizado) {
        console.log(`\n🔍 Analizando mensaje: "${mensajeLower.substring(0, 60)}${mensajeLower.length > 60 ? '...' : ''}"`);
        
        // Array para guardar coincidencias con puntuación
        let coincidencias = [];

        for (const faq of this.faqs) {
            // Verificar si tiene palabras de bloqueo específicas de esta FAQ
            if (faq.palabrasBloqueo && faq.palabrasBloqueo.length > 0) {
                const tieneBloqueo = faq.palabrasBloqueo.some(palabra => {
                    const palabraNormalizada = this.normalizarTexto(palabra);
                    return mensajeNormalizado.includes(palabraNormalizada);
                });

                if (tieneBloqueo) {
                    console.log(`   ⚠️ FAQ "${faq.nombre}" bloqueada por palabras de bloqueo`);
                    continue;
                }
            }

            // Sistema de puntuación por coincidencias
            let puntuacion = 0;
            let detalleCoincidencias = [];

            // 1. PRIORIDAD ALTA: Frases completas
            if (faq.frasesCompletas && faq.frasesCompletas.length > 0) {
                for (const frase of faq.frasesCompletas) {
                    const fraseNormalizada = this.normalizarTexto(frase);
                    
                    if (mensajeNormalizado.includes(fraseNormalizada)) {
                        const longitudFrase = fraseNormalizada.split(' ').length;
                        const puntaje = longitudFrase * 10;  // Peso ALTO para frases completas
                        puntuacion += puntaje;
                        detalleCoincidencias.push(`FRASE:"${frase}" (+${puntaje}pts)`);
                    }
                }
            }

            // 2. PRIORIDAD MEDIA: Palabras clave sueltas
            if (faq.palabrasClave && faq.palabrasClave.length > 0) {
                for (const palabra of faq.palabrasClave) {
                    const palabraNormalizada = this.normalizarTexto(palabra);
                    
                    // Buscar como palabra completa (con límites)
                    const regex = new RegExp(`\\b${palabraNormalizada}\\b`, 'i');
                    if (regex.test(mensajeNormalizado)) {
                        const puntaje = 3;  // Peso MEDIO para palabras sueltas
                        puntuacion += puntaje;
                        detalleCoincidencias.push(`"${palabra}" (+${puntaje}pts)`);
                    }
                }
            }

            // Si hay puntuación, agregar a candidatos
            if (puntuacion > 0) {
                coincidencias.push({
                    faq: faq,
                    puntuacion: puntuacion,
                    detalles: detalleCoincidencias
                });
            }
        }

        // Ordenar por puntuación (mayor a menor)
        coincidencias.sort((a, b) => b.puntuacion - a.puntuacion);

        // Si hay coincidencias, devolver la mejor
        if (coincidencias.length > 0) {
            const mejor = coincidencias[0];
            
            // UMBRAL MÍNIMO: Requiere al menos 6 puntos para activar FAQ
            if (mejor.puntuacion >= 6) {
                console.log(`\n🏆 FAQ SELECCIONADA: "${mejor.faq.nombre}" (${mejor.puntuacion} puntos)`);
                console.log(`   Coincidencias: ${mejor.detalles.join(', ')}`);
                
                // Mostrar otras opciones consideradas (para debugging)
                if (coincidencias.length > 1) {
                    console.log(`\n   📋 Otras opciones descartadas:`);
                    coincidencias.slice(1, 3).forEach(c => {
                        console.log(`      • ${c.faq.nombre} (${c.puntuacion} puntos)`);
                    });
                }
                
                return mejor.faq;
            } else {
                console.log(`   ⚠️ FAQ con mayor puntuación: "${mejor.faq.nombre}" (${mejor.puntuacion} pts) pero NO alcanza umbral mínimo (6 pts)\n`);
            }
        }

        console.log(`   ❌ No se encontraron coincidencias suficientes\n`);
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




