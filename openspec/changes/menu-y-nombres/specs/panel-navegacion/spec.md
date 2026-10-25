## Purpose

Define cómo se ve y se comporta el menú de navegación del panel de administración (admin y superadmin): un solo menú igual en todas las páginas, que se puede achicar sin parpadeos y que usa los mismos nombres en escritorio y celular.

## ADDED Requirements

### Requirement: Un solo menú para todas las páginas del panel
El panel SHALL mostrar el mismo menú lateral (escritorio) y el mismo menú inferior (celular) en todas sus páginas, definido en un único lugar compartido. Ninguna página SHALL tener su propia copia del menú.

#### Scenario: Cambiar un nombre del menú se refleja en todas las páginas
- **WHEN** se cambia el nombre de una sección en el archivo compartido del menú
- **THEN** ese nombre aparece actualizado en todas las páginas del panel sin editar ninguna de ellas

#### Scenario: Las páginas del panel muestran las mismas secciones
- **WHEN** una persona abre cualquiera de las páginas del panel con el mismo rol
- **THEN** ve las mismas secciones, en el mismo orden y con los mismos nombres

### Requirement: El menú achicado se recuerda y no parpadea al navegar
Si la persona achicó el menú (solo iconos), el panel SHALL mostrarlo achicado desde el primer dibujo de cada página: el menú ancho con nombres NO SHALL verse ni animarse al cargar una página nueva.

#### Scenario: Navegar con el menú achicado
- **WHEN** el menú está achicado y la persona toca una sección del menú
- **THEN** la página nueva aparece con el menú achicado desde el principio, sin mostrar los nombres ni la animación de achicarse

#### Scenario: Recordar la elección
- **WHEN** la persona achica o expande el menú y luego abre otra página o vuelve a entrar al panel
- **THEN** el menú conserva el último estado elegido

#### Scenario: Expandir y achicar a pedido
- **WHEN** la persona toca el botón de achicar o expandir
- **THEN** el menú cambia de estado con una animación corta y no cambia solo después

### Requirement: Nombres consistentes en escritorio, celular y títulos
Cada sección SHALL llamarse igual en el menú de escritorio, en el de celular (que puede usar una versión corta) y en el título de su página. Los nombres son: Eventos, Resumen, Ventas, Reportes, Escáner, Soporte (organización) o Mensajes (superadmin), Consultas públicas, Panel global, y para crear eventos Solicitar evento (organización) o Crear evento (superadmin).

#### Scenario: La misma sección con el mismo nombre
- **WHEN** se compara el menú de escritorio con el de celular y el título de la página
- **THEN** la sección "Resumen" no aparece con otros nombres como "Panel Principal", "Dashboard" o "Panel"

#### Scenario: Versión corta en celular
- **WHEN** un nombre no entra en el menú de celular ("Consultas públicas", "Panel global" o "Solicitar evento")
- **THEN** el menú de celular usa una versión corta del mismo nombre ("Consultas", "Global", "Solicitar") y no otro nombre distinto

### Requirement: Secciones según el rol
El menú SHALL mostrar solo las secciones que corresponden al rol de la persona: las de superadmin (Mensajes, Consultas públicas, Panel global, Crear evento) solo al superadmin, y las de organización (Soporte, Solicitar evento) solo a la organización.

#### Scenario: Organización entra al panel
- **WHEN** entra una persona con rol organización
- **THEN** el menú no muestra Consultas públicas ni Panel global, y muestra Soporte y Solicitar evento

#### Scenario: Superadmin entra al panel
- **WHEN** entra una persona con rol superadmin
- **THEN** el menú muestra Mensajes, Consultas públicas, Panel global y Crear evento

#### Scenario: El menú no cambia de forma al cargar el rol
- **WHEN** el rol de la persona ya se conoce de una visita anterior
- **THEN** el menú aparece con sus secciones finales desde el primer dibujo, sin que aparezcan o desaparezcan elementos después

### Requirement: La sección actual está resaltada
El menú SHALL resaltar la sección de la página abierta, en escritorio y en celular, y SHALL marcarla como la página actual para lectores de pantalla.

#### Scenario: Resaltado de la página actual
- **WHEN** la persona abre la página de Ventas
- **THEN** la sección Ventas aparece resaltada en el menú y las demás no

### Requirement: Se mantienen la paleta y la información
El menú SHALL conservar los colores, los íconos, los avisos de no leídos (Mensajes y Consultas públicas) y el botón de cerrar sesión que existen hoy.

#### Scenario: Avisos de no leídos
- **WHEN** hay mensajes o consultas nuevas
- **THEN** el número de no leídos se sigue mostrando junto a la sección correspondiente, con el menú ancho y con el achicado
