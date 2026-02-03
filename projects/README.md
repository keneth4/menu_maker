# Estructura de proyectos

Cada proyecto vive en una carpeta propia y contiene su configuracion y assets.

```
projects/
  <slug>/
    menu.json
    assets/
      backgrounds/
      dishes/
      sounds/
```

Durante desarrollo, estos archivos se sirven desde `public/projects/<slug>`.
El objetivo final es que el editor pueda leer y escribir estas carpetas de
forma local, y exportar un ZIP estatico por proyecto.
