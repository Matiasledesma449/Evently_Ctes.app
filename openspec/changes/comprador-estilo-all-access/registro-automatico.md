# Registro del trabajo automático

## 2026-10-26 · tareas 1.1 a 2.5 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/solicitud-de-ayuda.js` y `pruebas/32-solicitud-de-ayuda.js` (nuevos), `shared/preguntas-frecuentes.js`
  (ícono y frase por tema, tema "Arrepentimiento de compra"), `shared/pie-publico.js` (links legales), pruebas 22 y 23
  adaptadas, `public/soporte.html` (portada, tarjetas, contacto y formulario nuevo), `public/terminos.html`,
  `public/privacidad.html` y `public/arrepentimiento.html` (nuevos), `public/evento.html` ("Abrir en Maps"),
  `public/confirmacion.html` (número de compra).
- Comprobación: `node pruebas/ejecutar-todas.js` (32 archivos, todo pasa); auditoría del sitio del comprador
  (`--solo-publicas`): las seis páginas en computadora y celular de 375 px, pie con links legales, aviso de borrador,
  botón "Abrir en Maps", tarjetas por tema, buscador, solicitud sin asunto avisa y con asunto se guarda, arrepentimiento
  sin número de compra avisa y con número muestra el código de gestión. 0 problemas. Capturas revisadas a ojo.
- Decisiones: los textos legales son propios (no copiados de All Access) y solo afirman lo que Evently hace (no dicen que
  se mandan correos ni que el validador anula entradas, porque hoy no pasa). Datos de la empresa "A COMPLETAR".
- No se hizo: 3.1 (auditoría completa, al final con todo), 3.2 (la productora completa y revisa los textos legales).
