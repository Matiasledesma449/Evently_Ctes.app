# Pruebas del servidor de pagos

Pruebas hechas con Node, sin instalar nada. No usan internet, ni Mercado Pago, ni Firestore real: todo es simulado.

## Cómo correrlas

Desde la raíz del proyecto:

```
node pruebas/ejecutar-todas.js
```

Muestra una línea por archivo (`PASO` o `FALLO`) y, si algo falla, las líneas que fallaron. También se puede correr un archivo suelto, por ejemplo `node pruebas/01-firma.js`.

## Qué cubre cada archivo

| Archivo | Qué prueba |
|---|---|
| `01-firma.js` | Verificación de la firma de los avisos de Mercado Pago |
| `02-aviso-y-consulta-del-pago.js` | Avisos que no son de pagos, firma inválida, consulta del pago |
| `03-comparar-pago-con-venta.js` | Comparación del pago con la venta (monto, moneda, referencia) |
| `04-aviso-con-venta.js` | La comparación dentro del flujo completo del aviso |
| `05-confirmar-venta.js` | Confirmación en una transacción: entradas, stock, método de pago |
| `06-decidir-estado.js` | Tabla de qué le pasa a la venta según el estado del pago |
| `07-avisos-repetidos-y-errores.js` | Avisos repetidos o simultáneos, última entrada, errores de la base de datos |
| `08-revision-y-pago-duplicado.js` | Venta marcada para revisión y pago duplicado |
| `09-consulta-de-compra.js` | `/api/venta`: token, datos que se devuelven, vencimiento |
| `10-pantalla-de-compra.js` | `public/evento.html` con un navegador simulado |

## Cómo funcionan por dentro

- `_ayuda-db-falsa.js` imita lo mínimo de Firestore que usa el servidor: documentos en memoria, transacciones y el bloqueo optimista (si dos transacciones tocan el mismo documento, una se repite). También reemplaza `firebase-admin` por un doble, así que no hace falta `npm install`.
- Los secretos que aparecen son de ejemplo (`secreto-de-ejemplo-no-real`).

## Qué NO prueban

Son simulaciones: no reemplazan las pruebas reales con Mercado Pago y Firestore de la sección 9 de `openspec/changes/pagos-mercadopago/tasks.md`.
