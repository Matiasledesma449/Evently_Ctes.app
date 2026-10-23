# Tasks

Convención: "se comprueba" dice cómo verificarlo. Las pruebas de cálculo se corren con `node` (sin navegador ni Firebase). Las pruebas en pantalla necesitan una sesión iniciada en el panel; iniciar sesión lo hace el usuario.

## 1. Cálculos puros y su prueba

- [x] 1.1 Escribir en `shared/ventas-utils.js` las funciones `filtrarVentas`, `metodosDePago` y `tiempoDesde` (con una auxiliar para fechas de Firestore, `Date` y números). Se comprueba con `node -e` llamando a cada una con un ejemplo: devuelven lo esperado y no fallan con ventas sin `fecha`, sin método o con `monto_total` no numérico. **Hecho (2026-10-23):** `filtrarVentas`, `metodosDePago`, `tiempoDesde` y la auxiliar de fechas están en `shared/ventas-utils.js`; probadas con un ejemplo y con los casos T29 a T44 de la prueba 14 (incluye ventas sin fecha, sin método y con monto no numérico).
- [x] 1.2 Escribir `tarjetasDelFiltro` para los 4 estados (Todos, Confirmadas, Pendientes, Rechazadas) según `specs/panel-ventas-resumen/spec.md`, reutilizando `resumenDeVentas` y `textoDelMotivo`. Se comprueba con `node -e` que cada estado devuelve exactamente 4 tarjetas con los títulos de la especificación. **Hecho (2026-10-23):** `tarjetasDelFiltro` devuelve 4 tarjetas con los títulos de la especificación para cada estado (casos T1 a T28). Se sumó el campo `ayuda` (texto chico) y `tono` (color).
- [x] 1.3 Crear `pruebas/14-tarjetas-de-ventas.js` con el formato de las demás (líneas `OK` y `MAL`) y casos de cada escenario de la especificación: los ejemplos de Todos, Confirmadas (con y sin ventas), Pendientes (dinero en espera y antigüedad), Rechazadas (motivo más frecuente), método combinado, métodos desde los datos, ventas viejas con datos raros y que la recaudación no sume pendientes ni rechazadas. Se comprueba con `node pruebas/14-tarjetas-de-ventas.js` (todo `OK`) y con `node pruebas/ejecutar-todas.js` (pasan todas, incluidas las 13 anteriores). **Hecho (2026-10-23):** `node pruebas/14-tarjetas-de-ventas.js` da 47 casos `OK` y `node pruebas/ejecutar-todas.js` pasa los 14 archivos. Se comprobó que la prueba detecta errores: al romper a propósito el cálculo de "Dinero en espera" falló el caso T13, y se restauró el archivo.

## 2. La pantalla Ventas usa los cálculos

- [ ] 2.1 En `admin/ventas.html`, usar `filtrarVentas` para armar la lista filtrada y dibujar las tarjetas desde `tarjetasDelFiltro` dentro de `#resumenVentas` (con `escaparHtml`), manteniendo las clases visuales y los colores de hoy. Se comprueba en el navegador: con "Todos" las 4 tarjetas son las de siempre y con cada filtro cambian a las propias de ese filtro.
- [ ] 2.2 Agregar la línea "Mostrando: ..." sobre las tarjetas con el estado, el método y la cantidad de ventas. Se comprueba cambiando filtros y viendo que la línea cambia con ellos.
- [ ] 2.3 Armar las opciones del desplegable de método desde `metodosDePago` en cada actualización de datos, conservando la selección si el método sigue existiendo, y aplicar el cambio de método al instante (el botón "Aplicar filtros" queda y hace lo mismo). Se comprueba en el navegador: el desplegable solo lista métodos que tienen ventas, elegir uno actualiza tarjetas y tabla sin apretar el botón, y la selección no se pierde cuando llegan datos nuevos.
- [ ] 2.4 Mostrar el aviso de ventas pendientes y método cuando hay un método elegido. Se comprueba eligiendo un método y viendo el aviso; con "Todos los métodos" no aparece.
- [ ] 2.5 Actualizar `pruebas/13-panel-de-ventas.js`: hoy fija el comportamiento anterior (por ejemplo, V15 y V16 esperan que con "Confirmadas" o "Pendientes" las tarjetas sigan siendo las mismas de "Todos") y simula la pantalla con las 4 tarjetas fijas (`totalRecaudado`, `totalEntradas`, `totalTransacciones`, `totalPendientes`). Se cambian esos casos para que esperen las tarjetas nuevas de cada filtro y se agregan los de la línea "Mostrando", el desplegable de método y el aviso. Se comprueba con `node pruebas/13-panel-de-ventas.js` y `node pruebas/ejecutar-todas.js`: pasan todas.

## 3. Revisión final

- [ ] 3.1 Recorrer Ventas del evento con ventas de varios estados, en un ancho de pantalla de escritorio y de celular: los 4 filtros, un método, y combinados. Se comprueba que ninguna tarjeta queda "en 0 sin sentido", que los textos largos no se salen y que la consola no muestra errores.
- [ ] 3.2 Confirmar que no cambió nada fuera de lo previsto. Se comprueba con `git diff --stat` contra la rama base: solo `admin/ventas.html`, `shared/ventas-utils.js`, `pruebas/14-tarjetas-de-ventas.js` y este change.

## Workflow follow-up

- Archivar el change cuando el usuario lo apruebe.
- Los números de Resumen (Dashboard) y Reportes se tratan en el cambio del panel claro.
