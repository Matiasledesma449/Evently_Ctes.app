# Design

## Datos que se guardan

Una conversación (`conversaciones`) suma dos campos. Los que ya existían no cambian.

```
ultimoDe: "<uid de quien escribió el último mensaje>"
ultimoLeido: false   // true cuando la otra persona abrió la conversación
```

- Al enviar un mensaje (en `admin/mensajes.html` y en `admin/soporte.html`) se guardan `ultimoDe: <mi uid>` y `ultimoLeido: false` junto con `ultimoMensaje` y `ultimaFecha`, en la misma escritura que ya existe.
- Al abrir una conversación cuyo `ultimoDe` es la otra persona y `ultimoLeido` no es `true`, se guarda `ultimoLeido: true` (junto con el `leido: true` de los mensajes, que ya se hace).
- Conversaciones viejas: no tienen `ultimoDe`; se toman como "Leído". No se migra nada.
- `consultas_publicas` no cambia: ya tiene `estado` (`nueva`, `leida`, `respondida`) y `fecha`.

## `shared/estado-mensajes.js`

Módulo de navegador sin dependencias (`export function ...`), como `shared/solicitudes-evento.js`; la prueba le quita los `export` para cargarlo en `node`.

- `estadoDeConversacion(conv, miUid)`: devuelve `'nuevo'`, `'leido'` o `'respondido'`.
  - `ultimoDe` vacío o desconocido → `'leido'` (conversación vieja o recién creada sin mensajes).
  - `ultimoDe === miUid` → `'respondido'`.
  - `ultimoDe` es la otra persona y `ultimoLeido !== true` → `'nuevo'`; si es `true` → `'leido'`.
- `estadoDeConsulta(consulta)`: `'nuevo'` (`nueva`), `'leido'` (`leida`), `'respondido'` (`respondida`); cualquier otro valor o falta → `'leido'`.
- `contarPorEstado(lista, funcionDeEstado)`: `{ nuevo, leido, respondido, total }` para los contadores del filtro.
- `presentacionDeEstado(estado)`: `{ etiqueta, clasesInsignia, clasesPunto, negrita }` con el texto y las clases de Tailwind de cada estado (Nuevo: ámbar y negrita; Leído: gris; Respondido: verde). Un solo lugar para que las dos pantallas coincidan.
- `filtrarPorEstado(lista, filtro, funcionDeEstado)`: `'todos'` devuelve todo; si no, solo los de ese estado.
- `organizacionesParaChat(usuarios, miUid, conversaciones, textoBuscado)`: de la lista de usuarios deja los de `rol === 'organizacion'` distintos de `miUid`, les agrega `conversacionId` (si ya hay una conversación con ese uid) y los ordena por nombre sin importar mayúsculas ni tildes; con texto, filtra por nombre o correo. Nombre vacío se muestra como "Organización sin nombre".
- `textoVacio(contexto)`: `{ titulo, ayuda, verTodas }` para cada estado vacío: `mensajes-sin-conversaciones`, `consultas-sin-consultas`, `filtro-sin-resultados`, `organizaciones-sin-resultados`.

Todos los textos se devuelven como texto: quien los muestre usa `textContent` o los escapa. Hoy `admin/mensajes.html` arma la lista con `innerHTML` y nombres sin escapar: al reescribirla se usa `textContent` / `replaceChildren`, como ya hace `consultas-publicas.html`.

## Formato de las pantallas

Las dos usan la misma estructura (la de Mensajes de hoy): columna de lista de ancho fijo (`w-80`), detalle a la derecha, y en celular una sola columna a la vez con botón de volver.

- **Fila de la lista**: avatar con la inicial, nombre (negrita si es "Nuevo"), vista previa de una línea, hora a la derecha y debajo la marca de estado: punto ámbar + número de no leídos (Nuevo), nada (Leído), tilde verde (Respondido). La fila seleccionada va en violeta, como hoy.
- **Detalle de Mensajes**: igual que hoy (cabecera, burbujas, campo para escribir). Se agrega la insignia de estado en la cabecera.
- **Detalle de Consultas públicas**: cabecera con nombre, correo y insignia; la consulta como una burbuja de la otra persona (con fecha y origen); debajo, las acciones: "Responder por Gmail" y "Marcar como respondida". No hay campo para escribir: la respuesta sale por Gmail.
- **Abrir una consulta "Nueva"** guarda `estado: 'leida'` sola. Marcarla como respondida sigue siendo a mano.
- **Filtro de estado** (Todas, Nuevos, Leídos, Respondidos) con el contador de cada uno, arriba de la lista, en las dos pantallas. En Mensajes las solicitudes de contraseña siguen arriba de todo, fuera del filtro.
- **Estados vacíos**: sin nada (icono, título y una línea de qué hacer: en Mensajes "Tocá Nuevo mensaje para escribirle a una organización"; en Consultas "Acá van a aparecer los mensajes que lleguen desde el sitio público") y filtro sin resultados (texto distinto con botón "Ver todas"). Sin elemento seleccionado en el detalle, el texto de ayuda de hoy.

## "Nuevo mensaje"

- Al abrir el modal se leen los usuarios como hoy (`getDocs(collection(db, 'usuarios'))`) y se pasan por `organizacionesParaChat`. Si falla la lectura, el modal dice "No se pudieron cargar las organizaciones" en vez de quedarse en "Cargando".
- Campo de búsqueda arriba de la lista, que filtra al escribir.
- Cada fila: inicial, nombre y correo; si ya hay conversación, la marca "Conversación abierta" y al tocarla abre esa conversación (hoy `crearNuevaConversacion` ya la reutiliza; se usa lo ya cargado y no se vuelve a leer).
- Se saca el texto "Selecciona el cliente": son organizaciones.
- Se arregla de paso que el nombre y el correo entran a `innerHTML` y a `data-nombre` sin escapar.

## Roles y permisos

No cambia quién puede qué: `mensajes.html` y `consultas-publicas.html` siguen verificando `rol === 'superadmin'` al cargar. Lo nuevo (`ultimoDe`, `ultimoLeido`) se escribe desde el navegador y, hasta que se publiquen las reglas de Firestore (tarea 10.3 de pagos), la base no lo protege. Queda en `proposal.md` como fuera de alcance.

## Riesgos

- `admin/mensajes.html` es una página grande con el JavaScript incrustado: la reescritura de la lista toca solicitudes, conversaciones, el modal y la eliminación. Hay que cuidar que borrar una conversación y las solicitudes de contraseña sigan funcionando igual.
- `onSnapshot` de `conversaciones` y de `mensajes` marcan `leido` al abrir: hay que evitar un bucle (escribir `ultimoLeido` solo si todavía no es `true`).
- No hay navegador en la nube: las pantallas se verifican a mano o con la skill `auditar-panel`; las funciones de `shared/` se prueban con `node`.
