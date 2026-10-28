## Purpose

Define dónde y quién puede crear las categorías de porcentaje del costo de servicio y elegir una al crear un evento, sin cambiar cómo se calcula el costo.

## ADDED Requirements

### Requirement: Las categorías se editan en "Crear evento"
Las categorías de porcentaje SHALL crearse y editarse en la pantalla "Crear evento", y SHALL dejar de mostrarse en la lista de Eventos.

#### Scenario: Ver las categorías
- **WHEN** el superadmin abre "Crear evento"
- **THEN** ve el panel de categorías con su nombre y porcentaje, y puede crear o editar una

#### Scenario: Lista de Eventos
- **WHEN** abre Eventos
- **THEN** no ve el panel de categorías

#### Scenario: Valor inválido
- **WHEN** escribe un porcentaje fuera de 0 a 30, con más de 2 decimales o que no es un número
- **THEN** ve un aviso claro y no se guarda nada

### Requirement: Elegir la categoría al crear el evento
El formulario de "Crear evento" SHALL permitir elegir una categoría para el evento, y SHALL quedar en 0% si no se elige ninguna.

#### Scenario: Evento con categoría
- **WHEN** el superadmin elige una categoría y guarda el evento
- **THEN** el evento queda asociado a esa categoría

#### Scenario: Evento sin categoría
- **WHEN** guarda el evento sin elegir categoría
- **THEN** el evento se vende con costo de servicio 0%

### Requirement: Solo el superadmin real
Las categorías y su elección SHALL estar disponibles solo para una cuenta superadmin que no esté viendo el panel como organización.

#### Scenario: Superadmin viendo como organización
- **WHEN** el superadmin activó "Ver como organización"
- **THEN** no ve las categorías en ninguna pantalla

#### Scenario: Cuenta de organización
- **WHEN** una cuenta de organización abre cualquier pantalla del panel
- **THEN** no ve las categorías ni puede cambiarlas

### Requirement: El cálculo del costo no cambia
Mover las categorías de lugar SHALL no cambiar el porcentaje que se cobra ni el desglose que ve quien compra.

#### Scenario: Compra después del cambio
- **WHEN** se compra una entrada de un evento con categoría al 8%
- **THEN** el desglose y el total son los mismos que antes del cambio
