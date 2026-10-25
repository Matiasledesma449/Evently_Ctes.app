## Purpose

Define qué formas de pago muestra el sitio y de dónde salen, y que el efectivo no aparece.

## ADDED Requirements

### Requirement: Sin efectivo en ninguna pantalla
Ninguna pantalla del sitio ni del panel SHALL ofrecer "Efectivo" como forma de pago.

#### Scenario: Paso de pago de un evento
- **WHEN** una persona llega al paso de pago de cualquier evento
- **THEN** el texto no menciona el efectivo como opción

#### Scenario: Filtros del panel
- **WHEN** una persona abre los filtros de método de pago de Ventas o Reportes
- **THEN** solo aparecen métodos que tienen ventas guardadas, nunca una lista fija con "Efectivo"

### Requirement: Formas de pago reales y en un solo lugar
Las formas de pago nombradas al comprador SHALL salir de una lista compartida única, con los mismos nombres que usa el panel para las ventas.

#### Scenario: Nombres iguales en el sitio y el panel
- **WHEN** se compara el texto del paso de pago con los métodos que muestra el panel
- **THEN** los nombres coinciden (por ejemplo "Crédito" y "Débito")

### Requirement: Una prueba avisa si vuelve el efectivo
Una prueba automática SHALL fallar si alguna pantalla vuelve a ofrecer "Efectivo" como opción.

#### Scenario: Alguien agrega la opción
- **WHEN** se escribe `<option value="Efectivo">` en una página
- **THEN** `node pruebas/ejecutar-todas.js` falla y nombra el archivo
