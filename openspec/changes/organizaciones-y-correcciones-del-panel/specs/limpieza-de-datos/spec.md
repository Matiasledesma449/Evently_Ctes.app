## Purpose

Define la herramienta con la que la persona vacía los datos de prueba para empezar de cero, mostrando antes qué se borraría y borrando solo con su confirmación.

## ADDED Requirements

### Requirement: La herramienta solo la corre la persona
La limpieza SHALL ser un programa que corre la persona en su computadora; el sitio, el navegador y el trabajo automático de la nube SHALL no poder ejecutarla ni borrar datos con ella.

#### Scenario: Desde el navegador
- **WHEN** alguien usa el sitio o el panel
- **THEN** no existe ninguna pantalla ni botón que dispare la limpieza

#### Scenario: Trabajo automático
- **WHEN** corre el trabajo automático de la nube
- **THEN** no ejecuta la herramienta

### Requirement: Vista previa por defecto
Sin una confirmación explícita, la herramienta SHALL solo mostrar, por colección, cuántos documentos borraría, y SHALL no borrar nada.

#### Scenario: Correrla sin confirmar
- **WHEN** la persona la corre sin la confirmación
- **THEN** ve cuántos eventos, ventas y solicitudes borraría y el aviso de que no se borró nada

### Requirement: Qué se borra y qué se conserva
La herramienta SHALL poder vaciar los eventos, las ventas y las solicitudes de eventos, y SHALL conservar siempre las cuentas de usuario, la configuración de categorías y las organizaciones.

#### Scenario: Borrar con confirmación
- **WHEN** la persona confirma
- **THEN** se vacían esas colecciones y quedan intactos los usuarios, la configuración y las organizaciones

#### Scenario: Elegir qué vaciar
- **WHEN** la persona indica una sola colección
- **THEN** solo esa se vacía

### Requirement: Confirmación escrita y resultado
Para borrar, la herramienta SHALL pedir que la persona escriba una frase de confirmación, y al terminar SHALL informar cuántos documentos borró de cada colección.

#### Scenario: Confirmación equivocada
- **WHEN** la persona escribe otra cosa
- **THEN** no se borra nada

#### Scenario: Informe final
- **WHEN** termina el borrado
- **THEN** muestra cuántos documentos borró de cada colección

### Requirement: Sin claves en el repositorio
La herramienta SHALL tomar las credenciales de un archivo local indicado por la persona y SHALL no incluir ni mostrar ninguna clave.

#### Scenario: Credenciales
- **WHEN** la persona la corre
- **THEN** indica la ubicación de su archivo de credenciales y el programa no lo imprime ni lo copia
