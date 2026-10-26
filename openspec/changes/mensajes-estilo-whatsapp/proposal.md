# Proposal

## Why

El pedido 5 de `openspec/pendientes.md` dice: "Mensajes y Consultas públicas estilo WhatsApp: colores para nuevo, leído y respondido; estado vacío claro. 'Nuevo mensaje' lista todas las organizaciones."

Lo que se ve en el código hoy:

- **Mensajes** (`admin/mensajes.html`, solo superadmin): lista de conversaciones a la izquierda y chat a la derecha, con solicitudes de contraseña mezcladas arriba. La lista no distingue una conversación con algo sin leer de una ya leída ni de una ya respondida. Cada mensaje tiene `leido`, pero la lista no lo usa.
- **Consultas públicas** (`admin/consultas-publicas.html`): una columna de tarjetas con un filtro de estado (`nueva`, `leida`, `respondida`). El estado ya existe y ya se guarda, pero el color es muy parecido entre estados y la pantalla no tiene el formato de chat. El texto de "sin resultados" es el mismo para "no hay nada" y "este filtro no trae nada".
- **Estado vacío**: Mensajes dice "No tenés conversaciones" y no explica qué hacer; Consultas públicas dice "No hay consultas para este filtro" aunque no haya ninguna.
- **Nuevo mensaje** (`btnNuevaConversacion`): carga todos los usuarios y deja solo los de `rol === 'organizacion'`. Si una organización no aparece, hoy no hay forma de saber por qué (no hay buscador ni aviso).

## What Changes

- **Mismo formato en las dos pantallas**: lista a la izquierda (con avatar, nombre, vista previa, hora y marca de estado) y detalle a la derecha con el fondo y las burbujas que ya usa Mensajes. En celular, la lista y el detalle se alternan, como hoy en Mensajes.
- **Tres estados con color propio y la misma leyenda en las dos pantallas**:
  - **Nuevo** (hay algo sin leer): punto y nombre en negrita, etiqueta ámbar, número de no leídos en los chats.
  - **Leído** (se vio y falta responder): gris, sin punto.
  - **Respondido** (el último mensaje es de Evently, o la consulta se marcó respondida): verde, con tilde.
- **Consultas públicas**: pasan al formato de lista + detalle; abrir una consulta nueva la marca como leída sola; "Responder por Gmail" sigue y "Marcar como respondida" sigue a mano. El filtro por estado queda, con el contador de cada uno.
- **Mensajes**: la conversación muestra su estado según el último mensaje. Para saberlo sin leer todos los mensajes, la conversación guarda dos datos nuevos: `ultimoDe` (quién escribió el último mensaje) y `ultimoLeido` (si el otro ya lo vio). Lo escriben `admin/mensajes.html` y `admin/soporte.html`. Las conversaciones viejas, sin esos datos, se ven como "Leído".
- **Estado vacío claro**, con un texto distinto para cada caso: "todavía no hay nada" (con qué hacer) y "este filtro no trae resultados" (con botón para ver todas).
- **"Nuevo mensaje" lista todas las organizaciones**: trae a toda organización registrada (la lista hoy ya sale de `rol === 'organizacion'`), ordenada por nombre, con un buscador, el nombre de la organización y su correo, y un texto claro si no hay ninguna. Las que ya tienen conversación se marcan "Conversación abierta" y al tocarlas se abre esa conversación.
- **Funciones compartidas** en `shared/estado-mensajes.js` (estado de una conversación y de una consulta, contador, etiquetas y colores, filtrar y ordenar organizaciones) con su prueba en `pruebas/`.

## Capabilities

### New Capabilities
- `estado-de-mensajes`: cómo se calcula y se muestra nuevo / leído / respondido en Mensajes y en Consultas públicas.
- `bandeja-estilo-chat`: el formato de lista + detalle, los estados vacíos y el selector de "Nuevo mensaje".

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. -->

## Impact

- Código (previsto): `shared/estado-mensajes.js` (nuevo), `admin/mensajes.html`, `admin/consultas-publicas.html`, `admin/soporte.html` (solo para guardar `ultimoDe` y `ultimoLeido` al enviar y al abrir), una prueba nueva en `pruebas/`, y `CLAUDE.md` (una línea).
- No toca: `api/`, `server/`, `public/contacto-modal.js` (las consultas siguen entrando con `estado: 'nueva'`), reglas de Firestore ni datos ya guardados. Las conversaciones y consultas viejas se ven bien sin migrar nada.
- Sin dependencias nuevas.

## Fuera de alcance

- Cambiar las reglas de Firestore (tarea 10.3 de pagos): los campos nuevos de la conversación se escriben desde el navegador; hasta que se publiquen las reglas, la base no impide que otra cuenta los cambie. Queda anotado.
- Mensajes con adjuntos, imágenes o "escribiendo…": no se pidió.
- Que el comprador reciba la respuesta dentro de la plataforma: las consultas públicas se siguen respondiendo por correo.
- Migrar o borrar conversaciones y consultas viejas.
- Las solicitudes de contraseña de Mensajes no cambian (ya tienen su propio estilo ámbar y su botón "Marcar como atendida").

## Decidí por vos (decisiones comunes, sin pregunta)

- **Dónde se guarda el estado de un chat**: dos campos en la conversación (`ultimoDe`, `ultimoLeido`) y no un recuento de mensajes por conversación. Es más barato (no hay que leer todos los mensajes para pintar la lista). Si prefieren contar mensajes sin leer de verdad, es un cambio mayor y más lento.
- **"Respondido" en un chat** significa que el último mensaje lo escribió Evently; "Nuevo" que el último lo escribió la otra persona y nadie lo abrió; "Leído" que se abrió y no se respondió.
- **Colores**: ámbar (nuevo), gris (leído) y verde (respondido), que son los que ya usa Consultas públicas; se mantiene el violeta del panel para lo seleccionado.
- **Abrir una consulta nueva la marca leída** sola (como WhatsApp), sin botón; "Marcar como respondida" sigue a mano porque la respuesta sale por Gmail, fuera de la plataforma.
- **"Nuevo mensaje" sigue siendo solo para organizaciones** (`rol === 'organizacion'`), no para compradores: el pedido dice "todas las organizaciones". Si en la base hay organizaciones con otro valor en `rol`, no aparecen; se anota para revisarlo con datos reales.
- **Las conversaciones viejas se ven como "Leído"**, sin migrar nada; pasan a tener estado propio con el primer mensaje nuevo.

## Por qué esta opción y no otra

- **Una sola pieza de código compartida** (`shared/estado-mensajes.js`) para que las dos pantallas tengan los mismos colores y reglas, y se pueda probar con `node` sin navegador, como `shared/solicitudes-evento.js`.
- **Reusar el diseño de Mensajes** (burbujas, fondo, lista lateral) en vez de inventar uno: es lo que el pedido llama "estilo WhatsApp" y no suma librerías.

## Cómo se verifica a mano

1. Como superadmin, abrir Mensajes: las conversaciones con algo sin leer se ven en negrita con punto y número; las respondidas, con tilde verde.
2. Escribirle a Evently desde Soporte como organización: en Mensajes la conversación pasa a "Nuevo"; al abrirla pasa a "Leído"; al responder, a "Respondido".
3. Con una cuenta sin conversaciones, ver el estado vacío con su indicación.
4. "Nuevo mensaje": aparecen todas las organizaciones, el buscador filtra, y una con conversación abierta la abre en vez de crear otra.
5. Mandar una consulta desde el sitio público: en Consultas públicas aparece "Nueva"; al abrirla pasa a "Leída"; "Marcar como respondida" la pone en verde.
6. Probar un filtro sin resultados: aparece el aviso con el botón para ver todas.
7. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
