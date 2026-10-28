## Purpose

Define dónde se manejan las solicitudes de evento del superadmin y cómo se comentan y contactan.

## ADDED Requirements

### Requirement: Las solicitudes viven en Crear evento
El panel del superadmin SHALL mostrar las solicitudes de evento en la pestaña "Solicitudes" de "Crear evento", con aprobar, rechazar y editar, y SHALL NOT tener un "Panel global".

#### Scenario: Superadmin abre Crear evento
- **WHEN** el superadmin abre "Crear evento"
- **THEN** ve las pestañas "Crear evento" y "Solicitudes" y la cantidad de pendientes en la segunda

#### Scenario: Favorito viejo del Panel global
- **WHEN** alguien abre `superadmin.html`
- **THEN** pasa a la pestaña "Solicitudes" de "Crear evento"

#### Scenario: Organización
- **WHEN** una organización abre "Solicitar evento"
- **THEN** no ve las pestañas ni las solicitudes de otras organizaciones

### Requirement: Comentar una solicitud
El superadmin SHALL poder dejar un comentario en una solicitud, y la organización SHALL verlo en la tarjeta de su solicitud.

#### Scenario: Comentario nuevo
- **WHEN** el superadmin escribe "Falta la hora de fin" y guarda
- **THEN** la solicitud guarda el comentario con autor y fecha, sigue en el mismo estado y el historial lo muestra el primero

#### Scenario: Comentario vacío
- **WHEN** el superadmin guarda el cuadro sin texto o solo con espacios
- **THEN** no se guarda nada y se avisa que falta escribir

#### Scenario: Texto con etiquetas
- **WHEN** el comentario contiene `<b>hola</b>`
- **THEN** se muestra como texto, nunca como HTML

#### Scenario: Solicitud sin comentarios
- **WHEN** la organización abre una solicitud vieja
- **THEN** la tarjeta se ve igual que antes

### Requirement: Contacto directo
Cada solicitud SHALL ofrecer contactar a la organización por correo y por WhatsApp cuando se tiene el dato.

#### Scenario: Con correo y teléfono
- **WHEN** la solicitud tiene correo y la organización tiene teléfono
- **THEN** se ofrecen "Escribir por correo" y "WhatsApp", con un texto inicial que nombra el evento

#### Scenario: Sin teléfono
- **WHEN** la organización no tiene teléfono
- **THEN** solo se ofrece el correo

#### Scenario: Teléfono con símbolos
- **WHEN** el teléfono es `+54 9 3782 45-6789`
- **THEN** el enlace de WhatsApp usa solo los dígitos
