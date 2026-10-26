# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador, sin Firebase ni Mercado Pago reales). Lo que necesita navegador o un cobro real lo prueba la persona. Código base: la rama `claude/nube-2026-10-26-0315`.

## 1. Cálculo en el servidor

- [x] 1.1 Crear `server/comision.js` con `normalizarCategorias(config)`, `porcentajeDelEvento(evento, config)` (0 si no hay categoría o no existe) y `calcularCostoServicio(subtotal, porcentaje)` que devuelve `{ costoServicio, total }` redondeados a 2 decimales. Se comprueba leyendo el archivo: sin dependencias externas ni acceso a la red.
- [x] 1.2 Sumar en `server/compra.js` la lectura de `configuracion/comisiones` (`leerConfiguracionComision(db)`) y que `calcularCompra` reciba la configuración y devuelva `subtotal`, `costoServicio`, `comisionPorcentaje`, `comisionCategoria` y `total` con el costo incluido. Se comprueba con la prueba 24.
- [x] 1.3 En `server/crear-pago.js`, leer la configuración antes de calcular; si la lectura falla, devolver el error genérico y no crear la venta. Se comprueba con la prueba 24 (caso "falla la lectura": no hay ventas creadas).
- [x] 1.4 En `server/ventas.js`, guardar `subtotal`, `costo_servicio`, `comision_porcentaje`, `comision_categoria` y `monto_total` con el costo incluido. Se comprueba con la prueba 24.
- [x] 1.5 En `server/mercadopago.js`, agregar el renglón "Costo de servicio" cuando es mayor que cero, sin tocar el renglón de las entradas ni agregar restricción de cuotas. Se comprueba con la prueba 24: la suma de los renglones es igual a `monto_total`.
- [x] 1.6 Crear `pruebas/24-costo-de-servicio.js` con los casos de las especificaciones: 8% sobre $4.500, redondeo de 7,5% sobre $1.234, sin categoría, categoría inexistente, el navegador manda `comision`/`porcentaje` (se ignora), falla la lectura, dos renglones que suman el total, sin `installments`, y pago por solo el subtotal (queda para revisar). Se comprueba con `node pruebas/24-costo-de-servicio.js`.
- [x] 1.7 (ninguna prueba existente usaba `calcularCompra`; solo se agregó `id` a las referencias de la base falsa, como en Firestore real) Actualizar las pruebas existentes de pagos que dependan de la forma de `calcularCompra` o de la base falsa (`pruebas/_ayuda-db-falsa.js`) sin cambiar ningún caso. Se comprueba con `node pruebas/ejecutar-todas.js`.

## 2. Confirmación del comprador

- [x] 2.1 En `server/venta.js` (`/api/venta`) devolver `costoServicio` cuando la venta lo tiene, sin devolver ningún dato interno nuevo. Se comprueba con la prueba 9 ampliada.
- [x] 2.2 En `public/confirmacion.html` mostrar la línea "Costo de servicio" solo si viene. Se comprueba leyendo el archivo y con la prueba 11 ampliada; a mano en 5.2.

## 3. Página del evento

- [x] 3.1 Crear `shared/comision.js` (versión del navegador): `categoriaDelEvento(evento, config)` y `desgloseDeCompra(precio, cantidad, porcentaje)`. Se comprueba con la prueba 25: da los mismos resultados que `server/comision.js` en los mismos casos.
- [x] 3.2 (hecho en el código y probado con navegador simulado en la prueba 10; falta mirarlo a mano en 5.2) En `public/evento.html`, leer `configuracion/comisiones` y mostrar Entradas / Costo de servicio / Total; con 0% solo el Total. Si la lectura falla, mostrar solo el Total con una nota de que se calcula al pagar. Se comprueba leyendo el archivo y a mano en 5.2; no se renombra ningún `id` de la compra.
- [x] 3.3 Crear `pruebas/25-desglose-de-compra.js` (3.1) y ampliar `pruebas/10-pantalla-de-compra.js` si hace falta. Se comprueba con `node`.

## 4. Panel del superadmin y del organizador

- [ ] 4.1 Crear `shared/categorias-comision.js` con `validarCategoria({ nombre, porcentaje })` (nombre 1–40, porcentaje 0–30 con hasta 2 decimales, mensajes claros), `nuevoIdDeCategoria(categorias)` y `categoriasOrdenadas(config)`. Se comprueba con la prueba 26.
- [ ] 4.2 Crear `pruebas/26-categorias-de-comision.js`: valores válidos e inválidos (80, "ocho", vacío, negativo, 3 decimales), ids que no se repiten, nombre con `<b>x</b>`. Se comprueba con `node`.
- [ ] 4.3 En `admin/eventos-seleccion.html` (solo superadmin) agregar el bloque "Costo de servicio" con la tabla de categorías, "Agregar categoría" y guardar por fila. Los nombres se escapan con `escaparHtml`. Se comprueba leyendo el archivo; a mano en 5.2.
- [ ] 4.4 En la tarjeta de cada evento (solo superadmin) agregar el selector "Costo de servicio" que guarda `comisionCategoriaId` y avisa. La organización no lo ve. Se comprueba leyendo el archivo; a mano en 5.2.
- [ ] 4.5 Sumar `ingresoDeVenta(venta)` y `costoServicioDeVenta(venta)` a `shared/ventas-utils.js` (subtotal con respaldo en `monto_total`) y usarlas en `resumenDeVentas`, `tarjetasDelFiltro` y `cifrasDelEvento`. Se comprueba con las pruebas 14 y 15 ampliadas con ventas con y sin costo de servicio.
- [ ] 4.6 En `admin/reportes.html` cambiar las sumas de `monto_total` para recaudado, por lote y por método por `ingresoDeVenta`, y que la columna del detalle diga lo mismo. Se comprueba leyendo el archivo (no queda ninguna suma de `monto_total` para recaudación) y con la prueba 17.
- [ ] 4.7 En el detalle de una venta de `admin/ventas.html` mostrar entradas, costo de servicio y total pagado cuando hay costo. Se comprueba leyendo el archivo; a mano en 5.2.

## 5. Revisión final

- [ ] 5.1 Correr `node pruebas/ejecutar-todas.js`: todo pasa con las pruebas 24 a 26 incluidas.
- [ ] 5.2 Prueba a mano en navegador (necesita navegador y una compra de prueba; no la hace la nube): crear dos categorías, asignar una a un evento, mirar la página del evento (con y sin categoría), pagar en Mercado Pago de prueba y comprobar que cobra el total con el renglón "Costo de servicio", la confirmación y el panel (recaudado sin el costo, detalle de la venta).
- [ ] 5.3 La persona decide los porcentajes y los nombres de las categorías, y cuándo se publican las reglas de Firestore para `configuracion` (ver `design.md`, Riesgos).
- [ ] 5.4 Actualizar `CLAUDE.md` con `configuracion/comisiones`, `server/comision.js` y `shared/comision.js`. Se comprueba leyendo el archivo.
