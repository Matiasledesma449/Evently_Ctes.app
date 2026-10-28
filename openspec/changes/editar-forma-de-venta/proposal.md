# Proposal

## Why

Pedido 12 de la persona (26/10, noche): al editar un evento, "¿Cómo se venden las entradas?" quedaba bloqueado. Quiere
poder pasar de entrada única a lotes y al revés. Cuidado: el servidor confirma cada venta por la posición y el nombre del
lote (server/confirmacion.js), así que un lote que ya existe no se puede borrar, mover ni renombrar.

## What Changes

- **Entrada única → con lotes**: siempre se puede. El lote de la entrada única queda primero, con su nombre fijo y sus
  vendidas; se agregan lotes nuevos al final.
- **Con lotes → entrada única**: solo si el evento tiene un solo lote. Ese lote pasa a ser la entrada única y conserva su
  nombre y sus vendidas. Con varios lotes, la opción queda deshabilitada con un aviso que explica por qué (habría que
  borrar lotes que pueden tener ventas).
- La transacción de guardado no cambia: sigue rechazando quitar o renombrar lotes y dejar menos lugares que los vendidos.

## Fuera de alcance

- Unir o borrar lotes con ventas.
