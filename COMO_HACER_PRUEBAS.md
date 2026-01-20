# 🧪 Cómo Hacer Pruebas - Guía Rápida

Esta guía te muestra cómo probar el sistema de forma rápida y sencilla.

---

## 📋 Paso 1: Preparar el Entorno

### 1.1 Verificar Configuración

Asegúrate de tener un archivo `.env` con:

```env
OPENAI_API_KEY=tu_clave_aqui
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id
POWER_AUTOMATE_WEBHOOK_URL=tu_webhook_url (opcional)
ESPECIALISTA_JANETH_BAUTISTA_WHATSAPP=5213328339619@c.us
# ... otros especialistas
```

### 1.2 Verificar Chrome

Si tienes problemas con Chrome, ejecuta:

```bash
node solucionar-chrome.js
```

---

## 🚀 Paso 2: Iniciar el Servidor

### Opción A: Inicio Normal

```bash
node server.js
```

### Opción B: Con Logs Detallados

```bash
DEBUG=* node server.js
```

### ✅ Lo que deberías ver:

```
✅ Chrome del sistema detectado en macOS
✅ Clave OpenAI detectada correctamente
✅ WhatsApp conectado exitosamente para FGYA
🚀 Servidor FGYA corriendo en http://localhost:3000
```

**Si ves estos mensajes, el servidor está funcionando correctamente.**

---

## 🧪 Paso 3: Pruebas Básicas

### Prueba 1: Mensaje Simple

**Envía al bot:**
```
Hola
```

**Resultado esperado:**
- El bot responde con un saludo
- No se crea ninguna tarea

---

### Prueba 2: Consulta con IA

**Envía al bot:**
```
¿Qué servicios ofrecen?
```

**Resultado esperado:**
- El bot responde con información sobre los servicios
- La respuesta es generada por IA

---

### Prueba 3: Crear Grupo con Especialista

**Envía al bot:**
```
Quiero hablar con Janeth Bautista
```

**Resultado esperado:**
- Recibes confirmación de que el grupo fue creado
- El especialista recibe una notificación
- Se crea un grupo en WhatsApp llamado "FGYA - [Tu Nombre]"

**Verifica en los logs:**
```
👥 Creando grupo de WhatsApp para cliente y especialista...
✅ Grupo creado con createGroup: [ID]
✅ Grupo registrado: [ID] - Estado: ia_activa
```

---

### Prueba 4: Desactivación de IA

**En el grupo creado:**

1. **Escribe un mensaje:**
   ```
   Hola, necesito ayuda con una factura
   ```

2. **El especialista responde** (desde su WhatsApp)

3. **Verifica:**
   - La IA NO responde (está desactivada)
   - Solo el especialista puede responder

**Logs esperados:**
```
👥 Mensaje recibido en grupo: [ID]
👤 Mensaje de especialista detectado en grupo [ID]
🔇 IA desactivada - No se responderá al mensaje del especialista
```

---

### Prueba 5: Reactivación Automática de IA

**En el grupo:**

1. El especialista deja de responder
2. Espera 5 minutos
3. Escribe un mensaje nuevo

**Resultado esperado:**
- La IA se reactiva automáticamente
- La IA responde a tu mensaje

**Logs esperados:**
```
🔊 IA reactivada automáticamente en grupo [ID] después de 5 minutos de inactividad
```

---

## 📊 Paso 4: Verificar Resultados

### Verificar Grupos Creados

Revisa el archivo: `data/grupos-whatsapp.json`

```json
{
  "grupos": [
    {
      "id": "[ID del grupo]",
      "nombre": "FGYA - [Nombre]",
      "estado": "especialista_activo",
      "fechaCreacion": "2024-..."
    }
  ]
}
```

### Verificar Tareas Creadas

Revisa el archivo: `data/tareas.json`

Deberías ver tareas con:
- `titulo`: Tema detectado
- `responsable`: Especialista asignado
- `estatus`: "Pendiente"

---

## 🎯 Pruebas Avanzadas

### Prueba de Asignación Automática

**Envía mensajes sobre diferentes temas:**

1. **Auditorías:**
   ```
   Necesito una auditoría ISO 9001
   ```
   → Debe asignarse a **Janeth Silva**

2. **Facturación:**
   ```
   Necesito una factura
   ```
   → Debe asignarse a **Janeth Bautista**

3. **Anexo 30:**
   ```
   Necesito ayuda con el anexo 30
   ```
   → Debe asignarse a **Ana Paula Figueroa**

**Verifica en `data/tareas.json`** que cada tarea tenga el responsable correcto.

---

### Prueba de Archivos

**Envía una imagen al bot:**

1. Toma una foto o envía una imagen
2. Opcionalmente agrega un texto (caption)

**Resultado esperado:**
- El archivo se sube a Google Drive
- Recibes un link de confirmación
- Si tiene caption, se procesa como mensaje normal

**Logs esperados:**
```
📥 Archivo detectado - Tipo: image/jpeg
✅ Archivo guardado temporalmente
📤 Archivo subido a Drive: [nombre] - ID: [id]
```

---

## 🔍 Monitoreo en Tiempo Real

### Ver Logs del Servidor

Mientras pruebas, observa la consola del servidor. Deberías ver:

```
💬 Mensaje de texto recibido: [mensaje]
🧭 Etiqueta: [categoría] (confianza: [número])
✅ Respuesta generada: [respuesta]
```

### Verificar Estado de Grupos

Los logs muestran el estado de cada grupo:

```
👥 Mensaje recibido en grupo: [ID]
🔊 IA activa en grupo [ID] - Procesando mensaje
🔇 IA desactivada en grupo [ID] - No se responderá
⏰ Reactivación de IA programada para grupo [ID] en 5 minutos
```

---

## ⚠️ Solución de Problemas

### El servidor no inicia

**Problema:** Error de Chrome

**Solución:**
```bash
node solucionar-chrome.js
node server.js
```

---

### El bot no responde

**Verifica:**
1. ¿El servidor está corriendo?
2. ¿Ves el mensaje "WhatsApp conectado exitosamente"?
3. ¿El número del bot está activo en WhatsApp?

---

### El grupo no se crea

**Verifica:**
1. ¿El número del especialista está en `.env`?
2. ¿El formato es correcto? (`521[numero]@c.us`)
3. ¿Revisa los logs para ver el error específico?

---

### La IA no se desactiva

**Verifica:**
1. ¿El número del especialista en `.env` coincide exactamente?
2. ¿El grupo está registrado en `data/grupos-whatsapp.json`?
3. ¿Revisa los logs para ver si detecta al especialista?

---

## ✅ Checklist de Pruebas

Marca cada prueba cuando la completes:

- [ ] Servidor inicia correctamente
- [ ] Bot responde a mensajes simples
- [ ] IA genera respuestas coherentes
- [ ] Se crea grupo al pedir contactar especialista
- [ ] Especialista recibe notificación
- [ ] IA se desactiva cuando especialista responde
- [ ] IA se reactiva después de 5 minutos
- [ ] Se asignan tareas correctamente
- [ ] Archivos se suben a Google Drive
- [ ] Tareas se envían a Power Automate (si está configurado)

---

## 🎯 Prueba Rápida (5 minutos)

Si solo tienes 5 minutos, prueba esto:

1. **Inicia el servidor:**
   ```bash
   node server.js
   ```

2. **Envía al bot:**
   ```
   Quiero hablar con Janeth Bautista
   ```

3. **Verifica:**
   - Recibes confirmación
   - Se crea el grupo
   - El especialista recibe notificación

4. **En el grupo:**
   - Escribe un mensaje
   - El especialista responde
   - La IA NO responde

5. **Espera 5 minutos:**
   - La IA se reactiva
   - Escribe y la IA responde

**Si todo esto funciona, el sistema está operativo! ✅**

---

## 📝 Notas Finales

- **Primera vez:** La primera conexión puede tardar unos segundos
- **QR Code:** Si es la primera vez, puede pedirte escanear un código QR
- **Logs:** Siempre revisa los logs para entender qué está pasando
- **Archivos de datos:** Revisa `data/` para ver el estado del sistema

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Consulta las otras guías:
   - `GUIA_SISTEMA_GRUPOS.md` - Sistema de grupos
   - `GUIA_SISTEMA_TAREAS.md` - Sistema de tareas
   - `GUIA_PRUEBAS.md` - Pruebas detalladas

¡Listo para probar! 🚀

