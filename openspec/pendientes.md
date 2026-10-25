# Pedidos pendientes

Lista de pedidos que todavía no tienen change de OpenSpec. La usa el trabajo nocturno en la nube: toma el primero que no esté hecho, escribe su plan (explore + propose, sin código) y abre un PR para que se apruebe. Al crear el change, marcar el pedido con `[x]` y el nombre del change.

## En orden

- [ ] 1. Selector de evento sin confusión: banner con el evento activo en cada página del panel; exportar y PDF dicen de qué evento son.
- [ ] 2. Formas de pago: sacar "Efectivo" de todos los eventos; mostrar las formas reales (transferencia, débito, crédito); PDF con opciones elegibles.
- [ ] 3. Crear evento: fechas y horas por día, lugar con sugerencias y mapa, descripción en campos separados (actividad, tipo, requisitos, edad).
- [ ] 4. Superadmin: eliminar "Panel global"; las solicitudes de evento pasan a "Crear evento" con aprobar, rechazar, comentar y contacto directo; al entrar ve los eventos directamente.
- [ ] 5. Mensajes y Consultas públicas estilo WhatsApp: colores para nuevo, leído y respondido; estado vacío claro. "Nuevo mensaje" lista todas las organizaciones.
- [ ] 6. Página de compra del comprador (diseño), manteniendo el violeta.
- [ ] 7. Comisión por servicio, porcentajes editables por organizador y cuotas.
- [ ] 8. Menú del panel (admin y superadmin): el logo de Evently es un botón que vuelve al inicio y se ve también con el menú achicado (solo íconos); el menú se puede achicar y agrandar; las secciones se ven en un tamaño que entre todo en la pantalla, pero se mantiene el scroll por si se agregan más.
- [ ] 9. Exportar a CSV (Excel), además del PDF, en Ventas y Reportes; el archivo dice de qué evento es.

## Detalles de la persona (pedidos 1 a 9)

Dicho por la persona; el plan de cada pedido tiene que respetarlo y las dudas van como preguntas con opciones.

- **Admin = jefe de la organización** (pedidos 1 y 4): no hace falta agrupar por organización. Al entrar ve directo sus eventos: activos, pendientes, rechazados y viejos. En esa misma pantalla hay un botón "Crear nuevo evento" que lleva a la página de crear evento.
- **Selector de evento** (pedido 1): hoy se puede cambiar de evento en Reportes, pasar a Ventas y exportar un PDF de otro evento sin darse cuenta. Tiene que quedar claro, en todas las páginas y en cada exportación, de qué evento son los datos.
- **Formas de pago** (pedido 2): sacar el filtro "Efectivo" en admin y superadmin. Solo transferencia, débito y crédito.
- **PDF** (pedido 2): antes de exportar, la persona elige qué secciones quiere ver (por ejemplo solo lotes). Salen solo las elegidas, ordenadas; si elige todo, sale todo. Lleva el logo de la organización y la leyenda de que fue creado por Evently, bien definido. Duda para preguntar: qué fecha y horario mostrar en el PDF.
- **Fechas al crear evento** (pedido 3): elegir con un calendario (no escribir); día de inicio y de fin si dura uno o más días; horarios.
- **Dirección** (pedido 3): mientras escribe, sugerencias de direcciones; o un mapa donde marcar el lugar a mano. La persona cree que no hace falta pagar: buscar una opción gratuita y proponer alternativas con pros y contras.
- **Superadmin** (pedido 4): "Panel global" se elimina porque es redundante. Las solicitudes de evento (las que piden organizadores o admins) van dentro de "Crear evento".
- **Mensajes y Consultas públicas** (pedido 5): las consultas públicas son mensajes de clientes a la organización. También hay mensajes de superadmin a admin y de admin a superadmin, y el superadmin ve los que le llegan a cada organización. Orden: organización, evento dentro de la organización, cliente; con colores que los diferencien y bien agrupados. Tiene que ser fácil de entender y de contestar.
- **Página de compra** (pedido 6): la persona la mejora con capturas que pasa más adelante. Mantener la misma paleta, diseño e interfaz.
- **Comisión** (pedido 7): desde la página de superadmin se edita el porcentaje que se cobra por venta, con varias categorías según cómo se maneje con cada organización.

## Bugs conocidos (cada uno necesita su propio change)

- `eventoId` solo se guarda en `localStorage` al elegir en eventos-seleccion; con `?id=` no.
- Ventas viejas con `monto_total` NaN y pendientes de prueba sin vencer (son datos: no se arreglan desde el código sin aprobación).

## Necesitan prueba real (no los hace la nube)

- imagenes-de-eventos 6.5: con una cuenta de organización, solicitar un evento con una foto del celular, aprobarla y ver que aparece en las páginas.
- pagos-mercadopago sección 9 (pruebas con tarjeta): la persona decidió no hacerlas por ahora.
