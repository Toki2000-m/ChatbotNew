const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const path = require("path");

// Ruta al JSON descargado de Google Cloud
const CREDENTIALS_PATH = path.join(__dirname, "credentials", "client_secret.json");
const TOKEN_PATH = path.join(__dirname, "credentials", "tokens.json");

async function main() {
  console.log("🚀 Iniciando configuración de acceso a Google Drive...\n");

  // Verificar que existe el archivo client_secret.json
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error("❌ No se encontró el archivo client_secret.json en /credentials");
    return;
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // URL para autorizar manualmente el acceso
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });

  console.log("🔗 Autoriza esta aplicación visitando este enlace:");
  console.log(authUrl, "\n");

  // Pedir al usuario el código de autorización manualmente
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("📥 Pega aquí el código que te dio Google: ", async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log("\n✅ Autorización completada. Archivo tokens.json guardado en /credentials");
      console.log("Ya puedes usar tu bot con subida a Google Drive 🚀");
    } catch (err) {
      console.error("❌ Error al obtener el token:", err);
    }
  });
}

main().catch(console.error);
