# BACKLOG_EVENTLY

Convenciones:
- ID: ADM-xx (Admin) | SUP-xx (SuperAdmin) | USR-xx (Usuario final) | SHR-xx (Compartido)
- Estado: pendiente | en-curso | hecho | bloqueado

---

## FASE 0 — Preparación
- [x] SHR-00 — Crear BACKLOG_EVENTLY.md
- [x] SHR-01 — Crear shared/ui-utils.js
- [x] SHR-02 — Crear shared/i18n.js (esqueleto)

## FASE 1 — Correcciones críticas Admin + SuperAdmin
- [X] SHR-10 — Scrollbars independientes en shell admin (Admin + SuperAdmin)
- [X] ADM-01 / SUP-01 — Ventas: quitar filtro de eventos
- [X] ADM-02 / SUP-02 — Ventas: quitar columnas "Acciones" y "Estado" de la tabla
- [X] ADM-03 — Mis eventos: expiración 30 días + mensaje "Nos comunicaremos a la brevedad"
- [ ] SUP-03 — Panel global: "Todas las organizaciones" muestra todos los eventos

## FASE 2 — Exportaciones
- [ ] ADM-10 — Export PDF Eventos (Admin) con opción filtros/todo
- [ ] SUP-10 — Export PDF Eventos (SuperAdmin) por organización
- [ ] ADM-11 / SUP-11 — Export CSV en Ventas
- [ ] SHR-12 — Quitar método "Efectivo" de todo el sistema

## FASE 3 — SuperAdmin: Organizaciones
- [ ] SUP-20 — Crear organizaciones
- [ ] SUP-21 — Eliminar organizaciones y sus eventos
- [ ] SUP-22 — Al crear org, ofrecer "Crear evento"
- [ ] SUP-23 — "Nuevo mensaje" con todas las organizaciones

## FASE 4 — Usuario final: estructura y navegación
- [ ] USR-30 — Home como presentación + ventas (eventos activos primero)
- [ ] USR-31 — Menú horizontal con categorías
- [ ] USR-32 — Responsive + menú hamburguesa
- [ ] USR-33 — Logo Eventy → Inicio
- [ ] USR-34 — Footer con legales
- [ ] USR-35 — Páginas legales individuales

## FASE 5 — Usuario final: evento, soporte y pagos
- [ ] USR-40 — Mapa de ubicación del evento
- [ ] USR-41 — Botón de soporte global
- [ ] USR-42 — Métodos de pago reales (transferencia, crédito, débito)
- [ ] USR-43 — Export QR en PDF
- [ ] USR-44 — Quitar efectivo del flujo usuario

## FASE 6 — Legales, idioma, pulido
- [ ] USR-50 — Cambio de idioma ES/EN
- [ ] USR-51 — Unificar "Ayuda" → "Soporte"
- [ ] SHR-52 — Reemplazar alert() por modales/toasts

## FASE 7 — QA y backend
- [ ] SHR-70 — Purga real eventos rechazados >30 días
- [ ] SHR-71 — Revisar Security Rules Firestore
- [ ] SHR-72 — QA por rol