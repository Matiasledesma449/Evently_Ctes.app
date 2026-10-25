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

## Respuestas de la persona

Respuesta del 2026-10-25 en el PR de este plan: `1B 2D (transferencia, débito y crédito) 3A 4A`.

- **1B**: se borran los dos `data.js` (nadie los carga; se comprobó con una búsqueda en el repo). Eso resuelve también la decisión pendiente de `CLAUDE.md` sobre esos archivos.
- **2D** (texto libre): las formas que se muestran son **Transferencia, Débito y Crédito**. Es una opción que no estaba en la lista; queda abierta la pregunta 5 de abajo, porque "Transferencia" no es un nombre que hoy guarde el servidor y no se nombró a Prepaga.
- **3A**: la misma lista para todos los eventos.
- **4A**: casillas para elegir las secciones del PDF.

## Preguntas para la persona (segunda vuelta)

**5. Hoy el servidor no tiene "Transferencia": guarda "Dinero en cuenta" (pagar con saldo de Mercado Pago) y "Prepaga". ¿Cómo lo resolvemos?**
- A (recomendado): "Transferencia" es el nombre que ve quien compra para lo que hoy se guarda como "Dinero en cuenta". Se cambia solo el texto (en el sitio y en el panel); lo que guarda el servidor no cambia y las ventas viejas se siguen contando bien. "Prepaga" sigue contándose en los reportes si aparece, pero no se nombra al comprador.
- B: cambiar también lo que guarda el servidor a "Transferencia". Las ventas viejas dirían "Dinero en cuenta" y los reportes tendrían que juntar los dos nombres.
- C: me equivoqué al leer: querías transferencia bancaria real (cuenta propia, sin Mercado Pago). Es otro change grande y necesita cuenta y pruebas reales; no lo hace la nube.

Respuesta del 2026-10-25 en el PR de la segunda vuelta: `5A`.

- **5A**: "Transferencia" es solo el nombre que ve quien compra para lo que el servidor guarda como "Dinero en cuenta". No cambia `server/` ni las ventas viejas. "Prepaga" se sigue contando en los reportes si aparece, pero no se nombra al comprador.

## Preguntas para la persona (tercera vuelta)

La respuesta al PR de la vuelta anterior fue solo `B`, sin número y sin `SIGUE`. Puede ser la opción B de la pregunta de los `data.js` (dejarlos por ahora) o la opción B de "Qué sigue" (plan de evento activo). No adivino: los `data.js` siguen sin borrarse y las tareas 2.1 y 2.2 siguen pendientes.

**6. ¿Qué quisiste decir con tu `B`?**
- A: era para los `data.js`: dejarlos por ahora. Se saltean las tareas 2.1 y 2.2 y se sigue con las demás tareas del plan.
- B: era para "Qué sigue": hacer las primeras tareas del plan de evento activo. Los `data.js` quedan como están hasta que decidas (borrarlos vos a mano o dejarlos).
- C: las dos cosas (dejar los `data.js` y seguir con el plan de evento activo).

Respuesta del 2026-10-25 en el PR de la tercera vuelta: `1A` (la pregunta de ese PR era la 6).

- **6A**: el `B` era para los `data.js`: se dejan como están por ahora. Reemplaza a la respuesta 1B: no se borran los dos `data.js` y se saltean las tareas 2.1 y 2.2. La decisión pendiente de `CLAUDE.md` sobre esos archivos sigue abierta. La prueba que avisa si alguna pantalla ofrece "Efectivo" se mantiene. Esto no pide hacer ahora el plan de evento activo.

## Por qué esta opción y no otra

- **Una lista compartida** en vez de nombres escritos a mano en cada página: igual que con el menú y el selector de evento, tres copias terminan distintas.
- **No cambiar lo que guarda el servidor** salvo que se pida (pregunta 2B): las ventas viejas y las de Mercado Pago ya usan esos nombres, y cambiarlos parte los reportes en dos.

## Cómo se verifica a mano

1. Abrir un evento y llegar al paso del pago: el texto nombra solo las formas reales y no dice "Efectivo".
2. En Reportes, abrir la exportación del PDF: se pueden elegir las secciones y el PDF trae solo las marcadas.
3. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
