# 📱 Guía: Configuración de WhatsApp para Especialistas

Esta guía explica cómo configurar los números de WhatsApp de los especialistas para que reciban notificaciones cuando un cliente quiera contactarlos.

## 🎯 Funcionalidad

Cuando un cliente escribe mensajes como:
- "contactar"
- "quiero hablar con [nombre del especialista]"
- "conectar con [especialista]"

El sistema automáticamente:
1. ✅ Obtiene los datos del cliente (nombre, teléfono, WhatsApp)
2. ✅ Envía una notificación al especialista con los datos del cliente
3. ✅ Confirma al cliente que la notificación fue enviada

## ⚙️ Configuración en .env

Agrega las siguientes variables en tu archivo `.env`:

```env
# Números de WhatsApp de Especialistas (formato: 5213312345678@c.us)
ESPECIALISTA_JANETH_SILVA_WHATSAPP=5213321571469@c.us
ESPECIALISTA_NOEMI_HERNANDEZ_WHATSAPP=5213313078636@c.us
ESPECIALISTA_FRANCISCO_RAMIREZ_WHATSAPP=5213313332696@c.us
ESPECIALISTA_SARA_LOPEZ_WHATSAPP=5213311101036@c.us
ESPECIALISTA_AURORA_CHAVIRA_WHATSAPP=5213317490504@c.us
ESPECIALISTA_ANA_PAULA_FIGUEROA_WHATSAPP=5213329499077@c.us
ESPECIALISTA_ALFREDO_ZAMUDIO_WHATSAPP=5213318647476@c.us
ESPECIALISTA_JANETH_BAUTISTA_WHATSAPP=5213328339619@c.us
```

## 📝 Formato del Número

El formato debe ser: `521[numero]@c.us`

Donde:
- `521` = código de país de México
- `[numero]` = número de teléfono sin espacios ni guiones (ej: 3312345678)
- `@c.us` = sufijo de WhatsApp

### Ejemplos:

- Número: `33 1234 5678` → `5213312345678@c.us`
- Número: `3321571469` → `5213321571469@c.us`
- Número: `(33) 3407-0123` → `5213334070123@c.us`

## 🔍 Cómo Obtener el ID de WhatsApp

1. **Desde el bot:**
   - El ID aparece en los logs cuando alguien envía un mensaje
   - Formato: `5213312345678@c.us`

2. **Desde el código:**
   - El `message.from` contiene el ID completo
   - Ejemplo: `5213312345678@c.us`

3. **Convertir número normal a formato WhatsApp:**
   - Agregar `521` al inicio
   - Agregar `@c.us` al final
   - Ejemplo: `3312345678` → `5213312345678@c.us`

## 🧪 Prueba

1. **Configura el .env** con al menos un especialista
2. **Reinicia el servidor**
3. **Envía un mensaje al bot:** "Necesito una factura"
4. **Luego escribe:** "contactar" o "quiero hablar con Janeth Bautista"
5. **Verifica:**
   - El cliente recibe confirmación
   - El especialista recibe notificación con los datos del cliente

## 📨 Mensaje que Recibe el Especialista

```
🔔 Nueva Solicitud de Contacto

Un cliente desea contactarte:

👤 Datos del Cliente:
• Nombre: Juan Pérez
• Teléfono: 3312345678
• WhatsApp: 5213312345678@c.us
• Email: juan@ejemplo.com
• Consulta: Necesito una factura

📅 Fecha: 21/11/2025, 10:30:45

💬 Puedes responder directamente a este número de WhatsApp.
```

## ⚠️ Notas Importantes

1. **El especialista debe tener WhatsApp Business** o WhatsApp normal activo
2. **El número debe estar registrado** en WhatsApp
3. **El bot debe tener permiso** para enviar mensajes a ese número
4. **Si el número no está configurado**, el sistema mostrará una advertencia pero no fallará

## 🔧 Solución de Problemas

### ❌ "No se encontró número de WhatsApp para especialista"
- **Causa:** La variable no está en `.env` o tiene un nombre incorrecto
- **Solución:** Verifica que el nombre de la variable sea exactamente: `ESPECIALISTA_[ID]_WHATSAPP`
- **Ejemplo:** Para `janeth-silva` → `ESPECIALISTA_JANETH_SILVA_WHATSAPP`

### ❌ El especialista no recibe el mensaje
- **Causa 1:** El número está mal formateado
- **Solución:** Verifica que tenga el formato `521[numero]@c.us`

- **Causa 2:** El número no está registrado en WhatsApp
- **Solución:** Asegúrate de que el número tenga WhatsApp activo

- **Causa 3:** El bot no tiene permiso
- **Solución:** El bot debe poder enviar mensajes a números que no están en sus contactos

### ✅ Verificar que Funciona

Revisa los logs del servidor:
```
📞 Cliente quiere contactar con especialista: Janeth Bautista
✅ Notificación enviada a Janeth Bautista (5213328339619@c.us)
```

## 📋 Lista de IDs de Especialistas

| Especialista | ID | Variable .env |
|-------------|-----|---------------|
| Janeth Silva | `janeth-silva` | `ESPECIALISTA_JANETH_SILVA_WHATSAPP` |
| Noemí Hernández | `noemi-hernandez` | `ESPECIALISTA_NOEMI_HERNANDEZ_WHATSAPP` |
| Francisco Ramírez | `francisco-ramirez` | `ESPECIALISTA_FRANCISCO_RAMIREZ_WHATSAPP` |
| Sara López | `sara-lopez` | `ESPECIALISTA_SARA_LOPEZ_WHATSAPP` |
| Aurora Chavira | `aurora-chavira` | `ESPECIALISTA_AURORA_CHAVIRA_WHATSAPP` |
| Ana Paula Figueroa | `ana-paula-figueroa` | `ESPECIALISTA_ANA_PAULA_FIGUEROA_WHATSAPP` |
| J. Alfredo Zamudio | `alfredo-zamudio` | `ESPECIALISTA_ALFREDO_ZAMUDIO_WHATSAPP` |
| Janeth Bautista | `janeth-bautista` | `ESPECIALISTA_JANETH_BAUTISTA_WHATSAPP` |

## 🚀 Ejemplo Completo de .env

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=...

# Power Automate
POWER_AUTOMATE_WEBHOOK_URL=https://...

# Especialistas WhatsApp
ESPECIALISTA_JANETH_SILVA_WHATSAPP=5213321571469@c.us
ESPECIALISTA_NOEMI_HERNANDEZ_WHATSAPP=5213313078636@c.us
ESPECIALISTA_FRANCISCO_RAMIREZ_WHATSAPP=5213313332696@c.us
ESPECIALISTA_SARA_LOPEZ_WHATSAPP=5213311101036@c.us
ESPECIALISTA_AURORA_CHAVIRA_WHATSAPP=5213317490504@c.us
ESPECIALISTA_ANA_PAULA_FIGUEROA_WHATSAPP=5213329499077@c.us
ESPECIALISTA_ALFREDO_ZAMUDIO_WHATSAPP=5213318647476@c.us
ESPECIALISTA_JANETH_BAUTISTA_WHATSAPP=5213328339619@c.us
```

¡Listo! Con esta configuración, los especialistas recibirán notificaciones cuando los clientes quieran contactarlos. 🎉

