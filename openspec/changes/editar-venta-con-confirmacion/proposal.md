# Proposal

## Why

Pedidos 15 y 16 de la persona (28/10, tras probar la vista previa):
- Un evento suspendido debe mostrarle al comprador un mensaje amable de mantenimiento ("en un rato se puede seguir
  comprando"), no un texto seco.
- Al editar, quiere pasar de lotes a entrada única aunque el evento tenga varios lotes (su evento no tiene ventas), con un
  paso de confirmación al cambiar la forma de venta (en los dos sentidos) y la contraseña del login al guardar.

## What Changes

- **Evento suspendido (sitio)**: `public/evento.html` muestra "Estamos preparando todo para vos" con el aviso de
  mantenimiento y un botón a los demás eventos; los pasos de compra no se ven. Para un evento eliminado, el mensaje es "Este evento ya no está
  disponible". El servidor (`server/compra.js`) responde con el mismo mensaje amable si alguien intenta pagar uno suspendido.
- **Varios lotes → entrada única** (`shared/forma-de-venta.js`, prueba 39): se puede si los lotes que se quitan (todos menos
  el primero) no tienen ventas confirmadas ni pagos en curso, ni `vendidas` > 0. Queda el primer lote, con su nombre y lo
  vendido. Si no se puede, el aviso nombra los lotes con ventas. Si no se pudieron leer las ventas, queda bloqueado.
- **Confirmación** al cambiar la forma de venta en Editar evento (los dos sentidos), explicando qué pasa con lo vendido.
  Cancelar vuelve a la forma anterior.
- Antes de guardar se vuelven a revisar las ventas (por si alguien empezó a pagar en un lote que se quita).
- **Contraseña al guardar** un evento editado: ventana propia (sin `prompt`) y `reauthenticateWithCredential` de Firebase.
  Con la contraseña mal no se guarda nada. Crear evento no la pide.
- La transacción de guardado acepta quitar los lotes de atrás solo al pasar a entrada única y si no tienen `vendidas`.

## Fuera de alcance

- Quitar lotes con ventas (rompería la confirmación de esas ventas).
