# Proposal (plan, sin código todavía)

## Why

Pedido 23 de la persona (28/10): hoy, antes de pagar, el comprador escribe su nombre y su correo cada vez y no recibe nada
por correo. Quiere:
1. Que el comprador se **registre** (así ya tenemos su correo y se lo pasamos a Mercado Pago).
2. Mandarle por correo la **confirmación con sus entradas (PDF)**.
3. Avisarle de **otros eventos**.
4. **Recordatorios**: cuando falta una semana y el mismo día del evento. Todo con buenos textos.

## Lo que hace falta decidir (necesita el OK de la persona)

Evently no tiene hoy cómo mandar correos propios (Firebase solo manda los de contraseña). Hace falta un **servicio de
correo** nuevo, con su clave guardada en Vercel. Opciones:

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| **A. Resend** (recomendada) | Servicio de correo con API simple; se llama desde las funciones de `api/` con `fetch` (sin librerías nuevas) | 3.000 correos/mes gratis; muy fácil; buenos resultados de entrega | Para mandar desde "@evently..." hay que verificar un dominio propio; sin dominio, solo envía de prueba |
| B. Gmail con contraseña de aplicación | Mandar desde una cuenta de Gmail con `nodemailer` | Gratis; no necesita dominio | Librería nueva; límite de ~500 por día; cae más en Spam; si Google bloquea la cuenta, se corta todo |
| C. Brevo | Servicio de correo y de campañas | 300 por día gratis; trae lista de suscriptores y baja automática para las novedades | Más configuración; panel aparte |

Recordatorios: una **tarea programada de Vercel (cron)** que corre una vez por día (lo que permite el plan gratis), busca
los eventos que son en 7 días o ese mismo día y manda los correos.

## What Changes (con la opción A)

- **Registro del comprador** con Firebase Authentication (correo y contraseña, y opcional "Entrar con Google"), rol
  `cliente` en `usuarios`. Antes de pagar se pide iniciar sesión o registrarse; el nombre y el correo salen de la cuenta y se
  mandan a Mercado Pago como datos del pagador.
- **Casilla separada y sin marcar** "Quiero recibir novedades de otros eventos" (consentimiento aparte, como pide la Ley
  25.326 para publicidad); cada correo de novedades trae "Darme de baja".
- **Correo de confirmación** que manda el servidor cuando el webhook confirma la venta: resumen de la compra, una entrada
  en PDF por cada QR (o el enlace a la página de la compra) y datos del evento.
- **Recordatorios** (`api/recordatorios.js` + cron de Vercel): "Falta una semana" y "¡Hoy es el día!", con lugar, horario,
  mapa y entradas. Cada venta guarda qué recordatorios ya se mandaron, para no repetir.
- **Mis entradas**: página del comprador con sus compras.
- Textos de los correos cuidados (los escribo y la persona los aprueba).
- Reglas de Firestore: el cliente solo lee sus propias compras.

## Pasos de la persona (cuando se elija)

1. Crear la cuenta del servicio elegido y, si es Resend, verificar un dominio (o usar el modo de prueba para la presentación).
2. Cargar la clave en Vercel (variable de entorno) — Claude no toca las variables.
3. Activar "Entrar con Google" en la consola de Firebase si se quiere.

## Riesgos

- Toca el flujo de pago (crear-pago y webhook): se prueba con las pruebas simuladas de siempre y una compra real chica.
- Correos en Spam si no hay dominio verificado.
