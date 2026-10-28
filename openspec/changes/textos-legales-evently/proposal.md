# Proposal

## Why

Pedido 22 de la persona (28/10): para la presentación, los Términos y condiciones y la Política de privacidad tienen que
contar qué hace Evently para proteger y garantizar los datos de los usuarios, adecuados a lo que el sitio hace.

## What Changes

- **Política de privacidad** (`public/privacidad.html`): resumen "Nuestros compromisos"; qué datos se guardan (también de
  organizadores y validación en la entrada), sin datos sensibles; finalidades (correos de la compra como parte del servicio,
  novedades solo con permiso); con quién se comparten; cómo se cuidan (HTTPS, ventas solo desde el servidor, firma de los
  avisos de Mercado Pago, contraseña para cambios importantes, acceso por organización, claves en el servidor); derechos
  de la Ley 25.326 con sus plazos (acceso gratuito cada seis meses y respuesta en 10 días corridos; rectificación y
  supresión en 5 días hábiles) y la Agencia de Acceso a la Información Pública; almacenamiento en el navegador sin cookies de
  publicidad; menores; aviso de cambios.
- **Términos y condiciones** (`public/terminos.html`): Ley 24.240; responsabilidades de Evently y del organizador; precios en
  pesos y costo de servicio a la vista; QR de un solo uso; uso correcto del sitio; eventos en pausa, reprogramados o
  cancelados; admisión sin discriminar (Ley 26.370); arrepentimiento (Ley 24.240 art. 34 y Res. 424/2020); comunicaciones;
  disponibilidad del sitio; jurisdicción sin perjuicio del domicilio del consumidor.
- Se saca el cartel "Borrador"; queda la fecha de actualización. Siguen marcados en amarillo los datos de la empresa
  (razón social, CUIT, domicilio, correo, plazo de guarda, jurisdicción), que no se inventan.

## Corrección tras la revisión

Lo que todavía no existe (correos, que cada organizador vea solo sus ventas) se escribe en futuro ("vamos a"); no se
afirma que el navegador no pueda modificar ventas (el validador lo hace); la devolución por cancelación sigue la decide el
organizador (como antes); la supresión conserva solo lo que la ley obligue.

## Pendientes

- La regla de Firestore de `ventas` todavía deja leer ventas de otras organizaciones (pendiente de seguridad).
- Los correos de confirmación, entradas y recordatorios dependen del pedido 23 (servicio de correo).
- La condición "al menos 24 horas antes" del arrepentimiento (de antes, también en `arrepentimiento.html` y en las
  preguntas frecuentes) no figura en la Ley 24.240 ni en la Res. 424/2020: revisarla con un abogado.
- No se pudo confirmar en el Código Civil y Comercial si los eventos con fecha fija quedan fuera del arrepentimiento; el
  texto no lo afirma. Conviene que lo revise un abogado.
