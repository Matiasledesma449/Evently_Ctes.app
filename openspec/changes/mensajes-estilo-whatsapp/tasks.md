# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Lo que necesita navegador se comprueba a mano o con la skill `auditar-panel`.

## 1. Funciones compartidas

- [x] 1.1 Crear `shared/estado-mensajes.js` con `estadoDeConversacion`, `estadoDeConsulta`, `contarPorEstado`, `presentacionDeEstado`, `filtrarPorEstado`, `organizacionesParaChat` y `textoVacio` (ver `design.md`). Se comprueba con `node pruebas/21-estado-mensajes.js`.
- [x] 1.2 Crear `pruebas/21-estado-mensajes.js` con los casos de las especificaciones (nuevo, leído, respondido, conversación vieja sin `ultimoDe`, estado de consulta desconocido, contadores, filtro, organizaciones ordenadas y filtradas sin importar tildes, sin organizaciones, con conversación abierta, nombre vacío). Se comprueba con `node pruebas/ejecutar-todas.js`.

## 2. Guardar a quién le toca

- [x] 2.1 En `admin/soporte.html`: al enviar, guardar `ultimoDe` y `ultimoLeido: false` en la conversación (en la creación y en la actualización que ya existen). Se comprueba leyendo el archivo: los dos caminos del lote llevan los campos.
- [x] 2.2 En `admin/mensajes.html`: lo mismo al enviar, y al crear una conversación nueva. Se comprueba leyendo el archivo.

## 3. Consultas públicas

- [ ] 3.1 Pasar `admin/consultas-publicas.html` a lista + detalle con la insignia de estado, el filtro con contadores y los estados vacíos, todo con `textContent`. Se comprueba leyendo el archivo.
- [ ] 3.2 Abrir una consulta `nueva` la pasa a `leida` (una sola vez, sin bucle con `onSnapshot`); "Responder por Gmail" y "Marcar como respondida" siguen igual. Se comprueba leyendo el archivo.

## 4. Mensajes

- [ ] 4.1 En `admin/mensajes.html`: reescribir la lista con el estado de cada conversación (negrita y marca, tilde verde, gris), el filtro con contadores y los estados vacíos, sin `innerHTML` con nombres; las solicitudes de contraseña quedan arriba como hoy. Se comprueba leyendo el archivo.
- [ ] 4.2 Al abrir una conversación, guardar `ultimoLeido: true` solo si hace falta, y mostrar la insignia de estado en la cabecera. Se comprueba leyendo el archivo.
- [ ] 4.3 "Nuevo mensaje": buscador, lista completa de organizaciones con `organizacionesParaChat`, marca "Conversación abierta", aviso si no hay o falla la carga, y todo escapado. Se comprueba leyendo el archivo.
- [ ] 4.4 Comprobar que borrar una conversación y las solicitudes de contraseña siguen igual. Se comprueba leyendo el archivo.

## 5. Revisión final

- [ ] 5.1 Probar a mano en el navegador los siete pasos de "Cómo se verifica a mano" de `proposal.md`. (Necesita navegador y cuentas de superadmin y de organización: queda para la persona.)
- [ ] 5.2 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 5.3 Actualizar `CLAUDE.md` con `shared/estado-mensajes.js`, la prueba 21 y los campos `ultimoDe` y `ultimoLeido` de `conversaciones`, sin claves, correos ni rutas personales.

## Workflow follow-up

- Archivar el change cuando la persona lo apruebe.
- Para publicar: las reglas de Firestore (tarea 10.3 de pagos) deberían limitar quién escribe `ultimoDe` y `ultimoLeido`.
- Revisar con datos reales si hay organizaciones con otro valor en `rol` que no aparezcan en "Nuevo mensaje".
