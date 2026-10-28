# Tasks (se empiezan cuando la persona elija el servicio de correo)

- [x] 0.1 La persona eligió Gmail (gratis, 500/día); migración a un servicio pago, más adelante.
- [x] 0.2 La persona crea la contraseña de aplicación de Gmail y la carga en Vercel (`GMAIL_USUARIO`, `GMAIL_CLAVE_APLICACION`).
- [ ] 1.1 Registro e inicio de sesión del comprador (Firebase Auth, rol `cliente`) y casilla de novedades.
- [ ] 1.2 `evento.html` pide sesión antes de pagar; `api/crear-pago` usa los datos de la cuenta y el correo como pagador.
- [x] 2.1 `server/correos.js` (nodemailer 10.2.1, prueba 44) y envío de la confirmación desde el webhook (sin repetir; si falla, la venta queda confirmada igual).
- [x] 2.1b Correo de prueba para el superadmin en Ojo de halcón (se sacó el 28/10: era solo para probar).
- [ ] 2.2 Entradas en PDF adjunto (hoy: botón a la página de la compra con los QR y los códigos en el correo).
- [ ] 3.1 `api/recordatorios.js` + cron diario de Vercel (7 días antes y el mismo día), sin repetir envíos.
- [ ] 4.1 Página "Mis entradas" y reglas de Firestore para el cliente.
- [ ] 5.1 Probar: pruebas simuladas, compra real chica y correos de prueba.
