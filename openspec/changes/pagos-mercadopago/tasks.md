# Tasks

Las tareas marcadas **(Usuario)** las hace la persona dueña del proyecto en las consolas de Mercado Pago, Google Cloud, Vercel o Firebase. Ningún valor secreto se pega en el chat ni se guarda en el repositorio. Los pagos se prueban en la URL de producción, en una ventana de incógnito.

## 1. Protección de secretos y configuración externa

- [x] 1.1 Agregar al `.gitignore` el bloque para claves de cuentas de servicio (un comentario, `*-????????????.json`, `*service-account*.json` y `.secrets/`). Se comprueba con `git check-ignore -v ejemplo-0123456789ab.json` y `git check-ignore -v mi-service-account.json`, que deben mostrar la regla, y con `git check-ignore -v vercel.json`, que no debe mostrar nada.
- [x] 1.2 Crear una etiqueta local de git (por ejemplo `antes-de-pagos`) en el estado actual como punto de retorno. Se comprueba con `git tag --list`, que debe mostrarla.
- [x] 1.3 **(Usuario)** En Mercado Pago, copiar el Access Token de prueba y configurar Webhooks en modo de prueba con la URL `https://evently-ctes-app.vercel.app/api/mp-webhook` y el evento "Pagos"; guardar la clave secreta que se genera. Se comprueba cuando el usuario confirma que en el panel aparece la URL de prueba con el evento Pagos y que ya tiene ambos valores guardados fuera del chat.
- [x] 1.4 **(Usuario)** En Google Cloud, crear la cuenta de servicio `evently-pagos-server` con el rol *Cloud Datastore User* y generar su clave JSON, guardada **fuera** de la carpeta del proyecto. Se comprueba en IAM: la cuenta tiene un solo rol, y el archivo de la clave no está dentro de `Evently.app`.
- [x] 1.5 **(Usuario)** En Vercel (Settings → Environment Variables), cargar para Production las 6 variables: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` y `SITE_URL` (`https://evently-ctes-app.vercel.app`), marcando las secretas como Sensitive. Se comprueba cuando Vercel lista los 6 nombres con los valores ocultos.

## 2. Base del servidor

- [x] 2.1 Crear el `package.json` de la raíz con la dependencia `firebase-admin` y generar el `package-lock.json`. Se comprueba con `npm ls firebase-admin`, que muestra la versión instalada, y con `git status`, que ofrece solo `package.json` y `package-lock.json` (nunca `node_modules`).
- [x] 2.2 Crear la carpeta `server/` con la lectura de variables de entorno y las constantes (30 minutos, máximo 10 entradas), de modo que si falta alguna variable se genere un error de configuración claro. Se comprueba ejecutando con `node -e` el módulo sin variables definidas: debe lanzar el error de configuración y no usar valores por defecto.
- [x] 2.3 Agregar en `server/` el inicio único de `firebase-admin` con la cuenta de servicio (convirtiendo los `\n` escapados de la clave). Se comprueba revisando que nunca se imprima la clave en los registros, y más adelante con la primera lectura real de Firestore (tarea 5.1).

## 3. Función `/api/crear-pago`

- [x] 3.1 Validar el pedido (nombre, apellido, correo con formato válido, cantidad entera de 1 a 10, evento y lote) ignorando cualquier precio o estado que llegue. Se comprueba con `node -e` y una lista de casos: datos correctos pasan; falta de nombre, correo inválido, cantidad 0, 11 o 2,5 fallan con un mensaje que indica qué corregir.
- [ ] 3.2 Leer el evento en Firestore, comprobar que esté publicado y que el lote exista, y calcular precio y stock disponible (capacidad menos vendidas). Se comprueba tras desplegar, llamando a la función con un evento inexistente, uno sin publicar y una cantidad mayor que la disponible: cada caso devuelve su error y no aparece ninguna venta nueva en Firestore.
- [ ] 3.3 Crear la venta `pendiente` con token aleatorio, vencimiento a 30 minutos, monto calculado por el servidor y entradas vacías. Se comprueba en la consola de Firestore: el documento tiene los campos esperados, el monto coincide con el precio del lote por la cantidad, y el token tiene al menos 32 caracteres.
- [x] 3.4 Consultar una sola vez `GET /v1/payment_methods` con el Access Token de prueba para confirmar los identificadores de tipo de pago a excluir, y anotar la lista final en `design.md`. Se comprueba cuando la lista anotada excluye solo el efectivo (`ticket`) y permite crédito, débito, prepagas y dinero en cuenta.
- [ ] 3.5 Crear la preferencia en Mercado Pago (ítem con el total, `external_reference` con el id de la venta, tres `back_urls` a `confirmacion.html?id=…&t=…`, `auto_return` aprobado, aviso a `/api/mp-webhook`, vencimiento a 30 minutos y métodos excluidos) y devolver el enlace de pago. Se comprueba abriendo el enlace en incógnito: aparece la página de Mercado Pago con el monto correcto y sin opción de efectivo.
- [x] 3.6 Si Mercado Pago falla, marcar la venta `rechazada` con motivo `error_mercado_pago` y devolver un mensaje para reintentar. Se comprueba con `node -e` simulando una respuesta de error de Mercado Pago: la venta queda rechazada y la respuesta no incluye detalles internos ni claves.

## 4. Función `/api/mp-webhook`

- [x] 4.1 Verificar la firma del aviso (texto `id:…;request-id:…;ts:…;`, HMAC-SHA256 en hexadecimal, comparación de tiempo constante) y responder 401 si falla. Se comprueba con `node -e`: una firma armada a mano con una clave de ejemplo pasa, y la misma con un carácter cambiado, sin `ts` o sin `v1` falla.
- [ ] 4.2 Ignorar con un 200 los avisos que no sean de pagos, y para los de pagos consultar `GET /v1/payments/{id}`. Se comprueba desde el panel de Mercado Pago con "Simular notificación" y un id inexistente: la función no cambia ninguna venta y responde sin romperse.
- [x] 4.3 Comparar el pago con la venta (`external_reference`, moneda ARS, monto con tolerancia de un centavo) y registrar el motivo si no coincide. Se comprueba con `node -e` y pagos de ejemplo: monto distinto, moneda distinta y venta inexistente no confirman nada.
- [ ] 4.4 Confirmar la venta en una transacción: estado `confirmada`, suma de vendidas al lote, método de pago real (Crédito, Débito, Prepaga o Dinero en cuenta), entradas con códigos aleatorios distintos y `mpPaymentId`. Se comprueba con la prueba completa de la tarea 9.1.
- [ ] 4.5 Manejar los demás casos: pendiente o en proceso se queda `pendiente`; rechazado o cancelado pasa a `rechazada` con motivo; una `rechazada` pasa a `confirmada` si llega un aprobado y hay stock; una `confirmada` no cambia; sin stock queda `rechazada` con `sin_stock` y `requiereReembolso`. Se comprueba con `node -e` y una tabla de casos sobre la función que decide el estado.
- [ ] 4.6 Hacer la confirmación segura ante avisos repetidos y responder 500 en errores temporales para que Mercado Pago reintente. Se comprueba con `node -e`: procesar dos veces el mismo pago aprobado deja una sola confirmación, y un error simulado de base de datos devuelve 500 sin dejar la venta a medias.

## 5. Función `/api/venta`

- [ ] 5.1 Consultar una venta con su id y su token, devolviendo el mismo mensaje de "no encontrada" si el token es incorrecto o la venta no existe. Se comprueba llamando la función con un token equivocado y con un id inventado: ambas respuestas son idénticas, y con los datos correctos devuelve la venta (también valida la conexión a Firestore de la tarea 2.3).
- [ ] 5.2 Devolver estado, motivo, datos del evento, lote, cantidad y monto, y las entradas solo si la venta está `confirmada`, sin token ni identificadores internos de pago. Se comprueba con una venta pendiente y una confirmada de prueba: la pendiente no trae códigos y la confirmada trae uno por entrada.
- [ ] 5.3 Pasar a `rechazada` con motivo `vencida` una venta pendiente cuyo vencimiento ya pasó, al consultarla. Se comprueba cambiando a mano `venceEn` de una venta de prueba a una hora pasada en la consola de Firestore: la consulta devuelve `rechazada` y el documento queda actualizado.

## 6. Pantalla de compra (`public/evento.html`)

- [ ] 6.1 Reemplazar el paso 2 por nombre, apellido, correo, resumen de la compra, aviso visible de modo de prueba y un botón "Pagar con Mercado Pago". Se comprueba abriendo un evento: no hay campos de tarjeta, billetera ni efectivo.
- [ ] 6.2 Llamar a `/api/crear-pago`, mostrar los errores en pantalla en lugar de `alert()`, deshabilitar el botón mientras se procesa y redirigir al enlace de pago. Se comprueba con un correo inválido y con más entradas que las disponibles: aparece el mensaje en pantalla, y con datos válidos el navegador va a Mercado Pago.
- [ ] 6.3 Eliminar de `evento.html` la creación de la venta, el descuento de stock, los recargos y el correo fijo. Se comprueba con una búsqueda de texto en el archivo: no aparecen `addDoc`, `updateDoc`, `sin-correo@evently.com` ni `serverTimestamp`.

## 7. Pantalla de confirmación (`public/confirmacion.html`)

- [ ] 7.1 Reescribir la carga para usar `/api/venta` con el id y el token de la dirección, sin leer Firestore, y volver a consultar cada 3 segundos hasta 2 minutos mientras esté `pendiente`. Se comprueba abriendo la pantalla con un enlace sin token o con otro token: muestra "compra no encontrada", y con una compra pendiente de prueba se actualiza sola.
- [ ] 7.2 Mostrar mensajes según el estado, un código QR por cada entrada cuando está `confirmada`, y el motivo con un botón para volver a intentar cuando está `rechazada`. Se comprueba con una compra confirmada de 3 entradas (3 QR distintos), una rechazada (motivo y botón) y una pendiente (sin QR).
- [ ] 7.3 Quitar el CBU falso, el botón "Descargar PDF" falso y la lectura de Firestore, e indicar al comprador que guarde el enlace de la compra. Se comprueba con una búsqueda de texto: no aparecen `CBU`, `pagos@evently.com` ni `getDoc`, y la pantalla confirmada muestra la indicación de guardar el enlace.

## 8. Panel de ventas

- [ ] 8.1 En `admin/ventas.html`: cambiar el filtro y el estilo de "anulada" por "rechazada", quitar el botón "Confirmar pago" y la llamada que actualiza la venta, mostrar el motivo en lenguaje simple, el aviso de reembolso pendiente y el nombre y correo reales. Se comprueba con ventas de prueba de cada estado: los filtros funcionan, el detalle de una pendiente no tiene botón de confirmar y la venta `sin_stock` muestra el aviso.
- [ ] 8.2 En `admin/dashboard.html` y en `admin/ventas.html`: contar recaudación y entradas vendidas solo de ventas confirmadas, y mostrar las pendientes aparte como "pendientes de pago". Se comprueba con un evento de prueba con 2 confirmadas, 1 pendiente y 1 rechazada: las cifras suman solo las 2 confirmadas.
- [ ] 8.3 En `admin/reportes.html` y `admin/superadmin.html`: aplicar el mismo criterio de solo ventas confirmadas en las cifras de dinero y de entradas. Se comprueba con el mismo evento de prueba: los totales coinciden con los del Dashboard.

## 9. Pruebas completas con Mercado Pago (producción, incógnito)

- [ ] 9.1 Compra aprobada: titular `APRO` con la Visa de prueba (`4509 9535 6623 3704`, CVV 123, vence 11/30). Se comprueba que se vuelve a `confirmacion.html` con estado confirmada y un QR por entrada, que en Firestore la venta está `confirmada` con entradas y método Crédito, y que las vendidas del lote subieron.
- [ ] 9.2 Compra rechazada: titulares `OTHE` y `FUND`. Se comprueba que la venta queda `rechazada` con motivo, que el stock no cambia y que el botón de reintentar lleva de nuevo al evento.
- [ ] 9.3 Compra pendiente: titular `CONT`. Se comprueba que la venta sigue `pendiente`, que la pantalla lo explica y que no hay entradas.
- [ ] 9.4 Pago con dinero en cuenta usando la cuenta de comprador de prueba. Se comprueba que la venta queda confirmada con método "Dinero en cuenta".
- [ ] 9.5 Precio manipulado: desde la consola del navegador, enviar a `/api/crear-pago` un precio distinto. Se comprueba que la venta guarda el precio real del lote.
- [ ] 9.6 Última entrada: con un lote de 1 entrada, abrir dos compras, pagar ambas y observar. Se comprueba que una queda `confirmada` y la otra `rechazada` con `sin_stock` y `requiereReembolso`, y que el lote no vendió de más.
- [ ] 9.7 Aviso repetido: reenviar el aviso de un pago aprobado desde el panel de Mercado Pago. Se comprueba que no cambian las entradas ni el stock.
- [ ] 9.8 Vencimiento: dejar una compra pendiente más de 30 minutos y abrir su enlace. Se comprueba que aparece `rechazada` con motivo `vencida`.
- [ ] 9.9 Confirmar o ajustar los puntos abiertos del diseño con lo observado (`init_point` o `sandbox_init_point`, campo del monto, regla de `data.id`) y anotar el resultado en `design.md`. Se comprueba cuando `design.md` no tiene preguntas abiertas.

## 10. Reglas de Firestore, documentación y cierre

- [ ] 10.1 Preparar el texto final de las reglas de `ventas` y `eventos` según el diseño y mostrarlo al usuario antes de publicarlo. Se comprueba cuando el usuario aprueba el texto.
- [ ] 10.2 Decidir con el usuario qué hacer con el validador antes de publicar las reglas, porque con ellas deja de funcionar: publicarlas igual, o esperar al change del validador. Se comprueba cuando la decisión queda anotada en este archivo.
- [ ] 10.3 **(Usuario)** Copiar las reglas actuales a un archivo local fuera del repositorio y publicar las nuevas en la consola de Firebase. Se comprueba en el historial de reglas de la consola: aparecen las dos versiones.
- [ ] 10.4 Probar las reglas nuevas: en el simulador de reglas y en la consola del navegador, crear o modificar una venta y modificar el stock de un evento debe fallar; un visitante sin sesión no puede leer `ventas`. Se comprueba además que la compra aprobada de prueba sigue funcionando completa y que un superadmin y una organización siguen viendo Ventas, Dashboard y Reportes.
- [ ] 10.5 Actualizar `CLAUDE.md`: estructura con `api/` y `server/`, el flujo de pagos, los nombres de las variables de entorno (sin valores) y el rol `organizacion`. Se comprueba leyendo el archivo: no contiene ningún valor secreto, dominio de cuenta ni ruta personal.
- [ ] 10.6 Borrar de la consola de Firestore las ventas de prueba que ya no hagan falta. Se comprueba mirando la colección `ventas`: quedan solo las que el usuario quiere conservar.
- [ ] 10.7 Revisión final del repositorio. Se comprueba con `git status` y `git diff --stat`: ningún archivo con claves, tokens ni `.env`, y solo los archivos previstos en el change.

## Workflow follow-up

- Un commit local chico por grupo de tareas, mostrando `git status` y los archivos antes de cada commit. El push solo con aprobación explícita del usuario.
- Archivar el change cuando las pruebas de la sección 9 estén completas y el usuario lo apruebe.
- Después de archivar: crear el change del validador (autenticación y escritura por el servidor) y, si hay tiempo, el de aislamiento de ventas por organización.
