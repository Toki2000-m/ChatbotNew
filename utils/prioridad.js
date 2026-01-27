// ============================================
// 🔥 Módulo de Prioridad Automática
// ============================================

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectarPrioridad(texto) {
  const t = normalizarTexto(texto);

  const reglas = {
    ALTA: {
      palabras: [
        "urgente",
        "emergencia",
        "hoy",
        "ahorita",
        "inmediato",
        "lo antes posible",
        "para hoy"
      ],
      vencimientoHoras: 4,
      etiqueta: "URGENTE",
      accion: "ESCALAR"
    },
    BAJA: {
      palabras: [
        "informacion",
        "consulta",
        "duda",
        "cuando puedan",
        "sin prisa",
        "solo saber",
        "no es urgente"
      ],
      vencimientoHoras: 72,
      etiqueta: "INFORMATIVO",
      accion: "AUTO_RESPUESTA"
    }
  };

  // 🔴 Prioridad ALTA
  if (reglas.ALTA.palabras.some(p => t.includes(p))) {
    return {
      nivel: "ALTA",
      etiqueta: reglas.ALTA.etiqueta,
      accion: reglas.ALTA.accion,
      vencimiento: new Date(Date.now() + reglas.ALTA.vencimientoHoras * 60 * 60 * 1000),
      confianza: 0.9
    };
  }

  // 🟢 Prioridad BAJA
  if (reglas.BAJA.palabras.some(p => t.includes(p))) {
    return {
      nivel: "BAJA",
      etiqueta: reglas.BAJA.etiqueta,
      accion: reglas.BAJA.accion,
      vencimiento: new Date(Date.now() + reglas.BAJA.vencimientoHoras * 60 * 60 * 1000),
      confianza: 0.7
    };
  }

  // 🟡 Prioridad MEDIA (default)
  return {
    nivel: "MEDIA",
    etiqueta: "SEGUIMIENTO",
    accion: "REGISTRAR",
    vencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000),
    confianza: 0.8
  };
}

module.exports = { detectarPrioridad };
