## Purpose

Define el pie de página común del sitio del comprador, con los links de ayuda que ya existen, para que la persona siempre tenga a mano dónde pedir ayuda.

## ADDED Requirements

### Requirement: Pie común con links de ayuda
El inicio, la página del evento y el Centro de ayuda SHALL mostrar el mismo pie de página con los links "Inicio", "Centro de ayuda" y "Enviar una consulta", y el texto de derechos que ya tienen.

#### Scenario: Ver el pie
- **WHEN** la persona llega al final de cualquiera de las tres páginas
- **THEN** ve el mismo pie con los tres links

#### Scenario: Ir a la ayuda
- **WHEN** toca "Centro de ayuda"
- **THEN** se abre la página de soporte

#### Scenario: Enviar una consulta
- **WHEN** toca "Enviar una consulta"
- **THEN** se abre la página de soporte posicionada en el formulario

### Requirement: No mostrar el link a la página actual
El pie SHALL no ofrecer como link la página en la que ya está la persona.

#### Scenario: Estando en el Centro de ayuda
- **WHEN** la persona ve el pie dentro del Centro de ayuda
- **THEN** no ve el link "Centro de ayuda" como acceso a sí mismo

### Requirement: Sin links legales sin confirmar
El pie SHALL no incluir links legales (defensa del consumidor, arrepentimiento de compra, términos, privacidad) hasta que la productora los confirme.

#### Scenario: Pie sin links legales
- **WHEN** se mira el pie
- **THEN** solo aparecen los links de ayuda y de inicio

### Requirement: Visible en celular
El pie SHALL verse legible en celular, con los links apilados o en línea sin desbordar la pantalla.

#### Scenario: Pantalla angosta
- **WHEN** se mira el pie en una pantalla de 375 px de ancho
- **THEN** no hay desplazamiento horizontal y cada link se puede tocar sin errar
