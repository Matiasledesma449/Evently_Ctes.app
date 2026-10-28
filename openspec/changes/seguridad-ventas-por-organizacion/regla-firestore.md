# Regla de Firestore para `ventas`

En la consola de Firebase → Firestore Database → Reglas, **reemplazá** el bloque `match /ventas/{...}` que tengas por este
(dentro de `match /databases/{database}/documents { ... }`). Usa las funciones `esSuperadmin()` y `estaLogueado()` que ya
están en tus reglas. Publicalo recién **después** del merge a `main` y de correr la herramienta
`completar-organizacion-de-ventas.js`.

```
match /ventas/{ventaId} {
  // La organización de quien lee ('' si no tiene)
  function organizacionDeQuienLee() {
    return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.get('organizacionId', '');
  }
  // El superadmin lee todas; una organización, solo las de sus eventos
  allow read: if esSuperadmin()
    || (estaLogueado()
        && organizacionDeQuienLee() != ''
        && resource.data.organizacionId == organizacionDeQuienLee());
  // Solo el servidor (firebase-admin) crea y cambia ventas
  allow write: if false;
}
```

## Cómo comprobarlo (Simulador de reglas de la consola)

1. `get` de una venta de tu organización, autenticado con el UID de un admin de esa organización → **permitido**.
2. `get` de una venta de otra organización con el mismo UID → **denegado**.
3. `get` con el UID del superadmin → **permitido**.
4. `create` o `update` con cualquier UID → **denegado**.
5. Lo más importante: entrar al panel con una cuenta de organización y ver que Resumen, Ventas y Reportes cargan sus ventas
   (el simulador prueba documentos sueltos; el panel hace consultas, que Firestore aprueba solo si piden `organizacionId`).
