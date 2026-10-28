# Proposal

## Why

Pedido 17 de la persona (28/10): para admin y superadmin, la información tiene que verse en porcentajes claros y estéticos
(hoy hay solo cifras sueltas y se confunden), y Reportes, Ventas y Finanzas (balance y liquidaciones) tienen que poder
descargarse en CSV y PDF con una salida profesional, ordenada y clara. Ventas se actualiza en tiempo real.

## What Changes

- **Panel "En porcentajes"** (`shared/porcentajes.js`, prueba 40) en Resumen y en Reportes (pestaña Resumen general):
  ocupación (anillo), estado de las compras (confirmadas, pendientes, rechazadas o vencidas), entradas por lote,
  recaudación por lote y formas de pago, con barras de colores. Salen de las ventas confirmadas (el estado, de todas) con la
  misma regla de ingreso que las tarjetas (`subtotal`, sin costo de servicio). En Reportes respeta el lote y el método elegidos.
- **Descargas** (`shared/exportar.js`, prueba 41): CSV para Excel (punto y coma, BOM, celdas protegidas contra fórmulas,
  fechas en hora argentina) y PDF con encabezado de Evently, filtros, tarjetas, tablas con total y pie © 2026 (html2pdf,
  la misma librería que ya usaba Reportes).
  - Reportes: "Descargar CSV" (una fila por compra confirmada de lo elegido); el PDF de siempre pasa a decir © 2026.
  - Ventas: "Descargar CSV" y "Descargar PDF" de lo que se ve con los filtros; el archivo dice la hora de los datos.
  - Finanzas: balance (CSV y PDF: totales, por período y por organización) y liquidaciones (CSV de siempre y PDF por organización).
- Pruebas 13 y 27 ajustadas a lo nuevo.

## Fuera de alcance

- Gráficos dentro del PDF (van tablas y porcentajes).
