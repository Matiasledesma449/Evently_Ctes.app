# Proposal

## Why

Quien compra entradas en Evently hoy tiene tres tropiezos: el inicio muestra las tarjetas con más texto que afiche, la página del evento mezcla el detalle, el mapa y la compra en un solo bloque, y si tiene una duda solo puede escribir un formulario en "Centro de soporte", sin ninguna respuesta a mano. Sitios de venta de entradas como All Access (referencia que pasó la persona, solo para tomar la estructura) ponen el afiche primero, ordenan la página del evento de lo que se compra a lo que se sabe del lugar, y responden las dudas comunes antes de pedir que se escriba. Se hace ahora porque el mapa del lugar y los días del evento ya existen y se pueden ordenar bien.

## What Changes

- **Centro de ayuda** en `public/soporte.html`: preguntas frecuentes por tema (Cómo comprar, Pagos, Mi entrada, Anulaciones y cambios, Reprogramaciones y cancelaciones), un buscador que filtra ignorando mayúsculas y acentos, y el formulario de contacto al final, con la misma lógica de envío de hoy.
- **Página del evento reordenada**: afiche con nombre, fechas y lugar; luego las entradas (lotes y cantidad); luego "Sobre el evento" (el detalle); luego "Dónde es" (lugar y mapa); y los datos y el pago cuando la persona sigue. El flujo de pago, los precios y los identificadores de los campos no cambian.
- **Inicio con el afiche protagonista**: la imagen de cada tarjeta es más alta y el texto se compacta (nombre, fecha, lugar, precio y "Ver entradas"). El carrusel de destacados queda igual.
- **Pie de página común** en inicio, evento y soporte, con links a Inicio, Centro de ayuda y "Enviar una consulta". Los links legales no se agregan todavía.
- El botón "Ayuda" de la página del evento y el de inicio llevan al Centro de ayuda (con el origen que ya se guarda en la consulta).
- Textos y estilos mantienen el violeta y el diseño actuales.

## Capabilities

### New Capabilities
- `centro-de-ayuda`: preguntas frecuentes por tema, buscador y formulario de consulta al final de la página de soporte.
- `pagina-del-evento`: orden de las secciones de la página del evento y qué muestra cada una, sin cambiar la compra.
- `inicio-de-eventos`: tarjetas del inicio con el afiche como protagonista y el carrusel de destacados.
- `pie-publico`: pie de página común del sitio del comprador con links de ayuda.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- El cartel de promoción o de "cuotas sin interés": depende del pedido 7 (comisión y cuotas), que es plata.
- Los links legales (defensa del consumidor, arrepentimiento de compra, términos, privacidad): se suman cuando la productora los confirme.
- Cómo se paga: `api/`, `server/`, el cálculo de precios, el stock y `confirmacion.html` no se tocan.
- Cambio de idioma ES/EN/PT: `shared/i18n.js` sigue como esqueleto.
- El botón flotante de WhatsApp y cualquier servicio nuevo.
- El panel de Admin y SuperAdmin.

## Por qué estas opciones y no otras

- **Preguntas en un módulo compartido (`shared/preguntas-frecuentes.js`)** y no escritas a mano dentro del HTML: se editan en un solo lugar y el buscador se puede probar con `node`, como el resto de las funciones compartidas.
- **Acordeón con `<details>` nativo** y no un componente propio: funciona sin JavaScript, es accesible y no suma código.
- **Dividir `renderEvento` en dos bloques** y no rehacer la página: los campos y botones de la compra (`step1`, `step2`, `formCompra`…) quedan con los mismos identificadores, así que el flujo de pago no se rompe.
- **Pie en un módulo** y no copiado en cada página: son tres páginas hoy y habrá más.
- **Las preguntas las redacta Claude como borrador** y la productora las confirma: lo que el sistema no puede afirmar (por ejemplo, la política de anulaciones) no se inventa; esas respuestas mandan a escribir una consulta hasta que haya una política.

## Impact

- Se modifican `public/index.html`, `public/evento.html` y `public/soporte.html`.
- Se agregan `shared/preguntas-frecuentes.js` y `shared/pie-publico.js`, y las pruebas `pruebas/22-preguntas-frecuentes.js` y `pruebas/23-pie-publico.js`.
- Se actualiza `CLAUDE.md` con los dos módulos nuevos.
- No hay cambios en Firestore ni en las funciones de `api/`. La consulta sigue guardándose en `consultas_publicas` con los mismos campos.
- El código base es la rama `claude/nube-2026-10-26-0230` (último PR de la nube), que ya trae los días, el detalle y el mapa del evento; este plan se escribió sobre esa versión.

## Cómo se verifica a mano

- Las funciones nuevas se comprueban con `node pruebas/22-preguntas-frecuentes.js` y `node pruebas/23-pie-publico.js`, y con `node pruebas/ejecutar-todas.js` para no romper nada.
- Las pantallas se miran en el navegador, en computadora y en celular (ancho de 375 px): inicio, un evento con mapa y varios días, un evento viejo sin días ni mapa, y Soporte buscando "tarjeta", "ENTRADA" y una palabra que no existe.
- Se hace una compra de prueba hasta la pantalla de Mercado Pago para confirmar que el pago sigue igual.

## Preguntas para la persona

1. ¿Quién confirma el texto de las preguntas frecuentes? Mientras tanto quedan como borrador, con las respuestas que dependen de una política (anulaciones y reprogramaciones) mandando a escribir una consulta.
