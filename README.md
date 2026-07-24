# Embarkation Zone — Totem 01

Interfaz táctil 4K vertical (2160 × 3840) construida con HTML, CSS y JavaScript sin dependencias.

## Interacciones

- Tocar el vídeo central abre el panel LED animado y desenfoca el vídeo.
- El selector izquierdo admite toque, arrastre vertical y teclado.
- Los controles derechos e inferiores responden al toque.
- Un toque en la esquina inferior derecha entra en pantalla completa.
- Un doble toque en esa misma zona sale de pantalla completa.
- `Esc` cierra el popup y `F` alterna la pantalla completa.

## Desarrollo local

Sirve la carpeta con cualquier servidor estático. Por ejemplo:

```powershell
npx serve .
```

La composición tiene un lienzo interno fijo de 2160 × 3840 y se escala automáticamente
para previsualizarla en pantallas de cualquier tamaño.
