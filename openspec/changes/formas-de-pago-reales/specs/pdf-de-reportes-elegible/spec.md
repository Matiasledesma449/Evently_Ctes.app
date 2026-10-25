## Purpose

Define cómo se elige qué lleva el PDF de Reportes antes de exportarlo.

## ADDED Requirements

### Requirement: Elegir las secciones del PDF
Antes de exportar, Reportes SHALL mostrar una casilla por cada sección del PDF (Resumen general, Desglose por lote, Detalle de transacciones, Métodos de pago, Indicadores clave), todas marcadas al empezar. El PDF SHALL incluir solo las marcadas, en el orden de siempre.

#### Scenario: Se desmarca una sección
- **WHEN** se desmarca "Detalle de transacciones" y se exporta
- **THEN** el PDF no trae esa sección y las demás se numeran 1, 2, 3, 4 sin saltos

#### Scenario: Todo marcado
- **WHEN** se exporta sin tocar las casillas
- **THEN** el PDF trae las 5 secciones, como hoy

### Requirement: Al menos una sección
Si no hay ninguna sección marcada, Reportes SHALL avisar en pantalla que hay que elegir al menos una y SHALL NOT generar el archivo.

#### Scenario: Todo desmarcado
- **WHEN** se desmarcan todas las casillas y se pulsa exportar
- **THEN** aparece el aviso y no se descarga ningún archivo

### Requirement: Los filtros siguen valiendo
Las secciones elegidas SHALL respetar el evento, el lote y el método de pago filtrados en pantalla, igual que hoy.

#### Scenario: Filtro por método
- **WHEN** hay un método de pago filtrado y se exporta
- **THEN** cada sección elegida se calcula con las ventas de ese método
