#!/usr/bin/env node

/**
 * Script para solucionar problemas con Chrome/Puppeteer
 * Ejecuta: node solucionar-chrome.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Solucionando problema de Chrome/Puppeteer...\n');

// Detectar sistema operativo
const platform = os.platform();
console.log(`📱 Sistema operativo: ${platform}\n`);

try {
  // Opción 1: Reinstalar Puppeteer
  console.log('1️⃣ Reinstalando Puppeteer...');
  try {
    execSync('npm uninstall puppeteer', { stdio: 'inherit', cwd: __dirname });
    execSync('npm install puppeteer@latest', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Puppeteer reinstalado\n');
  } catch (err) {
    console.warn('⚠️ Error al reinstalar Puppeteer:', err.message);
  }

  // Opción 2: Limpiar cache
  console.log('2️⃣ Limpiando cache de Puppeteer...');
  const cachePath = path.join(os.homedir(), '.cache', 'puppeteer');
  if (fs.existsSync(cachePath)) {
    try {
      execSync(`rm -rf "${cachePath}"`, { stdio: 'inherit' });
      console.log('✅ Cache limpiado\n');
    } catch (err) {
      console.warn('⚠️ No se pudo limpiar el cache:', err.message);
    }
  }

  // Opción 3: Verificar Chrome del sistema (macOS)
  if (platform === 'darwin') {
    console.log('3️⃣ Verificando Chrome en macOS...');
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    
    let chromeFound = false;
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ Chrome encontrado en: ${chromePath}`);
        chromeFound = true;
        break;
      }
    }
    
    if (!chromeFound) {
      console.log('⚠️ Chrome no encontrado en las rutas estándar');
      console.log('💡 Puedes instalar Chrome desde: https://www.google.com/chrome/');
    }
  }

  console.log('\n✅ Proceso completado!');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Reinicia el servidor: node server.js');
  console.log('2. Si el problema persiste, instala Chrome manualmente');
  console.log('3. O configura la variable de entorno PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}







