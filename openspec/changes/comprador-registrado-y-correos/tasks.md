# Tasks (se empiezan cuando la persona elija el servicio de correo)

- [ ] 0.1 La persona elige el servicio de correo (A recomendada) y carga la clave en Vercel.
- [ ] 1.1 Registro e inicio de sesión del comprador (Firebase Auth, rol `cliente`) y casilla de novedades.
- [ ] 1.2 `evento.html` pide sesión antes de pagar; `api/crear-pago` usa los datos de la cuenta y el correo como pagador.
- [ ] 2.1 `server/correos.js` (armado de los correos, con pruebas simuladas) y envío de la confirmación desde el webhook.
- [ ] 2.2 Entradas en PDF (o enlace a la compra) en el correo.
- [ ] 3.1 `api/recordatorios.js` + cron diario de Vercel (7 días antes y el mismo día), sin repetir envíos.
- [ ] 4.1 Página "Mis entradas" y reglas de Firestore para el cliente.
- [ ] 5.1 Probar: pruebas simuladas, compra real chica y correos de prueba.
