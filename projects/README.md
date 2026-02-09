# Estructura de proyectos (`public/projects`)

Cada proyecto vive en una carpeta propia y contiene su configuracion y assets.

```
public/projects/
  <slug>/
    menu.json
    assets/
      backgrounds/
      dishes/
      sounds/
```

Durante desarrollo y pruebas en contenedor, estos archivos se sirven desde
`/projects/<slug>` (mapeados desde `public/projects/<slug>`).
El editor puede leer/escribir assets via modo `filesystem` o `bridge` y
exportar un ZIP estatico por proyecto.
