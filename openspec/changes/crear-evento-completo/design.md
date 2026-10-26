# Design

## Datos que se guardan

Un evento (en `solicitudes_eventos` y, al aprobar, en `eventos`; `admin/aprobaciones.js` copia la solicitud entera) suma estos campos. Los que ya existían no cambian de nombre ni de tipo.

```
fecha:       "15 Diciembre 2026"          // texto del primer día (compatibilidad, ya existe)
dias:        [{ fecha: "2026-12-15", horaInicio: "21:00", horaFin: "05:00" }, ...]
lugar:       "Complejo Municipal, Saladas" // texto (ya existe)
ubicacion:   { lat: -28.25, lng: -58.63 }  // solo si se eligió una sugerencia (pregunta 1)
descripcion: "texto libre"                 // ya existe, opcional
detalle:     { actividad, tipo, requisitos, edad }
```

Un evento sin `dias` ni `detalle` (todos los viejos) se muestra como hoy.

## `shared/evento-datos.js`

Módulo de navegador sin dependencias (`export function ...`), como `shared/formas-de-pago.js`; la prueba le quita los `export` para cargarlo en `node`. También exporta `TIPOS_DE_EVENTO` para la lista del formulario.

- `normalizarDias(dias)`: limpia la lista; descarta días sin fecha válida, ordena por fecha, devuelve `[]` si no hay nada.
- `validarDias(dias)`: devuelve el primer problema en español o `''` si está bien (fecha obligatoria, horas con formato `HH:MM`, sin días repetidos).
- `fechaDeTexto(dias)`: texto del primer día (`15 Diciembre 2026`), el que va en `fecha`.
- `resumenDeDias(evento)`: lista de renglones `"Sáb 15 dic · 21:00 a 05:00 (termina al día siguiente)"`; si el evento no tiene `dias`, un solo renglón con `fecha`.
- `armarDetalle(campos)` y `detalleParaMostrar(evento)`: el detalle limpio (sin campos vacíos) y las filas a mostrar; si no hay `detalle`, usa `descripcion`.

## Formulario (`admin/eventos.html`)

- Reemplaza el campo de fecha por una lista de días (mínimo 1) con fecha, hora de inicio y hora de fin, y botón "Agregar día", como ya funcionan los lotes.
- Reemplaza la caja única de descripción por cuatro campos, y deja el texto libre como "Algo más para contarle al público (opcional)".
- Al enviar, valida con `validarDias`, arma `dias`, `fecha` y `detalle`, y los guarda junto con lo de siempre.
- Los textos se muestran con `textContent` o escapados (nunca como HTML).

## Página del evento (`public/evento.html`)

- Usa `resumenDeDias` en lugar del único renglón de fecha y `detalleParaMostrar` en lugar del único párrafo de descripción. Todo escapado con `escaparHtml`.

## Lugar con mapa

Respuesta de la persona a la pregunta 1: **A** (Leaflet + OpenStreetMap + Nominatim, por CDN, sin clave).

- `shared/evento-datos.js` suma `armarUbicacion(lat, lng)` (devuelve `{ lat, lng }` redondeado a 6 decimales, o `null` si no son números dentro de rango) y `ubicacionDeEvento(evento)` (la lee de un evento, `null` si no hay o es inválida). Se prueban con `node`.
- `shared/lugar-mapa.js` (navegador): `activarLugarConMapa({ input, lista, mapa, aviso })` conecta el campo de lugar con Nominatim (`nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ar`), con espera de 600 ms entre teclas (uso moderado, política de Nominatim) y devuelve `obtenerUbicacion()` / `limpiar()`. Al elegir una sugerencia pone el texto en el campo, dibuja el mapa y recuerda la latitud y longitud; si la persona vuelve a escribir en el campo, la ubicación se descarta para no quedar contradictoria con el texto. Si la búsqueda falla, muestra un aviso corto y el campo sigue como texto.
- `admin/eventos.html` carga Leaflet por CDN, usa el componente y guarda `ubicacion` solo si se eligió una sugerencia.
- `public/evento.html` carga Leaflet por CDN solo si el evento tiene `ubicacion` y dibuja el mapa con un marcador, debajo del lugar. Sin `ubicacion`, no hay mapa y el lugar se ve como siempre.
- Los textos de las sugerencias se muestran con `textContent` (nunca como HTML).

## Edición de una solicitud

`admin/aprobaciones.js` deja editar `fecha` y `lugar` como texto. Si el evento tiene `dias`, cambiar `fecha` a mano los desincroniza. Se decide en las tareas: cuando la solicitud tiene `dias`, el campo `fecha` de la edición se muestra bloqueado con un aviso, y para cambiar los días se pide rehacer la solicitud. Es lo más chico que evita datos contradictorios.

## Riesgos

- `fechaEvento` en `public/index.html` entiende `AAAA-MM-DD` y `15 diciembre 2026`; `fecha` se guarda en este segundo formato, el que ya usaba el ejemplo del formulario.
- No hay navegador en la nube: el formulario se verifica a mano o con la skill `auditar-panel`; las funciones de `shared/` se prueban con `node`.
