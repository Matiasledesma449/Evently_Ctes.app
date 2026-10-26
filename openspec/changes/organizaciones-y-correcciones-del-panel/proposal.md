# Proposal

## Why

La persona probó la vista previa del panel y encontró cosas que confunden: con "Ver como organización" todavía se ven las categorías de porcentaje y el filtro "Todas las organizaciones"; las categorías están en la lista de Eventos y no en "Crear evento"; el Dashboard muestra más eventos que la lista de Eventos; y Transferencia, Débito y Crédito no se reflejan igual en todas las páginas. Todo eso viene de un mismo problema de fondo: una "organización" hoy no existe como cosa propia (es solo un usuario con rol `organizacion`), y cada pantalla decide a su manera de quién es un evento. Se arregla ahora, antes de cargar datos nuevos, para empezar de cero con una estructura clara: una productora (por ejemplo Valigroup) es una organización, con sus eventos y sus admins.

## What Changes

- **Ver como organización de verdad**: las pantallas del panel usan el rol con el que se está mirando (`window.rolEfectivo`) y no el rol real. En esa vista no aparecen las categorías de porcentaje ni el filtro de organizaciones. Los permisos reales no cambian. Además, en esa vista el superadmin **elige qué organización mira** y las listas muestran solo los eventos de esa organización (hoy muestran todos).
- **Categorías de porcentaje en "Crear evento"**: el panel de categorías y su elección pasan a la pantalla "Crear evento", solo para el superadmin real. Salen de la lista de Eventos.
- **Un admin ve solo los eventos de su organización**, sin filtro de organizaciones. El filtro "Todas las organizaciones" es solo del superadmin.
- **Organizaciones como entidad**: el superadmin crea una organización (nombre) y le vincula a sus admins por correo. Cada evento lleva el `organizacionId` de su organización, y **esa es la única regla de pertenencia** (se dejan de usar `creadoPor` y el correo como respaldo).
- **Conteos coherentes**: Resumen (Dashboard), Eventos, Ventas y Reportes arman la lista de eventos con la misma función, así que muestran los mismos eventos.
- **Formas de pago consistentes**: el filtro y los textos de Ventas, Reportes, Resumen y el PDF ofrecen siempre Transferencia, Débito y Crédito (más "Otros" solo si hay ventas con otro método). Efectivo no aparece.
- **Script de limpieza para empezar de cero**: una herramienta que corre la persona, que primero muestra qué borraría y solo borra con confirmación. Se usa después de implementar lo anterior.

## Capabilities

### New Capabilities
- `vista-como-organizacion`: qué ve el superadmin cuando mira el panel como organización; las pantallas respetan el rol con el que se mira.
- `organizaciones`: la organización como entidad, su creación por el superadmin, sus admins, la pertenencia de los eventos y las listas de eventos coherentes.
- `costo-de-servicio-en-crear-evento`: dónde se editan y se eligen las categorías de porcentaje, y quién puede hacerlo.
- `formas-de-pago-en-el-panel`: las formas de pago que se ofrecen y se muestran de manera consistente en todo el panel.
- `limpieza-de-datos`: la herramienta para vaciar los datos de prueba de forma segura y confirmada por la persona.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- Cómo se paga, el cálculo del costo de servicio y la página de compra.
- Mensajes y Consultas públicas.
- Crear cuentas de acceso desde el panel (ver la pregunta 1): no se hace en este change.
- Borrar datos desde la nube o desde el navegador: la limpieza la corre la persona, en su computadora.
- Cualquier cambio de reglas de Firestore publicado por Claude: se entrega el texto y lo publica la persona.

## Por qué estas opciones y no otras

- **Una sola función de pertenencia** (`organizacionId`) y no la mezcla de tres campos de hoy: es lo que hace que cada pantalla cuente distinto. Se acepta que los eventos viejos sin `organizacionId` no se vean para los admins; la limpieza de datos los saca.
- **Las organizaciones en una colección propia** (`organizaciones`) y no solo un campo suelto: permite crear una productora nueva, listarlas y elegirlas al crear un evento sin depender de que ya exista un usuario.
- **Vincular admins existentes por correo** y no crear cuentas desde el panel: crear cuentas de acceso necesita permisos del servidor y es sensible. Por ahora las cuentas se crean como hoy y el superadmin las asigna a una organización.
- **Filtro de formas de pago con lista fija** y no armado con lo que haya en los datos: así siempre se ve lo mismo, y los nombres viejos no cuelan.
- **Limpieza como herramienta aparte, con vista previa y confirmación**: borrar datos reales no lo hace ni la nube ni el navegador.

## Impact

- Se modifican `admin/eventos-seleccion.html`, `admin/eventos.html`, `admin/dashboard.html`, `admin/ventas.html`, `admin/reportes.html`, `admin/soporte.html`, `admin/aprobaciones.js`, `shared/selector-evento.js`, `shared/menu-admin.js`, `shared/formas-de-pago.js` y `shared/ventas-utils.js`.
- Se agregan `admin/organizaciones.html`, `shared/organizaciones.js`, `herramientas/limpiar-datos.js` (con su `LEEME.md`) y pruebas nuevas.
- Firestore: colección nueva `organizaciones` y reglas nuevas que publica la persona (texto en `design.md`). Los eventos nuevos llevan `organizacionId`.
- Se actualiza `CLAUDE.md`.
- El código base es la rama `claude/nube-2026-10-26-0400` (último PR de la nube).

## Cómo se verifica a mano

- Con `node`: las pruebas nuevas de pertenencia y de formas de pago, y `node pruebas/ejecutar-todas.js` completo.
- Con un superadmin en "Ver como organización": en Eventos no se ven categorías ni filtro de organizaciones, y la lista es la de una organización.
- Con una cuenta de organización real: solo se ven los eventos de su organización.
- Resumen, Eventos, Ventas y Reportes muestran el mismo conjunto de eventos para la misma organización.
- En Ventas y Reportes, el filtro ofrece Transferencia, Débito y Crédito, y no ofrece Efectivo.
- Crear una organización nueva, vincularle un admin y crear un evento a su nombre; el admin solo ve ese evento.
- La limpieza: correr primero sin confirmar y revisar la lista de lo que borraría.

## Preguntas para la persona

1. **Cuentas de las organizaciones.** ¿Cómo se crean las cuentas de los admins de una organización nueva? A (recomendado): como hoy, a mano en Firebase, y el superadmin las vincula por correo a la organización. B: que el panel las cree solas (necesita una función del servidor con permisos de Firebase: más trabajo y más riesgo, se haría en un change aparte).
2. **Los eventos de hoy.** Los eventos viejos que no tengan `organizacionId` dejan de verse para los admins. ¿Está bien porque vas a limpiar los datos y empezar de cero? (si no, hay que armar primero una migración).
3. **"Ver como organización".** Hoy esa vista muestra todos los eventos. A (recomendado): el superadmin elige qué organización mira y ve solo sus eventos, como la vería su admin. B: queda como hoy, mostrando todos los eventos.
4. **"Prepaga".** Algunas ventas guardan el método "Prepaga" (tarjeta prepaga). ¿En el panel se cuenta como Crédito, como Débito o queda en "Otros"?
