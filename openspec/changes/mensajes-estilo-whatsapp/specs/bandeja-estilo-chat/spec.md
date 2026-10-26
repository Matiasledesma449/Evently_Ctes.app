## Purpose

Define el formato de lista + detalle de Mensajes y Consultas públicas, sus estados vacíos y el selector de "Nuevo mensaje".

## ADDED Requirements

### Requirement: Formato de lista y detalle
Mensajes y Consultas públicas SHALL mostrar una lista a la izquierda y el detalle a la derecha, con el mismo aspecto, y en celular una sola columna a la vez.

#### Scenario: Escritorio
- **WHEN** el superadmin abre cualquiera de las dos pantallas en una pantalla ancha
- **THEN** ve la lista y el detalle lado a lado, con el elemento seleccionado en violeta

#### Scenario: Celular
- **WHEN** abre un elemento en una pantalla angosta
- **THEN** ve solo el detalle, con un botón para volver a la lista

#### Scenario: Texto con etiquetas
- **WHEN** un nombre, mensaje o consulta contiene `<b>hola</b>`
- **THEN** se muestra como texto, nunca como HTML

### Requirement: Filtro por estado con contadores
Cada pantalla SHALL permitir filtrar por Todos, Nuevos, Leídos y Respondidos, mostrando cuántos hay de cada uno.

#### Scenario: Filtrar
- **WHEN** el superadmin elige "Nuevos"
- **THEN** la lista muestra solo los nuevos y el contador coincide con la cantidad mostrada

#### Scenario: Las solicitudes de contraseña
- **WHEN** hay solicitudes de contraseña pendientes en Mensajes
- **THEN** se siguen mostrando arriba de la lista sin importar el filtro

### Requirement: Estados vacíos claros
Cada pantalla SHALL explicar por qué no hay nada y qué hacer, con un texto distinto si no existe nada y si el filtro no trae resultados.

#### Scenario: Sin conversaciones
- **WHEN** el superadmin no tiene ninguna conversación
- **THEN** ve un aviso que le indica tocar "Nuevo mensaje" para escribirle a una organización

#### Scenario: Sin consultas
- **WHEN** no llegó ninguna consulta pública
- **THEN** ve un aviso que explica que acá van a aparecer los mensajes del sitio público

#### Scenario: Filtro sin resultados
- **WHEN** el filtro elegido no trae nada pero sí hay elementos
- **THEN** ve un aviso de que no hay resultados para ese filtro y un botón "Ver todas"

### Requirement: Nuevo mensaje lista todas las organizaciones
"Nuevo mensaje" SHALL listar a todas las organizaciones registradas, con buscador, y reutilizar la conversación si ya existe.

#### Scenario: Lista completa
- **WHEN** el superadmin toca "Nuevo mensaje"
- **THEN** ve todas las cuentas con rol de organización, ordenadas por nombre, cada una con su nombre y su correo

#### Scenario: Buscar
- **WHEN** escribe parte de un nombre o de un correo
- **THEN** la lista se reduce a las organizaciones que coinciden, sin importar mayúsculas ni tildes

#### Scenario: Ya hay conversación
- **WHEN** elige una organización con la que ya conversó
- **THEN** se abre esa conversación y no se crea otra; la fila decía "Conversación abierta"

#### Scenario: Sin organizaciones
- **WHEN** no hay ninguna organización registrada o no coincide la búsqueda
- **THEN** ve un aviso claro en vez de una lista vacía

#### Scenario: Falla la carga
- **WHEN** no se pueden leer los usuarios
- **THEN** el modal dice que no se pudieron cargar las organizaciones, en vez de quedarse en "Cargando"
