# Design

## Context

La motivación y el alcance están en `proposal.md`; el comportamiento exigido está en `specs/`. Acá solo el estado actual y las restricciones que condicionan el cómo.

**Estado actual (leído del código):**
- `public/evento.html` arma la venta en el navegador: correo fijo `sin-correo@evently.com` (:525), precio, recargos y códigos de entrada generados en el cliente, `addDoc` en `ventas` (:591) y `updateDoc` del stock en `eventos` (:598).
- `public/confirmacion.html` lee la venta con `getDoc` y fabrica el QR de la primera entrada.
- El panel lee `ventas` en `dashboard.html:139`, `ventas.html:237`, `reportes.html:233` y `superadmin.html:239`. Las cifras de dinero suman **todas** las ventas sin mirar el estado (`dashboard.html:162`, `ventas.html:349`, 12 lugares en `reportes.html`).
- `eventos` solo lo escriben hoy: `eventos.html:368` (superadmin, modo directo), `aprobaciones.js:433` (superadmin) y el comprador en `evento.html:598`, que desaparece con este change.
- Las reglas de `ventas` y `eventos` son hoy más abiertas de lo que necesita un cobro real; este change las ajusta.
- El sitio se publica desde la raíz del repo con `vercel.json` (`outputDirectory: "."`). No hay `package.json` ni carpeta `api/`.

**Restricciones:** plan Hobby de Vercel (funciones de hasta 300 s, cuerpo de hasta 4,5 MB), sin tests automáticos, entrega el 30/10, pruebas solo en producción, y no se cambia el resto del stack.

## Goals / Non-Goals

**Goals:**
- Que precio, stock, estado y entradas los decida solo el servidor.
- Que un pago aprobado se confirme una sola vez, aunque el aviso se repita.
- Que se pueda volver atrás (código y reglas) sin perder datos.

**Non-Goals:**
- Reintentar el mismo pago desde nuestro sitio: el botón "volver a intentar" lleva al evento y crea una compra nueva.
- Migrar o limpiar las ventas viejas de prueba.
- Medir rendimiento o armar monitoreo: alcanza con los registros de Vercel.

## Decisions

### 1. Funciones de Node en `api/` con el estilo `(req, res)`
Tres archivos en `api/` (`crear-pago.js`, `mp-webhook.js`, `venta.js`) en CommonJS. El código compartido (conexión a Firestore, cálculo de estados, validaciones) va en una carpeta `server/` fuera de `api/`, como recomienda Vercel.
- **Por qué:** es lo más simple y documentado; `req.query`, `req.body` y `req.headers` ya vienen listos.
- **Alternativas:** el formato `fetch` estándar (más nuevo, sin ventaja acá) y ES modules (obliga a tocar el `package.json`).
- **Consecuencia:** como se publica la raíz, `server/` y `package.json` quedan descargables como archivos. No tienen secretos, solo código.

### 2. Mercado Pago con `fetch`, sin su SDK
Llamadas directas a `POST /checkout/preferences`, `GET /v1/payments/{id}` y, una sola vez, `GET /v1/payment_methods`. Con el Access Token en el encabezado `Authorization`.
- **Por qué:** una dependencia menos y se ve exactamente qué se envía.
- **Alternativa:** el SDK oficial de Node; ahorra poco código y suma peso.
- **Tipos de pago (confirmado en la tarea 3.4):** `GET /v1/payment_methods` con las credenciales de prueba de Argentina devuelve cuatro tipos: `credit_card` (cabal, visa, amex, master, naranja, argencard, diners), `debit_card` (debcabal, debmaster, maestro, debvisa), `prepaid_card` (visa, cabal, master) y `ticket` (pagofacil, rapipago). **Se excluye únicamente `ticket`** (efectivo). Se permiten crédito, débito, prepagas y dinero en cuenta. `account_money` no aparece en esa lista, así que que se ofrezca depende de la cuenta del comprador. No se excluyen `atm`, `bank_transfer`, `digital_currency` ni `digital_wallet` porque esta cuenta no los tiene.

### 3. Acceso a Firestore con `firebase-admin` y una cuenta de servicio dedicada
Se inicia una sola vez por proceso, con tres variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). La clave llega con `\n` escapados y se convierten al leerla. La cuenta tiene solo el rol *Cloud Datastore User*.
- **Por qué:** `firebase-admin` soporta transacciones y no pasa por las reglas, que es lo que permite cerrar `ventas` a todo el navegador.
- **Alternativas:** reusar `firebase-adminsdk` (permisos más amplios) o llamar la API REST a mano (más código y más errores).

### 4. Modelo de datos: se amplía `ventas`
Campos nuevos sobre los actuales (`eventoId`, `eventoNombre`, `loteNombre`, `cantidad`, `correo`, `metodo_pago`, `monto_total`, `estado`, `fecha`, `entradas`): `nombre`, `apellido`, `loteIndex`, `tokenConsulta`, `venceEn`, `motivo`, `mpPreferenceId`, `mpPaymentId`, `requiereReembolso`, `fechaConfirmacion`.
- **Agregados durante la implementación:** `motivoDetalle` (detalle del rechazo de Mercado Pago), `requiereRevision` y `motivoRevision` (el pago llegó con otro monto o moneda: se marca la venta sin cambiar su estado), y `motivoReembolso` y `pagosDuplicados` (una venta confirmada recibió otro pago aprobado: queda con `requiereReembolso` y se anotan los pagos repetidos).
- Las `entradas` quedan vacías hasta confirmar, y mantienen el formato `{ codigo, usado }`, así `validador.html` sigue siendo compatible.
- Se mantienen los nombres de estado `pendiente` y `confirmada` que ya usa el panel. `anulada` se reemplaza por `rechazada`.
- **Alternativa descartada:** una colección nueva `pedidos`. Obligaría a cambiar todo el panel por una ventaja mínima.

### 5. Estados y transiciones
```
 pendiente --(aprobado)-------> confirmada            (final)
 pendiente --(rechazado)------> rechazada
 pendiente --(pasan 30 min)---> rechazada (vencida)
 rechazada --(aprobado + hay stock)--> confirmada
 aprobado sin stock ----------> rechazada (sin_stock, requiereReembolso)
```
`confirmada` no retrocede. Todas las transiciones se hacen dentro de una transacción sobre la venta.

### 6. Stock sin reserva
- **Al crear el pago:** disponible = `disponibles - vendidas` del lote en el documento del evento. Las ventas pendientes no cuentan.
- **Al confirmar:** una transacción vuelve a leer el evento, comprueba el stock, suma las unidades a `vendidas` y reescribe el arreglo `lotes` (Firestore no permite cambiar un elemento de un arreglo). Si no alcanza, aplica el caso `sin_stock`.
- **Lote:** se identifica con `loteIndex` y se comprueba que el `nombre` coincida con el guardado. Los eventos publicados no se editan, así que el orden no cambia.
- **Alternativa descartada:** reservar 15 minutos. Es más correcto, pero más lógica para el tiempo disponible. El riesgo (última entrada) está documentado.

### 7. Firma del aviso y verificación del pago
- Se arma el texto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, se calcula HMAC-SHA256 en hexadecimal con `MP_WEBHOOK_SECRET` y se compara con `v1` usando una comparación de tiempo constante.
- `data.id` se toma de la dirección (`?data.id=`), no del cuerpo. Los avisos que no son de tipo pago se ignoran con un 200.
- Después se consulta el pago real. Se comprueba: `external_reference` = id de una venta, moneda `ARS`, `transaction_amount` igual al `monto_total` de la venta (con tolerancia de un centavo) y el estado.
- **Por qué consultar y no creer el aviso:** el aviso solo avisa que "algo cambió"; el estado verdadero está en Mercado Pago.

### 8. Idempotencia
La transacción lee la venta: si ya está `confirmada`, no hace nada y responde 200. Se guarda `mpPaymentId` del pago que la confirmó. Un error temporal responde 500 para que Mercado Pago reintente cada 15 minutos.

### 9. Vencimiento "perezoso"
`/api/venta` compara `venceEn` con la hora del servidor. Si la venta sigue `pendiente` y venció, la pasa a `rechazada` con motivo `vencida` antes de responder. La preferencia de Mercado Pago también vence a los 30 minutos, así que no se puede pagar después. Un aviso tardío de pago aprobado igual puede confirmar una venta vencida si queda stock.
- **Alternativa descartada:** un proceso programado. Es otro servicio para algo que se resuelve al mirar.
- **Efecto:** en el panel una venta vencida puede figurar `pendiente` hasta que alguien la consulte. Se acepta; el panel puede marcarla como vencida al mostrarla.

### 10. Pantalla de confirmación con consulta periódica
`confirmacion.html` consulta `/api/venta` cada 3 segundos, hasta 2 minutos, mientras el estado sea `pendiente`. Después muestra un aviso de que se está demorando y el enlace para volver. Las tres `back_urls` apuntan a la misma pantalla, que decide qué mostrar según el estado real y no según lo que trae la dirección. El QR de cada entrada se dibuja en el navegador con la librería que ya se usa.

### 11. Reglas de Firestore
Se aplican a mano en la consola y se guardan como texto en las tareas. Las partes que cambian:
```
match /ventas/{id} {
  allow read: if esSuperadmin() || esOrganizacion();
  allow create, update, delete: if false;
}
match /eventos/{id} {
  allow read: if resource.data.estado == "publicado" || estaLogueado();
  allow write: if esSuperadmin();
}
```
Se reutilizan `esSuperadmin()` y `esOrganizacion()` que ya existen (esta última hoy no se usa). El resto de las colecciones no se toca en este change.

### 12. Orden de puesta en marcha
1. Secretos y configuración externa (lo hace el usuario).
2. Funciones desplegadas pero sin usar: se prueban llamándolas sin pagos.
3. Cambio de `evento.html` y `confirmacion.html` al flujo nuevo.
4. Ajustes del panel.
5. **Las reglas se publican al final**, para que el flujo viejo siga funcionando mientras se construye el nuevo.

## Risks / Trade-offs

- [Última entrada vendida dos veces] → el segundo pago queda `rechazada` por `sin_stock` con `requiereReembolso`; se devuelve a mano en el panel de Mercado Pago.
- [Uso abusivo de la creación de pagos: muchas compras iniciadas y nunca pagadas] → máximo 10 entradas, vencimiento a 30 minutos, y las pendientes no restan stock ni suman a la recaudación.
- [El validador deja de funcionar al publicar las reglas, porque hoy no usa una cuenta propia] → está fuera de este change; hay que decidir antes del 30/10 si se publica sin validador o si se hace primero su change. No hay forma de dejarlo andando con las reglas nuevas sin darle una cuenta o una función propia.
- [Una organización puede leer ventas de otra] → aceptado por tiempo; el registro público está apagado, así que son solo cuentas que creó el administrador.
- [Las pruebas se hacen en producción y dejan ventas de prueba] → se identifican por correo de prueba y se pueden borrar a mano desde la consola.
- [Una clave se sube por error al repositorio] → el patrón nuevo en `.gitignore`, guardar la clave fuera de la carpeta, y revisar `git status` antes de cada commit.
- [Las vistas previas de Vercel están protegidas y Mercado Pago no las alcanza] → los pagos se prueban solo en la URL de producción; se prepara un punto de vuelta atrás.
- [Un aviso de pago llega para una venta que nunca existió o con otro monto] → no se confirma nada y se registra para revisión.
- [Faltan secretos en Vercel] → las funciones responden con error de configuración y no crean ventas.

## Migration Plan

- **Despliegue:** commit y push a `main`, Vercel despliega solo. Las variables se cargan antes en Production y requieren un deploy nuevo para tomar efecto.
- **Datos:** las ventas viejas de prueba quedan como están. El panel las muestra sin error aunque les falten los campos nuevos.
- **Vuelta atrás del código:** restaurar el deploy anterior desde Vercel, o `git revert` del commit del flujo nuevo.
- **Vuelta atrás de las reglas:** volver a publicar la versión anterior desde el historial de reglas de la consola de Firebase. Conviene copiar las reglas actuales a un archivo local antes de cambiarlas.
- **Antes de empezar:** crear una etiqueta de git en el estado actual, para tener un punto de retorno claro.

## Open Questions

Se resuelven al implementar, sin cambiar las specs ni las tareas:
- Si con credenciales de prueba se usa `init_point` o `sandbox_init_point`.
- Si `transaction_amount` o `total_paid_amount` es el campo correcto para comparar el monto cuando hay cuotas con interés.
- Si los archivos con guion bajo dentro de `api/` se pueden usar como código compartido; si no, queda `server/`.
