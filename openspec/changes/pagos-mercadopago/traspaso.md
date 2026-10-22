# Traspaso: cómo continuar este trabajo con otra IA (o con otra persona)

Este documento es para quien retome el change `pagos-mercadopago` sin haber visto la conversación anterior. Si sos una IA: **seguí estas reglas al pie de la letra** y no improvises fuera de ellas. La persona dueña del proyecto no es programadora experta: hablale en español simple y explicale lo que hacés.

Última actualización: 2026-10-22, rama `auto/pagos-mercadopago`.

## 1. Qué es esto

Evently vende entradas para eventos. Este change cambia el pago: antes el navegador armaba la venta, calculaba el precio y descontaba el stock (no es confiable). Ahora **lo decide el servidor** y se cobra con Mercado Pago, hoy en **modo de prueba** (no se cobra dinero real). Fecha de entrega: **30/10/2026**.

- Sitio estático (HTML + JavaScript puro, sin build) en Vercel, más funciones de Node en `api/` con la lógica en `server/`.
- Base de datos: Firebase (Firestore). El servidor usa `firebase-admin`; el navegador solo lee.
- Flujo: `public/evento.html` → `POST /api/crear-pago` → Mercado Pago → aviso a `POST /api/mp-webhook` (confirma la venta) → el comprador vuelve a `public/confirmacion.html`, que consulta `POST /api/venta`.
- Panel: `admin/*.html`. Reglas comunes en `shared/ventas-utils.js`.

## 2. Dónde está el estado (leer en este orden)

1. `CLAUDE.md` (reglas del proyecto).
2. Este archivo.
3. `openspec/changes/pagos-mercadopago/tasks.md`: qué tareas están marcadas `[x]` y cuáles no (y por qué).
4. `openspec/changes/pagos-mercadopago/registro-automatico.md`: una entrada por tarea, con decisiones, hallazgos, pruebas y pendientes. **Es la memoria del trabajo.**
5. `design.md` y `specs/` (el diseño y los requisitos).

## 3. Reglas obligatorias

- Español simple. Cambios chicos, de a uno. Explicar qué es y por qué antes de usar algo nuevo.
- **Preguntar antes de** crear carpetas de otro tipo, borrar, mover o **instalar** algo. No cambiar de tecnología.
- **Nunca** leer ni mostrar claves, archivos `.env` ni claves de cuenta de servicio (`firebase-adminsdk`). Si hace falta una, avisar a la persona. No pegar valores secretos en el chat, en archivos ni en commits. El repo es **público**: tampoco rutas personales ni datos de cuentas.
- No inventar: si algo no se verificó, decir "no verificado".
- **Probar antes de decir "listo".** Correr `node pruebas/ejecutar-todas.js` (13 archivos, 392 casos, todo simulado, sin instalar nada). Decir qué se verificó y cómo.
- Una tarea = un commit, en español, con el mensaje que empieza por `tarea N.N:`. Se deshace con `git log --oneline --grep "tarea 4.3"` y `git revert <hash>`.
- Antes de cada commit: `git status` y revisar lo que está en staging (`git diff --cached`). `git add` de archivos concretos, nunca `git add .`.
- **Git:** trabajar solo en la rama `auto/pagos-mercadopago`. **Nunca** `git push` a `main`, nunca `--force`, nunca borrar ramas remotas. **Antes de cada push** mirar `git log origin/auto/pagos-mercadopago..HEAD --oneline`: un push envía **todos** los commits locales pendientes, no solo el último (ya pasó una vez por error).
- Cambios que ve el público (`public/*.html`) o el panel (`admin/*.html`): dejarlos como commit local hasta que la persona lo apruebe.
- Marcar una tarea `[x]` solo si su criterio de verificación se cumplió de verdad. Si el criterio pide el sitio desplegado, Mercado Pago real o Firestore real, **no se marca**: se deja sin marcar y se anota por qué en el registro.
- No hacer las tareas marcadas **(Usuario)**, ni pruebas en producción, ni publicar reglas de Firestore, ni tocar variables de Vercel.
- Cada hallazgo o decisión nueva se anota en `registro-automatico.md`.

## 3 bis. Revisión

Antes de cada commit, alguien (otra IA o la persona) debe revisar el diff en staging buscando: secretos, rutas personales, datos del comprador escritos sin escapar en HTML (XSS), cifras de dinero que no cuenten solo ventas `confirmada`, y que nada del navegador pueda cambiar precio, stock o estado.

## 4. Estado actual

Hecho y probado de forma simulada (392 casos): firma del aviso, consulta del pago, comparación con la venta, confirmación en transacción, estados, avisos repetidos y simultáneos, última entrada, `/api/venta`, pantalla de compra, pantalla de confirmación, panel de ventas/dashboard/reportes/panel global.

**Tareas sin marcar y por qué** (todas esperan una prueba real): 3.2, 3.3, 3.5, 4.2, 4.4, 5.1, 5.3, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3 y toda la sección 9. Las secciones 10.x también están pendientes.

Nunca se probó contra Mercado Pago real ni contra Firestore real. Eso es lo que falta.

## 5. Lo que sigue (en orden)

1. **La persona** decide si se hace el merge de la rama a `main` (despliega a producción en modo de prueba). El pull request está abierto como borrador. Las pruebas de pago se hacen en producción, en una ventana de incógnito (las vistas previas de Vercel no tienen las variables secretas ni los dominios autorizados).
2. **La persona** hace la sección 9 con las tarjetas de prueba de Mercado Pago (9.1 a 9.9). Después se marcan las tareas que corresponda, anotando lo observado.
3. Lo que puede hacer una IA sin la persona:
   - **10.1** preparar el texto final de las reglas de Firestore para `ventas` y `eventos` y mostrarlo (no publicarlo).
   - **10.5** actualizar `CLAUDE.md`: estructura con `api/`, `server/`, `shared/ventas-utils.js` y `pruebas/`, el flujo de pagos, los **nombres** de las variables de entorno (sin valores) y el rol `organizacion`. Hoy `CLAUDE.md` todavía dice que no hay pruebas automatizadas.
   - Revisar y arreglar lo anotado en "Visto y no tocado" del registro (ver punto 6), en cambios aparte.
4. **10.2** decidir con la persona qué hacer con el validador de entradas (`validador.html`, escribe `usado` desde el navegador): al publicar las reglas deja de funcionar.
5. **La persona** publica las reglas (10.3); después se prueban (10.4), se borran las ventas de prueba (10.6) y se hace la revisión final (10.7). Recién ahí se archiva el change.

## 6. Pendientes y riesgos conocidos

- **Pedidos nuevos de la persona, TODAVÍA SIN DISEÑAR (2026-10-22).** Se hacen como un **change nuevo de OpenSpec** (explorar, proponer, planificar, implementar), no como parche de este. Antes hay que preguntarle los números y decisiones de negocio:
  0. **Respuestas de la persona (2026-10-22):** (a) el dinero de las entradas entra a la cuenta de la empresa de tickets y, cuando se haga el conteo total, se le entrega a cada organizador la parte que le corresponde (reparto manual, fuera del sistema); (b) el porcentaje de la comisión se acuerda con cada organizador, así que **la página debe tener un apartado, o una opción dentro de una sección del panel, para editar esos porcentajes y datos similares**; (c) quiere probar primero que Mercado Pago de prueba funcione y que **las demás formas de pago también funcionen**. Sigue sin definir si la comisión es un porcentaje, un monto fijo o por tramos, y si las cuotas las maneja Mercado Pago o una tabla propia: conviene resolver lo segundo mirando qué pasa en una prueba real con cuotas (comparar `transaction_amount` con `total_paid_amount` del pago).
  1. **Comisión por usar la página:** un cargo que se suma al precio de la entrada que paga el comprador y que se queda la persona dueña del sitio; depende de lo que cuesta la entrada (porcentaje, monto fijo o tramos: por definir). Habría que guardarlo aparte en la venta (subtotal de entradas, cargo por servicio y total) y mostrarlo en el panel separado, porque a los organizadores les corresponde solo el subtotal de las entradas. Hoy todo el dinero entra a una sola cuenta de Mercado Pago (la de la persona) y no hay reparto automático a organizadores (eso requeriría conectar cada organizador con OAuth y usar `marketplace_fee`).
  2. **Tarjetas de crédito y débito "con sus recargos":** en el sitio viejo (simulado) crédito tenía 3 cuotas +10%, 6 cuotas +20%, 12 cuotas +35%, y débito no tenía recargo. Hoy crédito, débito, prepaga y dinero en cuenta se pagan **en la página de Mercado Pago**, que maneja las cuotas y su costo. Opciones: (A) dejar las cuotas a Mercado Pago, simple y seguro; (B) tabla propia de recargos, que obligaría a elegir las cuotas en nuestro sitio, fijar las cuotas en la preferencia y configurar "cuotas sin interés" en la cuenta de Mercado Pago para no cobrar interés doble. **Lo que hace Mercado Pago en Argentina con el interés de las cuotas no está verificado:** hay que confirmarlo en su documentación o con una prueba real.
  3. **Otras formas de pago:** la persona dice que no recuerda haber aprobado quitar billeteras y transferencia; solo confirmó que quitar el **efectivo** está bien. En `proposal.md` figura que se eliminaron del navegador el formulario de tarjetas, billeteras, efectivo y recargos. Las tarjetas no se pueden pedir en nuestro sitio (seguridad): se cargan en Mercado Pago. Las billeteras Ualá/Brubank del sitio viejo eran simuladas y Mercado Pago no las ofrece; lo que ofrece es lo que devuelve `GET /v1/payment_methods` en su cuenta (crédito, débito, prepaga y dinero en cuenta).
- **Reglas de Firestore sin publicar:** hasta publicarlas, el navegador todavía puede escribir en `ventas` y `eventos` desde la consola. Es el riesgo de seguridad más importante que queda.
- **Sin límite de consultas** en `/api/venta`, `/api/crear-pago` y `/api/mp-webhook`: configurarlo en Vercel (Firewall / rate limit). Lo hace la persona.
- **HTML sin escapar con datos del organizador** (nombre, lugar, descripción del evento): `public/evento.html` (`renderEvento`, `renderLotes`), `admin/dashboard.html` y `admin/superadmin.html`. Corregir en un cambio aparte usando `escaparHtml` de `shared/ventas-utils.js`.
- `admin/reportes.html`: la columna Fecha de la tabla de transacciones imprime `[object Object]`.
- El tiempo máximo de las funciones en Vercel (el spec pide responder a Mercado Pago en menos de 22 segundos) no está configurado ni verificado.
- Puntos abiertos del diseño a confirmar con el primer pago real (tarea 9.9): si el enlace de pago es `init_point` o `sandbox_init_point`, el campo del monto, y si `data.id` va en minúsculas en la firma.
- Los correos con tilde o apóstrofe se rechazan a propósito (seguridad).
- Las compras viejas (de antes de este change) no tienen token: no se pueden abrir con el enlace nuevo.

## 8. Seguir con otra IA a través de OmniRoute (cuando se acaba la cuota de Claude)

OmniRoute es un puente local que permite usar otros proveedores de IA (varios gratuitos). **No toma el control solo**: cuando la cuota de Claude se acaba, la persona tiene que abrir una **sesión nueva** con otro modelo. Esa sesión no tiene la conversación anterior: por eso existe este documento. Según el README del proyecto OmniRoute (no probado aquí).

**Una sola vez (lo hace la persona, porque lleva claves):**
1. En una terminal: `omniroute setup` y seguir el asistente para conectar uno o más proveedores. **Las claves las escribe la persona en el asistente; nunca en el chat ni en un archivo del repositorio.**

**Cada vez que haya que continuar:**
2. Abrir una terminal en la carpeta del proyecto (la raíz, donde está `CLAUDE.md`).
3. Ejecutar `omniroute run claude --model <proveedor/modelo>` (el README da como ejemplo `omniroute run claude --model openai/gpt-5.4`; el nombre exacto depende de lo que se haya conectado, y se ve con `omniroute models`). Eso abre Claude Code usando el modelo elegido.
4. Pegarle este texto como primer mensaje:

> Estoy retomando un trabajo que otra IA dejó a medias. Leé primero `CLAUDE.md` y después `openspec/changes/pagos-mercadopago/traspaso.md`, y seguí ESAS REGLAS AL PIE DE LA LETRA. Después leé `tasks.md` y las últimas entradas de `registro-automatico.md`, corré `node pruebas/ejecutar-todas.js` y recién ahí decime en español simple qué vas a hacer. No hagas push, no toques `main`, no leas claves ni archivos `.env`, y preguntame antes de instalar o borrar algo. Hacé una sola tarea por vez y anotá todo en el registro.

**Precauciones al usar proveedores gratuitos:**
- Reciben el código y los mensajes de la conversación. **No pegar claves, tokens ni datos de compradores.** Si una tarea las necesita, no hacerla por este camino.
- La calidad cambia según el modelo: revisar con más cuidado cada cambio, correr las pruebas siempre y no marcar tareas sin que el criterio se cumpla.
- Si el agente `revisor` o los complementos de seguridad de Claude no están disponibles en esa sesión, revisar el diff en staging a mano (punto 3 bis).
- Mientras haya cuota de Claude, conviene seguir con Claude: hace falta menos supervisión.

## 7. Cómo retomar paso a paso

1. Leer los archivos del punto 2.
2. `git status` y `git log --oneline -8`: confirmar la rama y que no haya cambios sin entender.
3. `node pruebas/ejecutar-todas.js`: tiene que dar todo en verde antes de tocar nada.
4. Elegir **una** tarea del punto 5. Leer su spec y el código que toca. Imitar el estilo existente (comentarios en español, funciones puras donde se pueda, nada de dependencias nuevas).
5. Hacer el cambio más chico que la cumple y probarlo. Si cambia comportamiento, agregar o ajustar casos en `pruebas/`.
6. Anotar en `registro-automatico.md`, marcar `tasks.md` si corresponde, revisar el diff, commit local, y recién ahí decidir el push (punto 3).
7. Al terminar, resumir en pocas líneas: qué cambió, qué se verificó, qué falta y qué necesita decidir la persona.
