# Tasks

## 1. Menú y pestañas

- [x] 1.1 En `shared/menu-admin.js`, quitar la entrada "Consultas públicas", marcar "Mensajes" activa también en `consultas-publicas`, y agregar `window.dibujarPestanasMensajes`. Se comprueba leyendo el archivo: el HTML es texto fijo.
- [x] 1.2 En `admin/mensajes.html` y `admin/consultas-publicas.html`, agregar el contenedor de la barra arriba del título y llamarla. Se comprueba con el navegador automático: la pestaña correcta en violeta en cada una.
- [x] 1.3 En `shared/menu-rol.js`, poner cada número en su pestaña y la suma en el aviso del menú. Se comprueba con datos inventados: una conversación sin leer y una consulta nueva → menú 2, pestañas 1 y 1.

## 2. Revisión

- [ ] 2.1 Actualizar la skill de auditoría (menú esperado sin "Consultas públicas") y correrla: sin problemas nuevos.
- [x] 2.2 `node pruebas/ejecutar-todas.js`: todo pasa.
- [ ] 2.3 Prueba a mano con la cuenta real (la persona).
