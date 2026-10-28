# Proposal

## Why

La persona probó otra vez la vista previa (2026-10-26, noche):
- "Agregar admin" falla con "No se pudo agregar el admin" (el mensaje no dice por qué). Quiere poner ella el correo y la clave del dueño de la productora.
- Un correo usado en dos organizaciones no debe pasar de una a otra.
- Quiere eliminar organizaciones (con un paso de confirmación) y poder recuperarlas si se borró sin querer.
- No todos los eventos usan lotes: quiere poder vender una entrada única (precio, cantidad y hasta qué fecha) sin que aparezca nada de lotes.
- Quiere sacar "Editar lotes" y la comisión de las tarjetas de Eventos.

## What Changes

1. **Agregar admin**: campo **Clave** (lo escribe el superadmin; si queda vacío, se genera una). La clave generada incluye un símbolo (proyectos de Firebase con política de contraseñas). Los errores de Firebase se muestran con su motivo (clave débil, correo ya usado, alta deshabilitada, sin conexión) y su código.
2. **Un correo, una organización**: si el correo ya es admin de otra organización, se avisa y **no** se mueve. Para pasarlo, primero se lo quita de la otra.
3. **Eliminar y recuperar organizaciones**: "Eliminar" pide confirmar en un cuadro. Se marca como eliminada (no se borra): desaparece de las listas y de los desplegables, y queda en "Organizaciones eliminadas" con **Recuperar**. Sus eventos y admins no cambian.
4. **Entrada única o con lotes** en Crear / Solicitar evento. Entrada única: precio, cantidad y "se vende hasta" (opcional). Se guarda como un solo lote "Entrada general" y el evento marca `ventaSimple: true`; en la compra no aparece "Elige un lote".
5. **Tarjetas de Eventos sin "Editar lotes" ni comisión** (el costo de servicio se elige al crear el evento).

## Impact

`admin/organizaciones.html`, `shared/cuentas-admin.js`, `admin/eventos-seleccion.html`, `admin/crear-evento-superadmin.js`, `shared/menu-admin.js`, `admin/aprobaciones.js`, `admin/eventos.html`, `public/evento.html`; se borra `admin/editar-lotes.js` (ya no se usa: con eso se pierde "Habilitar ahora", que el servidor sigue respetando si el campo existe). Pruebas 26 y 34 actualizadas.
