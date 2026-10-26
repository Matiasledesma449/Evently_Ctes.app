# Registro del trabajo automático

## 2026-10-26 · tareas 1.1 a 1.3 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/cabecera-publica.js` (nuevo) y `pruebas/33-cabecera-publica.js` (nueva), las seis páginas del comprador
  con la cabecera común y el fondo común, `shared/pie-publico.js` (contraste), `public/soporte.html` (rehecho con la paleta
  del sitio: temas → preguntas del tema, formulario que se abre), páginas legales (misma franja violeta, títulos sin
  mayúsculas), `public/evento.html` (sin el aviso "Modo de prueba"), `public/index.html` (sin el bloque de ayuda repetido,
  flechas del carrusel que no tapan el texto en el celular, sin la etiqueta "EVENTLY · AGENDA"), `pruebas/10` adaptada.
- Comprobación: `node pruebas/ejecutar-todas.js` (33 archivos) y auditoría del comprador (seis páginas, computadora y
  celular, 0 problemas); capturas revisadas a ojo.

## 2026-10-26 · tareas 2.1 y 2.2 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/cuentas-admin.js` y `pruebas/34-cuentas-admin.js` (nuevos), `admin/organizaciones.html` (pestañas, "Agregar
  admin" que vincula o crea la cuenta con clave generada, confirmación antes de mover, "Quitar"), `admin/eventos-seleccion.html`
  (pestañas Eventos / Organizaciones), `shared/menu-admin.js` y `shared/menu-rol.js` (sin entrada "Organizaciones"; "Eventos"
  activa en esa pestaña).
- Cómo se crea la cuenta: una segunda app de Firebase da de alta el usuario (la sesión del superadmin no cambia) y el
  superadmin escribe `usuarios/{uid}` con `rol: 'organizacion'` y la organización. La clave se muestra una sola vez.
- Comprobación: `node pruebas/34-cuentas-admin.js`; navegador automático con Firebase falso: pestañas, menú, alta con la
  segunda app (cierra solo su sesión), clave visible, mover pide confirmar y no escribe antes, superadmin rechazado,
  quitar admin. `node pruebas/ejecutar-todas.js` pasa.
