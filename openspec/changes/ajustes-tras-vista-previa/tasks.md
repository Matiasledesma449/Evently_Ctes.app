# Tasks

## 1. Sitio del comprador
- [x] 1.1 `shared/cabecera-publica.js` y cabecera común en las seis páginas; logo lleva al inicio. Se comprueba con el navegador automático.
- [x] 1.2 Pie con buen contraste; sacar el bloque "¿Necesitás ayuda?" del inicio; sacar el aviso "Modo de prueba". Se comprueba con el navegador automático.
- [x] 1.3 Centro de ayuda ordenado con la paleta del sitio (temas → preguntas del tema; formulario que se abre desde "Contactate"). Se comprueba con la auditoría del comprador.

## 2. Organizaciones
- [x] 2.1 Pestañas Eventos / Organizaciones y sacar "Organizaciones" del menú. Se comprueba con el navegador automático.
- [x] 2.2 `shared/cuentas-admin.js` (clave generada) y "Agregar admin" que crea la cuenta si no existe; aviso y confirmación si es de otra organización; "Quitar". Prueba de la clave con `node`; el resto con el navegador automático y Firebase falso.

## 3. Lotes
- [x] 3.1 `shared/lotes.js` con `estadoDeLote` y su prueba.
- [x] 3.2 Crear/Solicitar evento: tipo de lote y fechas con calendario.
- [x] 3.3 Página de compra: solo lotes disponibles; los próximos y finalizados se ven deshabilitados con su texto.
- [x] 3.4 Servidor (`server/compra.js`): rechaza lotes no disponibles; pruebas de pagos siguen pasando.
- [x] 3.5 Eventos (superadmin): "Editar lotes" con fechas y "Habilitar ahora".

## 4. Mapa
- [x] 4.1 Mapa siempre visible con marcador arrastrable y dirección automática.

## 5. Revisión
- [x] 5.1 `node pruebas/ejecutar-todas.js` y auditoría completa.
- [ ] 5.2 Prueba a mano en la vista previa (la persona).
