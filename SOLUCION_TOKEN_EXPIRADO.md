# 🔧 Solución: Token de Google Drive Expirado

## ❌ Error que estás viendo

```
❌ Error al subir a Drive: invalid_grant
Detalles del error: {
  "error": "invalid_grant",
  "error_description": "Token has been expired or revoked."
}
Código de error: 400
```

## ✅ Solución Rápida

### Opción 1: Reautenticar (Recomendado)

1. **Ejecuta el script de autenticación:**
   ```bash
   node drive-auth.js
   ```

2. **Sigue las instrucciones:**
   - Se abrirá una URL en la consola
   - Copia esa URL y ábrela en tu navegador
   - Autoriza la aplicación
   - Copia el código que te da Google
   - Pégalo en la consola cuando te lo pida

3. **Listo**: Los nuevos tokens se guardarán automáticamente en `credentials/tokens.json`

### Opción 2: Verificar el Refresh Token

Si ya tienes un `refresh_token` válido en `credentials/tokens.json`, el sistema debería refrescar automáticamente. Si no funciona:

1. Verifica que `tokens.json` tenga un campo `refresh_token`
2. Si no lo tiene, ejecuta `node drive-auth.js` para obtener uno nuevo

## 🔄 Mejoras Implementadas

He actualizado el código para que:

1. **Refresque automáticamente** los tokens cuando expiren
2. **Reintente la subida** después de refrescar el token
3. **Guarde los nuevos tokens** automáticamente

## 📝 Notas Importantes

- Los tokens de acceso expiran después de 1 hora
- El `refresh_token` puede expirar si:
  - No se usa por más de 6 meses
  - El usuario revoca el acceso manualmente
  - Se cambian las credenciales de la aplicación

## 🚀 Prevención Futura

El código ahora maneja automáticamente la renovación de tokens, pero si el `refresh_token` también expira, necesitarás ejecutar `drive-auth.js` nuevamente.

## ⚠️ Si el problema persiste

1. Verifica que `credentials/client_secret.json` existe y es válido
2. Verifica que `credentials/tokens.json` tiene un `refresh_token`
3. Asegúrate de que la aplicación en Google Cloud Console esté activa
4. Verifica que los scopes incluyan `https://www.googleapis.com/auth/drive.file`


