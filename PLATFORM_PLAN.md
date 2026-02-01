# Plataforma de menús interactivos para restaurantes

## 1. Análisis de negocio

### 1.1. Problema y oportunidad
Los menús tradicionales en restaurantes suelen ser estáticos, poco memorables y con limitaciones para mostrar el platillo de forma atractiva. En un contexto donde los restaurantes buscan diferenciarse y aumentar el ticket promedio, una experiencia visual inmersiva y personalizable puede convertirse en una ventaja competitiva directa.

El uso de **assets 3D (Gaussian splattings)** y **animaciones 360° / wigglegramas** permite presentar cada platillo como una pieza visual protagonista. Esto incrementa la percepción de valor del producto, impulsa la curiosidad del cliente y puede aumentar la conversión hacia platillos con mayor margen.

### 1.2. Propuesta de valor
- **Experiencia memorable**: menús animados, inmersivos y “vivos”.
- **Personalización rápida**: cambios de platos, precios e idiomas sin depender de desarrolladores.
- **Exportación sin servidor**: el restaurante obtiene un sitio estático, fácil de publicar.
- **Mobile-first**: diseñado para consumo en dispositivos móviles y QR.
- **Gestión de plantillas**: 5 estructuras base para crear menús coherentes en minutos.

### 1.3. Clientes objetivo
- Restaurantes, bares, pubs y cafeterías que buscan una experiencia moderna.
- Negocios turísticos que quieren impresionar a clientes internacionales.
- Dark kitchens o marcas enfocadas en delivery que desean un sitio visualmente impactante.

### 1.4. Modelo de negocio sugerido
- **Suscripción mensual** por número de menús o locales activos.
- **Pago único** por exportación premium con branding removido.
- **Servicios adicionales**: captura de assets 3D, creación de wigglegramas, set up inicial.

### 1.5. Competencia y diferenciación
- Competidores: plantillas de menú digitales, PDF interactivos o sistemas tipo QR.
- Diferenciación principal: **contenido 3D y animación visual** + **exportación sin backend**.

---

## 2. Diseño de ideas

### 2.1. Experiencia base
1. **Pantallas de fondo animadas** (3–5 wigglegramas) que rotan automáticamente.
2. **Barra o carrusel central** con platillos/bebidas (assets 360° animados).
3. **Selector de idiomas global** (por ejemplo, Español/Inglés/Francés).
4. **Ficha de platillo** con nombre, descripción, precio y alérgenos.

### 2.2. Plantillas (5 estructuras base)
1. **Bar / Pub elegante** (foco en bebidas y snacks).
2. **Restaurante de alta cocina** (experiencia minimalista + historia del platillo).
3. **Café o brunch** (estilo cálido, visual, rápido).
4. **Street food** (colores intensos, interacción rápida, categorías grandes).
5. **Menú degustación** (navegación lineal por “tiempos”).

### 2.3. Editor de menús (plataforma)
- **Formulario guiado** para cargar:
  - Fondos animados (gif/mp4/webm)
  - Assets 360° por platillo
  - Categorías (Entradas, Platillos, Postres, Bebidas)
  - Idiomas y traducciones
- **Vista previa en tiempo real** con el layout de la plantilla seleccionada.
- **Opciones de estilo**: tipografías, colores, orden de categorías.
- **Exportación** en formato estático (HTML + assets) empaquetado en ZIP.

### 2.4. Arquitectura conceptual (patrones recomendados)
Se sugiere adoptar patrones de diseño reconocidos por su escalabilidad y mantenibilidad (ver [refactoring.guru](https://refactoring.guru/)):
- **Factory Method**: para generar instancias de plantillas diferentes sin acoplar la lógica.
- **Strategy**: para aplicar distintas reglas de renderizado entre plantillas.
- **Facade**: para simplificar el proceso de exportación y empaquetado.
- **Observer**: para actualizar la vista previa en tiempo real cuando cambia un asset.
- **Builder**: para construir el menú exportable paso a paso con parámetros opcionales.

### 2.5. Criterios técnicos clave
- **Mobile-first**: toda decisión de interfaz, rendimiento y flujo se valida primero en móvil.
- **Test-driven**: se escribe la prueba antes de la implementación (unit, integration y e2e).
- **Assets GIF**: no se usan splats en runtime; se priorizan GIF/MP4/WEBM optimizados para carga rápida.
- **Interactividad 360°**: el GIF/asset 360° puede responder a gestos horizontales para simular rotación.

### 2.6. Stack recomendado (orientado a rendimiento móvil)
- **Frontend**: Svelte + Vite + TypeScript (bundle ligero, excelente performance móvil).
- **Estilos**: Tailwind CSS (consistencia visual y velocidad de iteración).
- **Testing**: Vitest (unit/integration) + Playwright (e2e y mobile emulation).
- **Exportación estática**: build a HTML/CSS/JS + assets (sin backend).
- **Optimización assets**: pipeline de compresión (GIF/MP4/WEBM) y lazy loading.

---

## 3. Plan de desarrollo (etapas y milestones, test-driven)

### Etapa 0 — Investigación y definición
**Objetivo:** alinear visión, alcance del MVP y requisitos críticos de performance móvil.

**Milestones**
- Documento de requisitos (funcionales y no funcionales).
- Benchmark de formatos (GIF/MP4/WEBM) y límites de peso por asset.
- Lista inicial de assets requeridos para prototipo (fondos + 360°).

**Assets requeridos (para iniciar el prototipo)**
- 3–5 fondos animados (GIF/MP4/WEBM) del restaurante/bar.
- 3–6 assets 360° por categoría (GIF/MP4/WEBM).
- Textos base en al menos 2 idiomas (nombre + descripción + precio).

**Pruebas**
- Definir criterios de rendimiento (LCP, peso máximo de assets).

### Etapa 1 — Base técnica y arquitectura
**Objetivo:** construir la base del proyecto en contenedor y con arquitectura modular.

**Milestones**
- Stack definido (frontend, build, testing) enfocado a performance móvil.
- Arquitectura basada en patrones (Factory Method, Strategy, Builder).
- Pipeline de pruebas automatizado (unit/integration/e2e).

**Pruebas**
- Unit tests para compositores de plantilla.
- Integration tests para pipeline de exportación.

### Etapa 2 — MVP (plantilla Bar/Pub)
**Objetivo:** primer menú interactivo con fondo animado y carrusel de bebidas.

**Milestones**
- Editor básico: cargar fondos y assets 360°.
- Vista previa mobile-first con navegación por categorías.
- Selector de idioma global con textos base.

**Pruebas**
- e2e de flujo editor → preview → export.
- Tests de accesibilidad (contraste, navegación táctil).

### Etapa 3 — Exportación y optimización
**Objetivo:** generar sitios estáticos confiables y ligeros.

**Milestones**
- Exportación a ZIP (HTML + assets + manifest).
- Optimización de assets (compresión y lazy loading).
- Soporte offline básico (cache estático).

**Pruebas**
- Tests de peso máximo del bundle.
- Tests de carga en dispositivos móviles de gama media.

### Etapa 4 — Producto estable y escalable
**Objetivo:** consolidar 5 plantillas y mejorar experiencia de edición.

**Milestones**
- 5 plantillas listas.
- Multi-idioma completo por platillo.
- Biblioteca de estilos y tipografías.

**Pruebas**
- Regression tests por plantilla.
- Visual tests para layouts mobile.

---

## 4. Conclusión
La propuesta de plataforma atiende una necesidad real: mejorar la presentación y percepción de valor en menús de restaurantes. El uso de animaciones 360° y wigglegramas aporta diferenciación visual clara, mientras que la exportación sin servidor elimina fricción técnica para el cliente final.

Con una arquitectura basada en patrones de diseño sólidos, el producto puede escalar hacia nuevas plantillas, nuevos formatos de contenido y funciones comerciales (analytics, A/B testing, etc.).

---

## 5. Ejemplo de caso de uso: Menú Bar/Pub elegante

- **Fondos**: 3–5 wigglegramas del bar.
- **Bebidas**: carrusel animado con rotación 360°.
- **Selección**: al tocar una bebida se muestra su GIF 360°, nombre y precio.
- **Idiomas**: selector global (es/en).
- **Exportación**: sitio estático listo para hosting y QR.

---

## 6. Recomendaciones finales
- Priorizar **mobile-first**, rendimiento y fluidez de animaciones.
- Definir un pipeline para convertir assets 3D → GIF/MP4 optimizados.
- Iniciar con una sola categoría (bebidas) para validar el flujo.
- Considerar desde el inicio la arquitectura basada en patrones para evitar reescrituras.
