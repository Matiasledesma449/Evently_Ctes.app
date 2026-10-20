# Spec Delta

## Purpose

Define quién puede leer y escribir ventas y eventos en la base de datos, y cómo se protegen las claves del servidor, para que el navegador no pueda crear, cambiar ni confirmar ventas.

## ADDED Requirements

### Requirement: Nadie escribe ventas desde el navegador
Las reglas de la base de datos MUST impedir que cualquier visitante o cuenta cree, modifique o borre documentos de `ventas` desde el navegador. Solo el servidor, con su cuenta de servicio, SHALL escribir ventas.

#### Scenario: Visitante intenta crear una venta
- **WHEN** un visitante sin sesión intenta crear una venta desde la consola del navegador
- **THEN** la base de datos lo rechaza por falta de permisos

#### Scenario: Superadmin intenta modificar una venta
- **WHEN** un superadmin con sesión intenta cambiar el estado de una venta desde el navegador
- **THEN** la base de datos lo rechaza por falta de permisos

#### Scenario: El servidor escribe
- **WHEN** el servidor crea o confirma una venta con su cuenta de servicio
- **THEN** la operación se realiza normalmente

### Requirement: Lectura de ventas por rol
Las reglas MUST permitir leer `ventas` solo al superadmin y a las cuentas con rol `organizacion`. Los visitantes sin sesión y las cuentas sin rol reconocido no SHALL leer ninguna venta.

#### Scenario: Superadmin o organización
- **WHEN** un superadmin o una cuenta con rol `organizacion` abre Ventas, Dashboard o Reportes
- **THEN** ve los datos de las ventas como hasta ahora

#### Scenario: Visitante sin sesión
- **WHEN** un visitante sin sesión intenta leer ventas desde la consola del navegador
- **THEN** la base de datos lo rechaza por falta de permisos

#### Scenario: Cuenta sin rol
- **WHEN** una cuenta con sesión pero sin rol reconocido intenta leer ventas
- **THEN** la base de datos lo rechaza por falta de permisos

### Requirement: Solo el superadmin escribe eventos
Las reglas MUST permitir crear, modificar y borrar `eventos` únicamente al superadmin. El comprador SHALL NOT poder modificar el stock de un evento. Los eventos publicados siguen siendo de lectura pública.

#### Scenario: Comprador intenta cambiar el stock
- **WHEN** un visitante intenta modificar los lotes de un evento desde la consola del navegador
- **THEN** la base de datos lo rechaza por falta de permisos

#### Scenario: Visitante ve eventos publicados
- **WHEN** un visitante abre la página de inicio
- **THEN** ve los eventos publicados

#### Scenario: Superadmin crea o aprueba un evento
- **WHEN** el superadmin crea un evento directo o aprueba una solicitud
- **THEN** la operación se realiza normalmente

### Requirement: El servidor usa permisos mínimos
El servidor SHALL acceder a la base de datos con una cuenta de servicio dedicada a los pagos que tenga solo el permiso de leer y escribir datos de Firestore. MUST NOT reutilizar la cuenta de administración general de Firebase.

#### Scenario: Revisión de permisos
- **WHEN** se revisan los permisos de la cuenta de servicio de pagos en la consola de Google Cloud
- **THEN** tiene únicamente el rol *Cloud Datastore User*

### Requirement: Los secretos no están en el repositorio
El Access Token de Mercado Pago, la clave secreta de los avisos y la clave de la cuenta de servicio MUST NOT guardarse en el repositorio ni mostrarse en pantalla o en el chat. SHALL cargarse solo como variables de entorno del servidor. El archivo de ignorados MUST cubrir las claves JSON de cuentas de servicio con el nombre que genera Google Cloud.

#### Scenario: Clave nueva dentro de la carpeta
- **WHEN** alguien deja una clave JSON de cuenta de servicio dentro de la carpeta del proyecto
- **THEN** `git status` no la ofrece para agregar

#### Scenario: Archivos del proyecto
- **WHEN** se revisan los archivos versionados
- **THEN** ninguno contiene tokens ni claves

### Requirement: Si faltan secretos, no se vende
Si falta una variable secreta del servidor, las funciones de pago MUST responder con un error de configuración y NO SHALL crear ventas ni confirmar pagos.

#### Scenario: Variable ausente
- **WHEN** falta alguna variable de entorno necesaria y alguien intenta comprar
- **THEN** el comprador ve un mensaje de error genérico y no se crea ninguna venta
