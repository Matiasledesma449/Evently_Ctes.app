# Pedidos pendientes

Lista de pedidos que todavía no tienen change de OpenSpec. La usa el trabajo nocturno en la nube: toma el primero que no esté hecho, escribe su plan (explore + propose, sin código) y abre un PR para que se apruebe. Al crear el change, marcar el pedido con `[x]` y el nombre del change.

## En orden

- [x] 1. Selector de evento sin confusión: banner con el evento activo en cada página del panel; exportar y PDF dicen de qué evento son. (change: `evento-activo-en-todo-el-panel`)
- [x] 2. Formas de pago: sacar "Efectivo" de todos los eventos; mostrar las formas reales (transferencia, débito, crédito); PDF con opciones elegibles. (change: `formas-de-pago-reales`)
- [x] 3. Crear evento: fechas y horas por día, lugar con sugerencias y mapa, descripción en campos separados (actividad, tipo, requisitos, edad). (change: `crear-evento-completo`)
- [x] 4. Superadmin: eliminar "Panel global"; las solicitudes de evento pasan a "Crear evento" con aprobar, rechazar, comentar y contacto directo; al entrar ve los eventos directamente. (change: `superadmin-sin-panel-global`)
- [x] 5. Mensajes y Consultas públicas estilo WhatsApp: colores para nuevo, leído y respondido; estado vacío claro. "Nuevo mensaje" lista todas las organizaciones. (change: `mensajes-estilo-whatsapp`)
- [x] 6. Página de compra del comprador (diseño), manteniendo el violeta. (change: `pagina-de-compra-mejorada`)
- [x] 7. Comisión por servicio, porcentajes editables por organizador y cuotas. (change: `costo-de-servicio`)

## PRIMERO el miércoles 28/10 (pedido de la persona del 26/10, noche)

Hacer en este orden, con plan de OpenSpec, antes que cualquier otra cosa.

- [x] 10. **Crear evento desde Eventos**: en la lista de Eventos del superadmin, cuando el filtro tiene una organización elegida,
  un botón "Crear evento" que lleva a Crear evento con esa organización ya elegida.
- [x] 11. **Organización elegida en TODO el panel (franja rosa)**: al elegir una organización, en todas las páginas (Resumen,
  Reportes, Ventas, Escáner, Finanzas, Eventos) se ve una franja de color rosa: "Estás viendo: <organización>", con un
  desplegable para cambiar de organización y, al lado, el selector de eventos SOLO de esa organización. Cambiar de
  organización cambia los eventos en todas las páginas. Bug a corregir: en Reportes, con "Zavod" (sin eventos) elegida,
  el filtro de eventos de Resumen muestra eventos de otras organizaciones.
- [x] 12. **Editar evento**: poder cambiar "¿Cómo se venden las entradas?" (entrada única ↔ con lotes) también al editar
  (hoy queda bloqueado). Cuidado: las ventas se confirman por la posición y el nombre del lote (server/confirmacion.js);
  si el evento ya tiene ventas, no se puede cambiar la estructura sin romperlas: explicarlo y ofrecer solo lo seguro.
- [x] 13. **Suspender, reactivar y eliminar eventos** (superadmin): "Suspender" (deja de verse y de venderse, se puede
  editar), "Volver a activar", y "Eliminar" con un paso de confirmación (y, como en organizaciones, que se pueda recuperar).
  El servidor ya rechaza eventos con `activo === false` (server/compra.js).
- [x] 14. **Una sola sección para "ver" (nombre creativo, por ejemplo "Ojo de halcón" o "Vista")**: juntar en una sección
  del menú "Ver sitio" y "Ver como organización": un filtro "¿Qué organización?" y otro para ir a la página de Evently
  (inicio) o a la página de un evento en especial.

## Pedidos del 28/10 (tarde, tras probar la vista previa)

- [x] 15. Evento suspendido: el comprador ve un mensaje amable de "en mantenimiento, en un rato se puede seguir comprando".
- [x] 16. Editar evento: pasar de varios lotes a entrada única si los lotes que se quitan no tienen ventas (ni pendientes); confirmación al cambiar de forma de venta (en los dos sentidos); al guardar, pedir la contraseña del login.
- [ ] 17. Porcentajes y gráficos claros en Resumen (admin y superadmin); Reportes con porcentajes y descarga CSV y PDF; Finanzas (balance y liquidaciones) y Ventas con descarga CSV y PDF, salida profesional y ordenada.
- [x] 18. Eliminar la sección "Sitio" del panel.
- [x] 19. "Olvidé mi contraseña" del login: el mensaje no llega (revisar).
- [x] 20. Pie del sitio: enlaces legales centrados y fijos (no desaparecen al entrar a uno), logo de Evently a la izquierda, © 2026.
- [ ] 21. Banners de las secciones del sitio con lugar para imagen (la persona pasa las imágenes después).
- [ ] 22. Términos y condiciones y política de privacidad adecuados a Evently (datos personales, consumidor, pagos).
- [ ] 23. Comprador registrado y correos: registro antes de comprar, entrada en PDF por correo, aviso de otros eventos, recordatorio a una semana y el día del evento. Necesita un servicio de correo nuevo (decidir con la persona).

## Pasos de la persona para el miércoles

- "Agregar admin" en la vista previa dice "El servidor no está configurado para crear cuentas": la vista previa no tiene las
  variables de Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Opciones: probarlo en producción
  después del merge, o cargar esas variables también para "Preview" en Vercel (lo hace la persona; Claude no toca variables).
  El rol "Administrador de Firebase Authentication" ya se le dio a evently-pagos-server y la regla de configuracion/sitio
  ya está publicada (26/10).

## Seguridad pendiente

- La regla de `ventas` deja que cualquier cuenta de organización lea las ventas de TODAS las organizaciones (nombres y
  correos de compradores). Arreglo: guardar `organizacionId` en cada venta (server/ventas.js) y limitar la regla.

## Bugs conocidos (cada uno necesita su propio change)

- `eventoId` solo se guarda en `localStorage` al elegir en eventos-seleccion; con `?id=` no.
- Ventas viejas con `monto_total` NaN y pendientes de prueba sin vencer (son datos: no se arreglan desde el código sin aprobación).

## Necesitan prueba real (no los hace la nube)

- imagenes-de-eventos 6.5: con una cuenta de organización, solicitar un evento con una foto del celular, aprobarla y ver que aparece en las páginas.
- pagos-mercadopago sección 9 (pruebas con tarjeta): la persona decidió no hacerlas por ahora.
