# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Ajustadas a las respuestas de la persona (1B, 2D, 3A, 4A); la sección 1 espera la pregunta 5 de `proposal.md`.

## 1. Lista compartida de formas de pago (espera la pregunta 5)

- [ ] 1.1 Crear `shared/formas-de-pago.js` con la lista (Transferencia, Débito, Crédito; ajustar según la pregunta 5) y una función que devuelve el texto para el comprador. Se comprueba con `node -e`: la lista no contiene "Efectivo" y el texto nombra cada forma una vez.
- [ ] 1.2 Usar esa función en el aviso del paso de pago de `public/evento.html`. Se comprueba leyendo el archivo: el texto sale de la función y no queda ninguna lista escrita a mano.
- [ ] 1.3 Si la pregunta 5 es A: dejar en la lista compartida la equivalencia "Transferencia" = lo que guarda el servidor como "Dinero en cuenta", y usarla en Ventas y Reportes solo para mostrar el nombre. Se comprueba con `node -e` y con `node pruebas/ejecutar-todas.js`.

## 2. Sin efectivo

- [ ] 2.1 Borrar `public/assets/js/data.js` y `public/assets/css/js/data.js` (respuesta 1B). Se comprueba con una búsqueda de `data.js` en el repo (sin referencias fuera de `openspec/`) y `git status`.
- [ ] 2.2 Quitar la decisión pendiente de los `data.js` en `CLAUDE.md`. Se comprueba leyendo el archivo.
- [ ] 2.3 Crear `pruebas/18-formas-de-pago.js`: recorre `public/*.html`, `admin/*.html` y `shared/*.js` y falla si hay "Efectivo" como opción (`<option>` o valor de lista), permitiéndolo en comentarios. Se comprueba con `node pruebas/18-formas-de-pago.js` (todo `OK`); se agrega a propósito un `<option value="Efectivo">` en una copia y se ve que la prueba falla.

## 3. PDF de Reportes con secciones elegibles (respuesta 4A)

- [ ] 3.1 Escribir `seccionesDelPdf(elegidas)` en `shared/ventas-utils.js` (orden fijo, numeración sin saltos, claves desconocidas ignoradas, lista vacía devuelve vacío). Se comprueba con `node -e`: todas marcadas da 5; sin "detalle" da 4 numeradas 1 a 4; `[]` y `null` no fallan.
- [ ] 3.2 Agregar a `pruebas/18-formas-de-pago.js` los casos de 3.1. Se comprueba con `node pruebas/18-formas-de-pago.js` y `node pruebas/ejecutar-todas.js`.
- [ ] 3.3 En `admin/reportes.html`: casillas por sección junto a "Exportar PDF", armado del PDF solo con las elegidas y títulos numerados con la función; aviso en pantalla si no hay ninguna. Se comprueba con la skill `auditar-panel` con datos inventados, reemplazando `html2pdf` para leer lo que se le entrega: con todo marcado hay 5 títulos, sin "Detalle" hay 4 numerados 1 a 4, y sin ninguna no se llama a `html2pdf`.

## 4. Revisión final

- [ ] 4.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 4.2 Confirmar con `git diff --stat` que solo cambió lo previsto (`shared/`, `public/evento.html`, `admin/reportes.html`, `pruebas/`, los dos `data.js` borrados, `CLAUDE.md` y este change).
- [ ] 4.3 Actualizar `CLAUDE.md` con la lista compartida de formas de pago. Se comprueba leyendo el archivo: sin claves, correos ni rutas personales.

## Workflow follow-up

- Si la persona responde 5B, agregar tareas en `server/confirmacion.js` y en los reportes para juntar "Dinero en cuenta" y "Transferencia".
- Si la persona responde 5C, sacar este change de la lista de la nube y abrir otro para la transferencia bancaria real.
- Archivar el change cuando la persona lo apruebe.
