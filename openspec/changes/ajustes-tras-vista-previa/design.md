# Design

## 1. Estética del comprador
- `shared/cabecera-publica.js` dibuja la cabecera con texto fijo (sin datos de afuera): logo → `index.html`, links "Eventos" y "Centro de ayuda" (el de la página actual se marca en violeta). Cada página trae un `<header id="cabecera">` vacío.
- Paleta: fondo `#f7f7f9`, tarjetas blancas con borde gris claro y `rounded-2xl`, violeta `#7c3aed` / `#6d28d9`, títulos `gray-900`, texto `gray-600/700`. La portada del Centro de ayuda pasa a un degradé violeta claro (el mismo violeta del sitio) en lugar del violeta casi negro.
- Pie: texto `gray-600`, links `gray-700` con subrayado al pasar, fondo blanco con borde.

## 2. Organizaciones en Eventos y cuentas de admin
- Pestañas en `eventos-seleccion.html` y `organizaciones.html` (como Mensajes): "Eventos" y "Organizaciones". `organizaciones.html` queda como la pestaña; el menú pierde la entrada.
- **Crear cuenta sin servidor**: `shared/cuentas-admin.js` inicializa una **segunda app de Firebase** (`initializeApp(config, 'altas')`) y crea el usuario con `createUserWithEmailAndPassword` en esa app, así la sesión del superadmin no cambia. Después el superadmin (app principal) escribe `usuarios/{uid}` con `rol: 'organizacion'`, `email`, `organizacionId` (las reglas ya permiten que el superadmin escriba `usuarios`). La segunda app cierra su sesión al terminar.
- La clave se genera en el navegador con `crypto.getRandomValues` (12 caracteres, sin caracteres confusos), se muestra una vez con un botón "Copiar" y no se guarda en ningún lado. Opción "Mandarle el correo para elegir su contraseña" (`sendPasswordResetEmail`).
- Si la cuenta ya existe y es de otra organización: aviso + botón "Mover a esta organización". Si es superadmin: no se puede vincular.
- "Quitar" pone `organizacionId: ''` en la cuenta (no borra la cuenta).

## 3. Lotes
- Campos nuevos por lote: `tipo` (`'fechas'` o `'siempre'`), `desde` y `hasta` (`AAAA-MM-DD`), `habilitadoManual` (bool, solo superadmin). `vigencia` (texto) se sigue llenando para mostrar ("01/11 al 20/11").
- `shared/lotes.js` (puro, también lo usa el servidor por `require` con los `export` quitados como las pruebas, o una copia CommonJS en `server/`): `estadoDeLote(lote, hoy)` → `'disponible' | 'proximo' | 'finalizado'`. Lotes viejos sin `tipo` ni fechas → disponibles (como hoy).
- `server/compra.js` usa la misma regla: si el lote no está disponible, responde 409 "Este lote todavía no está a la venta" / "Este lote ya terminó".
- Edición del superadmin: en la tarjeta de cada evento de Eventos, "Editar lotes" abre un cuadro con fechas y el interruptor "Habilitar ahora"; guarda con `updateDoc` del arreglo `lotes` completo (solo superadmin por reglas).

## 4. Mapa con punto
- `activarLugarConMapa` muestra el mapa desde el inicio (centrado en Corrientes), con marcador arrastrable; tocar el mapa mueve el marcador. Al soltar, se pide la dirección a Nominatim `reverse` (una vez por movimiento, en español) y se completa el campo de lugar; la ubicación queda guardada aunque no se elija una sugerencia.
