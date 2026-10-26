# Pedidos pendientes

Lista de pedidos que todavía no tienen change de OpenSpec. La usa el trabajo nocturno en la nube: toma el primero que no esté hecho, escribe su plan (explore + propose, sin código) y abre un PR para que se apruebe. Al crear el change, marcar el pedido con `[x]` y el nombre del change.

## En orden

- [x] 1. Selector de evento sin confusión: banner con el evento activo en cada página del panel; exportar y PDF dicen de qué evento son. (change: `evento-activo-en-todo-el-panel`)
- [x] 2. Formas de pago: sacar "Efectivo" de todos los eventos; mostrar las formas reales (transferencia, débito, crédito); PDF con opciones elegibles. (change: `formas-de-pago-reales`)
- [x] 3. Crear evento: fechas y horas por día, lugar con sugerencias y mapa, descripción en campos separados (actividad, tipo, requisitos, edad). (change: `crear-evento-completo`)
- [ ] 4. Superadmin: eliminar "Panel global"; las solicitudes de evento pasan a "Crear evento" con aprobar, rechazar, comentar y contacto directo; al entrar ve los eventos directamente.
- [ ] 5. Mensajes y Consultas públicas estilo WhatsApp: colores para nuevo, leído y respondido; estado vacío claro. "Nuevo mensaje" lista todas las organizaciones.
- [ ] 6. Página de compra del comprador (diseño), manteniendo el violeta.
- [ ] 7. Comisión por servicio, porcentajes editables por organizador y cuotas.

## Bugs conocidos (cada uno necesita su propio change)

- `eventoId` solo se guarda en `localStorage` al elegir en eventos-seleccion; con `?id=` no.
- Ventas viejas con `monto_total` NaN y pendientes de prueba sin vencer (son datos: no se arreglan desde el código sin aprobación).

## Necesitan prueba real (no los hace la nube)

- imagenes-de-eventos 6.5: con una cuenta de organización, solicitar un evento con una foto del celular, aprobarla y ver que aparece en las páginas.
- pagos-mercadopago sección 9 (pruebas con tarjeta): la persona decidió no hacerlas por ahora.
