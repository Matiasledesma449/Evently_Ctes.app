# Herramientas

## limpiar-datos.js: vaciar los datos de prueba

Borra todos los documentos de `eventos`, `ventas` y `solicitudes_eventos`. **Conserva** `usuarios`, `configuracion` y `organizaciones`. La corrés vos; Claude no la ejecuta.

### Antes de empezar

1. Instalá las dependencias una vez, desde la raíz del proyecto: `npm install`.
2. Descargá desde la consola de Firebase un archivo de credenciales de cuenta de servicio y guardalo **fuera de la carpeta del proyecto** (así no se sube al repositorio por error).
3. Decile a la terminal dónde está ese archivo. En Mac o Linux:
   `export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/archivo.json"`
   En Windows (PowerShell):
   `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\a\tu\archivo.json"`

### Paso 1: mirar sin borrar

```
node herramientas/limpiar-datos.js
```

Muestra cuántos documentos hay en cada colección y termina. No borra nada. Para mirar una sola: `--solo ventas`.

### Paso 2: borrar

```
node herramientas/limpiar-datos.js --borrar
```

Muestra de nuevo lo que va a borrar y te pide escribir la frase `BORRAR TODO`. Si la frase no es exacta, no borra nada. También se puede combinar: `--borrar --solo ventas`.

### Antes de borrar

Publicá primero las reglas de Firestore de `organizaciones` y recién después corré la limpieza, siempre primero sin `--borrar`.

Borrar no se puede deshacer.
