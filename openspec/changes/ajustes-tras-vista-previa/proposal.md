# Proposal

## Why

La persona probó la vista previa del PR #37 (2026-10-26) y pidió corregir el sitio del comprador, las organizaciones, los lotes y el mapa. Además, el aviso "Modo de prueba: no se cobra dinero real" de la página del evento ya es falso: desde el 2026-10-22 Mercado Pago cobra de verdad.

## What Changes

### 1. Sitio del comprador: una sola estética
- **Cabecera común** en todas las páginas (inicio, evento, Centro de ayuda, términos, privacidad, arrepentimiento): logo "Evently" que siempre lleva al inicio, y a la derecha "Eventos" y "Centro de ayuda". Se quita el "Volver" suelto y el "Ayuda" desarticulado.
- **Misma paleta** en todas: fondo gris claro, tarjetas blancas, violeta de Evently. El Centro de ayuda deja la portada oscura y usa el violeta del resto.
- **Centro de ayuda ordenado**: tarjetas por tema arriba; al tocar un tema se ven solo sus preguntas; el buscador muestra resultados; el formulario de solicitud se abre desde "Contactate con nosotros" (no queda todo a la vista a la vez).
- **Pie con buen contraste** (texto gris oscuro, links legibles), sin repetir "Centro de ayuda" en el cuerpo del inicio.
- **Se quita el aviso "Modo de prueba"** de la página del evento.

### 2. Organizaciones dentro de Eventos (superadmin)
- La lista de **Eventos** del superadmin tiene dos pestañas: **Eventos** y **Organizaciones**. Sale "Organizaciones" del menú.
- **Crear el admin desde el panel**: en cada organización, "Agregar admin" con correo; si la cuenta no existe, se crea con una **clave generada** que se muestra una sola vez para pasársela al admin (y se le puede mandar el correo de "cambiar contraseña").
- **Una cuenta pertenece a una sola organización**: si el correo ya es admin de otra, se avisa y se pide confirmar antes de moverlo (hoy se mueve sin avisar).
- **Quitar admin** de una organización (por si se escribió mal el correo). Una organización puede tener varios admins.

### 3. Lotes por fechas o siempre disponibles
- Cada lote es **"Por fechas"** (preventa: desde/hasta con calendario) o **"Siempre disponible"** (sectores de un concierto: Campo, Platea, VIP).
- En la página de compra, un lote por fechas **aparece solo entre sus fechas**; antes dice "Disponible desde …" y después "Finalizado".
- El **superadmin** puede, desde Eventos, **editar las fechas** de cada lote y **habilitarlo antes de tiempo**. El admin no.
- El servidor de pagos **rechaza** un lote que no está disponible (misma regla que la página).

### 4. Mapa con punto exacto
- En Crear evento y Solicitar evento, el mapa se ve siempre: se puede **tocar o arrastrar el marcador** y la **dirección se completa sola**. Así el evento guarda el punto exacto y "Abrir en Maps" lleva a ese lugar.

## Capabilities

### New Capabilities
- `estetica-del-comprador`, `organizaciones-en-eventos`, `lotes-por-fechas`, `mapa-con-punto`.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- El pago en la vista previa: falla porque las claves de Mercado Pago están cargadas solo para producción (no es un error del sitio).
- Mandar correos propios (no hay servicio de correo); se usa el correo de "cambiar contraseña" de Firebase.

## Impact

- Comprador: `public/*.html`, `shared/pie-publico.js`, nuevo `shared/cabecera-publica.js`.
- Panel: `admin/eventos-seleccion.html`, `admin/organizaciones.html`, `admin/eventos.html`, `shared/menu-admin.js`, nuevo `shared/cuentas-admin.js`.
- Lotes: nuevo `shared/lotes.js` (función pura de disponibilidad), `public/evento.html`, `server/compra.js`.
- Mapa: `shared/lugar-mapa.js`.
