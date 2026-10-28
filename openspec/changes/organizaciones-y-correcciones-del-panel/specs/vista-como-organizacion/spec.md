## Purpose

Define qué ve el superadmin cuando mira el panel "como organización": las pantallas respetan el rol con el que se está mirando, sin cambiar los permisos reales.

## ADDED Requirements

### Requirement: Las pantallas usan el rol con el que se mira
Cada pantalla del panel SHALL decidir qué mostrar según el rol con el que se está mirando (la organización si el superadmin activó "Ver como organización"), y no según el rol real de la cuenta.

#### Scenario: Eventos vista como organización
- **WHEN** un superadmin activa "Ver como organización" y abre Eventos
- **THEN** no ve las categorías de porcentaje ni el filtro "Todas las organizaciones", y ve la lista como la vería una organización

#### Scenario: Eventos como superadmin
- **WHEN** el superadmin abre Eventos sin esa vista
- **THEN** ve el filtro de organizaciones y la lista de todos los eventos

#### Scenario: Otras pantallas
- **WHEN** abre Resumen, Ventas, Reportes, Escáner o Soporte con la vista de organización activa
- **THEN** ninguna muestra controles que son solo del superadmin

### Requirement: Elegir qué organización se mira
En la vista de organización, el superadmin SHALL elegir qué organización mira, y todas las listas de eventos SHALL mostrar solo los eventos de esa organización.

#### Scenario: Elegir una organización
- **WHEN** el superadmin activa la vista y elige una organización
- **THEN** Resumen, Eventos, Ventas y Reportes muestran solo los eventos de esa organización, como los vería su admin

#### Scenario: Sin organización elegida
- **WHEN** activa la vista y todavía no eligió ninguna
- **THEN** ve un aviso para elegir una organización y no ve eventos de ninguna

#### Scenario: Cambiar de organización
- **WHEN** elige otra organización
- **THEN** las pantallas pasan a mostrar los eventos de la nueva elegida, sin volver a iniciar sesión

### Requirement: Los permisos no cambian
La vista de organización SHALL cambiar solo lo que se ve; los permisos reales de la cuenta y los datos que la base permite leer o escribir SHALL seguir siendo los de siempre.

#### Scenario: Cuenta de organización real
- **WHEN** una cuenta de organización entra al panel
- **THEN** no ve controles de superadmin, aunque nadie haya activado ninguna vista

#### Scenario: Quitar la vista
- **WHEN** el superadmin vuelve a su vista normal
- **THEN** recupera todo lo que ve un superadmin sin tener que volver a entrar
