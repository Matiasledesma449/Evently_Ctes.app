## Purpose

Permite que un superadmin vea el panel como lo ve una organización, y vuelva a su vista con un clic, sin cerrar sesión y sin cambiar permisos ni datos.

## ADDED Requirements

### Requirement: El superadmin puede ver el panel como una organización
El menú SHALL ofrecer al superadmin un botón "Ver como organización". Al usarlo, el panel SHALL mostrar el menú y los textos propios de una organización (por ejemplo Soporte en lugar de Mensajes, y sin Consultas públicas ni Panel global).

#### Scenario: Activar la vista
- **WHEN** un superadmin toca "Ver como organización"
- **THEN** el menú pasa a mostrar solo las secciones de una organización y aparece un aviso visible que dice que está en esa vista

#### Scenario: Una organización no ve el botón
- **WHEN** entra una persona con rol organización
- **THEN** el menú no muestra el botón "Ver como organización"

### Requirement: Volver a la vista de superadmin con un clic
Mientras la vista de organización esté activa, el panel SHALL mostrar un aviso permanente con un botón "Volver a superadmin". Al usarlo, el panel SHALL volver a mostrar todas las secciones de superadmin.

#### Scenario: Volver
- **WHEN** el superadmin toca "Volver a superadmin"
- **THEN** el aviso desaparece y el menú vuelve a mostrar las secciones de superadmin

#### Scenario: Cerrar sesión limpia la vista
- **WHEN** el superadmin cierra sesión estando en la vista de organización
- **THEN** al volver a entrar, el panel abre en la vista normal de superadmin

### Requirement: La vista de organización no cambia permisos ni datos
"Ver como organización" SHALL cambiar solo lo que se muestra. NO SHALL modificar el rol guardado de la persona, sus permisos, ni ningún dato en Firestore.

#### Scenario: Los permisos siguen siendo los reales
- **WHEN** un superadmin está en la vista de organización
- **THEN** las reglas de acceso siguen tratándolo como superadmin y ningún dato ni rol guardado cambia

#### Scenario: Enviar solicitudes sigue siendo de organizaciones
- **WHEN** un superadmin en la vista de organización abre "Solicitar evento"
- **THEN** el panel le avisa con un texto corto que las solicitudes las envía una cuenta de organización, y no crea ninguna solicitud

#### Scenario: Páginas propias de superadmin
- **WHEN** un superadmin en la vista de organización abre una página solo de superadmin (por ejemplo Panel global)
- **THEN** el panel lo lleva a la lista de Eventos y no muestra esa sección
