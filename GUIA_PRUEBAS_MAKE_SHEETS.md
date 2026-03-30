# 🧪 Guía de Pruebas — Webhook Make → Google Sheets
**Proyecto:** FGYA WhatsApp Bot  
**Última actualización:** Marzo 2026  
**Estado:** ✅ Configurado temporalmente en Make + Google Sheets (en espera de cuenta corporativa)

---

## 📋 Contexto

El bot originalmente estaba pensado para usar **Power Automate + Microsoft Lists**, pero mientras se gestiona la cuenta corporativa, el flujo de registro de tareas y solicitudes se configuró temporalmente en:

- **Make (ex-Integromat)** — como automatizador del webhook
- **Google Sheets** — como base de datos temporal de registros

La URL del webhook de Make reemplaza a `POWER_AUTOMATE_WEBHOOK_URL` en el `.env`.

---

## ⚙️ Variables de entorno necesarias

En tu archivo `.env` debe estar configurado:

```env
POWER_AUTOMATE_WEBHOOK_URL=https://hook.eu2.make.com/XXXXXXXXXXXXXXXXX
```

> ⚠️ Aunque el nombre dice "Power Automate", apunta al webhook de Make. No cambiar el nombre de la variable para no romper el código.

---

## 🚀 Cómo correr las pruebas

```bash
node test-webhook-make.js
```

El script envía **3 payloads de prueba** al webhook y muestra el resultado en consola.

---

## 📦 Qué prueba el script

### Prueba 1 — Soporte básico
Simula cuando un usuario pasa por el **flujo de soporte manual** (nombre → teléfono → email → descripción).

```json
{
  "tipo": "Solicitud de Soporte",
  "usuario": {
    "nombre": "Juan Pérez (PRUEBA)",
    "email": "juan.prueba@test.com",
    "telefono": "3310000001",
    "descripción": "No puedo subir mis JSON al portal SAT"
  }
}
```

### Prueba 2 — Tarea automática (taskManager)
Simula cuando el **taskManager** detecta una consulta importante y crea una tarea asignada a un especialista.

```json
{
  "tipo": "Tarea",
  "tarea": {
    "titulo": "Archivos XML/JSON SAT",
    "responsable": "Alberto Méndez",
    "prioridad": "MEDIA",
    "estatus": "Pendiente"
  }
}
```

### Prueba 3 — Tarea URGENTE
Simula una tarea de **alta prioridad** (ej. cliente con auditoría inminente, SASISOPA urgente).

```json
{
  "tipo": "Tarea",
  "tarea": {
    "titulo": "SASISOPA - Permiso urgente",
    "responsable": "Janeth Silva",
    "prioridad": "ALTA",
    "estatus": "Pendiente Urgente"
  }
}
```

---

## ✅ Qué verificar después de correr el script

1. En la **consola** debe aparecer `✅ ÉXITO - Status: 200` para cada prueba
2. En tu **Google Sheet** deben aparecer **3 filas nuevas** con los datos de prueba
3. En **Make** → Historial de ejecuciones → deben aparecer 3 ejecuciones exitosas (✅ verde)

---

## ❌ Errores comunes y solución

| Error | Causa probable | Solución |
|-------|---------------|----------|
| `POWER_AUTOMATE_WEBHOOK_URL no está en tu .env` | Variable no configurada | Agrega la URL de Make al `.env` |
| `Status 404` | URL del webhook incorrecta o eliminada | Verifica en Make → Webhooks que el hook esté activo |
| `Timeout (15s)` | Escenario de Make pausado | En Make, activa el escenario (toggle verde) |
| `ECONNREFUSED` | Sin internet o URL malformada | Revisa conexión y formato de la URL |
| Las filas no aparecen en Sheets | Módulo de Sheets mal configurado en Make | Verifica el mapeo de columnas en el módulo de Google Sheets dentro de Make |

---

## 🗂️ Estructura del flujo en Make

```
Webhook (recibe JSON)
    └── Router
        ├── [Ruta 1] tipo = "Solicitud de Soporte"
        │       └── Google Sheets → Agregar fila (hoja: Soporte)
        └── [Ruta 2] tipo = "Tarea"
                └── Google Sheets → Agregar fila (hoja: Tareas)
```

---

## 📁 Archivos relacionados

| Archivo | Descripción |
|---------|-------------|
| `test-webhook-make.js` | Script de prueba del webhook |
| `routes/chatbot.js` | Función `enviarAPowerAutomate()` y `enviarTareaAPowerAutomate()` |
| `utils/taskManager.js` | Crea las tareas y las manda al webhook |
| `.env` | Contiene la URL del webhook de Make |

---

## 🔮 Migración futura a Power Automate

Cuando se tenga cuenta corporativa, solo se necesita:

1. Crear un flujo en **Power Automate** con trigger HTTP
2. Cambiar la URL en `.env`:
   ```env
   POWER_AUTOMATE_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com/...
   ```
3. El resto del código **no cambia** — ya está preparado para ambos.

---

> 📌 **Nota:** Este setup temporal fue necesario porque la empresa no proporcionó cuenta de Microsoft 365 durante el desarrollo. La arquitectura del bot ya contempla la migración sin cambios de código.   