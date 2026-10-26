# Design

## Datos

**Configuración**: documento `configuracion/comisiones`:

```
{ categorias: [ { id: "cat-1", nombre: "Estándar", porcentaje: 8 }, ... ] }
```

- `id`: texto corto generado al crear la categoría (`cat-` + número que no se repite), nunca se cambia.
- `nombre`: 1 a 40 caracteres.
- `porcentaje`: número entre 0 y 30, con hasta 2 decimales.
- Si el documento no existe o no tiene categorías, todos los eventos tienen 0%.

**Evento**: campo nuevo `comisionCategoriaId` (texto o ausente). Ausente, vacío o un id que ya no existe = 0%.

**Venta** (la escribe solo el servidor), campos nuevos:

| Campo | Qué es |
|---|---|
| `subtotal` | precio de las entradas (cantidad × precio) |
| `costo_servicio` | costo de servicio en pesos, redondeado a 2 decimales (0 si no hay) |
| `comision_porcentaje` | porcentaje usado en esa compra |
| `comision_categoria` | nombre de la categoría en ese momento (para el detalle) |
| `monto_total` | `subtotal + costo_servicio` (es lo que Mercado Pago cobra y lo que el webhook compara) |

Una venta vieja no tiene estos campos: se lee `subtotal = monto_total` y `costo_servicio = 0`.

## Cálculo (servidor, `server/comision.js`)

- `costo_servicio = redondear2(subtotal × porcentaje / 100)`, sobre el total de la compra y no por entrada, así no se acumulan redondeos.
- `monto_total = redondear2(subtotal + costo_servicio)`.
- El porcentaje sale de la categoría del evento guardado, leída en el momento de crear el pago. Si leer la configuración falla, **la compra no se hace** (error genérico): es mejor no vender que vender con 0% por un error.
- Mercado Pago recibe dos renglones: las entradas (igual que hoy) y "Costo de servicio" (cantidad 1, `unit_price = costo_servicio`). Si el costo es 0 no se manda el segundo renglón.
- El webhook, `compararPagoConVenta` y el control de pagos duplicados **no cambian**: ya comparan contra `monto_total`.
- No se manda `installments` ni ninguna restricción de cuotas: Mercado Pago muestra las suyas.

## Pantallas

- **Eventos (superadmin)**: bloque "Costo de servicio" arriba de la lista, con la tabla de categorías (nombre, porcentaje, botón guardar) y un botón "Agregar categoría". En cada tarjeta de evento, un selector "Costo de servicio" con las categorías y "Ninguno (0%)". Cambiar el selector guarda al instante y avisa con un aviso en pantalla.
- **Página del evento**: debajo de cantidad se ven tres líneas: Entradas, Costo de servicio (con el porcentaje) y Total. Con 0% solo se ve el Total, como hoy. La página lee `configuracion/comisiones` y el evento; es una vista previa y el servidor recalcula.
- **Confirmación**: si la venta tiene costo de servicio, `/api/venta` lo devuelve y la página lo muestra en el resumen.
- **Panel (Ventas)**: el detalle de una venta muestra entradas, costo de servicio y total pagado.

## Decisiones

- **El porcentaje se lee en vivo**, no se copia al evento: si el superadmin corrige una categoría, las compras siguientes usan el valor nuevo. La venta guarda el porcentaje usado, así queda el registro. Si prefiere "congelar" el porcentaje al asignar la categoría, se cambia para guardar el número en el evento.
- **El costo se cobra sobre el total, no por entrada**: menos errores de redondeo.
- **Tope de 30%** para evitar un error de tipeo (por ejemplo 80 en vez de 8). Si hace falta más, se sube el tope en un solo lugar.
- **No se borran categorías**: un evento podría quedar apuntando a una que ya no existe. Se pueden renombrar o dejar en 0%.
- **Si la categoría cambia mientras una persona mira la página**, el total que ve puede diferir del cobrado; Mercado Pago muestra el monto exacto antes de pagar.

## Riesgos

- Las reglas de Firestore todavía no están publicadas (tarea 10.3): hasta entonces, cualquiera con la configuración web podría escribir en `configuracion`. Al publicarlas: lectura pública de `configuracion/comisiones`, escritura solo del superadmin, y `comisionCategoriaId` en `eventos` solo modificable por el superadmin.
- Un evento publicado por una organización con una categoría mal elegida cobra mal: por eso el selector es solo del superadmin.
