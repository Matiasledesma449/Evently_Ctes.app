## Purpose

Define cómo lo que se exporta del panel dice de qué evento es.

## ADDED Requirements

### Requirement: El PDF de Reportes dice el evento
El PDF de Reportes SHALL mostrar el evento (o "Todos los eventos") arriba del documento y SHALL incluirlo en el nombre del archivo, junto con la fecha. El nombre del archivo no contiene tildes, espacios ni caracteres especiales y tiene un largo máximo.

#### Scenario: Un evento
- **WHEN** se exporta el PDF con el evento "Fiesta de Verano" elegido el 2026-10-25
- **THEN** el archivo se llama `Evently_Reporte_Fiesta-de-Verano_2026-10-25.pdf` y el documento dice "Evento: Fiesta de Verano"

#### Scenario: Todos los eventos
- **WHEN** se exporta el PDF con "Todos los eventos"
- **THEN** el archivo lleva `Todos-los-eventos` en el nombre y el documento lo dice arriba

#### Scenario: Nombre con caracteres raros
- **WHEN** el evento se llama `Noche/de "Rock" <3`
- **THEN** el nombre del archivo no contiene `/`, comillas ni `<`, y el PDF muestra el nombre como texto, sin interpretarlo

### Requirement: Cifras del PDF iguales a la pantalla
Las cifras del PDF SHALL ser las mismas que las de la pantalla de Reportes con el mismo evento, lote y método (ya vale hoy; se mantiene).

#### Scenario: Mismo filtro
- **WHEN** se exporta el PDF con un evento, un lote y un método elegidos
- **THEN** sus totales coinciden con los de la pantalla
