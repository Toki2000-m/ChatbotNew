const fs = require('fs');
const path = require('path');

// Ruta a tu base de datos
const dbPath = path.join(__dirname, 'data', 'grupos-whatsapp.json');

try {
    if (!fs.existsSync(dbPath)) {
        console.log("❌ No existe el archivo de base de datos. Nada que reparar.");
        process.exit();
    }

    // 1. Cargar datos
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(rawData);
    
    console.log(`📋 Analizando ${db.grupos.length} grupos...`);
    let modificados = 0;

    // 2. Recorrer y arreglar
    db.grupos = db.grupos.map(grupo => {
        // Si el estado no es el correcto, o es ambiguo, lo forzamos a ACTIVARSE
        if (grupo.estado === 'activo' || grupo.estado === 'especialista_activo' || !grupo.estado) {
            grupo.estado = 'ia_activa'; // <--- AQUÍ FORZAMOS LA CORRECCIÓN
            grupo.iaActiva = true;
            modificados++;
        }
        return grupo;
    });

    // 3. Guardar cambios
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log(`✅ REPARACIÓN COMPLETADA.`);
    console.log(`🔄 Se corrigieron ${modificados} grupos.`);
    console.log(`🚀 Ahora todos están listos para responder.`);

} catch (error) {
    console.error("Error fatal:", error);
}