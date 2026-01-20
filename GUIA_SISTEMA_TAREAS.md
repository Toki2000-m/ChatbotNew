# 📋 Guía del Sistema de Gestión de Tareas FGYA

Este documento explica cómo funciona el sistema de gestión de tareas implementado en el chatbot de WhatsApp.

## 🎯 Funcionalidades Principales

### 1. **Filtrado de Mensajes Innecesarios**
El sistema detecta y filtra automáticamente mensajes que no requieren acción:
- Saludos simples: "ok", "gracias", "bonito día", "hola"
- Mensajes muy cortos sin contenido sustancial
- Solo emojis sin texto

**Beneficio**: Reduce el ruido y mantiene el equipo enfocado en tareas reales.

### 2. **Agrupación Inteligente de Mensajes**
Los mensajes se agrupan automáticamente por:
- **Mismo usuario**
- **Mismo tema** (detectado por palabras clave y especialista)
- **Ventana de tiempo**: 30 minutos (extendida a 45 minutos si hay múltiples mensajes)

**Ejemplo**:
- Mensaje 1 (10:00): "Necesito información sobre auditorías"
- Mensaje 2 (10:15): "¿Cuánto cuesta?"
- Mensaje 3 (10:20): "¿Cuándo pueden hacerla?"

→ Se crea **una sola tarea** con los 3 mensajes agrupados.

### 3. **Asignación Automática a Especialistas**
El sistema asigna tareas automáticamente según el tema detectado:

| Especialista | Especialidades | Palabras Clave |
|-------------|----------------|----------------|
| **Janeth Silva** | Auditorías, ISO 9001 | auditoría, sasisopa, certificación |
| **Noemí Hernández** | Cambios de domicilio, Capacitación | cambio, domicilio, capacitación |
| **Ana Paula Figueroa** | Anexo 30 y 21 | anexo 30, anexo 21, permisos |
| **Sara López** | SASSOX, ISO 9001 | sassox, certificación |
| **Aurora Chávez** | NOM-OHS-ONE-2010 | nom, ohs, seguridad |
| **Francisco Ramírez** | Atención general | consulta, información |

### 4. **Gestión Completa de Tareas**
Cada tarea incluye:
- ✅ **Título**: Tema detectado automáticamente
- ✅ **Descripción**: Todos los mensajes agrupados
- ✅ **Responsable**: Especialista asignado automáticamente
- ✅ **Vencimiento**: 7 días por defecto (configurable)
- ✅ **Archivos asociados**: Links a Google Drive
- ✅ **Estatus**: Pendiente, En Proceso, Resuelta, Cancelada
- ✅ **Usuario**: Información del contacto de WhatsApp

## 🔄 Flujo de Trabajo

```
Mensaje recibido
    ↓
¿Es mensaje innecesario?
    ├─ SÍ → Responder brevemente, no crear tarea
    └─ NO → Continuar
        ↓
¿Requiere tarea? (clasificación IA)
    ├─ NO → Responder normalmente
    └─ SÍ → Buscar grupo existente
        ↓
¿Existe grupo del mismo tema?
    ├─ SÍ → Agregar mensaje al grupo
    └─ NO → Crear nuevo grupo
        ↓
¿Debe crear tarea ahora?
    (3+ mensajes o 30+ minutos desde último)
    ├─ SÍ → Crear tarea y enviar a Microsoft Lists
    └─ NO → Esperar más mensajes
```

## 📤 Integración con Microsoft Lists

Las tareas se envían automáticamente a Microsoft Lists a través de Power Automate.

### Formato de Datos Enviados

```json
{
  "tarea": {
    "id": "tarea_1234567890_abc123",
    "titulo": "Cotización de servicios",
    "descripcion": "Mensajes agrupados...",
    "responsable": {
      "nombre": "Janeth Silva",
      "telefono": "3321571469",
      "email": "auditorfg@fg.com.mx"
    },
    "vencimiento": "2024-02-15T10:30:00.000Z",
    "archivos": [
      {
        "nombre": "documento.pdf",
        "link": "https://drive.google.com/...",
        "tipo": "application/pdf"
      }
    ],
    "estatus": "Pendiente",
    "tema": "Cotización"
  },
  "usuario": {
    "whatsapp": "5213312345678@c.us",
    "nombre": "Usuario"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "fuente": "WhatsApp Bot",
  "tipo": "Tarea"
}
```

### Configuración en Power Automate

1. **Crear un nuevo flujo** con trigger HTTP
2. **Agregar acción "Agregar una fila"** de Microsoft Lists
3. **Mapear los campos**:
   - Título → `tarea.titulo`
   - Descripción → `tarea.descripcion`
   - Responsable → `tarea.responsable.nombre`
   - Teléfono Responsable → `tarea.responsable.telefono`
   - Email Responsable → `tarea.responsable.email`
   - Vencimiento → `tarea.vencimiento`
   - Archivos → `tarea.archivos` (como JSON o texto)
   - Estatus → `tarea.estatus`
   - Usuario WhatsApp → `usuario.whatsapp`
   - Fecha Creación → `timestamp`

## 📁 Estructura de Archivos

```
├── config/
│   └── especialistas.json      # Directorio de especialistas
├── utils/
│   └── taskManager.js          # Lógica de gestión de tareas
├── data/
│   └── tareas.json            # Almacenamiento local de tareas
├── routes/
│   └── chatbot.js             # Chatbot principal (integrado)
└── power-automate-tareas-schema.json  # Esquema de ejemplo
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Existente
OPENAI_API_KEY=tu_clave_openai
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id
POWER_AUTOMATE_WEBHOOK_URL=tu_webhook_url

# El mismo webhook puede manejar tanto soporte como tareas
# El sistema diferencia por el campo "tipo"
```

### Personalizar Especialistas

Edita `config/especialistas.json` para agregar o modificar especialistas:

```json
{
  "id": "nuevo-especialista",
  "nombre": "Nombre Completo",
  "telefono": "3312345678",
  "email": "email@fg.com.mx",
  "especialidades": ["Especialidad 1", "Especialidad 2"],
  "palabrasClave": ["palabra1", "palabra2", "palabra3"]
}
```

## 🔍 Monitoreo y Logs

El sistema genera logs detallados:

- `🚫 Mensaje innecesario detectado` - No se crea tarea
- `📝 Mensaje agregado a grupo existente` - Agrupando mensajes
- `🆕 Nuevo grupo creado` - Iniciando nuevo tema
- `✅ Tarea creada` - Tarea generada exitosamente
- `📤 Enviando tarea a Power Automate` - Enviando a Microsoft Lists

## 🎨 Beneficios del Sistema

1. **Menos Ruido**: Solo se crean tareas cuando realmente se necesita
2. **Tareas Claras**: Mensajes relacionados se agrupan automáticamente
3. **Asignación Automática**: Se asigna al especialista correcto sin intervención
4. **Seguimiento Completo**: Archivos, fechas y estatus en un solo lugar
5. **Integración Total**: Conectado con Google Drive y Microsoft Lists

## 🚀 Próximos Pasos

1. Configurar Power Automate para recibir tareas
2. Crear lista en Microsoft Lists con los campos necesarios
3. Probar el sistema enviando mensajes de prueba
4. Ajustar palabras clave de especialistas según necesidad
5. Configurar notificaciones cuando se creen nuevas tareas

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo o revisa los logs del servidor.

