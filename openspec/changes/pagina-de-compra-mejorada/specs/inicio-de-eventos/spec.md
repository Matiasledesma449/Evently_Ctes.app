## Purpose

Define cómo se muestran los eventos en el inicio del sitio del comprador, con el afiche como protagonista de cada tarjeta y el carrusel de destacados.

## ADDED Requirements

### Requirement: Tarjeta con el afiche protagonista
Cada evento de la lista SHALL mostrarse como una tarjeta cuyo afiche ocupa la mayor parte de la tarjeta, con el nombre, la fecha, el lugar, el precio inicial y el botón "Ver entradas".

#### Scenario: Evento con foto
- **WHEN** el evento tiene una foto
- **THEN** la tarjeta la muestra grande, con el texto compacto debajo

#### Scenario: Evento sin foto
- **WHEN** el evento no tiene foto
- **THEN** la tarjeta muestra el relleno violeta con la inicial del evento, el mismo de las demás pantallas

#### Scenario: Ver entradas
- **WHEN** la persona toca "Ver entradas"
- **THEN** se abre la página de ese evento

#### Scenario: Evento sin precio
- **WHEN** el evento no tiene un precio válido en su primer lote
- **THEN** la tarjeta no muestra precio y sigue mostrando el botón

### Requirement: Carrusel de destacados
El inicio SHALL conservar el carrusel de eventos destacados con sus flechas y puntos, sin cambios de comportamiento.

#### Scenario: Cambiar de destacado
- **WHEN** la persona usa las flechas o los puntos del carrusel
- **THEN** cambia el evento destacado como hasta ahora

### Requirement: Estados de carga y vacío
El inicio SHALL conservar los mensajes de "Cargando eventos..." y de ausencia de eventos o de error de carga.

#### Scenario: Sin eventos
- **WHEN** no hay eventos para mostrar
- **THEN** ve el mensaje de siempre y no una grilla vacía

### Requirement: Visible en celular
La lista SHALL verse en una sola columna en celular, sin desplazamiento horizontal.

#### Scenario: Pantalla angosta
- **WHEN** se abre el inicio en una pantalla de 375 px de ancho
- **THEN** las tarjetas ocupan todo el ancho, una debajo de otra
