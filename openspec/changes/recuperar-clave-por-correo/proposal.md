# Proposal

## Why

Pedido 19 de la persona (28/10): en el login, "¿Olvidaste tu contraseña?" no mandaba nada. El formulario solo guardaba un
pedido en `solicitudes_password` para que alguien escribiera por WhatsApp a mano; no había ningún correo ni SMS.

## What Changes

- El formulario usa `sendPasswordResetEmail` de Firebase Authentication (ya incluido, gratis): Firebase manda el correo con
  el enlace para crear una contraseña nueva, en español (`auth.languageCode = 'es'`).
- El WhatsApp pasa a ser opcional: si se completa, también queda el pedido en `solicitudes_password` (se ve en Mensajes).
- Por seguridad, la respuesta es la misma tenga o no cuenta el correo. Se avisa revisar Spam y que el enlace vence en una hora.

## Fuera de alcance

- SMS al teléfono: necesita un servicio pago (por ejemplo, la verificación por teléfono de Firebase o Twilio).
- El remitente y el texto del correo se cambian en la consola de Firebase (Authentication → Plantillas); lo hace la persona.
