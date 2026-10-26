## Purpose

Define el Centro de ayuda del sitio del comprador: preguntas frecuentes por tema, un buscador y el formulario de consulta al final, para que la persona encuentre la respuesta antes de escribir.

## ADDED Requirements

### Requirement: Preguntas frecuentes por tema
La página de soporte SHALL mostrar las preguntas frecuentes agrupadas en cinco temas: Cómo comprar, Pagos, Mi entrada, Anulaciones y cambios, y Reprogramaciones y cancelaciones; cada pregunta se abre y se cierra para ver su respuesta.

#### Scenario: Ver los temas
- **WHEN** una persona abre la página de soporte
- **THEN** ve los cinco temas, cada uno con sus preguntas cerradas

#### Scenario: Abrir una pregunta
- **WHEN** toca una pregunta
- **THEN** se muestra su respuesta, y al tocarla otra vez se oculta

### Requirement: Respuestas que no prometen lo que no se sabe
Las respuestas SHALL decir solo lo que el sitio hace hoy; cuando una respuesta depende de una política que todavía no está definida, SHALL indicar que se escriba una consulta con el formulario.

#### Scenario: Anulaciones y reprogramaciones
- **WHEN** una persona abre una pregunta de "Anulaciones y cambios" o de "Reprogramaciones y cancelaciones"
- **THEN** la respuesta la lleva al formulario de consulta, sin plazos ni reembolsos inventados

### Requirement: Buscador de preguntas
La página SHALL tener un buscador que filtre las preguntas por su texto y el de su respuesta, sin distinguir mayúsculas ni acentos.

#### Scenario: Buscar con otras mayúsculas
- **WHEN** la persona escribe "ENTRADA"
- **THEN** ve las preguntas cuyo texto contiene "entrada", en cualquier tema

#### Scenario: Buscar sin acentos
- **WHEN** la persona escribe "devolucion" y existe una pregunta con "devolución"
- **THEN** esa pregunta aparece en el resultado

#### Scenario: Buscador vacío
- **WHEN** la persona borra el texto del buscador
- **THEN** vuelve a ver todos los temas y todas las preguntas

#### Scenario: Sin resultados
- **WHEN** ninguna pregunta coincide con lo escrito
- **THEN** ve un aviso claro y un botón que lleva al formulario de consulta

#### Scenario: Texto con etiquetas
- **WHEN** escribe `<b>hola</b>` en el buscador
- **THEN** se trata como texto, sin romper la página ni interpretarse como HTML

### Requirement: Formulario de consulta al final
La página SHALL mostrar al final el formulario de consulta con nombre, correo y mensaje, y SHALL guardar cada consulta en `consultas_publicas` con el estado `nueva`, la fecha y el origen, igual que hoy.

#### Scenario: Enviar una consulta
- **WHEN** la persona completa los tres campos y envía
- **THEN** la consulta se guarda como `nueva`, el formulario se vacía y ve la confirmación "Recibimos tu consulta, te responderemos al correo indicado."

#### Scenario: Faltan datos
- **WHEN** envía con algún campo vacío
- **THEN** ve el aviso "Completá nombre, correo y mensaje." y no se guarda nada

#### Scenario: Falla el envío
- **WHEN** el guardado falla
- **THEN** ve "No se pudo enviar la consulta. Intentá nuevamente." y puede volver a intentar

#### Scenario: Origen de la consulta
- **WHEN** llega a soporte desde la página del evento o desde el inicio
- **THEN** la consulta guarda ese origen; si el origen es otro o no existe, guarda `public/soporte.html`

### Requirement: Visible en celular
La página SHALL verse en una sola columna en celular, sin desplazamiento horizontal.

#### Scenario: Pantalla angosta
- **WHEN** se abre en una pantalla de 375 px de ancho
- **THEN** los temas, el buscador y el formulario ocupan todo el ancho y no hay scroll horizontal
