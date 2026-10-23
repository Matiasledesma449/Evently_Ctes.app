## Purpose

Define de dónde sale la imagen de un evento, cómo la elige la organización al solicitarlo y que se vea igual en todas las páginas.

## ADDED Requirements

### Requirement: Una sola regla para la imagen de un evento
El sistema SHALL decidir la imagen de un evento con una única función compartida: si el evento tiene una dirección de imagen válida (`https://`), se usa esa; si no, se usa un relleno propio del evento. Todas las páginas que muestran un evento MUST usar esa función.

#### Scenario: Evento con foto
- **WHEN** un evento tiene una dirección de imagen `https://` válida
- **THEN** Inicio, la página del evento, la lista de Eventos y las solicitudes muestran esa misma foto

#### Scenario: Evento sin foto
- **WHEN** un evento tiene la imagen vacía, ausente o con una dirección no válida
- **THEN** todas las páginas muestran el mismo relleno de ese evento, no la foto de otro evento

### Requirement: Relleno propio y estable por evento
El relleno SHALL mostrar la letra inicial del nombre del evento sobre un color de la paleta violeta, elegido de forma estable a partir del identificador del evento. Dos eventos distintos sin foto SHOULD verse distintos, y el mismo evento MUST verse igual cada vez.

#### Scenario: Dos eventos sin foto
- **WHEN** hay dos eventos sin foto con identificadores distintos
- **THEN** sus rellenos tienen letra o color distintos

#### Scenario: Mismo evento, otra visita
- **WHEN** se abre dos veces el mismo evento sin foto
- **THEN** el relleno es idéntico

#### Scenario: Evento sin nombre
- **WHEN** el evento no tiene nombre
- **THEN** el relleno muestra un signo neutro y no falla

### Requirement: Imagen que no carga
Si la foto de un evento no carga, la página SHALL mostrar el relleno de ese evento en su lugar, sin dejar un hueco ni un ícono roto.

#### Scenario: Dirección rota
- **WHEN** la dirección de la imagen responde con error
- **THEN** se ve el relleno del evento

### Requirement: Textos y direcciones seguros
Los nombres de evento y las direcciones de imagen MUST insertarse en las páginas de forma segura (texto escapado y solo direcciones `https://`), de modo que un nombre o una dirección con código no se ejecute.

#### Scenario: Nombre con etiquetas
- **WHEN** un evento se llama `<img src=x onerror=alert(1)>`
- **THEN** la página muestra ese texto tal cual y no ejecuta nada

#### Scenario: Dirección peligrosa
- **WHEN** la imagen de un evento es `javascript:alert(1)`
- **THEN** se ignora y se muestra el relleno

### Requirement: La organización elige la foto al solicitar el evento
Al solicitar un evento, la organización SHALL poder elegir una foto de su equipo, ver una vista previa y subirla; la solicitud guarda la dirección de esa foto y, cuando se aprueba, el evento usa la misma foto.

#### Scenario: Foto elegida
- **WHEN** la organización elige una imagen válida y la sube
- **THEN** ve la vista previa y, al enviar la solicitud, queda guardada su dirección

#### Scenario: Foto aprobada
- **WHEN** el superadmin aprueba una solicitud con foto
- **THEN** el evento creado tiene esa foto y se ve igual en todas las páginas

#### Scenario: Sin foto
- **WHEN** la organización envía la solicitud sin elegir foto
- **THEN** la solicitud se envía y el evento usa su relleno

### Requirement: Si la foto falla, la solicitud no se envía a medias
Si hay una foto elegida y la subida falla o todavía no terminó, la solicitud SHALL NOT enviarse; el error se explica con un mensaje dentro de la página, sin ventanas emergentes.

#### Scenario: La subida falla
- **WHEN** la subida de la foto da error
- **THEN** aparece un mensaje claro, el botón de enviar sigue disponible para reintentar y no se creó ninguna solicitud

#### Scenario: Subida en curso
- **WHEN** la foto todavía se está subiendo
- **THEN** no se puede enviar la solicitud y se avisa que hay que esperar

### Requirement: Foto válida y de tamaño razonable
Solo se SHALL aceptar archivos de imagen (JPG, PNG o WebP). La foto se achica en el navegador (lado mayor de 1600 px) antes de subirla; si aun así supera 2 MB o el archivo no es una imagen, se rechaza con un mensaje claro.

#### Scenario: Foto grande de celular
- **WHEN** la organización elige una foto de 6 MB
- **THEN** se achica y se sube sin pedirle que la edite

#### Scenario: Archivo que no es imagen
- **WHEN** elige un PDF
- **THEN** se rechaza con un mensaje que dice que debe ser una imagen

### Requirement: Reglas de Storage
Las fotos de eventos SHALL vivir en `eventos_solicitudes/<uid de la persona>/` y las reglas de Storage MUST permitir leerlas a cualquiera, y subirlas solo a la persona con sesión dueña de esa carpeta, solo si son imágenes y de hasta 3 MB; cualquier otra ruta queda cerrada. Las reglas se guardan en un archivo versionado y se publican solo con OK explícito del usuario.

#### Scenario: Visitante
- **WHEN** alguien sin sesión pide una foto de evento
- **THEN** puede verla

#### Scenario: Subir sin sesión
- **WHEN** alguien sin sesión intenta subir un archivo
- **THEN** se rechaza

#### Scenario: Subir en la carpeta de otra persona
- **WHEN** una persona intenta subir dentro de la carpeta de otro uid
- **THEN** se rechaza

#### Scenario: Archivo que no es imagen o demasiado grande
- **WHEN** se intenta subir un archivo que no es imagen o que pesa más de 3 MB
- **THEN** se rechaza
