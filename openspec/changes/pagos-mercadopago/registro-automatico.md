# Registro de trabajo automático

Una entrada por tarea, de la más nueva a la más vieja. Cada tarea es un commit en la rama `auto/pagos-mercadopago`, así que se puede deshacer una sin afectar las demás.

Para encontrar el commit de una tarea (por ejemplo la 4.1) y deshacerlo:

```
git log --oneline --grep "tarea 4.1"
git revert <hash>
```

Los avances manuales anteriores a este registro (tareas 1.x a 3.x) no figuran acá.

---

## Pruebas guardadas en el repo (pedido del usuario, no es una tarea de `tasks.md`)
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** carpeta `pruebas/` nueva: 10 archivos de prueba numerados, `_ayuda-db-falsa.js`, `ejecutar-todas.js` y `LEEME.md`.
- **Cómo se corren:** `node pruebas/ejecutar-todas.js` desde la raíz. No instala nada y no usa red ni Firestore real.
- **Qué cambió respecto de las pruebas temporales:** se reemplazaron las rutas de mi PC por rutas relativas (el repo es público) y se agregó `01-firma.js`, que de 4.1 se había hecho "al vuelo" y no estaba guardada.
- **Resultado:** 10 archivos, 220 casos, todos bien.
- **Límite:** son simulaciones. No reemplazan la sección 9 (pruebas reales con Mercado Pago y Firestore).
- **Pendiente:** la tarea 10.5 (actualizar `CLAUDE.md`) tiene que mencionar la carpeta `pruebas/`; hoy `CLAUDE.md` todavía dice que no hay pruebas automatizadas. No se tocó `package.json` (no se agregó el comando `npm test`) por ser un archivo de configuración.
- **Push:** menor (archivos nuevos, sin tocar configuración), se sube a `auto/pagos-mercadopago`.

---

## Tareas 6.1, 6.2 y 6.3: pantalla de compra (`public/evento.html`)
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `public/evento.html` (reescrito casi completo), `tasks.md` (solo 6.3 marcada)
- **Qué cambió:** el paso 2 ya no pide método de pago, tarjeta, billetera ni efectivo. Pide nombre, apellido y correo, muestra el resumen (evento, lote, cantidad, total), el aviso de modo de prueba (`#avisoModoPrueba`, se puede borrar cuando Mercado Pago pase a modo real) y el botón "Pagar con Mercado Pago". Al enviar llama a `POST /api/crear-pago` y abre el enlace de pago que devuelve el servidor.
- **Qué se eliminó:** la creación de la venta, el descuento de stock, los recargos por cuotas, el correo fijo `sin-correo@evently.com`, los códigos de entrada hechos en el navegador, los `alert()` y los estilos de los métodos de pago. La página ahora solo **lee** el evento (`getDoc`); no escribe nada en Firestore.
- **Qué viaja en el pedido:** solo `eventoId`, `loteIndex`, `loteNombre`, `cantidad`, `nombre`, `apellido`, `correo`. Ningún precio, monto ni estado. El total en pantalla es solo informativo: el precio real lo calcula el servidor.
- **Errores en pantalla (sin `alert`):** un mensaje junto a cada campo inválido (con foco en el primero según el orden de la página) o un mensaje general (sin stock, Mercado Pago no responde, sin conexión, respuesta inválida). Los mensajes se escriben con `textContent`, nunca como HTML. En el paso 1 también hay avisos en pantalla para lote agotado o más entradas de las que quedan.
- **Protecciones del botón:** se deshabilita mientras procesa (un doble o triple clic no crea más de una compra) y se rehabilita si el comprador vuelve con "atrás" desde Mercado Pago. Solo se abre un enlace `https`.
- **Comprobación (37 casos):** HTML — solo 3 campos en el paso 2, sin campos de tarjeta/billetera/efectivo, aviso de prueba presente, ninguna de las palabras prohibidas por 6.3 (`addDoc`, `updateDoc`, `sin-correo@evently.com`, `serverTimestamp`). JavaScript real de la página corrido con un navegador simulado, un `fetch` falso y un Firestore falso — el pedido no lleva precio, errores por campo, error de stock, Mercado Pago caído, respuesta no JSON, sin conexión, enlaces `javascript:`/`http:` rechazados, doble clic, botón "atrás", y que el JS solo use ids que existen en el HTML.
- **Estado de las tareas:** **6.3 marcada.** **6.1 y 6.2 sin marcar**: piden abrir un evento en el navegador y llamar al servidor desplegado. **Falta que el usuario mire la pantalla**: no pude comprobar cómo se ve (estilos y disposición).
- **Push:** **NO se sube.** Cambia lo que ve el público (no es una acción menor). Queda como commit local, pendiente de que el usuario lo revise.
- **Visto y no tocado (ya estaba así):** `renderEvento` y `renderLotes` arman el HTML con datos del evento (`nombre`, `descripcion`, `lugar`, `imagen`) sin escapar. Si un organizador guarda texto con HTML, se ejecuta en la página del comprador. Conviene corregirlo en un cambio aparte.

---

## Tareas 5.1, 5.2 y 5.3: `/api/venta` (consulta de la compra)
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/venta.js` (nuevo), `api/venta.js` (nuevo), `tasks.md` (solo 5.2 marcada)
- **Cómo se usa:** `POST /api/venta` con `{ id, t }` en el cuerpo. Se eligió POST y no GET para que el token no quede en los registros de acceso del servidor. `confirmacion.html` (tarea 7.1) tendrá que llamarla así.
- **5.1, consulta con id y token:** devuelve exactamente la misma respuesta (404 "no encontrada") si el token es incorrecto, si el id no existe o si el formato es raro; un token de otra venta tampoco abre esta. Los formatos raros ni siquiera leen la base de datos. El token se compara en tiempo constante, y también se compara contra uno de relleno cuando la venta no existe.
- **5.2, qué se devuelve:** estado, motivo, nombre/fecha/lugar del evento, lote, cantidad, monto, moneda y si hay reembolso pendiente. Las entradas con códigos y el método de pago solo aparecen si la venta está `confirmada`. La respuesta se arma campo por campo: no incluye token, `mpPaymentId`, `mpPreferenceId`, `motivoDetalle`, `pagosDuplicados`, ni nombre/correo del comprador.
- **5.3, vencimiento al consultar:** una venta `pendiente` con `venceEn` pasado pasa a `rechazada` con motivo `vencida`, dentro de una transacción que vuelve a leer la venta. Una confirmada, una ya rechazada o una pendiente sin fecha no se tocan.
- **Comprobación (31 casos, base de datos falsa):** todos los puntos anteriores, más la carrera entre vencer y confirmar repetida 30 veces (siempre termina `confirmada`, con 3 entradas y el stock descontado una vez), base caída (500 genérico sin detalles) y el handler (GET da 405, cuerpo ilegible o inválido da 404).
- **Estado de las tareas:** **5.2 marcada.** **5.1 y 5.3 quedan sin marcar**: la 5.1 es la primera lectura real de Firestore (también valida la conexión de la tarea 2.3) y la 5.3 pide cambiar `venceEn` a mano en la consola de Firestore.
- **Pendiente para el usuario (revisión de seguridad):** `/api/venta` no tiene límite de consultas. Adivinar un token es inviable (192 bits), pero alguien podría mandar miles de consultas con formato válido y cada una cuesta una lectura de Firestore (más una del evento). Antes de salir a producción conviene activar un límite de peticiones en Vercel (Firewall / rate limit) para `/api/venta`, `/api/crear-pago` y `/api/mp-webhook`. No se hizo por ser configuración de la cuenta de Vercel.
- **Push:** menor, se sube a `auto/pagos-mercadopago`.

---

## Ajustes a 4.3 y 4.4: decisiones que el usuario delegó
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/confirmacion.js`, `server/ventas.js` (`marcarRevision`), `server/webhook.js`, `design.md` (campos nuevos del modelo)
- **Decisión 1, monto o moneda que no coinciden:** además del registro en el servidor, la venta queda marcada con `requiereRevision: true` y `motivoRevision` (`monto_distinto`, `moneda_distinta` o `monto_invalido`). No cambia su estado ni sus entradas. Se escribe una vez aunque el aviso se repita (si dos avisos llegan exactamente a la vez podría escribirse dos veces, lo cual es inofensivo). La marca **no se limpia sola** si después se confirma la venta: un pago con monto raro pudo haber cobrado dinero, y conviene que una persona lo vea. No se marca si la venta no existe o la referencia no es válida. *Motivo:* es lo que pide el spec ("queda marcada para revisión") y no mueve dinero.
- **Decisión 2, pago duplicado:** si una venta confirmada recibe otro pago aprobado, queda con `requiereReembolso: true`, `motivoReembolso: 'pago_duplicado'` y la lista `pagosDuplicados` (con tope de 20). Sigue `confirmada`, con las mismas entradas y sin descontar stock. Reusa el aviso de "reembolso pendiente" que el panel ya tiene que mostrar para `sin_stock`, sin inventar otro concepto. El aviso repetido del mismo pago duplicado, o del pago original, no vuelve a escribir.
- **Comprobación:** 10 casos nuevos (revisión por monto y moneda, sin escritura repetida, sin escritura si no hay venta; duplicado con uno, dos y tres pagos, avisos repetidos). Las pruebas de 4.2 a 4.6 se repitieron y siguen pasando.
- **Panel (8.1):** hay que mostrar `requiereRevision` y `requiereReembolso` también en ventas confirmadas.
- **Push:** menor, se sube a `auto/pagos-mercadopago`.

---

## Tarea 4.6: confirmación segura ante avisos repetidos y errores temporales
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** solo `tasks.md` (4.6 marcada) y este registro. No hizo falta código nuevo: la idempotencia y el 500 ya salen del diseño de 4.4 (la transacción lee la venta y no hace nada si ya está `confirmada`; cualquier error llega al `catch` del webhook y responde 500).
- **Comprobación (flujo completo: firma, consulta del pago, venta y transacción, con base de datos falsa que imita el bloqueo optimista de Firestore):**
  - El mismo pago aprobado tres veces seguidas deja una sola confirmación: mismos códigos, 2 entradas, stock descontado una vez.
  - Tres avisos del mismo pago al mismo tiempo: uno confirma y dos no cambian nada (la transacción se repitió al chocar).
  - Dos ventas pagan la última entrada a la vez: una se confirma y la otra queda `rechazada` con `sin_stock`; el lote vende 1 de 1.
  - Cinco compras simultáneas por 2 entradas: se confirman exactamente 2, las otras 3 quedan `rechazada` con reembolso pendiente, 2 entradas vendidas y códigos distintos.
  - Error de la base de datos al confirmar: responde 500, la venta sigue `pendiente`, sin entradas ni `mpPaymentId`, stock intacto, nada escrito, y el cuerpo de la respuesta no filtra detalles. El reintento posterior confirma normalmente.
  - Base caída al leer: 500 y nada escrito.
- **Límite de esta prueba:** la base falsa imita el comportamiento de Firestore pero no es Firestore. La confirmación real de que no se duplica nada queda para las pruebas 9.6 y 9.7.
- **Sin verificar:** el spec pide responder a Mercado Pago dentro de 22 segundos. Las llamadas a Mercado Pago cortan a los 10 segundos y la transacción es corta, pero no se configuró ni se verificó el tiempo máximo de la función en Vercel (`vercel.json` no lo define).
- **Push:** menor, se sube a `auto/pagos-mercadopago`.

---

## Tarea 4.5: manejar los demás casos de estado
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/estados.js` (nuevo, función pura `decidirTransicion`), `tasks.md` (4.5 marcada). Se commitea junto con 4.4.
- **Comprobación:** tabla de 26 casos con `node -e`: pendiente/en proceso no cambian la venta; rechazado o cancelado pasan una venta pendiente a `rechazada` con motivo (`pago_rechazado` o `pago_cancelado`); una `rechazada` pasa a `confirmada` si llega un aprobado y hay stock; una `confirmada` no cambia nunca (aprobado repetido, rechazo tardío, reembolso); aprobado sin stock queda `rechazada` con `sin_stock` y `requiereReembolso`; estados desconocidos no tocan nada.
- **Decisiones tomadas:** un rechazo sobre una venta que ya estaba `rechazada` no pisa el motivo anterior. Un pago reembolsado o con contracargo (`refunded`, `charged_back`) no cambia la venta.
- **Modelo de datos:** se agrega el campo `motivoDetalle` (el `status_detail` de Mercado Pago, recortado a 100 caracteres) y se usa `requiereReembolso` en todas las ventas confirmadas/rechazadas.

## Tarea 4.4: confirmar la venta en una transacción
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/confirmacion.js` (nuevo, transacción `aplicarPago`), `server/webhook.js` (la conecta al flujo)
- **Estado de la tarea:** código listo, **4.4 queda sin marcar**: su criterio es "la prueba completa de la tarea 9.1" (un pago real de prueba con Mercado Pago en el sitio desplegado).
- **Comprobación hecha (base de datos falsa en memoria, 34 casos):** el pago aprobado deja la venta `confirmada`, con tantas entradas como cantidad, todas distintas, con el formato exacto `{ codigo, usado: false }` que busca `validador.html`; guarda el método real (`Crédito`, `Débito`, `Prepaga`, `Dinero en cuenta`) y `mpPaymentId`; suma las vendidas solo al lote de la venta sin tocar los demás campos del evento. Última entrada: de dos compras, una se confirma y la otra queda `rechazada` con `sin_stock` y reembolso pendiente, y el lote no vende de más. Lote que cambió de nombre o evento borrado: no confirma. Otro pago aprobado sobre una venta ya confirmada: no cambia nada y se registra como pago duplicado. Las lecturas van antes que las escrituras, como exige Firestore.
- **Corregido tras la revisión:** un lote sin `nombre` (`crear-pago` guarda `''` en la venta) ya no se toma como lote inconsistente; se agregó un caso de prueba.
- **Para tener en cuenta en las tareas del panel (8.1):** aparecen motivos nuevos además de `sin_stock`: `lote_inconsistente`, `evento_inexistente`, `pago_rechazado`, `pago_cancelado` y `vencida`. El panel debe mostrarlos en lenguaje simple.
- **Códigos de entrada:** mantienen el prefijo `ENT-` pero con 12 bytes aleatorios (antes eran la hora más 4 letras, adivinables).
- **Push:** menor, se sube a `auto/pagos-mercadopago`. El endpoint ya confirma ventas, pero la rama no se despliega a producción.
- **Pregunta para el usuario:** si un comprador paga dos veces la misma venta, hoy solo se deja un aviso en el registro del servidor ("pago duplicado"). ¿Hace falta marcarlo en la venta para que el panel muestre el reembolso pendiente?

---

## Tarea 4.3: comparar el pago con la venta
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/pagos.js` (nuevo), `server/webhook.js` (conecta la comparación), `server/ventas.js` (se agrega `leerVenta`), `tasks.md` (4.3 marcada)
- **Comprobación:** 21 casos de la función pura con `node -e` (monto con un centavo de diferencia pasa; dos centavos, otra moneda, venta inexistente, referencia de otra venta o con caracteres de ruta no pasan) y 8 casos del flujo completo con una base de datos falsa en memoria: en ningún caso se escribe en la base, el motivo queda en el registro del servidor y una base caída devuelve 500. La prueba de 4.2 se repitió y sigue pasando. Se quitó `estadoPago` de la respuesta (sugerencia del revisor).
- **Cómo se probó sin instalar nada:** esta carpeta no tiene `node_modules`, así que las pruebas reemplazan `firebase-admin` por un doble en memoria. Las pruebas viven fuera del repo.
- **Push:** menor, se sube a `auto/pagos-mercadopago`.
- **Pregunta para el usuario:** el spec dice que si el monto no coincide la venta "queda marcada para revisión". Hoy solo se registra el motivo en el log del servidor. Marcarla en la venta (por ejemplo `requiereRevision: true`) agrega un campo al modelo de datos. ¿Se agrega?

---

## Tarea 4.2: ignorar avisos que no son de pagos y consultar el pago
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/webhook.js` (nuevo), `api/mp-webhook.js` (nuevo), `server/mercadopago.js` (se agrega `obtenerPago`)
- **Estado de la tarea:** código listo y probado con Mercado Pago simulado, pero **4.2 queda sin marcar**: su criterio es "Simular notificación" desde el panel de Mercado Pago, que necesita el sitio desplegado (igual que 3.2, 3.3 y 3.5).
- **Comprobación:** 14 casos con `node -e` y Mercado Pago simulado, sin red ni base de datos. Firma incorrecta, ausente, con `data.id` repetido o de otro pago: 401 y sin consultar a Mercado Pago. Aviso que no es de pago, sin tipo o con id no numérico: 200 y sin consultar. Pago aprobado (formato actual, formato viejo `topic` o tipo en el cuerpo): 200 y una consulta `GET /v1/payments/{id}` con el token. Pago inexistente (404): 200 y nada cambia. Mercado Pago caído o sin conexión: 500 para que reintente. Sin la clave del aviso: 500 y sin consultas. Ningún secreto aparece en los registros ni en las respuestas.
- **Estado del endpoint (al momento de esta tarea):** solo consultaba el pago. Desde las tareas 4.4 y 4.5 ya confirma ventas. **No pasar a `main` hasta hacer las pruebas reales** (4.2 con "Simular notificación", 4.4 y la sección 9 con Mercado Pago de prueba): hasta ahora todo se probó con Mercado Pago y base de datos simulados.
- **Push:** menor (archivos nuevos del change y una función agregada), se sube a `auto/pagos-mercadopago`.
- **Decisión tomada:** un pago que Mercado Pago dice que no existe devuelve 200 (reintentar no lo arregla). Cualquier otro fallo de consulta devuelve 500.

---

## Tarea 4.1: verificar la firma del aviso
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/firma.js` (nuevo), `tasks.md` (4.1 marcada)
- **Comprobación:** 17 casos con `node -e` y una clave de ejemplo. Pasan la firma correcta, `v1` en mayúsculas y `data.id` numérico. Fallan un carácter cambiado, `v1` corto, sin `ts`, sin `v1`, `ts`/`data.id`/`request-id` distintos, sin `request-id`, sin `data.id`, clave equivocada, sin clave, encabezado ausente o basura.
- **Push:** menor (archivo nuevo y una línea de `tasks.md`), se sube a `auto/pagos-mercadopago`.
- **Pendiente relacionado:** el 401 lo da el endpoint, que se crea en 4.2. No se agregó límite de antigüedad del `ts`.
