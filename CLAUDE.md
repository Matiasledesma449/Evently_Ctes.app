# Evently

Plataforma web de venta de entradas para eventos. Tiene un sitio público para compradores y un panel para organizadores (Admin) y para SuperAdmin.

## Estructura
- `public/`: sitio del usuario final (inicio, evento, confirmación, soporte, validación de entradas).
- `admin/`: panel Admin y SuperAdmin (login, eventos, ventas, reportes, mensajes, soporte, escáner QR).
- `shared/`: código común (`firebase-init.js`, `menu-admin.js` y `menu-rol.js` del menú del panel, `ventas-utils.js`, `ui-utils.js`, `i18n.js`, estilos).
- `validador.html`: validación de entradas por QR, en la raíz.
- `api/`: funciones serverless (Vercel): `crear-pago.js`, `mp-webhook.js`, `venta.js`.
- `server/`: lógica de los pagos que usan las funciones de `api/` (configuración, Mercado Pago, firma del webhook, Firestore con `firebase-admin`, validaciones).
- `pruebas/`: pruebas simuladas del flujo de pagos.
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
- Variables de entorno (solo los nombres, los valores van en Vercel): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `SITE_URL`.
- Detalle del change: `openspec/changes/pagos-mercadopago/`.

## Datos y roles
- Backend: Firebase (Auth, Firestore, Storage), inicializado en `shared/firebase-init.js`.
- Colecciones que se usan en el código: `usuarios`, `eventos`, `ventas`, `mensajes`, `conversaciones`, `consultas_publicas`, `solicitudes_eventos`, `solicitudes_password`.
- El rol se lee del campo `rol` en `usuarios`. Valores vistos: `superadmin`, `cliente`, `usuario`, `organizacion` (organizador de eventos; aparece en el menú del panel).

## Convenciones que se ven en el código
- Español en nombres, textos y comentarios.
- Firebase se expone como variables globales en `window` (`db`, `auth`, `getDocs`…). Los demás scripts esperan el evento `firebase-ready`.
- El menú del panel (escritorio y celular) se dibuja desde `shared/menu-admin.js`: cada página de `admin/` solo lo llama con `<script src="../shared/menu-admin.js" data-pagina="<nombre>">`; no se copia a mano. `menu-rol.js` maneja roles, avisos de no leídos y cierre de sesión. El superadmin puede usar "Ver como organización" (solo cambia lo que se ve; los permisos son los reales).
- Resumen, Ventas y Reportes miran un evento a la vez (Reportes también "Todos los eventos") con el selector de `shared/selector-evento.js`, que guarda el evento en `localStorage.eventoId`. Todas las cifras salen de las ventas confirmadas con las funciones puras de `shared/ventas-utils.js` (`cifrasDelEvento`, `tarjetasDeResumen`, `htmlDeTarjetasResumen`): no usar los contadores `vendidas` de los lotes.
- Utilidades de interfaz (toasts, modales, confirmar) en `shared/ui-utils.js`. Textos ES/EN en `shared/i18n.js`, todavía como esqueleto.
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
