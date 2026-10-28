# Evently

Plataforma web de venta de entradas para eventos. Tiene un sitio público para compradores y un panel para organizadores (Admin) y para SuperAdmin.

## Estructura
- `public/`: sitio del usuario final (inicio, evento, confirmación, soporte, validación de entradas).
- `admin/`: panel Admin y SuperAdmin (login, eventos, ventas, reportes, mensajes, soporte, escáner QR).
- `shared/`: código común (`firebase-init.js`, `menu-admin.js` y `menu-rol.js` del menú del panel, `ventas-utils.js`, `ui-utils.js`, `i18n.js`, estilos).
- `validador.html`: validación de entradas por QR, en la raíz.
- `api/`: funciones serverless (Vercel): `crear-pago.js`, `mp-webhook.js`, `venta.js` y `crear-admin.js` (el superadmin crea la cuenta del admin de una organización; el proyecto de Firebase no deja crear cuentas desde la página).
- `server/`: lógica de los pagos que usan las funciones de `api/` (configuración, Mercado Pago, firma del webhook, Firestore con `firebase-admin`, validaciones).
- `pruebas/`: pruebas simuladas (pagos y funciones puras del panel): `node pruebas/ejecutar-todas.js`.
- `herramientas/`: `limpiar-datos.js` vacía los datos de prueba; la corre solo la persona, con su clave fuera del repo (ver `herramientas/LEEME.md`). Claude no la ejecuta.
- `BACKLOG_EVENTLY.md`: lista de tareas por fases, con IDs (ADM-, SUP-, USR-, SHR-).
- `openspec/`: especificaciones y cambios planificados con OpenSpec.

## Cómo correrlo y probarlo
- El sitio es HTML + JavaScript puro, sin paso de build. Hay un `package.json` por las funciones de `api/` (`firebase-admin`).
- Los scripts se cargan por CDN (Firebase 10.7.1, Tailwind, jsQR). Hace falta internet.
- Cómo abrirlo en local: no verificado. Los `<script type="module">` suelen requerir un servidor HTTP y no `file://`.
- Hay pruebas simuladas solo para el flujo de pagos: `node pruebas/ejecutar-todas.js` (ver `pruebas/LEEME.md`). El resto del sitio no tiene tests: la verificación es manual, por rol (ver SHR-72 en el backlog).

## Pagos (Mercado Pago)
- Flujo: `evento.html` llama a `/api/crear-pago` → crea la venta `pendiente` y la preferencia de pago → Mercado Pago avisa a `/api/mp-webhook` (firma verificada) → la venta pasa a `confirmada` y se descuenta el stock en una transacción → `confirmacion.html` consulta `/api/venta` hasta ver el estado real.
- Las ventas y el stock solo los escribe el servidor (`firebase-admin`); el navegador no debe escribir en `ventas` (queda garantizado cuando se publiquen las reglas de Firestore, tarea 10.3).
- Costo de servicio: lo paga el comprador y se cobra como renglón aparte. Su porcentaje sale de la categoría que el superadmin asigna a cada evento (`comisionCategoriaId`); las categorías están en el documento `configuracion/comisiones`. El cálculo real está en `server/comision.js` y `server/compra.js`; `shared/comision.js` solo lo muestra en la página. Sin categoría, 0%. Las ventas guardan `subtotal`, `costo_servicio`, `comision_porcentaje` y `monto_total`; el panel cuenta como recaudado el subtotal (`ingresoDeVenta` en `shared/ventas-utils.js`). Detalle: `openspec/changes/costo-de-servicio/`.
- Variables de entorno (solo los nombres, los valores van en Vercel): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `SITE_URL`.
- Formas de pago que se nombran en el sitio (Transferencia, Débito, Crédito; sin efectivo): lista en `shared/formas-de-pago.js`, probada en `pruebas/18-formas-de-pago.js`. Es solo texto para mostrar; lo que guarda el servidor no cambia.
- Días con horario y detalle de un evento (`dias`, `detalle`; `fecha` sigue siendo el texto del primer día): funciones en `shared/evento-datos.js`, probadas en `pruebas/19-evento-datos.js`.
- Solicitudes de eventos del superadmin: ya no hay "Panel global"; viven en la pestaña "Solicitudes" de "Crear evento" (`admin/eventos.html?modo=directo`, lógica en `admin/aprobaciones.js`). Los comentarios (`comentarios`) y los enlaces de contacto salen de `shared/solicitudes-evento.js`, probado en `pruebas/20-solicitudes-evento.js`.
- Mensajes y Consultas públicas (superadmin): lista + detalle con estado nuevo / leído / respondido. Los cálculos y la lista de organizaciones de "Nuevo mensaje" salen de `shared/estado-mensajes.js`, probado en `pruebas/21-estado-mensajes.js`. Cada documento de `conversaciones` guarda además `ultimoDe` (quién escribió el último mensaje) y `ultimoLeido`; las conversaciones viejas sin esos campos se ven como "leído".
- Lugar con sugerencias y mapa: `shared/lugar-mapa.js` (Leaflet + OpenStreetMap + Nominatim por CDN, sin clave); el evento guarda `ubicacion` (`lat`, `lng`) solo si se eligió una sugerencia.
- Detalle del change: `openspec/changes/pagos-mercadopago/`.

## Datos y roles
- Backend: Firebase (Auth, Firestore, Storage), inicializado en `shared/firebase-init.js`.
- Colecciones que se usan en el código: `usuarios`, `eventos`, `ventas`, `mensajes`, `conversaciones`, `consultas_publicas`, `solicitudes_eventos`, `solicitudes_password`, `organizaciones`, `configuracion` (categorías del costo de servicio).
- El rol se lee del campo `rol` en `usuarios`. Valores vistos: `superadmin`, `cliente`, `usuario`, `organizacion` (organizador de eventos; aparece en el menú del panel).
- Panel del superadmin: **Finanzas** (`admin/finanzas.html`: balance por período con gráficos SVG propios en `shared/grafico-barras.js` y liquidaciones por organización con `shared/finanzas.js`). Sin librerías de gráficos. (La sección Sitio se sacó el 28/10; el pie todavía lee logos de `configuracion/sitio` si existen.)
- Organizaciones: cada productora es un documento de `organizaciones` (lo crea el superadmin en el panel). Un evento es de una organización **solo** por su campo `organizacionId` (ya no por `creadoPor` ni por correo); una cuenta `organizacion` ve los eventos del `organizacionId` de su documento en `usuarios`. La regla está en `shared/organizaciones.js` (`eventosParaVer`): todas las listas del panel la usan.

## Convenciones que se ven en el código
- Español en nombres, textos y comentarios.
- Firebase se expone como variables globales en `window` (`db`, `auth`, `getDocs`…). Los demás scripts esperan el evento `firebase-ready`.
- El menú del panel (escritorio y celular) se dibuja desde `shared/menu-admin.js`: cada página de `admin/` solo lo llama con `<script src="../shared/menu-admin.js" data-pagina="<nombre>">`; no se copia a mano. `menu-rol.js` maneja roles, avisos de no leídos y cierre de sesión. El superadmin entra a "Ver como organización" desde "Ojo de halcón" (`admin/ojo-de-halcon.html`, que también abre el sitio o un evento; solo cambia lo que se ve: los permisos son los reales). Fuera de esa vista, el superadmin elige una organización en la franja rosa "Estás viendo" (`localStorage.organizacionElegida`) y todo el panel la usa a través de `eventosParaVer` (`shared/organizaciones.js`), que además saca los eventos eliminados.
- Resumen, Ventas y Reportes miran un evento a la vez (Reportes también "Todos los eventos") con el selector de `shared/selector-evento.js`, que guarda el evento en `localStorage.eventoId`. Todas las cifras salen de las ventas confirmadas con las funciones puras de `shared/ventas-utils.js` (`cifrasDelEvento`, `tarjetasDeResumen`, `htmlDeTarjetasResumen`): no usar los contadores `vendidas` de los lotes.
- Un evento publicado puede estar suspendido (`activo: false`) o eliminado (`eliminado: true`, recuperable): la situación sale de `shared/estado-evento.js`; el sitio y `server/compra.js` no los venden.
- Qué evento está activo lo decide `elegirEventoActivo` de `shared/ventas-utils.js` (primero `?id=` de la dirección, después el recordado; "todos" nunca se recuerda). `shared/franja-evento.js` es la franja compartida que muestra el nombre del evento activo (hoy todavía no la usa ninguna página: el Escáner valida entradas de cualquier evento). Los PDF de Reportes llevan el evento en el nombre del archivo (`nombreDeArchivoDeReporte`) y arriba del documento. Pruebas en `pruebas/17-evento-activo-y-exportaciones.js`.
- La imagen de un evento sale siempre de `shared/imagen-evento.js` (su foto, o un relleno violeta con su inicial, distinto por evento): las páginas no arman su propio relleno. Como no se usa Firebase Storage (pide plan de pago), la foto se achica en el navegador (hasta 200 KB) y se guarda dentro del evento, en el campo `imagen` como `data:image/jpeg;base64,...`.
- Utilidades de interfaz (toasts, modales, confirmar) en `shared/ui-utils.js`. Textos ES/EN en `shared/i18n.js`, todavía como esqueleto.
- Sitio del comprador: `shared/preguntas-frecuentes.js` (preguntas y buscador del Centro de ayuda, `public/soporte.html`) y `shared/pie-publico.js` (pie común de inicio, evento y soporte).
- Cada página HTML lleva su propio JavaScript incrustado; son pocos los archivos `.js` separados.

## Decisiones pendientes (no cambiar sin proponer opciones)
- Stack: hoy no hay framework ni build. Tailwind por CDN no es lo recomendado para producción. Un cambio de stack se decide antes, con pros y contras.
- Hay datos de ejemplo duplicados en `public/assets/js/data.js` y `public/assets/css/js/data.js` (son idénticos), de la época previa a Firebase. Falta definir si se borran.
- Revisar las reglas de seguridad de Firestore (SHR-71 del backlog): la configuración web de Firebase está en el código.

## Reglas del proyecto
- Nunca leer ni mostrar claves de Firebase (cuenta de servicio) ni archivos `.env`.
- Los cambios se planifican con OpenSpec: primero `/opsx:explore` y después `/opsx:propose`.
- Mis reglas personales de trabajo están en la skill `mi-forma-de-trabajar`; no se repiten acá.
- El repo es público: no poner rutas personales, nombres de archivos de claves ni datos de cuentas en archivos versionados.
