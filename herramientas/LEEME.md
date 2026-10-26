# Herramientas

## Limpiar los datos de prueba (`limpiar-datos.js`)

Sirve para empezar de cero: vacía `eventos`, `ventas` y `solicitudes_eventos`.
**Nunca** toca `usuarios`, `configuracion` ni `organizaciones`.

La corre solo la persona responsable del proyecto, en su computadora. Por defecto **no borra nada**: solo muestra cuántos documentos borraría.

### Antes de empezar

1. Publicá primero las reglas de Firestore de `organizaciones` (están en `openspec/changes/organizaciones-y-correcciones-del-panel/design.md`).
2. Creá las organizaciones en el panel (menú **Organizaciones**) y vinculá a sus admins.
3. Descargá una clave de cuenta de servicio desde la consola de Firebase (Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada).
   - Guardala **fuera de la carpeta del proyecto** (por ejemplo, en tu carpeta de usuario).
   - No la subas a GitHub ni la compartas.

### Cómo se corre

Desde la carpeta del proyecto, en una terminal:

```bash
# 1. Decile a la herramienta dónde está tu clave (cambiá la ruta por la tuya)
export GOOGLE_APPLICATION_CREDENTIALS="<ruta a tu clave>.json"     # Git Bash
# $env:GOOGLE_APPLICATION_CREDENTIALS="<ruta a tu clave>.json"     # PowerShell

# 2. Vista previa: muestra qué se borraría y NO borra nada
node herramientas/limpiar-datos.js

# 3. Si la lista está bien, borrar de verdad (pide escribir una frase)
node herramientas/limpiar-datos.js --borrar

# Solo una colección (por ejemplo, las ventas)
node herramientas/limpiar-datos.js --solo ventas --borrar
```

### Qué vas a ver

- Primero, cuántos documentos hay en cada colección que se vaciaría y cuáles se conservan.
- Con `--borrar`, te pide escribir exactamente `BORRAR DATOS DE PRUEBA`. Si escribís otra cosa, no borra nada.
- Al terminar, cuántos documentos borró de cada colección.

Lo borrado no se puede recuperar.
