## Purpose

Define la sección "Mensajes" del superadmin, que junta los mensajes de las organizaciones y las consultas públicas en dos pestañas.

## ADDED Requirements

### Requirement: Una sola entrada en el menú
El menú del superadmin SHALL tener una sola entrada "Mensajes" para los mensajes de las organizaciones y las consultas públicas, y no SHALL tener una entrada "Consultas públicas" aparte.

#### Scenario: Menú del superadmin
- **WHEN** el superadmin abre cualquier página del panel
- **THEN** ve "Mensajes" en el menú y no ve "Consultas públicas"

#### Scenario: Sección activa
- **WHEN** abre la pestaña "Consultas públicas"
- **THEN** la entrada "Mensajes" del menú se ve activa

### Requirement: Dos pestañas
Las pantallas de mensajes y de consultas SHALL mostrar arriba la misma barra con las pestañas "Organizaciones" y "Consultas públicas", con la actual en violeta.

#### Scenario: Cambiar de pestaña
- **WHEN** el superadmin toca "Consultas públicas" estando en "Organizaciones"
- **THEN** ve las consultas públicas y la pestaña "Consultas públicas" queda en violeta

#### Scenario: Enlace viejo
- **WHEN** alguien abre `consultas-publicas.html`
- **THEN** ve la pestaña "Consultas públicas" de la sección Mensajes

### Requirement: Avisos de no leídos
El aviso del menú SHALL sumar los mensajes sin leer de las organizaciones y las consultas públicas nuevas, y cada pestaña SHALL mostrar su propio número.

#### Scenario: Uno de cada uno
- **WHEN** hay una conversación sin leer y una consulta pública nueva
- **THEN** el menú muestra 2, la pestaña "Organizaciones" 1 y la pestaña "Consultas públicas" 1
