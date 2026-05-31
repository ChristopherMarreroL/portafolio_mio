# Portafolio personal

Sitio web construido con Astro, TypeScript, Tailwind CSS 4 y Supabase para presentar perfil, proyectos y trayectoria formativa. Incluye un panel administrativo para crear, editar, eliminar, publicar y despublicar contenido sin modificar archivos JSON manualmente.

## Tecnologias
- Astro 5 con adapter de Vercel para SSR.
- TypeScript habilitado en Astro.
- Tailwind CSS 4 via `@tailwindcss/vite`.
- Supabase Auth, PostgreSQL y Storage.

## Instalacion
- Ejecuta `npm install` para instalar dependencias.
- Ejecuta `npm run dev` para desarrollo local.
- Ejecuta `npm run build` para generar el build de produccion.
- Ejecuta `npm run preview` para previsualizar el build.

## Variables De Entorno
Crea `.env.local` en la raiz del proyecto con estas variables:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_KEY=
```

No uses `service_role` ni claves secretas en el frontend. `.env.local` esta ignorado por Git.

Tambien existen ejemplos en `.env.example` y `sample/.env.example`.

## Configurar Supabase
- Abre tu proyecto de Supabase.
- Ve a SQL Editor.
- Ejecuta el contenido de `supabase/schema.sql`.
- El SQL crea las tablas `projects` y `credentials`.
- El SQL activa Row Level Security en ambas tablas.
- El SQL crea politicas para lectura publica solo de registros `published = true`.
- El SQL crea politicas para que usuarios autenticados puedan administrar todo el contenido.
- El SQL crea o actualiza el bucket publico `portfolio-media`.
- Las politicas de Storage permiten lectura publica y escritura solo a usuarios autenticados.

## Usuario Administrador
- Ve a Supabase Auth.
- Crea un usuario con email y password.
- Usa ese usuario para entrar al panel en `/admin/login`.

## Panel Administrativo
- `/admin/login`: iniciar sesion.
- `/admin/dashboard`: resumen de proyectos, credenciales, publicados y no publicados.
- `/admin/projects`: listar, publicar/despublicar y eliminar proyectos.
- `/admin/projects/new`: crear proyecto.
- `/admin/projects/edit/[id]`: editar proyecto.
- `/admin/credentials`: listar, filtrar, publicar/despublicar y eliminar credenciales.
- `/admin/credentials/new`: crear credencial.
- `/admin/credentials/edit/[id]`: editar credencial.

## Contenido Publico
- Proyectos publicos se leen desde Supabase `projects` con `published = true`.
- Cursos, certificaciones, diplomas, reconocimientos y estudios se leen desde Supabase `credentials` con `published = true`.
- El idioma se mantiene con los campos `title_es`, `title_en`, `description_es` y `description_en`.
- Las imagenes subidas desde el panel se guardan en Supabase Storage y se persisten como URL publica en `image_url`.

## Estructura Breve
- `src/pages/en/index.astro` y `src/pages/es/index.astro`: paginas publicas.
- `src/pages/admin/`: rutas del panel administrativo.
- `src/components/sections/`: Hero, ProjectsSection, CoursesSection, ContactSection.
- `src/components/`: tarjetas reutilizables (`ProjectCard`, `CourseCard`), UI (`Modal`, `Card`), layout (`Navbar`, `Footer`).
- `src/lib/supabase.ts`: cliente reutilizable de Supabase.
- `src/types/content.ts`: tipos reutilizables de proyectos y credenciales.
- `supabase/schema.sql`: schema, RLS y Storage.
- `public/`: imagenes estaticas existentes.
