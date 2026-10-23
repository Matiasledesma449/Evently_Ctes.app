# Proposal

## Why

Hoy todos los eventos se ven con la misma foto, y la organización no tiene una forma que funcione de elegir la suya:

- **Los 4 eventos reales tienen `imagen` vacía** (visto en Firestore, solo lectura). Por eso `public/index.html`, `public/evento.html` y `admin/eventos-seleccion.html` caen en la misma foto de relleno, `Imagen de evento 1.jpg`.
- **"Subir imagen" no puede funcionar sin pagar.** Storage no tiene reglas publicadas y habilitarlo en `evently-b612b` exige el plan de pago (Blaze, con tarjeta). **Decisión del usuario (2026-10-23): no usar tarjeta.** La foto se guarda entonces dentro del propio evento, en Firestore, que ya se usa gratis.
- **Cada página decide por su cuenta qué foto mostrar.** Hay cuatro copias del mismo "si no hay imagen, usar otra": el relleno de `index.html` es `./imag/...`, el de `eventos-seleccion.html` es `/public/imag/...` y `aprobaciones.js` usa una foto de Unsplash. Así, un mismo evento puede verse distinto según la página.
- Los nombres de evento se insertan sin escapar en `evento.html` y `eventos-seleccion.html`.

Lo pedido: la organización manda la foto que quiere al crear el evento, y esa foto coincide en todas las páginas.

## What Changes

- **Foto que funciona de punta a punta** en `admin/eventos.html`: al elegirla se achica en el navegador (hasta unos 200 KB), se ve la vista previa, los errores salen dentro de la página (sin `alert`) y la solicitud no se envía si la foto falló. La solicitud guarda la foto como imagen incluida (`data:image/jpeg;base64,...`) en el campo `imagen`.
- **Sin Storage:** no hay reglas ni archivos de Storage; no se necesita publicar nada en Firebase.
- **Una sola función compartida** (`shared/imagen-evento.js`) que dice qué mostrar de un evento: su foto o, si no tiene, un relleno propio (color violeta y letra inicial, estable por evento). Dos eventos sin foto se ven distintos y el mismo evento se ve igual en todas las páginas.
- Las páginas que muestran un evento pasan a usar esa función: Inicio (tarjetas y destacado), página del evento, lista de Eventos del panel y solicitudes (`aprobaciones.js`). Se escapan los textos y se maneja `onerror`.
- No se editan datos existentes. Si hace falta poner una foto a los eventos reales, se hace desde la pantalla con una cuenta de organización.
- Pruebas con `node` para la función pura y chequeos nuevos en `auditar-panel`.

## Capabilities

### New Capabilities
- `imagen-de-evento`: de dónde sale la imagen de un evento, cómo la elige la organización al solicitarlo, y que se vea igual en todas las páginas.

### Modified Capabilities
<!-- ninguna: el repo no tiene specs principales de imágenes -->

## Impact

- Código: `admin/eventos.html`, `admin/eventos-seleccion.html`, `admin/aprobaciones.js`, `public/index.html`, `public/evento.html`, `shared/imagen-evento.js` (nuevo), `pruebas/16-imagen-de-evento.js` (nuevo).
- Firebase: ningún cambio de configuración. Las fotos engordan un poco cada evento (unos 270 KB de texto) y las listas que traen varios eventos cargan algo más lento; el límite de un documento de Firestore es 1 MB.
- Fuera de alcance: rediseño de la página del comprador, vaciar datos de Valigroup, pagos y reglas de Firestore.
