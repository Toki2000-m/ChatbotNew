const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials", "client_secret.json");
const TOKEN_PATH = path.join(__dirname, "..", "credentials", "tokens.json");

async function refreshToken() {
  try {
    console.log("🔄 Intentando refrescar token de Google Drive...\n");
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error("❌ No se encontró client_secret.json");
      return;
    }
    
    if (!fs.existsSync(TOKEN_PATH)) {
      console.error("❌ No se encontró tokens.json. Ejecuta: node drive-auth.js primero");
      return;
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    oAuth2Client.setCredentials(tokens);
    
    // Forzar refresh
    const newTokens = await oAuth2Client.refreshAccessToken();
    const refreshedTokens = newTokens.credentials;
    
    // Guardar nuevos tokens
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(refreshedTokens, null, 2));
    
    console.log("✅ Token refrescado exitosamente");
    console.log("📅 Nuevo access_token válido hasta:", new Date(refreshedTokens.expiry_date).toLocaleString());
    console.log("\n🎯 Ahora puedes usar el bot sin errores de Drive");
    
  } catch (err) {
    console.error("❌ Error al refrescar token:", err.message);
    
    if (err.message.includes("invalid_grant")) {
      console.error("\n💡 SOLUCIÓN:");
      console.error("   1. Ejecuta: node drive-auth.js");
      console.error("   2. Sigue el proceso de autorización completo");
      console.error("   3. Luego vuelve a ejecutar este script\n");
    }
  }
}

refreshToken();