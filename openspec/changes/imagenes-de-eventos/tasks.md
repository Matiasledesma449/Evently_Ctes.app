# Tasks

Convención: "se comprueba" dice cómo verificarlo. Las funciones puras se prueban con `node` (sin navegador ni Firebase). Las pantallas se prueban con la skill `auditar-panel` (Playwright, Firebase y Storage falsos, datos inventados). Lo que no se pueda ver sin una cuenta real se anota como pendiente del usuario. Un commit por grupo, con el agente `revisor` antes; sin push.

## 1. La imagen de un evento, en un solo lugar

- [x] 1.1 Crear `shared/imagen-evento.js` con `imagenDelEvento`, `rellenoDelEvento`, `htmlDeImagenEvento` y `crearImagenEvento` según `design.md`. Se comprueba con `node -e`: foto `https://` válida se devuelve igual; vacía, ausente, `javascript:`, `http://` y con espacios devuelven relleno; el relleno de un mismo evento es idéntico en dos llamadas; dos ids distintos dan relleno distinto en una muestra de 6 ids; evento sin nombre da `?`. (Hecho: `shared/imagen-evento.js`; verificado con la prueba 16 con `node`.)
- [x] 1.2 Crear `pruebas/16-imagen-de-evento.js` con un caso por escenario de `specs/imagen-de-evento/spec.md` (incluye nombre con `<img onerror>`, URL peligrosa, evento sin id ni nombre, el HTML sin etiquetas sueltas y con `onerror`). Se comprueba con `node pruebas/16-imagen-de-evento.js` y con `node pruebas/ejecutar-todas.js` (16 archivos). (Hecho: 21 casos en `pruebas/16-imagen-de-evento.js`; `ejecutar-todas` pasa con 16 archivos.)

## 2. Usar la función en todas las páginas

- [x] 2.1 `public/index.html`: tarjetas y evento destacado usan la función compartida (sin relleno `./imag/...`). Se comprueba en `auditar-panel`: dos eventos sin foto se ven con rellenos distintos y uno con foto muestra la foto. (Hecho: Inicio, tarjetas y destacado; el destacado usa fondo violeta fuerte y letra clara por la capa oscura. Visto en captura propia.) 
- [x] 2.2 `public/evento.html`: la imagen y el nombre usan la función compartida y el nombre se escapa. Se comprueba: mismo relleno o foto que en Inicio para el mismo evento; nombre con etiquetas se ve como texto. (Hecho: página del evento con la función y nombre, fecha, lugar y descripción escapados; la prueba 10 se adaptó a los módulos compartidos.)
- [x] 2.3 `admin/eventos-seleccion.html`: tarjetas con la función compartida, nombre escapado y `onerror`. Se comprueba igual que 2.2. (Hecho: lista de Eventos con la función y nombre escapado; se ve en captura propia.)
- [x] 2.4 `admin/aprobaciones.js`: la tarjeta de solicitud usa la función compartida (sin foto de Unsplash) y, al aprobar, se sigue copiando `imagen` al evento. Se comprueba: la tarjeta de una solicitud sin foto muestra relleno; con `node`, que `dataEvento.imagen` conserva la URL. (Hecho: tarjetas de solicitudes con la función compartida (con foto, la foto; sin foto, el relleno) y aprobar sigue copiando `imagen` (prueba I24).)
- [x] 2.5 Buscar con `grep` cualquier otra página que muestre la imagen de un evento y que no esté en la lista. Se comprueba mostrando la salida del `grep`: ninguna página queda con su propio relleno. (Hecho: `grep` sin otras páginas que muestren la imagen de un evento ni rellenos viejos; `data.js` no se carga en ninguna página. Prueba I22 e I23.)
- [x] 2.6 Agregar a `auditar-panel` datos de un evento con foto y dos sin foto, y el chequeo de que el mismo evento se ve igual en Inicio, página del evento y lista de Eventos, y de que una foto rota muestra el relleno. Se comprueba corriéndola y rompiendo algo a propósito (por ejemplo, un relleno fijo) para ver que lo detecta. (Hecho: `auditar-panel` con `--solo-imagenes`: mismo evento igual en las tres páginas, foto rota con relleno, dos sin foto distintos, nombre con etiquetas sin ejecutar código, solicitudes. Mutación detectada.)

## 3. Subida desde "Solicitar evento"

- [x] 3.1 En `admin/eventos.html`: validar el tipo, achicar con `<canvas>` (1600 px, JPEG 0.85), mostrar la vista previa del archivo achicado y rechazar lo que siga pasando de 2 MB. Se comprueba en `auditar-panel` con una imagen grande de prueba y un PDF. (Hecho y verificado con `auditar-panel` (Storage falso): una foto de 4000x3000 se achica a JPEG de hasta 2 MB con vista previa; un PDF se rechaza con aviso. No se probó con una foto real de un celular.)
- [x] 3.2 En `admin/eventos.html`: subir a `eventos_solicitudes/<uid>/<Date.now()>.jpg`, mensajes dentro de la página (sin `alert`) y no enviar la solicitud si la subida falla o sigue en curso. Se comprueba con un Storage falso en `auditar-panel`: subida bien (se envía con la URL), subida con error (mensaje claro y ninguna solicitud creada) y envío durante la subida (bloqueado). (Hecho y verificado con `auditar-panel`: ruta `eventos_solicitudes/<uid>/<número>.jpg`, avisos dentro de la página sin ventanas emergentes, con subida fallida o en curso no se crea la solicitud; una mutación que quita el bloqueo es detectada. La subida contra Storage real queda para la prueba del usuario.)
- [x] 3.3 Sin foto elegida, la solicitud se envía con `imagen: ''`. Se comprueba en la misma prueba. (Hecho: sin foto se envía igual y no se sube nada; verificado en `auditar-panel`.)

## 4. Reglas de Storage

- [x] 4.1 Crear `storage.rules` y `firebase.json` según `design.md`. Se comprueba con `firebase_validate_security_rules` (o `firebase deploy --only storage --dry-run`) sin errores, y leyendo que no hay claves ni rutas personales. (Hecho: `storage.rules` y `firebase.json`; `firebase_validate_security_rules` dice "No errors detected".)
- [ ] 4.2 Confirmar con una consulta de solo lectura si Storage está habilitado en `evently-b612b`. Se comprueba anotando lo que responde; si no está habilitado, se frena y se le explica al usuario qué hacer en la consola.
- [ ] 4.3 **Con OK explícito del usuario en el chat**, publicar las reglas. Se comprueba leyendo las reglas activas con `firebase_get_security_rules`. Sin el OK, esta tarea queda sin marcar y se deja anotada.

## 5. Revisión final

- [x] 5.1 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas. Se comprueba con la salida (los avisos de "el menú tarda" que cambian de página entre corridas se repiten antes de dar el problema por real). (`node pruebas/ejecutar-todas.js`: 16 archivos bien; auditoría completa de `auditar-panel`: 54 combinaciones, 0 problemas.)
- [x] 5.2 Confirmar que no cambió nada fuera de lo previsto. Se comprueba con `git diff --stat`: solo las páginas de la lista, `shared/imagen-evento.js`, `storage.rules`, `firebase.json`, la prueba nueva, `auditar-panel` (fuera del repo) y este change. (`git diff --stat` revisado: solo las páginas de la lista, `shared/imagen-evento.js`, la prueba 16 (y la 10, adaptada), este change, `storage.rules`, `firebase.json` y `CLAUDE.md`.)
- [x] 5.3 Actualizar `CLAUDE.md` (la función compartida de imagen y que las fotos viven en Storage con reglas versionadas). Se comprueba leyendo el archivo: sin claves ni rutas personales. (CLAUDE.md actualizado.)
- [ ] 5.4 Pedirle al usuario una sola prueba real: entrar con una cuenta de organización, solicitar un evento con una foto y ver que aparece igual en las páginas. Se anota el resultado; hasta entonces el change queda "verificado con datos inventados".
