## Purpose

Define las páginas de Términos y condiciones, Política de privacidad y Arrepentimiento de compra, y sus links en el pie.

## ADDED Requirements

### Requirement: Páginas legales propias
El sitio SHALL tener páginas de Términos y condiciones y de Política de privacidad con textos propios de Evently, que marcan "A COMPLETAR" los datos de la empresa y avisan que son un borrador.

#### Scenario: Abrir Términos
- **WHEN** el comprador toca "Términos y condiciones" en el pie
- **THEN** ve la franja violeta con el título y el texto, y el aviso de borrador

### Requirement: Arrepentimiento de compra
El sitio SHALL tener una página para pedir el arrepentimiento de una compra dentro de los 10 días corridos, que entrega un código de gestión.

#### Scenario: Pedir el arrepentimiento
- **WHEN** el comprador completa correo, nombre y número de compra y envía
- **THEN** se guarda una consulta pública que empieza con "ARREPENTIMIENTO DE COMPRA" y la página muestra el código de gestión

### Requirement: Links en el pie
Todas las páginas del comprador SHALL mostrar en el pie "Términos y condiciones", "Política de privacidad" y "Botón de arrepentimiento", salvo el de la página en la que se está.

#### Scenario: Pie en el inicio
- **WHEN** el comprador mira el pie del inicio
- **THEN** ve los tres links legales
