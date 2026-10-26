# Proposal

## Why

El pedido 3 de `openspec/pendientes.md` dice: "Crear evento: fechas y horas por día, lugar con sugerencias y mapa, descripción en campos separados (actividad, tipo, requisitos, edad)."

Lo que se ve en el código hoy (`admin/eventos.html`, que sirve para "Solicitar evento" de la organización y para "Crear evento" del superadmin con `?modo=directo`):

- **Fecha**: un solo campo de texto libre (`Ej: 15 Diciembre 2024`), sin hora. Un evento de varios días no se puede describir y el comprador no ve a qué hora empieza.
- **Lugar**: un solo campo de texto libre, sin sugerencias ni mapa.
- **Descripción**: una sola caja de texto. Actividad, tipo de evento, requisitos y edad mínima se mezclan o no se dicen.
- Se guarda `fecha` (texto), `lugar` (texto) y `descripcion` (texto). Los leen `public/index.html` (que interpreta `fecha` para ordenar y esconder eventos pasados), `public/evento.html`, `public/confirmacion.html`, `server/venta.js`, `admin/eventos-seleccion.html`, `admin/superadmin.html` y `admin/aprobaciones.js` (que copia la solicitud entera al aprobar).

## What Changes

- **Fechas y horas por día**: el formulario deja agregar uno o más días, cada uno con su fecha, hora de inicio y hora de fin. Se guarda una lista `dias` y, para no romper nada, `fecha` sigue guardándose como texto del primer día (`15 Diciembre 2026`).
- **Descripción en campos separados**: actividad, tipo de evento, requisitos y edad mínima. Se guarda `detalle` con esos cuatro campos y `descripcion` sigue guardándose (el texto libre de siempre, opcional) para los eventos viejos y para quien no completa los campos.
- **Lugar con sugerencias y mapa** (depende de la pregunta 1): el campo de lugar sugiere direcciones y muestra un mapa; se guarda el texto en `lugar` (igual que hoy) y, si se eligió una sugerencia, también `ubicacion` con latitud y longitud.
- **Mostrar todo esto** en la página del evento (`public/evento.html`): un renglón por día con su horario, los cuatro campos del detalle y, si hay, el mapa.
- **Una lista compartida de funciones** en `shared/evento-datos.js` (armar y leer `dias`, texto de la fecha, detalle) para no repetir lógica, con su prueba en `pruebas/`.

## Capabilities

### New Capabilities
- `fechas-y-horas-por-dia`: cómo se cargan, guardan y muestran los días de un evento con su horario.
- `descripcion-en-campos`: los cuatro campos del detalle del evento y cómo conviven con la descripción vieja.
- `lugar-con-mapa`: sugerencias de lugar y mapa (según la pregunta 1).

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. -->

## Impact

- Código (previsto): `admin/eventos.html` (formulario y envío), `shared/evento-datos.js` (nuevo), `public/evento.html` (mostrar), una prueba nueva en `pruebas/`, y `admin/aprobaciones.js` solo si la edición de una solicitud tiene que mantener `dias` y `fecha` de acuerdo.
- No toca: `api/`, `server/`, reglas de Firestore ni datos ya guardados. Los eventos viejos (sin `dias` ni `detalle`) se siguen viendo igual.
- Sin dependencias nuevas, salvo que se elija la opción A o B de la pregunta 1 (mapa).

## Fuera de alcance

- Cambiar los datos de eventos ya guardados en Firestore.
- Las solicitudes de evento del superadmin (pedido 4).
- Cobrar o limitar la venta por día (cada evento sigue teniendo sus lotes; no hay entradas por día).

## Preguntas para la persona

**1. ¿Cómo hacemos las sugerencias de lugar y el mapa? Esto suma una librería o un servicio externo, por eso lo consulto.**
- A (recomendado): Leaflet con mapas de OpenStreetMap y sugerencias de Nominatim, cargados por CDN como el resto de los scripts. Es gratis y no necesita clave ni cuenta. Las sugerencias son de uso moderado (no sirve para miles de búsquedas por minuto) y a veces fallan con direcciones muy locales.
- B: Google Maps y Places. Sugerencias y mapa más precisos, pero necesita una clave de Google, una cuenta con tarjeta y puede cobrar según el uso.
- C: sin librería nueva: el lugar sigue siendo texto, se sugieren los lugares de eventos anteriores y se arma un botón "Ver en el mapa" que abre Google Maps con la dirección. Es lo más simple, pero no hay mapa dentro de la página.

Mientras no haya respuesta, no se hace nada del lugar con mapa: el resto del plan (días con horas y descripción en campos) se hace igual.

## Decidí por vos (decisiones comunes, sin pregunta)

- **Varios días, un solo `fecha`**: `fecha` guarda el primer día, porque `public/index.html` ordena y esconde eventos pasados por ese texto. Si prefieren que el evento se vea hasta el último día, es un cambio chico en `index.html` (usar el último día de `dias`).
- **Formato de las fechas**: `dias[].fecha` se guarda como `AAAA-MM-DD` (lo que ya entiende `fechaEvento` de `index.html`), y horas como `HH:MM`. Una hora de fin menor que la de inicio se acepta (la fiesta termina a la madrugada del día siguiente) y se muestra como "termina al día siguiente".
- **Requisitos y edad opcionales**: solo la actividad y el tipo son obligatorios si se completa el detalle; el texto libre viejo sigue valiendo.
- **Tipo de evento como lista**: Fiesta, Recital, Show, Deportivo, Cultural, Otro (con "Otro" se escribe a mano).

## Por qué esta opción y no otra

- **Lista `dias` más `fecha` de texto** en vez de reemplazar `fecha`: seis pantallas y `server/venta.js` leen `fecha`; cambiarla de golpe rompe ventas y confirmaciones viejas.
- **Funciones en `shared/`** igual que el menú, el evento activo y las formas de pago: se pueden probar con `node` sin navegador.

## Cómo se verifica a mano

1. Entrar como organización, abrir "Solicitar evento", agregar dos días con horas, completar el detalle y enviar.
2. Aprobar la solicitud como superadmin y abrir el evento en el sitio: se ven los dos días con horario y el detalle en campos.
3. Abrir un evento viejo: se ve igual que antes.
4. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
