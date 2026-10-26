# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Escritas para las respuestas de la persona (1A 2A 3A, 2026-10-25; ver `proposal.md`).

## 1. Funciones puras y su prueba

- [x] 1.1 Pasar a `shared/ventas-utils.js` la regla del evento activo (dirección primero, después el recordado, "todos" nunca se recuerda) y hacer que `shared/selector-evento.js` la use. Se comprueba con `node -e`: casos con `?id=`, solo recordado, ninguno y "todos"; y que `node pruebas/ejecutar-todas.js` sigue pasando.
- [x] 1.2 Escribir `nombreDeArchivoDeReporte(nombreEvento, fecha)`: sin tildes, espacios ni caracteres especiales, con largo máximo y `Todos-los-eventos` para el caso general. Se comprueba con `node -e`: "Fiesta de Verano" da `Evently_Reporte_Fiesta-de-Verano_2026-10-25.pdf`; `Noche/de "Rock" <3` no deja `/`, comillas ni `<`; nombre vacío o nulo no falla.
- [x] 1.3 Crear `pruebas/17-evento-activo-y-exportaciones.js` con los casos de 1.1 y 1.2. Se comprueba con `node pruebas/17-evento-activo-y-exportaciones.js` (todo `OK`) y `node pruebas/ejecutar-todas.js`; se rompe una regla a propósito y se ve que la prueba falla.

## 2. Franja del evento activo

- [x] 2.1 Revisar si el Escáner valida entradas de un evento puntual o de cualquiera, y anotar el resultado acá. Se comprueba leyendo `admin/escaner.html` y este archivo con la conclusión.
  - **Conclusión (2026-10-26):** valida entradas de **cualquier** evento. `admin/escaner.html` solo muestra el enlace a `validador.html`, sin ningún evento; y `validador.html` busca el código en todas las `ventas` (`array-contains` sobre `entradas`) sin filtrar por evento. Por el diseño (riesgo 3), la franja **no se pone** en el Escáner: se saltea la tarea 2.3 hasta que la persona decida (ver el PR).
- [x] 2.2 Crear `shared/franja-evento.js` (módulo) según el diseño: nombre con `textContent`, "—" mientras carga, texto de invitación si no hay evento. Se comprueba con la skill `auditar-panel` con datos inventados: nombre correcto, evento inexistente sin errores.
- [ ] 2.3 (salteada: el Escáner valida de cualquier evento, ver 2.1) Usar la franja en `admin/escaner.html`. Se comprueba en la skill: aparece el nombre del evento recordado y "Cambiar" lleva a `eventos-seleccion.html`.

## 3. PDF de Reportes

- [x] 3.1 En `admin/reportes.html`, usar `nombreDeArchivoDeReporte` para el archivo del PDF y mostrar el evento arriba del documento. Se comprueba en la skill reemplazando `html2pdf` para leer lo que se le entrega: el nombre del archivo y el texto nombran el evento elegido, y con "Todos" dicen `Todos-los-eventos`.

## 4. Revisión final

- [ ] 4.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 4.2 Confirmar con `git diff --stat` que solo cambió lo previsto (`shared/`, `admin/escaner.html`, `admin/reportes.html`, `pruebas/` y este change).
- [ ] 4.3 Actualizar `CLAUDE.md` con la franja compartida. Se comprueba leyendo el archivo: sin claves, correos ni rutas personales.

## Workflow follow-up

- La persona respondió 3A: no hay exportación en Ventas, no se agrega esa sección.
- Archivar el change cuando la persona lo apruebe.
