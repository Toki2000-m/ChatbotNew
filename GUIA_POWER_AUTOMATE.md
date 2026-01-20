# 🔧 Guía de Configuración: Power Automate + Webhook + Microsoft Lists

Esta guía te ayudará a configurar Power Automate para recibir las solicitudes de soporte desde WhatsApp y guardarlas en Microsoft Lists.

## 📋 Paso 1: Crear el Flujo en Power Automate

1. **Accede a Power Automate**
   - Ve a [https://powerautomate.microsoft.com](https://powerautomate.microsoft.com)
   - Inicia sesión con tu cuenta de Microsoft

2. **Crear un nuevo flujo**
   - Haz clic en **"Crear"** → **"Flujo instantáneo"** o **"Flujo automatizado"**
   - O ve a **"Mis flujos"** → **"Nuevo flujo"** → **"Flujo instantáneo"**

3. **Agregar el trigger HTTP**
   - Busca y selecciona: **"Cuando se recibe una solicitud HTTP"**
   - Este será el webhook que recibirá los datos del chatbot

## 📋 Paso 2: Configurar el Trigger HTTP

1. **Configurar el método y esquema JSON**
   - **Método HTTP**: Selecciona **POST**
   - **Esquema JSON de solicitud**: Haz clic en **"Usar la carga útil de ejemplo para generar el esquema"**
   - Pega este JSON de ejemplo (o usa el archivo `power-automate-schema.json`):

```json
{
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "3312345678",
    "whatsapp": "5213312345678@c.us",
    "descripción": "Necesito ayuda con mi certificación"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "fuente": "WhatsApp Bot",
  "tipo": "Solicitud de Soporte"
}
```

2. **Guardar el flujo**
   - Haz clic en **"Guardar"**
   - Power Automate generará automáticamente la **URL del webhook**
   - **¡IMPORTANTE!** Copia esta URL, la necesitarás para el archivo `.env`

## 📋 Paso 3: Agregar Acción para Microsoft Lists

1. **Agregar nueva acción**
   - Haz clic en **"+ Nuevo paso"**
   - Busca: **"Agregar una fila"** (Add a row)
   - Selecciona el conector de **SharePoint** o **Microsoft Lists**

2. **Configurar la lista**
   - **Sitio**: Selecciona tu sitio de SharePoint
   - **Nombre de la lista**: Selecciona o crea una lista llamada "Solicitudes de Soporte"

3. **Mapear los campos** (⚠️ IMPORTANTE: Usa el panel de contenido dinámico)
   
   Para cada campo, haz clic en el campo y selecciona del panel de contenido dinámico:
   
   - **Título** (Title): Busca y selecciona `nombre` dentro de `usuario` (no escribas "usuario.nombre" como texto)
   - **Teléfono**: Selecciona `telefono` dentro de `usuario`
   - **Email**: Selecciona `email` dentro de `usuario`
   - **Descripción**: Selecciona `descripción` dentro de `usuario`
   - **Fecha**: Selecciona `timestamp` (está en el nivel raíz)
   - **WhatsApp ID**: Selecciona `whatsapp` dentro de `usuario`
   - **Fuente**: Selecciona `fuente` (está en el nivel raíz)
   - **Tipo**: Selecciona `tipo` (está en el nivel raíz)
   
   **💡 Consejo**: En Power Automate, cuando hagas clic en un campo, aparecerá un panel lateral con "Contenido dinámico". Expande el objeto `usuario` y selecciona los campos desde ahí. NO escribas manualmente "usuario.nombre", sino que debes seleccionarlo del panel.

## 📋 Paso 4: Crear la Lista en Microsoft Lists (si no existe)

1. **Crear nueva lista**
   - Ve a [https://lists.microsoft.com](https://lists.microsoft.com)
   - Haz clic en **"Nueva lista"**
   - Selecciona **"Lista en blanco"**

2. **Agregar columnas**
   - **Título** (ya existe por defecto)
   - **Teléfono**: Tipo "Texto de una sola línea"
   - **Email**: Tipo "Texto de una sola línea"
   - **Descripción**: Tipo "Texto de varias líneas"
   - **Fecha**: Tipo "Fecha y hora"
   - **WhatsApp ID**: Tipo "Texto de una sola línea"
   - **Fuente**: Tipo "Texto de una sola línea"
   - **Tipo**: Tipo "Texto de una sola línea"
   - **Estado**: Tipo "Elección" (Pendiente, En Proceso, Resuelto)

3. **Guardar la lista**
   - Nombra la lista: **"Solicitudes de Soporte"**
   - Haz clic en **"Crear"**

## 📋 Paso 5: Configurar el archivo .env

1. **Abrir el archivo `.env`** en la raíz del proyecto
2. **Agregar la URL del webhook**:

```env
POWER_AUTOMATE_WEBHOOK_URL=https://defaultfb4eebd6e8a6405eb66ee2bd43a138.b8.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e0240211a46f4096a042e131300e3cc2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PczdK6qXyev4TlGFuwndYaOQZ0RrBlrFhq8Iw591iIM
```

**Nota**: Reemplaza la URL con la que Power Automate te proporcionó en el Paso 2.

## 📋 Paso 6: Probar el Flujo

1. **Activar el flujo en Power Automate**
   - Ve a tu flujo
   - Haz clic en **"Activar"** o **"Encender"**

2. **Probar desde WhatsApp**
   - Envía un mensaje al bot: "necesito soporte"
   - Completa el formulario con tus datos
   - Verifica que los datos aparezcan en Microsoft Lists

## 🔍 Estructura de Datos Enviados

El chatbot envía los siguientes datos en formato JSON (estructura anidada):

```json
{
  "usuario": {
    "nombre": "Nombre completo del usuario",
    "email": "Correo electrónico",
    "telefono": "Número de teléfono",
    "whatsapp": "ID de WhatsApp",
    "descripción": "Descripción del problema o consulta"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "fuente": "WhatsApp Bot",
  "tipo": "Solicitud de Soporte"
}
```

**Nota**: Los datos del usuario están dentro del objeto `usuario`, y hay campos adicionales como `timestamp`, `fuente` y `tipo` para mejor organización.

## ⚠️ Solución de Problemas

### Error: "POWER_AUTOMATE_WEBHOOK_URL no está configurado"
- Verifica que el archivo `.env` existe y tiene la variable configurada
- Reinicia el servidor después de agregar la variable

### Error: "Error al enviar datos a Power Automate"
- Verifica que la URL del webhook sea correcta
- Asegúrate de que el flujo esté activado en Power Automate
- Revisa los logs del servidor para ver el error específico

### Los datos no aparecen en Microsoft Lists
- Verifica que el flujo esté activado
- Revisa que los nombres de las columnas en Lists coincidan con los campos mapeados
- Ejecuta el flujo manualmente desde Power Automate para ver si hay errores

### Los datos aparecen como texto literal (ej: "usuario.nombre" en lugar del nombre real)
- **Problema**: Estás escribiendo los nombres de los campos como texto en lugar de usar el contenido dinámico
- **Solución**: 
  1. Haz clic en el campo que quieres mapear
  2. Aparecerá un panel lateral con "Contenido dinámico"
  3. Expande el objeto `usuario` (o busca directamente el campo)
  4. Haz clic en el campo que necesitas (ej: `nombre`, `email`, etc.)
  5. NO escribas manualmente "usuario.nombre" - siempre usa el panel de contenido dinámico
  6. Si no ves el panel, haz clic en el ícono de "Contenido dinámico" en la barra de herramientas

## 📝 Notas Adicionales

- El webhook de Power Automate expira después de 90 días de inactividad
- Si el webhook expira, necesitarás generar una nueva URL
- Considera agregar notificaciones por email cuando se reciba una nueva solicitud
- Puedes agregar más acciones al flujo, como enviar un email de confirmación al usuario

