# Design

## Context

Estado de hoy, visto en el código:

- **Resumen** (`admin/dashboard.html`): lee el evento por `?id=` o por `localStorage.eventoId`, escucha ese evento y sus ventas (`where eventoId == id`) y calcula las tarjetas dentro de la página. `totalVendidas = max(suma de los contadores vendidas de los lotes, entradas de ventas confirmadas)`, el promedio de entradas usa ese total y "Lote más rentable" es `precio * vendidas` del contador.
- **Ventas** (`admin/ventas.html`): ya lee un evento y usa funciones puras de `shared/ventas-utils.js` (cambio `ventas-tarjetas-por-filtro`).
- **Reportes** (`admin/reportes.html`): escucha **todos** los eventos y **todas** las ventas, filtra por lote y método y suma la capacidad de todos los eventos. No sabe qué evento se está mirando.
- El evento "recordado" (`localStorage.eventoId`) solo lo guarda la lista de Eventos (`eventos-seleccion.html`) y la creación de un evento; entrar con `?id=` no lo guarda.
- La lista de Eventos decide los "eventos propios" de una organización con tres criterios: mismo `organizacionId`, `creadoPor` igual al uid, o `correo` igual al email del usuario. El superadmin ve todos.
- Las reglas de Firestore dejan leer `ventas` a cualquier organización (ver "Fuera de alcance" en `proposal.md`).

Ver `proposal.md` para el motivo y `specs/` para lo que debe mostrarse.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de cálculo para las cifras de Resumen y Reportes, probada con `node`.
- Un solo selector de evento, igual en las tres pantallas.
- Que ninguna pantalla "salte" al cargar.

**Non-Goals:**
- Reglas de Firestore, datos o pagos.
- Reescribir las pestañas internas de Reportes: siguen igual pero con los datos de lo elegido.

## Decisions

### 1. Cálculos puros en `shared/ventas-utils.js`
Funciones nuevas, sin página ni Firestore, que también usará la prueba nueva:
- `eventosDeLaPersona(eventos, usuario, uid)`: el superadmin ve todos; una organización, los que cumplen alguno de los tres criterios que usa la lista de Eventos para una organización: `ev.organizacionId` igual al `organizacionId` del usuario, `ev.creadoPor` igual al uid, o `ev.correo` igual al email del usuario (misma comparación exacta). El Panel global usa una variante (correo sin distinguir mayúsculas), que queda fuera de este cambio.
- `ventasDeEventos(ventas, ids)`: ventas de uno o varios eventos.
- `cifrasDelEvento(eventos, ventas)`: devuelve `{ capacidad, entradas, aforoRestante, ocupacion, recaudado, confirmadas, promedioEntradas, loteMasVendido, loteMasRentable, pendientes, metodoMasUsado }`, todo desde las ventas confirmadas y los lotes (reutiliza `resumenDeVentas`).
- `tarjetasDeResumen(cifras)`: la lista de tarjetas `{ titulo, valor, ayuda, tono, icono }`; con `cifras = null` devuelve las mismas tarjetas con "—" (carga sin saltos).

**Por qué:** Resumen y Reportes llaman a la misma función, así que con el mismo evento los números **no pueden** diferir. **Alternativa descartada:** arreglar los cálculos dentro de cada página; ya demostró que diverge.

### 2. Selector compartido: `shared/selector-evento.js`
Script clásico que cada pantalla incluye junto a un contenedor `<div id="selectorEvento">`:
- Al cargarse (antes que nada), si la dirección trae `?id=` lo **guarda** en `localStorage.eventoId` (salvo "todos", que no se guarda). Así el evento queda recordado aunque se entre por enlace.
- Cuando Firebase está listo (evento `firebase-ready`, o de inmediato si `window.db` ya existe) lee el usuario, los eventos y arma el desplegable con `eventosDeLaPersona`. En Reportes agrega la opción "Todos los eventos".
- Elegir un evento **recarga la pantalla** con el `?id=` nuevo (y lo guarda). No se cambia en caliente: cada pantalla ya arranca desde `?id=`, y recargar mantiene el código simple y la dirección siempre fiel a lo que se ve.
- Mientras carga, muestra una caja de ancho fijo con "—" para que no salte.

**Alternativa descartada:** cambiar de evento sin recargar; obliga a re-armar las suscripciones de cada pantalla y es donde más se rompe.

### 3. Resumen
`dashboard.html` arma las tarjetas con `tarjetasDeResumen`. Hoy redirige a la lista de Eventos cuando no hay un evento; pasa a mostrar el selector con el texto de invitación, sin redirigir. Se dibujan de inmediato con "—" y se reemplazan al llegar los datos (sin el texto "Cargando datos..."). Las tarjetas que existen en Ventas usan sus mismos títulos. Cada tarjeta lleva su línea de ayuda. Se descarta el uso de los contadores `vendidas` de los lotes para cualquier cifra mostrada.

### 4. Reportes
- Un evento: escucha ese evento y sus ventas con `where eventoId == id` (menos datos que hoy).
- "Todos los eventos": lee todas las ventas como hoy y las filtra **en memoria** por los eventos de la persona (`ventasDeEventos`). Es lo mismo que se lee hoy; la protección real depende de las reglas (fuera de alcance).
- El filtro de lote sale de los lotes del evento (o de los eventos) elegidos y el de método de `metodosDePago` (ya existe). La capacidad sale de los lotes de lo elegido.
- Las tarjetas del resumen general usan `cifrasDelEvento`; las pestañas siguen calculando con `ventasFiltradas`, que ahora ya viene acotada al evento. Se agrega la línea "Mostrando: ...". El PDF usa la misma selección.

### 5. El enlace Resumen del menú
`shared/menu-admin.js` ya arma `dashboard.html?id=<eventoId recordado>`; con el selector guardando siempre el evento queda coherente, así que **no se modifica**. Solo se verifica con la skill `auditar-panel` (tarea 2.3).

## Risks / Trade-offs

- **[Cambiar de evento recarga la pantalla]** → Es instantáneo con los datos en caché y mantiene la dirección fiel; se prefiere a un cambio en caliente propenso a fallos.
- **[Una organización puede leer ventas de otros eventos por las reglas]** → El selector solo le ofrece los suyos, pero un usuario avanzado podría pedir otros; queda anotado para el cambio de reglas (SHR-71).
- **[Las pestañas de Reportes dependen de campos que pueden faltar en ventas viejas]** → Se prueba con las ventas viejas del evento de ejemplo (monto no numérico, sin fecha) y con la skill `auditar-panel`.
- **[`firebase-ready` puede ocurrir antes de cargar el selector]** → El selector comprueba si `window.db` ya existe antes de esperar el evento.
- **[Las cifras de Resumen cambian respecto a hoy]** → Es intencional (hoy eran incoherentes); se deja escrito en las tareas con el antes y el después.

## Migration Plan

1. Funciones puras y prueba `pruebas/15-cifras-del-evento.js`.
2. Selector en Ventas (la pantalla ya validada) y chequeos nuevos en `auditar-panel`.
3. Resumen con las funciones y el selector.
4. Reportes con el evento elegido.
5. Auditoría completa.

Marcha atrás: cada paso es un commit y se deshace con `git revert`. No hay datos que migrar.
