# Portafolio personal

Sitio web construido con Astro y Tailwind CSS 4 para presentar mi perfil, proyectos y trayectoria formativa. Incluye tarjetas interactivas, modales con galerias e indices rapidos a cada seccion.

## Secciones principales
- Hero: saludo breve, CTA a proyectos y cursos, enlaces a GitHub y LinkedIn.
- Proyectos: tarjetas con descripcion, stack y acceso a la galeria/modales; datos en `src/data/projects.json`.
- Cursos y certificaciones: listado agrupado por tipo (Diploma, Certificacion, Reconocimiento, Otros); datos en `src/data/courses.json`.
- Contacto: enlaces directos a email, LinkedIn y GitHub.

## Tecnologias
- Astro 5
- Tailwind CSS 4 (config simplificada via `@tailwindcss/vite`)
- TypeScript habilitado en Astro

## Scripts
- `npm install` para dependencias.
- `npm run dev` inicia el entorno local.
- `npm run build` genera los artefactos de produccion en `dist/`.
- `npm run preview` sirve el build generado.

## Estructura breve
- `src/pages/index.astro`: compone las secciones.
- `src/components/sections/`: Hero, ProjectsSection, CoursesSection, ContactSection.
- `src/components/`: tarjetas reutilizables (`ProjectCard`, `CourseCard`), UI (`Modal`, `Card`), layout (`Navbar`, `Footer`).
- `src/data/`: archivos JSON con proyectos y cursos.
- `public/`: imagenes de proyectos y certificados.
