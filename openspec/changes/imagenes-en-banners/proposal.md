# Proposal

## Why

Pedido 21 de la persona (28/10): los banners de las secciones del sitio tienen que poder llevar una imagen. La persona pasa
las imágenes después.

## What Changes

- `shared/banners.js` (prueba 42): una lista con la imagen de cada banner (Centro de ayuda, Términos, Privacidad y
  Arrepentimiento). Sin imagen, queda el violeta de siempre; con imagen, se pone de fondo con un velo violeta para que el
  texto blanco se siga leyendo.
- Las imágenes van en `public/assets/banners/` (con un LEEME de cómo agregarlas). Solo se aceptan nombres de archivo
  simples (jpg, png o webp), para que nada raro entre en el estilo de la página.
- Las cuatro páginas llaman a `aplicarBanner` al cargar.

## Pendiente

- Las imágenes: cuando la persona las pase, se copian a la carpeta y se escribe su nombre en la lista.
