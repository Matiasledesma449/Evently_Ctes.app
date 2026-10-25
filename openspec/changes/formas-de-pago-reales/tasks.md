# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Ajustadas a las respuestas de la persona (2D, 3A, 4A, 5A, 6A).

## 1. Lista compartida de formas de pago

- [x] 1.1 Crear `shared/formas-de-pago.js` con la lista (Transferencia, Débito, Crédito) y una función que devuelve el texto para el comprador. Se comprueba con `node -e`: la lista no contiene "Efectivo" y el texto nombra cada forma una vez.
- [x] 1.2 Usar esa función en el aviso del paso de pago de `public/evento.html`. Se comprueba leyendo el archivo: el texto sale de la función y no queda ninguna lista escrita a mano.
- [x] 1.3 (Hecha con `SIGUE A`: Ventas, Reportes y las tarjetas del Dashboard usan `nombreParaMostrar`; los desplegables guardan el nombre del servidor y muestran el otro; pruebas T1 a T7 en `pruebas/18-formas-de-pago.js`.) Dejar en la lista compartida la equivalencia "Transferencia" = lo que guarda el servidor como "Dinero en cuenta" (respuesta 5A), y usarla en Ventas y Reportes solo para mostrar el nombre. "Prepaga" se sigue mostrando en el panel si aparece. No se toca `server/`. Se comprueba con `node -e` y con `node pruebas/ejecutar-todas.js`.

## 2. Sin efectivo

- [x] 2.1 ~~Borrar `public/assets/js/data.js` y `public/assets/css/js/data.js`~~ Salteada (respuesta 6A): los `data.js` se dejan como están por ahora.
- [x] 2.2 ~~Quitar la decisión pendiente de los `data.js` en `CLAUDE.md`~~ Salteada (respuesta 6A): la decisión sigue pendiente y `CLAUDE.md` no cambia por esto.
- [x] 2.3 Crear `pruebas/18-formas-de-pago.js`: recorre `public/*.html`, `admin/*.html` y `shared/*.js` y falla si hay "Efectivo" como opción (`<option>` o valor de lista), permitiéndolo en comentarios. Se comprueba con `node pruebas/18-formas-de-pago.js` (todo `OK`); se agrega a propósito un `<option value="Efectivo">` en una copia y se ve que la prueba falla.

## 3. PDF de Reportes con secciones elegibles (respuesta 4A)

- [x] 3.1 Escribir `seccionesDelPdf(elegidas)` en `shared/ventas-utils.js` (orden fijo, numeración sin saltos, claves desconocidas ignoradas, lista vacía devuelve vacío). Se comprueba con `node -e`: todas marcadas da 5; sin "detalle" da 4 numeradas 1 a 4; `[]` y `null` no fallan.
- [x] 3.2 Agregar a `pruebas/18-formas-de-pago.js` los casos de 3.1. Se comprueba con `node pruebas/18-formas-de-pago.js` y `node pruebas/ejecutar-todas.js`.
- [x] 3.3 (Hecha con `SIGUE A`: casillas, armado por secciones y aviso escritos; la nube no tiene navegador, así que la comprobación con `auditar-panel` queda para la persona o para 4.1.) En `admin/reportes.html`: casillas por sección junto a "Exportar PDF", armado del PDF solo con las elegidas y títulos numerados con la función; aviso en pantalla si no hay ninguna. Se comprueba con la skill `auditar-panel` con datos inventados, reemplazando `html2pdf` para leer lo que se le entrega: con todo marcado hay 5 títulos, sin "Detalle" hay 4 numerados 1 a 4, y sin ninguna no se llama a `html2pdf`.

## 4. Revisión final

- [ ] 4.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [x] 4.2 (Hecha con `SIGUE A`: `public/assets` no tiene cambios, los dos `data.js` quedaron igual.) Confirmar con `git diff --stat` que solo cambió lo previsto (`shared/`, `public/evento.html`, `admin/reportes.html`, `pruebas/`, `CLAUDE.md` y este change; los dos `data.js` no se tocan).
- [x] 4.3 (Hecha con `SIGUE A`: `CLAUDE.md` ya nombra `shared/formas-de-pago.js` y `pruebas/18-formas-de-pago.js`, sin claves, correos ni rutas personales.) Actualizar `CLAUDE.md` con la lista compartida de formas de pago. Se comprueba leyendo el archivo: sin claves, correos ni rutas personales.

## Workflow follow-up

- La transferencia bancaria real (cuenta propia, sin Mercado Pago) queda fuera de este change; si se quiere, es otro change.
- Archivar el change cuando la persona lo apruebe.
