# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Las pantallas se prueban con la skill `auditar-panel` (Playwright, Firebase falso y datos inventados), sin sesión ni datos reales del usuario; lo que el usuario no vio con su sesión se aclara en cada tarea.

## 1. Cálculos puros y su prueba

- [x] 1.1 Escribir en `shared/ventas-utils.js` `eventosDeLaPersona` y `ventasDeEventos`. Se comprueba con `node -e`: el superadmin recibe todos los eventos; una organización recibe solo los que cumplen alguno de los tres criterios (organizacionId, creadoPor, correo); ventas sin `eventoId` o listas nulas no fallan. **Hecho (2026-10-23):** `eventosDeLaPersona` y `ventasDeEventos` en `shared/ventas-utils.js`, probadas con los casos E1 a E7 y V1 a V3 de la prueba 15 (incluye listas y eventos nulos, y que `undefined` no coincide con `undefined`).
- [x] 1.2 Escribir `cifrasDelEvento` según `specs/panel-resumen-evento/spec.md` (todo desde ventas confirmadas y lotes; el lote más rentable nunca supera lo recaudado; sin ventas, "—" donde corresponde). Se comprueba con `node -e` usando el ejemplo de la especificación: $96, 8 entradas, 4 ventas, promedio 2, aforo 292 y ocupación 3%; y con un ejemplo que tenga ventas pendientes y varios métodos, para "Pendientes de pago" y "Método más usado". **Hecho (2026-10-23):** `cifrasDelEvento` calcula todo desde las ventas confirmadas y los lotes. Con el ejemplo de la especificación da $96, 8 entradas, 4 ventas, promedio 2, aforo 292 y ocupación 3% (casos C1 a C20); también probados Pendientes de pago y Método más usado.
- [x] 1.3 Escribir `tarjetasDeResumen` (las tarjetas con título, valor, ayuda, tono e ícono; con `null` devuelve las mismas con "—"). Se comprueba con `node -e`: mismas tarjetas con datos y sin datos, y los títulos que coinciden con Ventas son idénticos. **Hecho (2026-10-23):** `tarjetasDeResumen` devuelve 11 tarjetas (título, valor, ayuda, tono, ícono, ancho); con `null` devuelve las mismas con "—". Los títulos que existen en Ventas son idénticos y, con los mismos datos, dan el mismo valor (casos T1 a T11 y X1). El nombre de la tarjeta de dinero es "Total recaudado".
- [x] 1.4 Crear `pruebas/15-cifras-del-evento.js` con casos de cada escenario de las tres especificaciones (incluye contador de lote desfasado, ventas viejas con monto no numérico o sin fecha, evento sin ventas, organización con eventos propios y ajenos, y "Todos" que suma solo lo de la persona). Se comprueba con `node pruebas/15-cifras-del-evento.js` (todo `OK`) y `node pruebas/ejecutar-todas.js` (pasan los 15 archivos); se rompe una regla a propósito y se ve que la prueba falla. **Hecho (2026-10-23):** `node pruebas/15-cifras-del-evento.js` da 49 casos OK y `node pruebas/ejecutar-todas.js` pasa los 15 archivos. Se comprobó que detecta errores: al romper a propósito el promedio de entradas por compra fallaron C1, T5 y T9, y se restauró el archivo.

## 2. Selector de evento compartido

- [ ] 2.1 Crear `shared/selector-evento.js` según el diseño: guarda el `?id=` apenas carga (salvo "todos"), arma el desplegable con `eventosDeLaPersona` cuando Firebase está listo, recarga con el `?id=` nuevo al elegir, muestra "—" mientras carga y el texto "Elegí un evento para ver sus datos" si el evento no existe. Se comprueba con la skill `auditar-panel` (tarea 2.3).
- [ ] 2.2 Usar el selector en `admin/ventas.html` (contenedor `#selectorEvento` arriba del título). Se comprueba en la skill: aparece el nombre del evento, no cambia nada más de Ventas y las pruebas 13 y 14 siguen pasando.
- [ ] 2.3 Agregar a `auditar-panel` los datos de un segundo evento con ventas y chequeos del selector: lista correcta para superadmin y organización, cambiar de evento cambia la dirección y lo guardado, el evento sigue al pasar de pantalla por el menú, y un `?id=` inexistente muestra el texto de invitación sin errores. Se comprueba corriendo la skill: sin problemas, y con un fallo puesto a propósito detecta el problema.

## 3. Resumen

- [ ] 3.1 En `admin/dashboard.html`, dibujar las tarjetas desde `tarjetasDeResumen` (de inmediato con "—" y luego con los datos), con el selector y sin los contadores `vendidas`. También se quita la redirección a la lista de Eventos cuando falta el evento (ahora muestra el selector con "Elegí un evento para ver sus datos"). Se comprueba en la skill: con los datos de ejemplo Resumen muestra las cifras de la especificación y ninguna tarjeta tiene "NaN"; el lote más rentable no supera lo recaudado; y abrir Resumen sin evento o con un `?id=` inexistente no redirige ni muestra errores.
- [ ] 3.2 Agregar a `auditar-panel` el chequeo de coincidencia entre pantallas: total recaudado, entradas vendidas y ventas confirmadas iguales en Resumen y Ventas del mismo evento, y que las primeras tarjetas aparezcan con "—" antes de llegar los datos y no cambien de tamaño. Se comprueba corriendo la skill.

## 4. Reportes

- [ ] 4.1 En `admin/reportes.html`, leer el evento elegido (o todos los de la persona), mostrar el selector con "Todos los eventos", la línea "Mostrando: ..." calcular las tarjetas con `cifrasDelEvento` (incluidas las "Pendientes de pago" aparte, sin sumarlas), arrancar en el evento que se venía mirando (el recordado) y mostrar las tarjetas con "—" mientras cargan, sin saltos. Se comprueba en la skill: con el mismo evento, Reportes coincide con Resumen y Ventas; con "Todos" suma los eventos de la persona y una organización no suma los ajenos; al venir de otra pantalla arranca en el mismo evento; y las pendientes aparecen aparte sin sumarse a la recaudación.
- [ ] 4.2 Armar el filtro de lote con los lotes de lo elegido y el de método con `metodosDePago` (sin lista fija), y que la capacidad salga de los lotes de lo elegido. Se comprueba en la skill: el filtro de método solo ofrece métodos con ventas y la capacidad cambia con el evento.
- [ ] 4.3 Hacer que el PDF use el evento, lote y método elegidos. Se comprueba: en la skill se descarga el PDF, se confirma que nombra el evento y el método elegidos y que sus totales coinciden con la pantalla (se lee el texto del PDF con la herramienta de PDF si hace falta).
- [ ] 4.4 Agregar a `auditar-panel` el chequeo de coincidencia de Reportes con Resumen y Ventas y el de "Todos los eventos". Se comprueba corriendo la skill.

## 5. Revisión final

- [ ] 5.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas. Se comprueba con la salida; también se miran las capturas de Resumen, Ventas y Reportes del mismo evento, en escritorio y en celular.
- [ ] 5.2 Confirmar que no cambió nada fuera de lo previsto. Se comprueba con `git diff --stat`: solo `admin/dashboard.html`, `admin/reportes.html`, `admin/ventas.html`, `shared/`, `pruebas/` y este change.
- [ ] 5.3 Actualizar `CLAUDE.md` (el selector compartido y que las cifras salen de las ventas confirmadas). Se comprueba leyendo el archivo: sin claves, correos ni rutas personales.

## Workflow follow-up

- Archivar el change cuando el usuario lo apruebe.
- Anotar para el cambio de reglas (SHR-71): una organización puede leer las ventas de todos los eventos.
