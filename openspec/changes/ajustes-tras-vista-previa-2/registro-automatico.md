# Registro del trabajo automático

## 2026-10-26 · tareas 1.1 a 1.5 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/cuentas-admin.js` (clave con símbolo, `validarClave`, `motivoDeErrorDeAlta`, correo de otra organización
  bloqueado), `admin/organizaciones.html` (campo Clave + Generar, motivo y código del error de Firebase, Eliminar con
  confirmación, sección "Organizaciones eliminadas" con Recuperar), `admin/eventos-seleccion.html` (sin comisión ni Editar
  lotes en las tarjetas; sin las eliminadas en el filtro), `admin/crear-evento-superadmin.js`, `shared/menu-admin.js` y
  `admin/aprobaciones.js` (sin las eliminadas en los desplegables), `admin/eventos.html` (Entrada única o Con lotes),
  `public/evento.html` ("Tu entrada" en entrada única), pruebas 26 y 34. Se borró `admin/editar-lotes.js` (ya no se usa).
- Comprobación: `node pruebas/ejecutar-todas.js` (35 archivos); navegador automático con Firebase falso: clave débil
  rechazada, clave elegida usada, correo de otra organización bloqueado sin escribir, Eliminar pide confirmar (Cancelar no
  escribe), Recuperar, eliminada fuera del filtro, tarjetas sin comisión ni Editar lotes, entrada única pide precio y
  cantidad y se envía, la compra de entrada única dice "Tu entrada" y no habla de lotes.
- Pendiente: 1.6 prueba con la cuenta real. Si "Agregar admin" vuelve a fallar, el mensaje ahora dice el motivo y el código.
