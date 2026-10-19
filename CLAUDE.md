# Evently

Plataforma web de venta de entradas para eventos. Tiene un sitio público para compradores y un panel para organizadores (Admin) y para SuperAdmin.

## Estructura
- `public/`: sitio del usuario final (inicio, evento, confirmación, soporte, validación de entradas).
- `admin/`: panel Admin y SuperAdmin (login, eventos, ventas, reportes, mensajes, soporte, escáner QR).
- `shared/`: código común (`firebase-init.js`, `menu-rol.js`, `ui-utils.js`, `i18n.js`, estilos).
- `validador.html`: validación de entradas por QR, en la raíz.
- `BACKLOG_EVENTLY.md`: lista de tareas por fases, con IDs (ADM-, SUP-, USR-, SHR-).
- `openspec/`: especificaciones y cambios planificados con OpenSpec.

## Cómo correrlo y probarlo
- Es un sitio estático: HTML + JavaScript puro, sin `package.json` ni paso de build.
- Los scripts se cargan por CDN (Firebase 10.7.1, Tailwind, jsQR). Hace falta internet.
- Cómo abrirlo en local: no verificado. Los `<script type="module">` suelen requerir un servidor HTTP y no `file://`.
- **No hay tests automatizados.** La verificación es manual, por rol (ver SHR-72 en el backlog).

## Datos y roles
- Backend: Firebase (Auth, Firestore, Storage), inicializado en `shared/firebase-init.js`.
- Colecciones que se usan en el código: `usuarios`, `eventos`, `ventas`, `mensajes`, `conversaciones`, `consultas_publicas`, `solicitudes_eventos`, `solicitudes_password`.
- El rol se lee del campo `rol` en `usuarios`. Valores vistos: `superadmin`, `cliente`, `usuario`. El rol "admin" de organizador: no verificado.

## Convenciones que se ven en el código
- Español en nombres, textos y comentarios.
- Firebase se expone como variables globales en `window` (`db`, `auth`, `getDocs`…). Los demás scripts esperan el evento `firebase-ready`.
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
