## Purpose

Define las categorías de porcentaje del costo de servicio y cómo el superadmin las edita y se las asigna a cada evento.

## ADDED Requirements

### Requirement: Categorías editables por el superadmin
El panel SHALL permitir al superadmin ver, crear y editar categorías de costo de servicio, cada una con un nombre y un porcentaje; ninguna otra persona SHALL poder verlas ni editarlas desde el panel.

#### Scenario: Crear una categoría
- **WHEN** el superadmin agrega una categoría "Estándar" con 8%
- **THEN** la categoría queda guardada y aparece en la lista y en el selector de cada evento

#### Scenario: Editar el porcentaje
- **WHEN** el superadmin cambia el porcentaje de una categoría a 6,5 y guarda
- **THEN** las compras nuevas de los eventos con esa categoría usan 6,5%

#### Scenario: Organización no ve las categorías
- **WHEN** entra una cuenta de organización a "Eventos"
- **THEN** no ve el bloque de categorías ni el selector de costo de servicio

### Requirement: Valores válidos
El nombre SHALL tener entre 1 y 40 caracteres y el porcentaje SHALL ser un número entre 0 y 30 con hasta 2 decimales; un valor inválido NO SHALL guardarse y SHALL mostrar un mensaje claro.

#### Scenario: Porcentaje fuera de rango
- **WHEN** el superadmin escribe 80
- **THEN** no se guarda y ve un mensaje que dice que debe estar entre 0 y 30

#### Scenario: Porcentaje no numérico
- **WHEN** escribe "ocho"
- **THEN** no se guarda y ve el mismo mensaje

### Requirement: Una categoría por evento
El superadmin SHALL poder asignar a cada evento una categoría o "Ninguno (0%)"; la elección se guarda en el evento como `comisionCategoriaId`.

#### Scenario: Asignar
- **WHEN** el superadmin elige "Estándar" en un evento
- **THEN** el evento queda con esa categoría y ve un aviso de que se guardó

#### Scenario: Sin categoría
- **WHEN** un evento no tiene categoría, o la categoría ya no existe
- **THEN** su costo de servicio es 0%

### Requirement: Textos seguros
Los nombres de categoría SHALL mostrarse siempre como texto, nunca como HTML.

#### Scenario: Nombre con código
- **WHEN** una categoría se llama `<b>x</b>`
- **THEN** se ve literalmente ese texto y no se interpreta
