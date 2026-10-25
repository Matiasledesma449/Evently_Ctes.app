# Proposal

## Why

El pedido 2 de `openspec/pendientes.md` dice: "Formas de pago: sacar 'Efectivo' de todos los eventos; mostrar las formas reales (transferencia, débito, crédito); PDF con opciones elegibles."

Lo que se ve en el código hoy:

- **"Efectivo" ya no se cobra.** `server/mercadopago.js` excluye el efectivo (Rapipago y Pago Fácil) al crear el pago. La compra (`public/evento.html`) ya no lo ofrece. Lo único que queda escrito es la lista vieja `metodosPago: ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Mixto']` en los datos de ejemplo de `public/assets/js/data.js` y su copia idéntica en `public/assets/css/js/data.js` (ver `CLAUDE.md`, "Decisiones pendientes"). Ninguna página del panel ni del sitio carga esos archivos hoy.
- **Las formas de pago reales son las de Mercado Pago**: `server/confirmacion.js` guarda cada venta como `Crédito`, `Débito`, `Prepaga`, `Dinero en cuenta` u `Otro`. "Transferencia" no existe como forma de pago: lo más parecido es "Dinero en cuenta". El texto de la compra y los filtros de Ventas y Reportes ya salen de los datos, sin lista fija.
- **El PDF de Reportes no se puede armar a gusto.** Siempre trae las 5 secciones (Resumen general, Desglose por lote, Detalle de transacciones, Métodos de pago e Indicadores clave). Solo se puede filtrar por lote y por método de pago antes de exportar.

Importante: no se pudo comprobar si hay eventos ya cargados en Firestore con algún campo de "Efectivo": eso es un dato real y la nube no lo ve.

## What Changes

- **Una sola lista de formas de pago** en `shared/` (Crédito, Débito, Prepaga, Dinero en cuenta, o lo que se decida en la pregunta 2), que usen el texto de la compra y las pantallas del panel. Sin "Efectivo" en ningún lado.
- **Sacar "Efectivo"** de lo que queda escrito (pregunta 1).
- **PDF de Reportes con casillas** para elegir qué secciones incluir antes de exportar (pregunta 4). Se mantiene el filtro por lote y método que ya existe.
- **Una prueba nueva** en `pruebas/` que falla si alguna pantalla vuelve a ofrecer "Efectivo" y que verifica la lista de formas de pago y la elección de secciones del PDF.

## Capabilities

### New Capabilities
- `formas-de-pago-reales`: qué formas de pago se muestran y de dónde salen, y que "Efectivo" no aparece.
- `pdf-de-reportes-elegible`: qué secciones del PDF se pueden elegir y qué pasa con la elección.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. Se apoya en `compra-con-mercado-pago` de pagos-mercadopago. -->

## Impact

- Código (previsto): un archivo compartido nuevo con la lista de formas de pago, `public/evento.html` (solo el texto del aviso), `admin/reportes.html` (casillas y armado del PDF), los datos de ejemplo viejos según la pregunta 1, y una prueba en `pruebas/`.
- No toca: `api/`, `server/` (salvo que se elija la pregunta 2B), reglas de Firestore ni datos.
- Sin dependencias nuevas.

## Fuera de alcance

- Cobrar por transferencia bancaria real o en efectivo: necesita cuentas y pruebas reales (ver pregunta 2C).
- El formulario de "Crear evento" (pedido 3 de `pendientes.md`): si se elige la pregunta 3B, ese pedido guardará el campo.
- Cambiar los datos ya guardados en Firestore.

## Preguntas para la persona

**1. ¿Qué hacemos con el "Efectivo" que queda en los datos de ejemplo viejos (`data.js`)?**
- A (recomendado): no tocar esos archivos (nadie los usa) y dejar una prueba que avisa si alguna pantalla vuelve a ofrecer "Efectivo". Lo borra o no la decisión pendiente de `CLAUDE.md`, por separado.
- B: borrar los dos `data.js`. Es lo más limpio, pero es borrar archivos y hoy está como decisión pendiente.
- C: dejar los archivos y solo cambiar la lista a las formas reales. Queda un dato de ejemplo correcto, pero sigue habiendo dos copias.

**2. ¿Qué formas de pago se muestran?**
- A (recomendado): las que realmente se cobran hoy, con los nombres que ya usa el panel: Crédito, Débito, Prepaga y Dinero en cuenta. "Transferencia" no se muestra porque hoy no se puede pagar así.
- B: mostrar "Transferencia" en lugar de "Dinero en cuenta" (es lo más parecido para quien compra). Hay que cambiar el nombre que guarda el servidor, y las ventas viejas seguirían diciendo "Dinero en cuenta".
- C: agregar transferencia bancaria como forma de pago nueva. Es otro change grande y necesita una cuenta bancaria y pruebas reales: no lo hace la nube.

**3. ¿Las formas de pago son iguales para todos los eventos?**
- A (recomendado): sí, la misma lista para todos, la que acepta Mercado Pago. Es lo que ya pasa y lo más simple.
- B: el organizador elige cuáles acepta cada evento (por ejemplo, solo débito). Hay que guardar el dato en cada evento y hacer que el servidor excluya las demás; es más trabajo y se cruza con el pedido 3 (Crear evento).

**4. ¿Qué se puede elegir del PDF de Reportes?**
- A (recomendado): casillas para elegir qué secciones lleva (Resumen general, Desglose por lote, Detalle de transacciones, Métodos de pago, Indicadores clave), todas marcadas al empezar. Se mantienen los filtros de lote y método.
- B: solo agregar la opción de elegir una o varias formas de pago a incluir (hoy se elige una sola o todas), sin elegir secciones.
- C: las dos cosas (A y B). Es más trabajo en la pantalla de Reportes.

## Por qué esta opción y no otra

- **Una lista compartida** en vez de nombres escritos a mano en cada página: igual que con el menú y el selector de evento, tres copias terminan distintas.
- **No cambiar lo que guarda el servidor** salvo que se pida (pregunta 2B): las ventas viejas y las de Mercado Pago ya usan esos nombres, y cambiarlos parte los reportes en dos.

## Cómo se verifica a mano

1. Abrir un evento y llegar al paso del pago: el texto nombra solo las formas reales y no dice "Efectivo".
2. En Reportes, abrir la exportación del PDF: se pueden elegir las secciones y el PDF trae solo las marcadas.
3. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
