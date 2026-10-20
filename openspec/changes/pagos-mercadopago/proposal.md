# Proposal

## Why

Hoy el pago es simulado: el navegador arma la venta, calcula el precio y descuenta el stock, algo que no es confiable para cobrar dinero. Además el correo del comprador se guarda fijo como `sin-correo@evently.com`. Necesitamos cobrar de verdad (en modo de prueba de Mercado Pago) y que el precio, el stock y la confirmación los decida el servidor. Tiene que funcionar para la entrega del **30/10/2026**.

## What Changes

- **Pago con Mercado Pago Checkout Pro (modo de prueba).** El comprador carga nombre, apellido y correo, y paga en la página de Mercado Pago. Solo se aceptan tarjetas de crédito, débito y dinero en cuenta (sin efectivo).
- **Servidor propio en el mismo proyecto de Vercel**, con 3 funciones en `/api`:
  - `/api/crear-pago`: calcula precio y stock, crea la venta en `pendiente` y la preferencia de Mercado Pago.
  - `/api/mp-webhook`: recibe el aviso de Mercado Pago, valida la firma, consulta el pago y confirma la venta.
  - `/api/venta`: devuelve el estado de una compra (y las entradas solo si está confirmada).
- **Estados de venta:** `pendiente`, `confirmada` y `rechazada` (con un campo `motivo`). Una venta pendiente que pasó los 30 minutos se marca `rechazada` con motivo `vencida` cuando alguien la consulta.
- **Se eliminan del navegador:** el formulario de tarjetas, billeteras, efectivo y recargos de `evento.html`; la escritura de ventas; el botón "Confirmar pago" de `ventas.html`; el descuento de stock desde el navegador.
- **`confirmacion.html`** deja de leer Firestore: pregunta a `/api/venta`, muestra un QR por entrada y mensajes según el estado. Se van el CBU falso y el botón "Descargar PDF" falso.
- **Reglas de Firestore:** nadie escribe `ventas` desde el navegador; `ventas` la leen solo el superadmin y las cuentas con rol `organizacion`; `eventos` solo lo escribe el superadmin.
- **Panel:** Ventas cambia el filtro "anuladas" por "rechazadas"; Dashboard, Ventas y Reportes cuentan la recaudación solo de ventas confirmadas.
- **Secretos:** se agrega al `.gitignore` la protección de la clave de la cuenta de servicio nueva, y los tokens van solo en variables de entorno de Vercel.
- **Dependencia nueva:** un `package.json` en la raíz con `firebase-admin`. Es lo único que se suma al stack.

## Capabilities

### New Capabilities
- `compra-con-mercado-pago`: cómo se inicia una compra (datos del comprador, precio y stock calculados en el servidor, venta pendiente, preferencia de Mercado Pago, métodos permitidos).
- `confirmacion-de-pago`: cómo el servidor confirma o rechaza una venta a partir del aviso de Mercado Pago (firma, verificación del pago, idempotencia, stock, entradas).
- `estado-de-venta`: cómo el comprador consulta su compra (token, vencimiento a `rechazada`, entradas solo si está confirmada, pantalla de confirmación).
- `reglas-de-acceso-a-ventas`: quién puede leer y escribir `ventas` y `eventos` en Firestore, y cómo se protegen los secretos del servidor.
- `panel-de-ventas`: qué muestra el panel sobre las ventas (estados, filtros, recaudación solo de confirmadas) y que ya no se confirman a mano.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene specs principales. -->

## Impact

- **Código nuevo:** carpeta `api/` (3 funciones), `package.json`, `package-lock.json`.
- **Código que cambia:** `public/evento.html`, `public/confirmacion.html`, `admin/ventas.html`, `admin/dashboard.html`, `admin/reportes.html`, `.gitignore`. Las reglas de Firestore se cambian en la consola de Firebase, no en el repo.
- **Servicios externos:** Mercado Pago (aplicación Checkout Pro con credenciales de prueba), Firebase (cuenta de servicio nueva con el rol *Cloud Datastore User*), Vercel (6 variables de entorno).
- **Datos:** `ventas` suma campos (`nombre`, `apellido`, `tokenConsulta`, `venceEn`, `motivo`, `mpPreferenceId`, `mpPaymentId`, `requiereReembolso`). Los datos de prueba viejos no se migran.
- **Enlace con el plan de seguridad:** este change reemplaza la "limitación conocida" de que precio y stock se calculaban en el navegador.

## Por qué estas opciones y no otras

- **Checkout Pro (redirigir a Mercado Pago) y no armar el formulario de tarjetas nosotros:** tu sitio nunca toca datos de tarjeta, hay menos código y menos riesgo. Contra: el comprador sale un momento de tu sitio.
- **Funciones en Vercel y no Cloud Functions de Firebase:** Cloud Functions necesita pasar Firebase a un plan con tarjeta, y el sitio ya vive en Vercel. Contra: hay que configurar el acceso a Firestore con una cuenta de servicio.
- **`firebase-admin` y no la API REST de Firestore a mano:** es la forma oficial, soporta transacciones y es menos propensa a errores. Contra: agrega una dependencia.
- **Sin reserva de stock:** es mucho más simple y alcanza para la demo. Contra: dos compradores de la última entrada pueden pagar a la vez (ver riesgos).
- **Aislamiento por rol y no por organización:** no obliga a tocar `reportes.html` ni `superadmin.html` antes del 30/10. Contra: una organización podría ver ventas de otra.
- **Vencimiento de 30 minutos controlado al consultar y no con un proceso programado:** no hace falta ningún servicio extra. Contra: una venta vencida sigue figurando `pendiente` hasta que alguien la consulte.

## Fuera de alcance

- **El validador** (`validador.html`): hoy marca entradas con una escritura directa a `ventas` que las reglas nuevas van a bloquear. Se resuelve en otro change, y hasta entonces el validador deja de funcionar.
- Aislamiento por organización en `ventas`, reserva de stock, correo de confirmación, reembolsos automáticos, límite por persona o captcha, pago en efectivo, cambio de stack y Mercado Pago en modo producción.

## Riesgos conocidos

- **Última entrada:** si dos personas pagan la última entrada al mismo tiempo, la segunda paga y al confirmar no hay stock. Esa venta queda `rechazada` con motivo `sin_stock` y `requiereReembolso`, y el reembolso se hace a mano en el panel de Mercado Pago.
- **Ventas pendientes sin pagar:** cualquiera puede llamar a `/api/crear-pago`. Se acota con el vencimiento de 30 minutos y el máximo de 10 entradas. No se agrega captcha.
- **A confirmar con el primer pago de prueba:** si se usa `init_point` o `sandbox_init_point`, los ids exactos de los tipos de pago a excluir, si `data.id` va en minúsculas en la firma, y con qué campo del pago se compara el monto.
- **Pruebas en producción:** las vistas previas de Vercel suelen estar protegidas y Mercado Pago no podría avisarles, así que los pagos se prueban en la URL de producción.
- **Secretos:** la clave de la cuenta de servicio y los tokens nunca van al repo ni al chat.

## Cómo se verifica a mano

No hay tests automáticos. Se comprueba así, en una ventana de incógnito con las cuentas y tarjetas de prueba de Mercado Pago:

1. **Pago aprobado** (titular `APRO`): la compra termina en `confirmacion.html` con estado confirmada y un QR por entrada. En Firestore, la venta queda `confirmada` y las vendidas del lote suben.
2. **Pago rechazado** (titular `OTHE` o `FUND`): la venta queda `rechazada` y el stock no cambia.
3. **Pago pendiente** (titular `CONT`): la venta sigue `pendiente` y la página lo explica.
4. **Precio manipulado:** si desde la consola del navegador se intenta cambiar el precio, la compra usa igual el precio del servidor.
5. **Sin stock:** pedir más entradas de las disponibles devuelve un error claro.
6. **Aviso repetido:** reenviar el mismo aviso desde el panel de Mercado Pago no genera entradas ni descuentos dobles.
7. **Vencimiento:** una venta pendiente de más de 30 minutos, al consultarla, pasa a `rechazada` con motivo `vencida`.
8. **Reglas:** desde la consola del navegador, crear, editar o borrar una venta falla; un anónimo no puede leer `ventas`.
9. **Panel:** un superadmin y una organización siguen viendo sus pantallas de Ventas, Dashboard y Reportes.
10. **Repositorio:** `git status` no muestra ninguna clave ni archivo `.env`, y `git check-ignore -v` confirma que el patrón de la clave nueva funciona.
