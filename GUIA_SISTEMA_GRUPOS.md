# Guía: Sistema de Grupos con Desactivación Automática de IA

## ¿Qué se implementó?

Se agregó un sistema que permite que los clientes y especialistas se comuniquen directamente en grupos de WhatsApp, con la capacidad de que la IA se desactive automáticamente cuando el especialista está presente y se reactive cuando no hay actividad.

---

## Funcionalidades Principales

### 1. **Creación Automática de Grupos**

Cuando un cliente quiere contactar a un especialista:
- El sistema crea automáticamente un grupo de WhatsApp
- El grupo incluye al cliente y al especialista
- El nombre del grupo es: "FGYA - [Nombre del Cliente]"

### 2. **Notificación Inteligente al Especialista**

Al crear el grupo, el especialista recibe:
- Un mensaje generado por IA que le informa que hay un mensaje en el grupo
- Instrucciones claras para responder dentro del grupo
- Información relevante del cliente y su consulta

### 3. **Desactivación Automática de la IA**

Cuando el especialista comienza a responder:
- La IA detecta automáticamente que el especialista está activo
- La IA deja de responder mensajes en ese grupo
- Esto permite que el especialista y el cliente se comuniquen directamente sin interferencia

### 4. **Reactivación Automática**

Si el especialista no responde por 5 minutos:
- La IA se reactiva automáticamente
- La IA vuelve a estar disponible para ayudar al cliente
- Se envía un mensaje al grupo informando que la IA está disponible nuevamente

---

## ¿Cómo Funciona el Flujo?

```
1. Cliente escribe: "quiero hablar con [Especialista]"
   ↓
2. Sistema crea grupo de WhatsApp
   ↓
3. Especialista recibe notificación
   ↓
4. Especialista se une al grupo y responde
   ↓
5. IA se desactiva automáticamente
   ↓
6. Cliente y Especialista se comunican directamente
   ↓
7. Si el especialista no responde por 5 minutos:
   ↓
8. IA se reactiva automáticamente
```

---

## Casos de Uso

### Caso 1: Cliente quiere contactar especialista

**Cliente escribe:** "Necesito una factura, quiero hablar con Janeth Bautista"

**Lo que sucede:**
1. Se crea un grupo llamado "FGYA - [Nombre del Cliente]"
2. Janeth Bautista recibe una notificación
3. El cliente recibe confirmación de que el grupo fue creado
4. Cuando Janeth responde, la IA se desactiva
5. Cliente y Janeth pueden comunicarse directamente

### Caso 2: Especialista está activo

**En el grupo:**
- Cliente escribe: "Hola, necesito ayuda"
- **IA NO responde** (porque el especialista está activo)
- Especialista responde directamente al cliente

### Caso 3: Especialista se va y vuelve la IA

**En el grupo:**
- Especialista responde al cliente
- Pasan 5 minutos sin que el especialista escriba
- **IA se reactiva automáticamente**
- Cliente puede seguir preguntando y la IA responderá

---

## Configuración Requerida

### Variables de Entorno (.env)

Asegúrate de tener configurado:

```env
# Números de WhatsApp de Especialistas
ESPECIALISTA_JANETH_SILVA_WHATSAPP=5213321571469@c.us
ESPECIALISTA_NOEMI_HERNANDEZ_WHATSAPP=5213313078636@c.us
# ... (otros especialistas)
```

**Nota:** El formato del número debe ser: `521[numero]@c.us`

---

## Cómo Probar

### Prueba Básica

1. **Envía un mensaje al bot:**
   ```
   "Quiero hablar con Janeth Bautista"
   ```

2. **Verifica:**
   - Recibes confirmación de que el grupo fue creado
   - El especialista recibe notificación
   - Se crea el grupo en WhatsApp

3. **En el grupo:**
   - Escribe un mensaje
   - El especialista responde
   - La IA NO responde (está desactivada)

4. **Espera 5 minutos sin que el especialista escriba:**
   - La IA se reactiva automáticamente
   - Puedes escribir y la IA responderá

---

## Archivos Creados/Modificados

### Nuevo Archivo
- `utils/groupManager.js` - Sistema de gestión de grupos

### Archivos Modificados
- `routes/chatbot.js` - Integración del sistema de grupos

### Archivo de Datos
- `data/grupos-whatsapp.json` - Almacenamiento de grupos activos

---

## Monitoreo y Logs

El sistema genera logs claros para monitorear el funcionamiento:

```
Mensaje recibido en grupo: [ID del grupo]
Mensaje de especialista detectado en grupo [ID]
IA desactivada - No se responderá al mensaje del especialista
Reactivación de IA programada para grupo [ID] en 5 minutos
IA reactivada automáticamente en grupo [ID]
```

---

## Notas Importantes

1. **Permisos del Bot:**
   - El bot necesita permisos para crear grupos en WhatsApp
   - El bot debe poder agregar participantes a los grupos

2. **Formato de Números:**
   - Todos los números deben estar en formato internacional
   - Formato: `521[numero]@c.us` (donde 521 es el código de México)

3. **Límite de Tiempo:**
   - La reactivación automática ocurre después de 5 minutos de inactividad
   - Este tiempo es configurable en el código si es necesario

4. **Limpieza Automática:**
   - Los grupos antiguos (más de 24 horas) se limpian automáticamente
   - Esto mantiene el sistema optimizado

---

## Beneficios

✅ **Comunicación Directa:** Cliente y especialista se comunican sin intermediarios

✅ **Sin Interferencias:** La IA no interrumpe cuando el especialista está presente

✅ **Automatización Inteligente:** La IA se reactiva automáticamente cuando es necesario

✅ **Experiencia Mejorada:** El cliente tiene acceso tanto a la IA como al especialista según necesite

✅ **Notificaciones Claras:** El especialista sabe exactamente qué hacer y dónde responder

---

## Solución de Problemas

### El grupo no se crea

**Posibles causas:**
- El bot no tiene permisos para crear grupos
- Los números no están en el formato correcto
- Falta configuración en el archivo `.env`

**Solución:**
- Verifica los permisos del bot en WhatsApp
- Revisa que los números estén en formato `521[numero]@c.us`
- Asegúrate de tener las variables de entorno configuradas

### La IA no se desactiva

**Posibles causas:**
- El número del especialista no coincide
- El grupo no está registrado correctamente

**Solución:**
- Verifica que el número del especialista en `.env` coincida exactamente
- Revisa los logs para ver si el grupo se registró correctamente

### La IA no se reactiva

**Posibles causas:**
- El timer no se está ejecutando correctamente
- Hay un error en el sistema de reactivación

**Solución:**
- Revisa los logs para ver si hay errores
- Verifica que el servidor esté corriendo correctamente

---

## Soporte

Si tienes problemas o preguntas:
1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Consulta los archivos de datos en `data/grupos-whatsapp.json`

---

## Resumen

Este sistema permite que:
- Los clientes y especialistas se comuniquen directamente en grupos
- La IA se desactive automáticamente cuando el especialista está presente
- La IA se reactive cuando el especialista no está disponible
- Todo funcione de forma automática sin intervención manual

¡El sistema está listo para usar! 🚀

