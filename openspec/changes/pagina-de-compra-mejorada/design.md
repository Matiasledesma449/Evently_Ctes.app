# Design

## Punto de partida (lo que hay hoy)

Se leyó el código de la rama `claude/nube-2026-10-26-0230`:

- `public/soporte.html` ("Centro de soporte"): una tarjeta con el formulario (nombre, correo, mensaje) que guarda en `consultas_publicas` con `estado: 'nueva'`, `fecha` y `origen` (solo acepta `public/evento.html` y `public/index.html`; si no, `public/soporte.html`).
- `public/contacto-modal.js`: un modal de consulta que abren los botones con `data-open-consulta` (inicio y evento).
- `public/evento.html`: `renderEvento` dibuja en `#eventoContainer` una sola tarjeta con la imagen, el nombre, los días, el lugar, el mapa y el detalle. Aparte están `#step1` (lotes y cantidad) y `#step2` (datos, resumen y pago). Los dos pasos se alternan con la clase `active`.
- `public/index.html`: `crearCardEvento` arma cada tarjeta; la imagen (`.event-image`) mide 208 px de alto y el cuerpo tiene un alto mínimo de 174 px, por eso el texto pesa más que el afiche.
- El sitio **no envía las entradas por correo**: `confirmacion.html` las muestra en pantalla, una por unidad con su código QR, y pide guardar el enlace.
- La prueba `pruebas/10-pantalla-de-compra.js` ejecuta el JavaScript real de `evento.html` con un navegador simulado y avisa si el código pide un `id` que la prueba no conoce.

## Decisiones

### 1. Las preguntas viven en `shared/preguntas-frecuentes.js`
Un módulo sin dependencias con los temas, las preguntas y dos funciones puras: `normalizarTexto` (minúsculas y sin acentos) y `buscarPreguntas(texto)`, que devuelve los temas con solo las preguntas que coinciden. Una pregunta coincide si **todas** las palabras escritas aparecen en su texto o en su respuesta, ya normalizados. Texto vacío devuelve todo.

- Alternativa descartada: escribir las preguntas dentro del HTML. Se editaría a mano en varios lugares y el buscador no se podría probar con `node`.
- La respuesta sobre formas de pago usa `textoDeFormasDePago()` de `shared/formas-de-pago.js`, para no repetir la lista y que cambie sola cuando cambie esa lista.

### 2. El acordeón es `<details>`/`<summary>` nativo
Cada pregunta es un `<details>`. Sin JavaScript para abrir y cerrar, accesible con teclado. El JavaScript solo arma las preguntas y filtra.

- Alternativa descartada: botones con `aria-expanded` hechos a mano. Más código para el mismo resultado.

### 3. Texto siempre como texto
Las preguntas se dibujan con `textContent` y el buscador nunca se inserta como HTML. Es la misma regla que ya se usa en el resto del sitio.

### 4. La página del evento se parte en tres bloques, sin tocar la compra
`renderEvento` deja de dibujar todo en un solo lugar y pasa a llenar tres contenedores:

```
header
main
  #eventoContainer          afiche + nombre + días + lugar (texto)
  #step1 / #step2           entradas  ->  datos y pago   (iguales que hoy)
  #sobreEventoContainer     "Sobre el evento": el detalle
  #dondeEsContainer         "Dónde es": lugar y mapa
  #loadingContainer
footer
```

- Los identificadores de la compra (`step1`, `step2`, `formCompra`, `lotesContainer`, `cantidadInput`, `btnContinuarPaso1`, `btnPagarAhora`, etc.) y todo el código de pago **no se mueven ni se renombran**. Solo se agregan `sobreEventoContainer` y `dondeEsContainer`.
- El mapa se sigue dibujando con `cargarLeaflet`/`dibujarMapa`; solo cambia el contenedor donde vive (`#mapaEvento` pasa a `#dondeEsContainer`). Si no hay ubicación, no hay cuadro de mapa.
- Las secciones de abajo quedan visibles también en el paso de datos.
- Como la prueba 10 avisa si falta un `id`, hay que sumar los dos contenedores nuevos a su lista de elementos simulados.
- Alternativa descartada: poner la compra al final, después del mapa. Obligaría a mover los dos pasos y a tocar el flujo de pago, que es lo más delicado del sitio.

### 5. "Ayuda" lleva al Centro de ayuda
El botón "Ayuda" del encabezado del evento y el link de soporte del inicio pasan a ser links a `soporte.html?origen=public/evento.html` y `soporte.html?origen=public/index.html`, que la página ya entiende. El modal `contacto-modal.js` **no se borra**: sigue disponible para "Enviar una consulta" del inicio si se quiere una respuesta rápida, y se decide en la implementación si el pie lo reemplaza. (Es un cambio chico y reversible.)

- Alternativa descartada: dejar el modal como única ayuda. La persona pidió que las dudas se respondan antes de pedir que se escriba.

### 6. El pie es un módulo: `shared/pie-publico.js`
Exporta `enlacesDelPie(paginaActual)` (pura, se prueba con `node`) y `dibujarPie(elemento, paginaActual)`. `enlacesDelPie` devuelve Inicio, Centro de ayuda y Enviar una consulta, sin la página actual. Cada página lo llama con un `<footer>` vacío. El texto de derechos que ya tienen se conserva tal cual.

- Alternativa descartada: copiar el HTML del pie en cada página. Son tres hoy y se van a sumar.

### 7. Inicio: el afiche manda
En `public/index.html`, `.event-image` pasa de 208 px fijos a una proporción vertical de afiche (`aspect-ratio: 4 / 5`) con `object-fit: cover`, y el cuerpo de la tarjeta pierde el alto mínimo de 174 px. Nombre, fecha y lugar quedan en dos líneas compactas; se mantienen el precio y "Ver entradas". El relleno violeta por evento y la insignia de proximidad no cambian.

- Riesgo: una foto horizontal se recorta. Con `object-fit: cover` se ve bien, pero hay que mirarlo con fotos reales de eventos (ver Riesgos).
- Alternativa descartada: una lista de una sola columna como All Access. En escritorio desperdicia el ancho; se mantiene la grilla de 1, 2 y 3 columnas.

## Borrador de las preguntas

Solo se afirma lo que el sitio hace. Marcado "(confirmar)" lo que la productora debería validar.

- **Cómo comprar**: pasos (elegir evento, "Ver entradas", lote y cantidad, "Continuar con el pago", nombre, apellido y correo, pagar); máximo de 10 entradas por compra.
- **Pagos**: formas de pago (`textoDeFormasDePago()`); los datos de la tarjeta se cargan solo en la página de Mercado Pago, nunca en Evently; qué pasa si el pago queda pendiente (la compra se confirma cuando Mercado Pago avisa y la pantalla de confirmación lo consulta).
- **Mi entrada**: no se envía por correo; se ve en pantalla con un código QR por entrada; hay que guardar o copiar el enlace; si se perdió, escribir una consulta con el correo de la compra (confirmar).
- **Anulaciones y cambios**: sin política definida: escribir una consulta (confirmar con la productora).
- **Reprogramaciones y cancelaciones**: sin política definida: escribir una consulta (confirmar con la productora).

## Riesgos

- **Texto que promete algo falso.** Mitigación: solo se afirma lo que el código hace, y lo dependiente de la productora manda al formulario.
- **Romper la compra al mover el HTML.** Mitigación: no se mueve ni se renombra nada de la compra; la prueba 10 y las demás corren completas; y se hace una compra de prueba hasta Mercado Pago.
- **Afiche recortado en fotos horizontales.** Mitigación: `object-fit: cover` y mirar el resultado con fotos reales; si queda mal, se ajusta la proporción en un solo lugar (el estilo `.event-image`).
- **Tailwind por CDN y estilos propios mezclados.** Se sigue el estilo de cada página (en soporte e inicio, clases propias; en evento, Tailwind) y no se introduce nada nuevo.
- **La nube no tiene navegador**, así que lo visual solo se comprueba a mano o con el Chrome de la persona.

## Cómo se verifica

- Con `node`: `pruebas/22-preguntas-frecuentes.js` (normalización, búsqueda con mayúsculas y acentos, texto vacío, sin resultados, etiquetas HTML como texto) y `pruebas/23-pie-publico.js` (links por página, sin la página actual, sin links legales).
- La prueba 10 actualizada y `node pruebas/ejecutar-todas.js` completo.
- A mano en navegador, en escritorio y en celular (375 px), con un evento con mapa y varios días y otro viejo sin días ni mapa.
