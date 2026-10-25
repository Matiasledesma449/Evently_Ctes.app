# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Escritas para la opción A de cada pregunta de `proposal.md`; se ajustan según la respuesta de la persona.

## 1. Lista compartida de formas de pago

- [ ] 1.1 Crear `shared/formas-de-pago.js` con la lista (Crédito, Débito, Prepaga, Dinero en cuenta) y una función que devuelve el texto "tarjeta de crédito, de débito, prepaga o dinero en cuenta". Se comprueba con `node -e`: la lista no contiene "Efectivo" y el texto nombra cada forma una vez.
- [ ] 1.2 Usar esa función en el aviso del paso de pago de `public/evento.html`. Se comprueba leyendo el archivo: el texto sale de la función y no queda ninguna lista escrita a mano.

## 2. Sin efectivo

- [ ] 2.1 Según la pregunta 1 (opción A: no tocar `data.js`). Se comprueba con `git diff --stat`: sin cambios en los dos `data.js`.
- [ ] 2.2 Crear `pruebas/18-formas-de-pago.js`: recorre `public/*.html`, `admin/*.html` y `shared/*.js` y falla si hay "Efectivo" como opción (`<option>` o valor de lista), permitiéndolo en comentarios. Se comprueba con `node pruebas/18-formas-de-pago.js` (todo `OK`); se agrega a propósito un `<option value="Efectivo">` en una copia y se ve que la prueba falla.

## 3. PDF de Reportes con secciones elegibles

- [ ] 3.1 Escribir `seccionesDelPdf(elegidas)` en `shared/ventas-utils.js` (orden fijo, numeración sin saltos, claves desconocidas ignoradas, lista vacía devuelve vacío). Se comprueba con `node -e`: todas marcadas da 5; sin "detalle" da 4 numeradas 1 a 4; `[]` y `null` no fallan.
- [ ] 3.2 Agregar a `pruebas/18-formas-de-pago.js` los casos de 3.1. Se comprueba con `node pruebas/18-formas-de-pago.js` y `node pruebas/ejecutar-todas.js`.
- [ ] 3.3 En `admin/reportes.html`: casillas por sección junto a "Exportar PDF", armado del PDF solo con las elegidas y títulos numerados con la función; aviso en pantalla si no hay ninguna. Se comprueba con la skill `auditar-panel` con datos inventados, reemplazando `html2pdf` para leer lo que se le entrega: con todo marcado hay 5 títulos, sin "Detalle" hay 4 numerados 1 a 4, y sin ninguna no se llama a `html2pdf`.

## 4. Revisión final

- [ ] 4.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 4.2 Confirmar con `git diff --stat` que solo cambió lo previsto (`shared/`, `public/evento.html`, `admin/reportes.html`, `pruebas/` y este change).
- [ ] 4.3 Actualizar `CLAUDE.md` con la lista compartida de formas de pago. Se comprueba leyendo el archivo: sin claves, correos ni rutas personales.

## Workflow follow-up

- Si la persona responde 2B, agregar tareas en `server/confirmacion.js` y en los reportes para juntar "Dinero en cuenta" y "Transferencia".
- Si la persona responde 3B, agregar una sección "Formas de pago por evento" con sus propias tareas y especificación, coordinada con el pedido 3 (Crear evento).
- Si la persona responde 4B o 4C, ajustar la sección 3 (elegir formas de pago a incluir).
- Archivar el change cuando la persona lo apruebe.
