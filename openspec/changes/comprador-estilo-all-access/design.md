# Design

## Punto de partida

- `public/soporte.html`: buscador + preguntas por tema (`shared/preguntas-frecuentes.js`) y un formulario (nombre, correo, mensaje) que guarda en `consultas_publicas` con `estado: 'nueva'`, `fecha` y `origen`.
- `shared/pie-publico.js`: el pie común (Inicio, Centro de ayuda, Enviar una consulta) sin links legales.
- `public/evento.html`: "Dónde es" con el lugar y, si hay ubicación, el mapa de OpenStreetMap.
- `public/confirmacion.html`: muestra las entradas; el número de compra (`id` de la venta) solo está en la dirección.
- Las reglas de Firestore no están en el repositorio: no se sabe si `consultas_publicas` acepta campos nuevos.

## Decisiones

1. **Solicitud = consulta pública.** `shared/solicitud-de-ayuda.js` (puro) valida y arma el texto del mensaje con renglones "Asunto: …", "DNI: …", "Evento: …", "Número de compra: …" y la descripción. Se guarda con los mismos campos de siempre (`nombre`, `email`, `mensaje`, `estado`, `fecha`, `origen`). El DNI se acepta solo con números (7 u 8), sin puntos.
2. **Arrepentimiento = consulta pública** con el mensaje empezando con "ARREPENTIMIENTO DE COMPRA". El código de gestión es el id del documento que devuelve `addDoc`, que se muestra en la página. `origen` queda `public/soporte.html` (los valores de siempre).
3. **Temas con ícono y frase.** `TEMAS_DE_AYUDA` suma `icono` (Material Symbols) y `descripcion` a cada tema, y un tema nuevo "Arrepentimiento de compra" que explica el plazo y lleva a la página. El buscador no cambia.
4. **Portada.** Fondo con degradé violeta oscuro (sin foto), texto blanco, buscador con forma de píldora y botón "Buscar". Las tarjetas de temas van en grilla de 3 columnas (1 en celular) y llevan a `#tema-<id>`.
5. **Páginas legales.** HTML estático (sin base de datos), con la misma cabecera y pie que el resto. Los datos de la empresa van como "[A COMPLETAR: …]" y un aviso arriba dice que es un borrador a revisar por la productora.
6. **Pie.** `enlacesDelPie` suma los tres links legales (nunca el de la página actual). `PAGINAS_CON_PIE` suma `terminos`, `privacidad` y `arrepentimiento`.
7. **Abrir en Maps.** Link a `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` (o al texto del lugar si no hay ubicación), con `target="_blank"` y `rel="noopener noreferrer"`. No se carga nada de Google hasta que la persona toca el botón.
8. **Número de compra en la confirmación.** Se muestra el `id` de la venta como texto (ya está en la dirección de la página).

## Riesgos

- Textos legales incompletos: el aviso de borrador queda visible hasta que se completen los datos.
- Un DNI en una consulta es un dato personal: es opcional y se guarda en la misma colección que ya guarda nombre y correo, que solo lee el superadmin.
