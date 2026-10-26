# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Lo que necesita navegador se comprueba a mano. Código base: la rama `claude/nube-2026-10-26-0230`.

## 1. Funciones compartidas

- [x] 1.1 Crear `shared/preguntas-frecuentes.js` con los cinco temas, el borrador de preguntas (ver `design.md`; solo lo que el sitio hace, y las respuestas de anulaciones y reprogramaciones mandan al formulario), `normalizarTexto` y `buscarPreguntas(texto)`. La respuesta de formas de pago usa `textoDeFormasDePago()`. Se comprueba leyendo el archivo: no tiene `innerHTML` ni dependencias externas, y ninguna respuesta nombra plazos o reembolsos.
- [x] 1.2 Crear `pruebas/22-preguntas-frecuentes.js`: normaliza mayúsculas y acentos ("ENTRADA", "devolucion"), texto vacío devuelve todo, "todas las palabras deben aparecer", sin resultados devuelve vacío, `<b>hola</b>` no rompe ni coincide. Se comprueba con `node pruebas/22-preguntas-frecuentes.js`.
- [x] 1.3 Crear `shared/pie-publico.js` con `enlacesDelPie(paginaActual)` (Inicio, Centro de ayuda, Enviar una consulta, sin la página actual y sin links legales) y `dibujarPie(elemento, paginaActual)` con `textContent`/`createElement`, conservando el texto de derechos de hoy. Se comprueba leyendo el archivo.
- [x] 1.4 Crear `pruebas/23-pie-publico.js`: links en inicio, evento y soporte; la página actual no aparece; no hay links legales. Se comprueba con `node pruebas/23-pie-publico.js`.

## 2. Centro de ayuda (`public/soporte.html`)

- [x] 2.1 Reemplazar el título "Centro de soporte" por "Centro de ayuda" con el buscador y los temas con sus preguntas en `<details>`, dibujados con `buscarPreguntas`, con el estado "sin resultados" y el botón que lleva al formulario. Se comprueba leyendo el archivo y, a mano, buscando "tarjeta", "ENTRADA" y una palabra inexistente.
- [x] 2.2 Pasar el formulario al final, con `id="contacto"`, **sin cambiar su lógica** (mismos campos, mismos mensajes, mismo `origen`). Se comprueba leyendo el archivo: el bloque de envío queda igual y el `origen` sigue aceptando solo los dos valores permitidos.
- [x] 2.3 Usar `dibujarPie` en un `<footer>` vacío. Se comprueba leyendo el archivo.
- [x] 2.4 (el link ya sale de `enlacesDelPie`; falta mirarlo a mano) Que el link "Enviar una consulta" del pie abra la página posicionada en el formulario (`soporte.html#contacto`). Se comprueba a mano.

## 3. Página del evento (`public/evento.html`)

- [x] 3.1 Sumar los contenedores `#sobreEventoContainer` y `#dondeEsContainer` después de `#step2`, con sus títulos. Se comprueba leyendo el archivo: no se renombró ningún `id` de la compra.
- [x] 3.2 Partir `renderEvento` en tres: afiche con nombre, días y lugar en `#eventoContainer`; el detalle en "Sobre el evento" (con "¡No te lo pierdas!" si no hay); lugar y mapa en "Dónde es" (sin cuadro de mapa si no hay ubicación). Se comprueba leyendo el archivo y a mano con un evento con mapa, uno sin ubicación y uno viejo sin días.
- [x] 3.3 Cambiar el botón "Ayuda" del encabezado por un link a `soporte.html?origen=public/evento.html`. Se comprueba a mano: la consulta enviada guarda ese origen.
- [x] 3.4 Usar `dibujarPie` en el pie. Se comprueba leyendo el archivo.
- [x] 3.5 Actualizar `pruebas/10-pantalla-de-compra.js` para conocer los dos contenedores nuevos y correr `node pruebas/10-pantalla-de-compra.js`. Se comprueba: pasa sin cambiar ningún caso de pago.

## 4. Inicio (`public/index.html`)

- [ ] 4.1 Cambiar `.event-image` a proporción de afiche (`aspect-ratio: 4 / 5`, `object-fit: cover`) y sacar el alto mínimo del cuerpo de la tarjeta; compactar nombre, fecha y lugar. Se comprueba a mano con eventos con foto y sin foto, en escritorio y en 375 px.
- [ ] 4.2 Cambiar los links de ayuda del inicio para que lleven al Centro de ayuda (`origen=public/index.html`) y decidir si el modal de consulta queda como "Enviar una consulta" o lo reemplaza el pie. Se comprueba a mano.
- [ ] 4.3 Usar `dibujarPie` en el pie. Se comprueba leyendo el archivo.
- [ ] 4.4 Comprobar que el carrusel de destacados y los mensajes de carga y de "sin eventos" siguen igual. Se comprueba a mano.

## 5. Revisión final

- [ ] 5.1 Correr `node pruebas/ejecutar-todas.js`: todo pasa, con las pruebas 22 y 23 incluidas.
- [ ] 5.2 Prueba a mano en navegador (necesita navegador; no la hace la nube): inicio, un evento con mapa y varios días, un evento viejo, Soporte con las tres búsquedas, y una compra de prueba hasta la página de Mercado Pago para confirmar que el pago sigue igual. Se comprueba mirando 375 px y escritorio.
- [ ] 5.3 La persona revisa y corrige el texto de las preguntas frecuentes (en especial lo marcado "confirmar" en `design.md`) y decide cuándo sumar los links legales.
- [ ] 5.4 Actualizar `CLAUDE.md` con `shared/preguntas-frecuentes.js` y `shared/pie-publico.js`. Se comprueba leyendo el archivo.
