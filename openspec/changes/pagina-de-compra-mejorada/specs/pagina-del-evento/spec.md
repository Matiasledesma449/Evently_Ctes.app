## Purpose

Define el orden y el contenido de las secciones de la página del evento, de lo que se compra a lo que se sabe del lugar, sin cambiar cómo se compra ni cómo se paga.

## ADDED Requirements

### Requirement: Orden de las secciones
La página del evento SHALL mostrar, de arriba hacia abajo: el afiche con el nombre, los días y el lugar; las entradas (lotes y cantidad); "Sobre el evento" con el detalle; y "Dónde es" con el lugar y el mapa.

#### Scenario: Evento completo
- **WHEN** se abre un evento con foto, varios días, detalle y ubicación
- **THEN** las secciones aparecen en ese orden y cada una lleva su título

#### Scenario: Evento sin detalle
- **WHEN** el evento no tiene detalle cargado
- **THEN** "Sobre el evento" muestra el texto "¡No te lo pierdas!"

#### Scenario: Evento sin ubicación
- **WHEN** el evento no tiene un punto de mapa guardado
- **THEN** "Dónde es" muestra solo el lugar como texto, sin cuadro de mapa

#### Scenario: Evento viejo
- **WHEN** se abre un evento anterior a los días por evento
- **THEN** se ve con la fecha de siempre y sin errores

### Requirement: La compra no cambia
Elegir lote y cantidad, ver el resumen y el total, completar los datos y pagar con Mercado Pago SHALL funcionar igual que antes: mismos pasos, mismas validaciones, máximo de 10 entradas, y el precio lo sigue calculando el servidor.

#### Scenario: Elegir un lote
- **WHEN** la persona toca un lote
- **THEN** queda marcado y el total se actualiza

#### Scenario: Seguir al pago
- **WHEN** toca "Continuar con el pago" con un lote elegido
- **THEN** ve el paso de datos y resumen, y las secciones "Sobre el evento" y "Dónde es" siguen visibles

#### Scenario: Volver a elegir
- **WHEN** toca "Volver a seleccionar entradas"
- **THEN** vuelve a ver los lotes con lo que había elegido

### Requirement: Ayuda desde el evento
El botón "Ayuda" de la página SHALL llevar al Centro de ayuda, indicando que viene desde el evento.

#### Scenario: Tocar Ayuda
- **WHEN** la persona toca "Ayuda" en la página del evento
- **THEN** se abre el Centro de ayuda y, si envía una consulta, queda guardada con el origen `public/evento.html`

### Requirement: Visible en celular
La página SHALL verse en una sola columna en celular, con el botón de continuar al alcance y sin desplazamiento horizontal.

#### Scenario: Pantalla angosta
- **WHEN** se abre un evento en una pantalla de 375 px de ancho
- **THEN** las secciones se apilan en una columna y el mapa ocupa todo el ancho sin salirse
