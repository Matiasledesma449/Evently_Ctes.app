# Design

## Punto de partida (lo que hay hoy)

Se leyó el código de la rama `claude/nube-2026-10-26-0400`:

- **Rol con el que se mira.** `shared/menu-admin.js` define `window.rolEfectivo(rolReal)`, que devuelve `'organizacion'` si un superadmin activó "Ver como organización" (`localStorage.vistaComo`). Solo lo usan el menú (`menu-admin.js`) y `menu-rol.js`. `admin/eventos-seleccion.html` decide con `miUsuario.rol === 'superadmin'` (rol real); por eso, en la vista de organización, sigue mostrando las categorías y el filtro de organizaciones. `admin/eventos.html` y `admin/soporte.html` también usan el rol real.
- **Pertenencia de un evento: cuatro implementaciones.** `eventosDeLaPersona` en `shared/ventas-utils.js` (la usan el selector y Reportes), la función `organizacionDeEvento` y el filtro de `renderizarEventosCliente` dentro de `eventos-seleccion.html`, y el cruce por tres claves de `admin/aprobaciones.js`. Todas aceptan `organizacionId`, `creadoPor` o correo, cada una a su manera. Para el superadmin, `eventosDeLaPersona` devuelve todos los eventos aunque esté en la vista de organización.
- **Organización.** No existe como entidad: es un usuario con `rol: 'organizacion'` y un campo `organizacionId`. Los eventos y solicitudes pueden llevar `organizacionId`, `creadoPor` y `correo`.
- **Formas de pago.** `shared/formas-de-pago.js` tiene `FORMAS_DE_PAGO = ['Transferencia','Débito','Crédito']` y `nombreParaMostrar` ("Dinero en cuenta" se muestra como "Transferencia"). Pero `metodosDePago(ventas)` en `shared/ventas-utils.js` arma el filtro con lo que haya guardado en las ventas, y los filtros comparan el texto guardado: por eso aparecen nombres viejos y no siempre las tres formas.
- **Categorías del costo de servicio.** El panel y el selector por evento están en `admin/eventos-seleccion.html` (`panelServicio`, documento `configuracion/comisiones`).
- **Cuentas.** No hay registro en el panel: las cuentas se crean fuera de él.

## Decisiones

### 1. Una sola función de pertenencia: `shared/organizaciones.js`
Funciones puras, sin red:
- `eventosDeOrganizacion(eventos, organizacionId)`: los eventos cuyo `organizacionId` es exactamente ese. Sin `organizacionId` en la persona devuelve vacío.
- `eventosParaVer({ eventos, rolEfectivo, organizacionId, organizacionElegida })`: superadmin sin vista → todos; vista de organización → los de `organizacionElegida` (o vacío si no eligió); organización → los de su `organizacionId`. Recibe también `rolReal`: así una organización real nunca puede mirar otra pasando `organizacionElegida` (solo el superadmin en la vista).
- `organizacionDeEvento(evento, organizaciones)`: la organización del evento o `null` ("Sin organización").
- `validarOrganizacion({ nombre }, existentes)`: nombre entre 1 y 60 caracteres, sin repetir (sin distinguir mayúsculas ni espacios sobrantes).

`eventosDeLaPersona` de `ventas-utils.js` se conserva con su nombre (lo importan el selector, Reportes y la prueba 15) pero pasa a delegar en esta función. Las pruebas viejas que verifican los criterios de `creadoPor` y correo se **reescriben** al criterio nuevo.

- Alternativa descartada: mantener los tres criterios "por compatibilidad". Es justo lo que hace que cada pantalla cuente distinto. Se acepta que los eventos viejos sin `organizacionId` no se vean para los admins; la limpieza de datos los quita.

### 2. Qué se guarda
- Colección nueva `organizaciones/{id}`: `{ nombre, creadaEn }`. El `id` de la organización es el `organizacionId` que llevan los eventos, las solicitudes y las cuentas.
- `usuarios/{uid}.organizacionId` (ya existe el campo): lo escribe el superadmin al vincular la cuenta por correo.
- `eventos/{id}.organizacionId` y `solicitudes_eventos/{id}.organizacionId`. Al aprobar una solicitud, el evento hereda el de la solicitud (`{ ...solicitud }` ya lo copia; se verifica y se corta si falta).
- Crear evento directo (superadmin): el formulario pide elegir la organización y no deja guardar sin ella.

### 3. Vincular admins por correo, sin crear cuentas
En la pantalla de organizaciones, el superadmin escribe el correo de una cuenta que ya existe (`usuarios` con `rol: 'organizacion'`) y se escribe `organizacionId` en ese documento. Si el correo no existe, se avisa. No se crean cuentas de acceso desde el panel (ver pregunta 1 de la propuesta).

### 4. "Ver como organización" elige la organización
Se suma una clave `localStorage.vistaOrganizacionId` junto a `vistaComo`. Cuando la vista está activa, la barra violeta existente muestra un desplegable con las organizaciones. Todas las listas usan `eventosParaVer`. Sin organización elegida, las listas quedan vacías con el aviso "Elegí una organización". Cambia solo lo que se ve: los permisos reales no cambian.

Para que cada pantalla use el mismo criterio se agrega `window.vistaOrganizacion()` en `menu-admin.js` junto a `rolEfectivo`.

- Alternativa descartada: dejar que la vista muestre todos los eventos (como hoy): es lo que confunde.

### 5. Rol efectivo en cada pantalla
Se revisan todas las páginas de `admin/` y se cambia la lectura de `rol === 'superadmin'` por `window.rolEfectivo(rolReal) === 'superadmin'` en lo que es **qué se muestra**. Lo que protege de verdad (redirecciones de seguridad, reglas de Firestore) no cambia. `eventos.html` sigue llevando al superadmin real a `?modo=directo`; en la vista de organización el menú ya avisa sin navegar.

### 6. Categorías de porcentaje en "Crear evento"
El panel (`panelServicio`) y la validación existente (`shared/categorias-comision.js`) pasan de `eventos-seleccion.html` a `eventos.html?modo=directo`. En el formulario de crear evento se agrega un desplegable de categoría (por defecto "Sin categoría = 0%"). En la lista de Eventos solo queda, para el superadmin real, el selector de categoría por evento ya existente (para eventos que ya están creados); se oculta en la vista de organización. El cálculo del costo no se toca.

### 7. Formas de pago: lista fija
Se agrega en `shared/formas-de-pago.js`:
- `claveDeFormaDePago(guardado)`: devuelve `'Transferencia'`, `'Débito'`, `'Crédito'` u `'Otros'` según lo que guardó el servidor ("Dinero en cuenta" → Transferencia; "Débito" y "Crédito" iguales; lo demás → Otros).
- `opcionesDeFiltroDePago(ventas)`: `['todos', 'Transferencia', 'Débito', 'Crédito']` más `'Otros'` solo si alguna venta cae ahí.

`filtrarVentas` compara por `claveDeFormaDePago`. Ventas, Reportes, Resumen y el PDF usan estas dos funciones. Las cifras (montos, cantidades) no cambian: solo cambian nombres y agrupación.

- "Prepaga": va a "Otros" salvo que la persona decida otra cosa (pregunta 4 de la propuesta); se cambia en un solo lugar.

### 8. Conteos coherentes
Resumen (por su selector), Eventos, Ventas y Reportes obtienen su lista de eventos con `eventosParaVer`. Una prueba arma un conjunto de eventos de dos organizaciones y comprueba que las cuatro vistas devuelven lo mismo para la misma cuenta.

### 9. Limpieza de datos: `herramientas/limpiar-datos.js`
Un programa de Node que corre la persona, con `firebase-admin` (ya está en `package.json`). Por defecto muestra por colección cuántos documentos borraría y termina. Para borrar hay que pasar `--borrar` y escribir una frase de confirmación. Colecciones que vacía: `eventos`, `ventas`, `solicitudes_eventos` (con `--solo <colección>` se elige una). Conserva siempre `usuarios`, `configuracion` y `organizaciones`. Las credenciales se indican con la variable `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un archivo local: el programa no lo lee a la vista ni lo imprime, y el repositorio no incluye ninguna clave. Lleva un `LEEME.md` con los pasos. La nube no la ejecuta ni tiene credenciales para hacerlo.

### 10. Reglas de Firestore (las publica la persona)
Texto para sumar a las reglas actuales:

```
match /organizaciones/{id} {
  allow read: if estaLogueado();
  allow write: if esSuperadmin();
}
```

Y para vincular admins, `usuarios` ya permite escribir solo al superadmin (`allow write: if esSuperadmin()`), así que no hace falta cambiarlo. Los eventos ya solo los escribe el superadmin.

## Riesgos

- **Eventos viejos sin `organizacionId`.** Dejan de verse para los admins. Mitigación: el superadmin los ve marcados "Sin organización" y la limpieza de datos los quita; la persona ya quiere empezar de cero.
- **Una cuenta sin `organizacionId`** no ve ningún evento. Se comprueba al vincularla y se muestra un aviso en el panel de esa cuenta.
- **Romper los eventos que ya pasaron en las pruebas viejas.** Mitigación: se reescriben solo las pruebas de pertenencia; las demás cifras no cambian y se comprueba con `node pruebas/ejecutar-todas.js`.
- **Reglas de Firestore sin publicar.** Sin la regla de `organizaciones`, la lista no carga. La pantalla muestra un aviso claro y no inventa datos.
- **Tocar muchas pantallas a la vez.** Mitigación: tareas chicas, una pantalla por vez, y revisión final a mano con la persona.

## Cómo se verifica

- Con `node`: pruebas nuevas de `shared/organizaciones.js`, de `claveDeFormaDePago` y `opcionesDeFiltroDePago`, y de coherencia entre las cuatro vistas; la prueba 15 reescrita; `ejecutar-todas.js` completo.
- A mano con la persona: superadmin en "Ver como organización" (elegir organización, sin categorías ni filtro de organizaciones), una cuenta de organización real, y crear una organización nueva con un evento a su nombre.
- La limpieza: primero sin confirmar y revisar la lista; después, solo la persona, con confirmación.
