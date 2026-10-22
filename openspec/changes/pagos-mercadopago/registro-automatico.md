# Registro de trabajo automático

Una entrada por tarea, de la más nueva a la más vieja. Cada tarea es un commit en la rama `auto/pagos-mercadopago`, así que se puede deshacer una sin afectar las demás.

Para encontrar el commit de una tarea (por ejemplo la 4.1) y deshacerlo:

```
git log --oneline --grep "tarea 4.1"
git revert <hash>
```

Los avances manuales anteriores a este registro (tareas 1.x a 3.x) no figuran acá.

---

## Tarea 4.1: verificar la firma del aviso
- **Fecha:** 2026-10-21
- **Rama:** `auto/pagos-mercadopago`
- **Archivos:** `server/firma.js` (nuevo), `tasks.md` (4.1 marcada)
- **Comprobación:** 17 casos con `node -e` y una clave de ejemplo. Pasan la firma correcta, `v1` en mayúsculas y `data.id` numérico. Fallan un carácter cambiado, `v1` corto, sin `ts`, sin `v1`, `ts`/`data.id`/`request-id` distintos, sin `request-id`, sin `data.id`, clave equivocada, sin clave, encabezado ausente o basura.
- **Push:** menor (archivo nuevo y una línea de `tasks.md`), se sube a `auto/pagos-mercadopago`.
- **Pendiente relacionado:** el 401 lo da el endpoint, que se crea en 4.2. No se agregó límite de antigüedad del `ts`.
