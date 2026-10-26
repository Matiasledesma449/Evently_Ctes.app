# Proposal

## Why

La persona pasó capturas de All Access (2026-10-26) y pidió que el sitio del comprador se vea "más o menos así": un Centro de ayuda con una portada grande, buscador y tarjetas por tema; un bloque "Contactate con nosotros" con un formulario de solicitud más completo; páginas de Términos y condiciones y de Política de privacidad; el arrepentimiento de compra; y el mapa del lugar con un botón "Abrir en Maps".

## What Changes

- **Centro de ayuda** (`public/soporte.html`), con el violeta de Evently:
  - Portada oscura en violeta con la etiqueta "Bienvenido/a a nuestro Centro de ayuda", el título "¿Cómo podemos ayudarte?", el buscador con botón "Buscar" y, al costado, una tarjeta con las preguntas más leídas.
  - Tarjetas por tema (Cómo comprar, Pagos, Mi entrada, Anulaciones y cambios, Reprogramaciones y cancelaciones, Arrepentimiento de compra), cada una con su ícono y una frase. Tocar una lleva a sus preguntas.
  - Bloque "Contactate con nosotros" con el botón "Enviar una solicitud".
  - Formulario "Enviar una solicitud": correo, asunto, nombre y apellido, DNI (opcional), evento (opcional), número de compra (opcional) y descripción.
- **Términos y condiciones** (`public/terminos.html`) y **Política de privacidad** (`public/privacidad.html`): franja violeta arriba con el título y el texto en una tarjeta blanca. Los textos son **propios de Evently** (no se copian los de All Access) y dicen solo lo que el sitio hace. Los datos de la empresa (razón social, CUIT, domicilio, correo legal) quedan marcados "A COMPLETAR" y la página avisa que es un borrador a revisar.
- **Arrepentimiento de compra** (`public/arrepentimiento.html`): explica el derecho (10 días corridos) y tiene un formulario (correo, nombre, DNI, número de compra, motivo opcional). Al enviarlo muestra un **código de gestión**.
- **Pie común**: suma "Términos y condiciones", "Política de privacidad" y "Botón de arrepentimiento" en todas las páginas del comprador.
- **Página del evento**: en "Dónde es", un botón "Abrir en Maps" que abre el lugar en Google Maps en otra pestaña.
- **Confirmación de compra**: muestra el **número de compra**, para poder citarlo en una solicitud o en el arrepentimiento.

## Capabilities

### New Capabilities
- `centro-de-ayuda-estilo-all-access`: portada, tarjetas por tema, contacto y formulario de solicitud.
- `paginas-legales`: términos, privacidad y arrepentimiento, y sus links en el pie.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- Archivos adjuntos en la solicitud: necesitan Firebase Storage, que pide plan de pago.
- Botón de WhatsApp: no hay un número confirmado.
- Puntos de venta físicos: Evently vende solo en línea.
- El reembolso del arrepentimiento: se gestiona a mano desde Mercado Pago, como hoy.

## Por qué estas opciones y no otras

- **Textos legales propios** y no copiados: los de All Access son de otra empresa (nombran su razón social y su CUIT). Se escriben con la misma estructura pero diciendo lo que hace Evently.
- **La solicitud y el arrepentimiento se guardan como una consulta pública más** (`consultas_publicas`), con los mismos campos de siempre y los datos nuevos dentro del texto del mensaje: así el superadmin los ve en la pestaña "Consultas públicas" y no hace falta cambiar las reglas de Firestore (no se sabe si aceptan campos nuevos).
- **Portada con fondo violeta y no con una foto**: no hay fotos propias con permiso de uso.

## Impact

- Se modifican `public/soporte.html`, `public/evento.html`, `public/confirmacion.html`, `shared/pie-publico.js`, `shared/preguntas-frecuentes.js` y sus pruebas (22 y 23).
- Se agregan `public/terminos.html`, `public/privacidad.html`, `public/arrepentimiento.html`, `shared/solicitud-de-ayuda.js` (arma el texto de la solicitud) y su prueba.
