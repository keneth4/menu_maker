# Menu Maker

Plataforma para crear menús interactivos con assets animados (360° y wigglegramas) y exportación estática.

## Qué incluye este repositorio
- Documento de referencia con análisis, diseño, conclusión y plan de desarrollo.
- Base para evolucionar hacia el MVP de la plataforma.

## Documentación clave
- **Plan general y visión del producto**: [`PLATFORM_PLAN.md`](./PLATFORM_PLAN.md)

## Desarrollo en Docker
El proyecto se ejecuta dentro de un contenedor para facilitar despliegues en cualquier equipo.

```bash
docker compose up -d --build
docker compose exec app sh
```

Para detenerlo:

```bash
docker compose down
```

## Próximos pasos sugeridos
1. Definir las 5 plantillas base y priorizar la primera (Bar/Pub elegante).
2. Prototipar el flujo de carga de assets y vista previa.
3. Validar el pipeline de exportación estática.

---

Si quieres, puedo continuar con la definición técnica (stack recomendado, arquitectura inicial, estructura del repo) y el primer prototipo de interfaz.
