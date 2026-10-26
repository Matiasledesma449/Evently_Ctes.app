## Purpose

Define la organización (una productora, por ejemplo Valigroup) como entidad propia, con sus admins y sus eventos, y la regla única que decide a quién pertenece cada evento.

## ADDED Requirements

### Requirement: El superadmin crea organizaciones
El superadmin SHALL poder crear una organización con un nombre, verla en una lista y editar su nombre; otras cuentas SHALL no poder hacerlo.

#### Scenario: Crear una organización
- **WHEN** el superadmin escribe un nombre válido y confirma
- **THEN** la organización aparece en la lista y queda disponible para elegirla al crear eventos

#### Scenario: Nombre inválido
- **WHEN** el nombre está vacío, tiene solo espacios o es demasiado largo
- **THEN** ve un aviso claro y no se crea nada

#### Scenario: Nombre repetido
- **WHEN** escribe el nombre de una organización que ya existe (sin distinguir mayúsculas ni espacios sobrantes)
- **THEN** ve un aviso y no se crea una segunda

#### Scenario: Cuenta que no es superadmin
- **WHEN** una cuenta de organización intenta abrir la pantalla de organizaciones
- **THEN** no la ve y es llevada a Eventos

### Requirement: Cada admin pertenece a una organización
El superadmin SHALL poder vincular una cuenta existente de organización a una organización por su correo, y esa cuenta SHALL pasar a ver los eventos de esa organización.

#### Scenario: Vincular un admin
- **WHEN** el superadmin escribe el correo de una cuenta existente de rol organización y la vincula
- **THEN** la cuenta queda asociada a esa organización

#### Scenario: Correo que no existe
- **WHEN** el correo no corresponde a una cuenta de organización
- **THEN** ve un aviso claro y no se vincula nada

### Requirement: Un evento pertenece a una sola organización
Cada evento SHALL llevar el identificador de su organización, y ese identificador SHALL ser la única regla para decidir a quién pertenece.

#### Scenario: Crear un evento como superadmin
- **WHEN** el superadmin crea un evento
- **THEN** debe elegir la organización del evento y no puede guardarlo sin elegirla

#### Scenario: Aprobar una solicitud
- **WHEN** el superadmin aprueba la solicitud de una organización
- **THEN** el evento creado lleva el identificador de esa organización

#### Scenario: Evento sin organización
- **WHEN** existe un evento sin identificador de organización
- **THEN** ninguna organización lo ve, y el superadmin lo ve marcado "Sin organización"

### Requirement: El admin ve solo los eventos de su organización
Una cuenta de organización SHALL ver únicamente los eventos de su organización y SHALL no tener el filtro de organizaciones.

#### Scenario: Admin con eventos
- **WHEN** un admin abre Eventos
- **THEN** ve solo los eventos de su organización, sin filtro de organizaciones

#### Scenario: Admin de otra organización
- **WHEN** hay eventos de dos organizaciones
- **THEN** cada admin ve solo los suyos

### Requirement: Las listas de eventos coinciden entre pantallas
Resumen, Eventos, Ventas y Reportes SHALL armar la lista de eventos con la misma regla, de modo que para la misma cuenta muestren los mismos eventos y las mismas cantidades.

#### Scenario: Misma cantidad
- **WHEN** una organización tiene 3 eventos
- **THEN** el selector de Resumen, la lista de Eventos y el selector de Reportes muestran esos 3

#### Scenario: Superadmin con filtro
- **WHEN** el superadmin elige una organización en el filtro
- **THEN** ve exactamente los eventos que vería el admin de esa organización

### Requirement: Texto de usuario como texto
Los nombres de organizaciones y de eventos SHALL mostrarse siempre como texto, sin interpretarse como HTML.

#### Scenario: Nombre con etiquetas
- **WHEN** una organización se llama `<b>Prueba</b>`
- **THEN** se muestra tal cual, como texto
