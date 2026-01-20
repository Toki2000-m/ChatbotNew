# 🧪 Guía de Pruebas - Sistema de Gestión de Tareas FGYA

Esta guía te ayudará a probar todas las funcionalidades implementadas del sistema de gestión de tareas.

## 📋 Preparación

1. **Asegúrate de que el servidor esté corriendo:**
   ```bash
   node server.js
   ```

2. **Verifica que tengas configurado:**
   - ✅ `OPENAI_API_KEY` en `.env`
   - ✅ `GOOGLE_DRIVE_FOLDER_ID` en `.env`
   - ✅ `POWER_AUTOMATE_WEBHOOK_URL` en `.env` (opcional para pruebas)
   - ✅ Tokens de Google Drive válidos (`node drive-auth.js` si es necesario)

3. **Prepara tu WhatsApp** para enviar mensajes de prueba al bot

---

## 🧪 Casos de Prueba

### Prueba 1: Filtrado de Mensajes Innecesarios ✅

**Objetivo:** Verificar que mensajes simples no generan tareas

**Pasos:**
1. Envía al bot: `"ok"`
2. Envía al bot: `"gracias"`
3. Envía al bot: `"bonito día"`
4. Envía al bot: `"👍"`

**Resultado Esperado:**
- ✅ El bot responde brevemente (ej: "¡Gracias! 😊 ¿En qué más puedo ayudarte?")
- ✅ **NO se crea ninguna tarea**
- ✅ En los logs verás: `🚫 Mensaje innecesario detectado`

**Verificación:**
- Revisa `data/tareas.json` - no debería haber tareas nuevas
- Revisa los logs de la consola

---

### Prueba 2: Agrupación de Mensajes (30 minutos) 📝

**Objetivo:** Verificar que mensajes del mismo tema se agrupan

**Pasos:**
1. Envía: `"Necesito información sobre auditorías"`
2. Espera 1 minuto
3. Envía: `"¿Cuánto cuesta una auditoría?"`
4. Espera 1 minuto
5. Envía: `"¿Cuándo pueden hacerla?"`

**Resultado Esperado:**
- ✅ Los primeros 2 mensajes se agrupan (no se crea tarea aún)
- ✅ Al enviar el 3er mensaje, se crea **una sola tarea** con los 3 mensajes
- ✅ En los logs verás:
  - `🆕 Nuevo grupo creado: grupo_xxx - Tema: Auditorías`
  - `📝 Mensaje agregado a grupo existente: grupo_xxx`
  - `✅ Tarea creada: tarea_xxx - Responsable: Janeth Silva`

**Verificación:**
- Revisa `data/tareas.json` - debería haber 1 tarea con 3 mensajes agrupados
- La tarea debe tener:
  - `titulo`: "Auditorías" o similar
  - `descripcion`: Los 3 mensajes concatenados
  - `responsable.nombre`: "Janeth Silva" (asignado automáticamente)

---

### Prueba 3: Asignación Automática a Especialistas 👥

**Objetivo:** Verificar que se asigna al especialista correcto según el tema

**Casos de Prueba:**

#### 3.1 - Auditorías → Janeth Silva
- Envía: `"Necesito una auditoría ISO 9001"`
- **Esperado:** Tarea asignada a **Janeth Silva**

#### 3.2 - Anexo 30 → Ana Paula Figueroa
- Envía: `"Necesito ayuda con el anexo 30"`
- **Esperado:** Tarea asignada a **Ana Paula Figueroa**

#### 3.3 - Capacitación → Noemí Hernández
- Envía: `"Quiero información sobre programas de capacitación"`
- **Esperado:** Tarea asignada a **Noemí Hernández**

#### 3.4 - Consulta General → Equipo General
- Envía: `"Hola, tengo una consulta"`
- **Esperado:** Tarea asignada a **Equipo General** (default)

**Verificación:**
- Revisa `data/tareas.json`
- Cada tarea debe tener el `responsable` correcto según las palabras clave

---

### Prueba 4: Archivos con Caption 📎

**Objetivo:** Verificar que los archivos se asocian correctamente a tareas

**Pasos:**
1. Envía una imagen con caption: `"Este es el documento de la auditoría"`
2. Espera a que se procese

**Resultado Esperado:**
- ✅ El archivo se sube a Google Drive
- ✅ Se crea un grupo/mensaje con el caption
- ✅ El archivo se asocia a la tarea cuando se crea
- ✅ En los logs verás:
  - `📥 Archivo detectado`
  - `📤 Archivo subido a Drive: ...`
  - `💬 Procesando caption del archivo: ...`

**Verificación:**
- Revisa `data/tareas.json`
- La tarea debe tener en `archivos`: `[{nombre, link, tipo}]`
- El link debe ser válido de Google Drive

---

### Prueba 5: Archivos sin Caption 📁

**Objetivo:** Verificar que archivos sin texto también se procesan

**Pasos:**
1. Envía un archivo (imagen, PDF, etc.) **sin caption**

**Resultado Esperado:**
- ✅ El archivo se sube a Google Drive
- ✅ Se crea un mensaje automático: "Archivo recibido: [nombre]"
- ✅ Se procesa con el sistema de tareas

**Verificación:**
- Revisa los logs
- Revisa `data/tareas.json` - el archivo debe estar asociado

---

### Prueba 6: Ventana Extendida (45 minutos) ⏰

**Objetivo:** Verificar que si hay múltiples mensajes, se extiende la ventana

**Pasos:**
1. Envía: `"Necesito información sobre certificación"`
2. Espera 35 minutos
3. Envía: `"¿Cuánto tiempo tarda?"`
4. Espera 5 minutos
5. Envía: `"Perfecto, procedo"`

**Resultado Esperado:**
- ✅ Aunque pasaron 40 minutos, los mensajes se agrupan (ventana extendida a 45 min)
- ✅ Se crea una sola tarea con los 3 mensajes

**Nota:** Esta prueba requiere esperar, puedes ajustar los tiempos en `utils/taskManager.js` para pruebas más rápidas.

---

### Prueba 7: Mensajes de Diferentes Temas 🎯

**Objetivo:** Verificar que mensajes de temas diferentes crean tareas separadas

**Pasos:**
1. Envía: `"Necesito una auditoría"` (3 veces para crear tarea)
2. Espera 1 minuto
3. Envía: `"Quiero información sobre anexo 30"` (3 veces para crear tarea)

**Resultado Esperado:**
- ✅ Se crean **2 tareas separadas**
- ✅ Tarea 1: Tema "Auditorías" → Janeth Silva
- ✅ Tarea 2: Tema "Anexo 30" → Ana Paula Figueroa

**Verificación:**
- Revisa `data/tareas.json` - debe haber 2 tareas con diferentes temas y responsables

---

### Prueba 8: Integración con Power Automate 🔗

**Objetivo:** Verificar que las tareas se envían a Microsoft Lists

**Pasos:**
1. Asegúrate de tener `POWER_AUTOMATE_WEBHOOK_URL` configurado
2. Crea una tarea (envía 3 mensajes sobre un tema)
3. Revisa los logs

**Resultado Esperado:**
- ✅ En los logs verás: `📤 Enviando tarea a Power Automate`
- ✅ `✅ Tarea enviada exitosamente a Power Automate. Status: 200`
- ✅ La tarea aparece en Microsoft Lists

**Verificación:**
- Revisa Microsoft Lists
- La tarea debe tener todos los campos mapeados correctamente

---

### Prueba 9: Flujo de Soporte (sin cambios) 🆘

**Objetivo:** Verificar que el flujo de soporte sigue funcionando

**Pasos:**
1. Envía: `"necesito soporte"`
2. Completa el formulario (nombre, teléfono, email, descripción)

**Resultado Esperado:**
- ✅ Se inicia el flujo de soporte
- ✅ Se envían los datos a Power Automate
- ✅ **NO se crea tarea** (es un flujo diferente)

**Verificación:**
- Revisa los logs
- Revisa Power Automate / Microsoft Lists para la solicitud de soporte

---

### Prueba 10: Respuesta del Bot con IA 🤖

**Objetivo:** Verificar que el bot sigue respondiendo normalmente

**Pasos:**
1. Envía: `"¿Qué servicios ofrecen?"`
2. Envía: `"¿Cuál es su horario?"`

**Resultado Esperado:**
- ✅ El bot responde con información útil
- ✅ **NO se crea tarea** (solo información)
- ✅ La respuesta es coherente y profesional

---

## 📊 Verificación de Logs

Revisa los logs en la consola para verificar que todo funciona:

### Logs Esperados:

```
✅ Clave OpenAI detectada correctamente
💬 Mensaje de texto recibido: ...
🚫 Mensaje innecesario detectado, respondiendo brevemente sin crear tarea
📋 Resultado procesamiento: mensaje_innecesario

🆕 Nuevo grupo creado: grupo_xxx - Tema: Auditorías
📝 Mensaje agregado a grupo existente: grupo_xxx
✅ Tarea creada: tarea_xxx - Responsable: Janeth Silva
📤 Enviando tarea a Power Automate
✅ Tarea enviada exitosamente a Power Automate. Status: 200

📥 Archivo detectado - Tipo: image/jpeg
📤 Archivo subido a Drive: archivo.jpg - ID: xxx
💬 Procesando caption del archivo: ...
```

---

## 🔍 Verificación de Archivos

### 1. Revisar `data/tareas.json`

```json
{
  "tareas": [
    {
      "id": "tarea_xxx",
      "titulo": "Auditorías",
      "descripcion": "Mensaje 1\n\nMensaje 2\n\nMensaje 3",
      "responsable": {
        "nombre": "Janeth Silva",
        "telefono": "3321571469",
        "email": "auditorfg@fg.com.mx"
      },
      "vencimiento": "2024-02-XX...",
      "archivos": [...],
      "estatus": "Pendiente"
    }
  ],
  "grupos": [...]
}
```

### 2. Revisar Google Drive

- Los archivos deben estar en la carpeta configurada
- Los links deben ser accesibles

### 3. Revisar Microsoft Lists (si está configurado)

- Las tareas deben aparecer con todos los campos
- El responsable debe estar asignado correctamente

---

## ⚠️ Problemas Comunes

### ❌ No se crean tareas
- **Causa:** Los mensajes son muy cortos o se detectan como innecesarios
- **Solución:** Envía mensajes más largos y con contenido sustancial

### ❌ No se asigna el especialista correcto
- **Causa:** Las palabras clave no coinciden
- **Solución:** Revisa `config/especialistas.json` y ajusta las palabras clave

### ❌ Los archivos no se suben
- **Causa:** Token de Google Drive expirado
- **Solución:** Ejecuta `node drive-auth.js`

### ❌ No se envían a Power Automate
- **Causa:** `POWER_AUTOMATE_WEBHOOK_URL` no está configurado o es inválido
- **Solución:** Verifica la URL en `.env`

---

## ✅ Checklist de Pruebas

- [ ] Prueba 1: Filtrado de mensajes innecesarios
- [ ] Prueba 2: Agrupación de mensajes
- [ ] Prueba 3: Asignación automática (todos los casos)
- [ ] Prueba 4: Archivos con caption
- [ ] Prueba 5: Archivos sin caption
- [ ] Prueba 6: Ventana extendida (opcional, requiere tiempo)
- [ ] Prueba 7: Mensajes de diferentes temas
- [ ] Prueba 8: Integración con Power Automate
- [ ] Prueba 9: Flujo de soporte
- [ ] Prueba 10: Respuesta del bot con IA

---

## 🎯 Prueba Rápida (5 minutos)

Si quieres una prueba rápida, ejecuta estos pasos:

1. ✅ Envía: `"ok"` → Debe responder sin crear tarea
2. ✅ Envía: `"Necesito una auditoría ISO 9001"` (3 veces) → Debe crear tarea para Janeth Silva
3. ✅ Envía una imagen con caption: `"Este es el documento"` → Debe subir y asociar a tarea
4. ✅ Revisa `data/tareas.json` → Debe haber tareas creadas

---

¡Listo! Con estas pruebas podrás verificar que todo el sistema funciona correctamente. 🚀

