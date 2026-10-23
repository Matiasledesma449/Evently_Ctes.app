# Design

## Context

Estado de hoy, visto en el código y en Firebase (solo lectura):

- **Subida** (`admin/eventos.html`, solicitar evento): elige archivo, botón "Subir imagen" → `uploadBytes` a `eventos_solicitudes/<Date.now()>_<nombre>` con `window.storage` → guarda la URL en un campo oculto `#imagenUrl` → la solicitud se guarda con `imagen`. Límite 2 MB, errores con `alert`. Ya bloquea el envío si hay subida en curso o si se eligió archivo y no se subió.
- **Aprobación** (`admin/aprobaciones.js`): copia `solicitud.imagen` a `eventos.imagen`. Para mostrar la tarjeta usa una foto de Unsplash si no hay imagen.
- **Mostrar el evento:** `public/index.html` (`imagenEvento`, relleno `./imag/Imagen de evento 1.jpg`, con `onerror` hacia un marcador), `public/evento.html` (mismo relleno, nombre sin escapar), `admin/eventos-seleccion.html` (relleno `/public/imag/...`, nombre sin escapar, sin `onerror`).
- **Datos:** los 4 eventos en Firestore tienen `imagen` vacía o ausente.
- **Storage:** `firebase_get_security_rules` para Storage devuelve "No active Storage rules" (puede no estar habilitado o no tener reglas). El bucket figura en `shared/firebase-init.js`. No hay `firebase.json` ni `storage.rules` en el repo.
- Las páginas de `public/` ya cargan módulos de `../shared/` (por ejemplo `firebase-init.js`), así que un módulo nuevo en `shared/` se sirve igual (Vercel sirve la raíz).

## Goals / Non-Goals

**Goals:**
- Una sola función decide la imagen de un evento; las páginas no la repiten.
- Que la subida funcione y falle con claridad.
- Storage con reglas mínimas y versionadas.

**Non-Goals:**
- Rediseñar las tarjetas o la página del comprador.
- Editar o migrar datos existentes.
- Reglas de Firestore, pagos, vaciar datos.

## Decisions

### 1. `shared/imagen-evento.js` (módulo, funciones puras)
- `imagenDelEvento(evento)` → `{ src, relleno }`. `src` es la URL si es una cadena que, ya recortada, empieza con `https://` y no tiene espacios ni caracteres de control; si no, `''`. `relleno` es siempre un objeto `{ letra, fondo, texto }`.
- `rellenoDelEvento(evento)`: la letra es la primera letra o número del nombre en mayúscula (`?` si no hay nombre); el color sale de una lista fija de 6 violetas/índigos de la paleta, elegido con un hash simple del `id` (si no hay `id`, del nombre). Mismo evento, mismo resultado; ids distintos suelen dar colores o letras distintas.
- `htmlDeImagenEvento(evento, { clases })` → HTML con `<img>` (si hay `src`) y el relleno detrás, listo para `innerHTML`, con todo escapado y `onerror` que muestra el relleno. Para páginas que arman el DOM con `createElement` (Inicio, solicitudes) se exporta también `crearImagenEvento(evento, documento)` que devuelve el elemento.
- **Por qué no una foto de relleno distinta por evento:** hacen falta archivos que nadie mantiene y se repiten al haber más eventos que fotos. El relleno por color y letra no necesita archivos, queda dentro de la paleta violeta y no se confunde con una foto real.
- **Alternativa descartada:** sacar la foto de Unsplash por palabra clave del evento. Depende de un servicio externo, no es estable y puede mostrar algo que no corresponde al evento.

### 2. Qué se hace con `Imagen de evento 1.jpg`
Deja de ser el relleno de todos los eventos. El archivo queda en el repo sin usarse (borrarlo se decide después, como los `data.js` duplicados).

### 3. Subida en `admin/eventos.html`
- Al elegir el archivo se valida el tipo (JPG, PNG, WebP) y se achica en el navegador con `<canvas>` (lado mayor 1600 px, JPEG calidad 0.85); el archivo achicado es el que se sube y el que se ve en la vista previa. Si el resultado pesa más de 2 MB, se rechaza.
- La ruta pasa a `eventos_solicitudes/<uid>/<Date.now()>.jpg` (sin usar el nombre original: evita caracteres raros y datos personales en la ruta). Hace falta `auth.currentUser`; sin sesión se explica y no se sube.
- Los mensajes (éxito, error, "esperá a que termine") van en un `<p role="status">` de la página; se quitan los `alert` de este flujo.
- Se mantiene el comportamiento actual de bloquear el envío mientras se sube o si hay archivo sin subir, y se conserva el botón "Subir imagen" (decisión mínima: no se pasa a subida automática para no cambiar el flujo que la persona ya conoce).
- Sin foto, la solicitud se envía con `imagen: ''` (la foto es opcional, como hoy).

### 4. `storage.rules` y `firebase.json`
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /eventos_solicitudes/{uid}/{archivo} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.contentType.matches('image/(jpeg|png|webp)')
                   && request.resource.size < 3 * 1024 * 1024;
    }
  }
}
```
Todo lo demás queda cerrado. `firebase.json` mínimo con la clave `storage` apuntando a ese archivo, para poder publicar con `firebase deploy --only storage`. La lectura es pública porque las fotos de eventos se muestran a compradores sin sesión. Aceptado: cualquiera con la dirección exacta puede verlas, como en cualquier sitio de eventos. No se permite borrar ni sobrescribir fotos ajenas (solo la dueña de la carpeta puede escribir).

**Publicar:** la acción es del usuario o con su OK explícito en el chat; antes se valida la sintaxis con `firebase_validate_security_rules`. Si Storage no está habilitado en el proyecto, hay que habilitarlo desde la consola de Firebase (lo hace el usuario) y puede pedir un plan de pago: se le avisa antes de seguir.

### 5. Cómo se prueba
- `pruebas/16-imagen-de-evento.js` carga `shared/imagen-evento.js` con `vm` (quitando `export`, como en las pruebas 13–15) y cubre cada escenario de la especificación, incluidos nombres con etiquetas, `javascript:`, evento sin nombre y sin id.
- `auditar-panel`: sus datos inventados incluyen un evento con foto y otro sin foto (dos sin foto, con ids distintos). Chequeos: el mismo evento se ve igual en Inicio, página del evento y lista de Eventos; dos sin foto se ven distintos; una foto rota muestra el relleno. La subida contra Storage real no se puede probar con datos falsos; se prueba el flujo con un Storage falso (éxito y error) y se anota que la subida real queda para la prueba del usuario o con una cuenta de prueba.

## Risks / Trade-offs

- **Storage puede no estar habilitado** o exigir otro plan: es una acción del usuario en la consola; se detecta antes de publicar las reglas.
- **Subida real sin probar por mí:** necesita sesión de organización; se verifica con un Storage falso y el usuario la prueba una vez publicadas las reglas.
- **Fotos subidas a mano en `eventos_solicitudes/` sin uid** (no hay ninguna conocida): quedarían bajo reglas cerradas para escribir, pero legibles solo si coinciden con la ruta nueva; como Storage no tenía reglas, no se espera que existan.
- **Redimensionar en el navegador** puede fallar en navegadores viejos: en ese caso se sube el original si pesa menos de 2 MB, o se rechaza con un mensaje.
