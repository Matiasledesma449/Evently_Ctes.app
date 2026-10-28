# Proposal

## Why

La persona pidió (2026-10-26) que, en el panel del superadmin, **Mensajes** y **Consultas públicas** estén en una misma sección, divididas en "Mensajes de las organizaciones" y "Consultas públicas". Hoy son dos entradas separadas del menú y no se ve que son lo mismo: la bandeja de lo que le escriben a Evently.

## What Changes

- El menú del superadmin tiene **una sola entrada, "Mensajes"**, con un aviso rojo que suma los mensajes sin leer de las organizaciones y las consultas públicas nuevas. Desaparece la entrada "Consultas públicas" (escritorio y celular).
- Arriba de las dos pantallas aparece la misma **barra de pestañas**: "Organizaciones" y "Consultas públicas", cada una con su propio contador. La pestaña activa se ve en violeta. Cambiar de pestaña no cambia de sección en el menú.
- Las dos pantallas siguen funcionando igual por dentro (lista + detalle, estados nuevo / leído / respondido).
- Un enlace viejo a `consultas-publicas.html` sigue funcionando: abre la pestaña "Consultas públicas".

## Capabilities

### New Capabilities
- `bandeja-unificada`: la sección "Mensajes" del superadmin con sus dos pestañas y el aviso que suma las dos.

### Modified Capabilities

(Ninguna: el proyecto todavía no tiene especificaciones principales en `openspec/specs/`.)

## Qué queda fuera de alcance

- La cuenta de organización: su "Soporte" no cambia.
- Cómo se responde una consulta pública o un mensaje.

## Por qué esta opción y no otra

- **Dos archivos con una barra de pestañas común** y no un solo archivo con todo el código junto: las dos pantallas ya tienen el mismo diseño y cada una tiene mucho código propio y probado; juntarlas en un archivo es un cambio grande con riesgo de romper algo que anda. Para quien lo usa es una sola sección con dos pestañas.

## Impact

- Se modifican `shared/menu-admin.js` (una sola entrada y la barra de pestañas), `shared/menu-rol.js` (aviso que suma las dos), `admin/mensajes.html` y `admin/consultas-publicas.html` (la barra arriba).
- Se actualiza la skill de auditoría (menú esperado).

## Cómo se verifica

- Con el navegador automático y datos inventados: el menú del superadmin tiene "Mensajes" y no "Consultas públicas"; las dos pantallas muestran la barra con la pestaña correcta en violeta; el aviso suma las dos; en celular la barra entra sin correrse de costado.
- A mano (la persona): con su cuenta, ver que llegan los mensajes y las consultas reales a cada pestaña.
