# Registro del trabajo automático

## 2026-10-26 · tareas 1.1 a 2.2 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/menu-admin.js` (una sola entrada "Mensajes" y `dibujarPestanasMensajes`), `shared/menu-rol.js` (contador
  de cada pestaña, suma en el menú y "Mensajes" activa también en Consultas públicas), `admin/mensajes.html` y
  `admin/consultas-publicas.html` (barra de pestañas arriba).
- Comprobación: navegador automático con datos inventados (un mensaje sin leer de una organización y una consulta
  nueva): aviso del menú 2, pestañas 1 y 1 (computadora y celular); el menú tiene "Mensajes" y no
  "Consultas públicas", la pestaña actual en violeta,
  "Mensajes" activa en las dos, sin desborde en celular; `node pruebas/ejecutar-todas.js` pasa.
- Se hizo en la misma rama que organizaciones porque toca los mismos archivos del menú.
- No se hizo: 2.3 (prueba con la cuenta real, la hace la persona).
