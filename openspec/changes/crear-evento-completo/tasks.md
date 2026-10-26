# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Lo que necesita navegador se comprueba a mano o con la skill `auditar-panel`.

## 1. Funciones compartidas

- [x] 1.1 Crear `shared/evento-datos.js` con `normalizarDias`, `validarDias`, `fechaDeTexto`, `resumenDeDias`, `armarDetalle` y `detalleParaMostrar` (ver `design.md`). Se comprueba con `node -e`: dos días desordenados quedan ordenados, `fechaDeTexto` da `15 Diciembre 2026`, y un evento viejo da un solo renglón con su `fecha`.
- [x] 1.2 Crear `pruebas/19-evento-datos.js` con los casos de las especificaciones (sin días, hora de fin menor, fecha repetida, hora mal escrita, detalle con campos vacíos, evento viejo, texto con etiquetas). Se comprueba con `node pruebas/19-evento-datos.js` y `node pruebas/ejecutar-todas.js`.

## 2. Formulario

- [ ] 2.1 En `admin/eventos.html`: lista de días con fecha, hora de inicio y hora de fin, botón "Agregar día" y "Eliminar" (mínimo 1), y envío que guarda `dias` y `fecha`. Se comprueba leyendo el archivo: el envío usa las funciones de `shared/` y no queda el campo de fecha de texto libre.
- [ ] 2.2 En `admin/eventos.html`: cuatro campos de detalle (actividad, tipo con lista y "Otro", requisitos, edad) más el texto libre opcional, guardados en `detalle` y `descripcion`. Se comprueba leyendo el archivo.
- [ ] 2.3 Probar el envío con la skill `auditar-panel` con datos inventados: dos días, detalle completo, y que `Limpiar` deja el formulario como al principio. (Necesita navegador: si la nube no lo tiene, queda para la persona.)

## 3. Mostrar en el sitio

- [ ] 3.1 En `public/evento.html`: un renglón por día con horario y el detalle en filas, todo escapado; un evento viejo se ve igual que hoy. Se comprueba con `node pruebas/ejecutar-todas.js` y leyendo el archivo.
- [ ] 3.2 En `admin/aprobaciones.js`: si la solicitud tiene `dias`, el campo `fecha` de la edición queda bloqueado con un aviso. Se comprueba leyendo el archivo.

## 4. Lugar con sugerencias y mapa (espera la respuesta a la pregunta 1)

- [ ] 4.1 Hacer el campo de lugar según la opción elegida (A, B o C) y guardar `ubicacion` si corresponde.
- [ ] 4.2 Mostrar el mapa o el botón en `public/evento.html`.
- [ ] 4.3 Agregar a `pruebas/19-evento-datos.js` los casos de las especificaciones de `lugar-con-mapa`.

## 5. Revisión final

- [ ] 5.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 5.2 Actualizar `CLAUDE.md` con `shared/evento-datos.js` y la prueba 19, sin claves, correos ni rutas personales.

## Workflow follow-up

- Archivar el change cuando la persona lo apruebe.
- Bug conocido (no es parte de esta tarea): el evento activo solo se recuerda al elegir en `eventos-seleccion`, no con `?id=` (ya está en `pendientes.md`).
