# Proposal

## Why

Pendiente de seguridad (la persona pidió arreglarlo el 28/10): la regla de Firestore de `ventas` deja que cualquier cuenta
de organización lea las ventas de **todas** las organizaciones, con los datos de los compradores (nombre y correo).

## What Changes

- **Servidor** (`server/ventas.js`): cada venta nueva guarda `organizacionId`, el de su evento.
- **Panel** (`shared/consulta-ventas.js`): Resumen, Ventas, Reportes y Editar evento arman sus consultas de `ventas` con
  `consultaDeVentas`. Al superadmin real (también en "Ver como organización") no se le agrega nada; a una organización se le
  agrega `where('organizacionId', '==', <la suya>)`. Firestore lo exige: una regla no filtra, rechaza la consulta entera si
  no pide solo lo permitido.
- **Ventas que ya existen** (`herramientas/completar-organizacion-de-ventas.js`, prueba 43): les pone la organización de su
  evento. La corre la persona: primero vista previa, después `--aplicar` con frase de confirmación. Solo toca ese campo.
- **Regla de Firestore** (la publica la persona; texto en `regla-firestore.md`): una organización lee solo las ventas con
  su `organizacionId`; el superadmin, todas; nadie escribe desde el navegador (el servidor usa firebase-admin, que no pasa
  por las reglas).

## Orden para no cortar nada

1. Mergear a `main` (producción tiene que tener las consultas nuevas antes de la regla).
2. Correr la herramienta **enseguida** después del merge (vista previa y después `--aplicar`): mientras tanto, las
   organizaciones ven vacías sus ventas viejas. Se puede volver a correr para las ventas creadas entre medio.
3. Publicar la regla.

Si la regla se publica antes del merge, en producción las cuentas de organización dejan de ver ventas (el superadmin no se
afecta) hasta que se mergee.

## Fuera de alcance

- `validador.html` busca y marca entradas en `ventas` desde el navegador: con esta regla no puede escribir (ya pasaba con
  las reglas del 22/10, tarea 10.2 de pagos-mercadopago) y tampoco leer, porque su búsqueda no pide `organizacionId`.
  Validar entradas pasa al servidor en un change aparte.
- Si a un evento se le cambia la organización, sus ventas viejas quedan con la anterior hasta volver a correr la herramienta.
