# Proposal

## Why

Evently todavía no cobra por su servicio: el comprador paga solo el precio de la entrada. La persona pidió el modelo habitual de las ticketeras: se muestra aparte un **costo de servicio**, que es la ganancia de Evently, y su porcentaje se acuerda con cada productora, así que **cambia de un evento a otro**. Además quiere **categorías de porcentaje** (según cómo se maneje con cada organización) que el superadmin pueda editar desde el panel.

## Respuestas de la persona

Respondió en el PR #33 (26/10/2026):

1. ¿Quién paga la comisión? **La paga el comprador y se muestra aparte como costo de servicio (1A), y el porcentaje se define evento por evento (1C).** (Escribió "ACD"; no existe la D, y se tomó A + C.)
2. ¿Quién cambia el porcentaje? **Solo el superadmin, desde el panel (2A).**
3. ¿Cuotas? **Mostrar las cuotas que ya ofrece Mercado Pago al pagar, sin definir nada propio (3A).**
4. ¿Porcentaje por defecto? **0% hasta que se cargue a mano (4A).** (Escribió "SI".)
5. Además pidió **varias categorías de porcentaje**, editables desde el panel del superadmin.

## What Changes

- **Categorías de comisión**: el superadmin crea y edita categorías (nombre + porcentaje) en un panel nuevo dentro de "Eventos". Se guardan en un solo documento de configuración.
- **Categoría por evento**: en la lista de eventos, el superadmin elige para cada evento qué categoría de costo de servicio tiene (o ninguna = 0%). El organizador no puede cambiarla.
- **Costo de servicio en la compra**: la página del evento muestra "Entradas", "Costo de servicio" y "Total" mientras se elige la cantidad. El servidor calcula el porcentaje con lo guardado (nunca con lo que mande el navegador), lo suma al monto de la venta y lo cobra en Mercado Pago como un renglón aparte.
- **La venta guarda el desglose**: subtotal de entradas, costo de servicio, porcentaje usado y monto total. Las ventas viejas siguen funcionando (costo de servicio 0).
- **Panel del organizador**: "recaudado" cuenta lo que le corresponde a la organización (las entradas, sin el costo de servicio), igual en Resumen, Ventas y Reportes. El detalle de una venta muestra el desglose.
- **Cuotas**: no se define nada propio. Mercado Pago muestra las cuotas que corresponden en su pantalla de pago.

## Capabilities

### New Capabilities
- `categorias-de-comision`: categorías de porcentaje editables por el superadmin y asignación de una categoría a cada evento.
- `costo-de-servicio`: cálculo en el servidor, cobro, desglose guardado en la venta y cómo lo ve el comprador.
- `ingresos-del-organizador`: qué cifra de dinero cuenta el panel como recaudado cuando hay costo de servicio.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- Publicar reglas de Firestore: el documento de configuración debe poder leerse sin iniciar sesión (la página del evento lo lee) y escribirse solo por el superadmin. Eso se anota para la tarea 10.3 y no se toca acá.
- Pagos con tarjeta de prueba reales (sección 9 de `pagos-mercadopago`) y probar el cobro del renglón nuevo en Mercado Pago: lo prueba la persona.
- Borrar categorías: en esta versión se crean y se editan, no se borran (borrar datos guardados es decisión de la persona).
- Cartel de "cuotas sin interés" o promociones propias.
- Reintegros del costo de servicio, facturación, comisión de Mercado Pago (la descuenta Mercado Pago de lo que cobra Evently, no se modela).
- Liquidación a las productoras (cuánto se les transfiere).
- Ventas viejas: no se reescriben.

## Por qué estas opciones y no otras

- **Un documento `configuracion/comisiones` con la lista de categorías** y no una colección: son pocas, se leen siempre juntas y se editan desde una sola pantalla.
- **La categoría se guarda en el evento como `comisionCategoriaId`** y el porcentaje se lee de la categoría al comprar: si el superadmin corrige un porcentaje, vale para las compras siguientes de todos los eventos con esa categoría.
- **El servidor es la única fuente del cálculo**; la página solo muestra una vista previa, igual que hoy con el precio.
- **Un renglón aparte en Mercado Pago** ("Costo de servicio") y no subir el precio de las entradas: así el comprador lo ve en el resumen de Mercado Pago y coincide con la página del evento.
