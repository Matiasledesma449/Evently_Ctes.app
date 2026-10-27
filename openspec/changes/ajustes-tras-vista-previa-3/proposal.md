# Proposal

## Why

La persona probó la vista previa (2026-10-26, noche) y pidió:
- "Agregar admin" falla con `auth/admin-restricted-operation`: el proyecto de Firebase no deja crear cuentas desde la página.
- Saber cuánto pagarle a cada productora (sin la comisión) y ver el balance con gráficos por evento, organización y período.
- Un pie de página como el de All Access, con logos que cargue el superadmin.
- Entrar a la página de Evently desde el panel (superadmin y admin) y ver cada evento publicado.
- Editar eventos ya creados para corregirlos (por ejemplo, lotes que se ven los dos a la vez).

## What Changes

1. **Alta de admins por el servidor**: `api/crear-admin.js` (lógica en `server/admins.js`). Verifica el token del superadmin,
   crea la cuenta con `firebase-admin` y la guarda en `usuarios`. Si el correo ya tenía acceso sin cuenta de Evently, la
   vincula. Así no hace falta habilitar el registro abierto (que dejaría a cualquiera crearse una cuenta y leer datos).
   **Requiere** darle a la cuenta de servicio el rol "Administrador de Firebase Authentication" en Google Cloud.
2. **Finanzas** (superadmin): pestaña **Balance** (tarjetas, gráfico de barras por semana/mes/trimestre/semestre/año,
   filtros por organización y evento, ranking por organización y por evento, tabla) y pestaña **Liquidaciones** (a pagar a
   cada productora por período, con el detalle por evento y CSV). Gráficos en SVG propio: no se suma ninguna librería.
3. **Pie estilo All Access** en el sitio del comprador (oscuro con el violeta de Evently) y página **Sitio** para que el
   superadmin cargue, ordene y quite los logos del pie (`configuracion/sitio`). **Requiere** una regla nueva de Firestore.
4. **Ver sitio** en el menú y **Ver en Evently** en cada evento publicado (admin y superadmin).
5. **Editar evento** (superadmin): el formulario de Crear evento cargado con el evento. Los lotes que existen no se borran
   ni se renombran (el servidor confirma cada venta por la posición y el nombre del lote); la cantidad no baja de lo vendido.

## Reglas de Firestore a publicar (la persona)

```
match /configuracion/sitio {
  allow read: if true;
  allow write: if esSuperadmin();
}
```
