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
- El SQL crea las tablas `projects`, `credentials` y `news_posts`.
- El SQL activa Row Level Security en las tablas de contenido.
- El SQL crea politicas para lectura publica solo de registros `published = true`.
- El SQL crea una allowlist `portfolio_admins` y limita la administracion a esos usuarios.
- El SQL crea o actualiza el bucket publico `portfolio-media`.
- Las politicas de Storage permiten lectura publica y escritura solo a administradores autorizados.
- El bucket limita las cargas a imagenes PNG, JPEG o WEBP de hasta 5 MB.

## Usuario Administrador
- Ve a Supabase Auth.
- Crea un usuario con email y password.
- Desactiva nuevos registros públicos en la configuración de Supabase Auth.
- Ejecuta `supabase/schema.sql` despues de crear el usuario.
- Agrega expresamente el UUID correcto desde SQL con `insert into public.portfolio_admins (user_id) values ('UUID_DEL_ADMIN');`.
- Confirma la configuracion con `select * from public.portfolio_admins;` antes de desplegar el frontend actualizado.
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
- `/admin/news`: listar, publicar/despublicar y eliminar articulos.
- `/admin/news/new`: crear un articulo bilingue.
- `/admin/news/edit/[id]`: editar un articulo.
- Al reemplazar o eliminar contenido desde el panel, las imagenes subidas se retiran tambien de Supabase Storage.
- Cada articulo admite hasta tres imagenes; la primera funciona como portada y las restantes como galeria.
- La fecha de cada articulo se elige mediante un calendario interactivo en el panel.

## Contenido Publico
- Proyectos publicos se leen desde Supabase `projects` con `published = true`.
- Cursos, certificaciones, diplomas, reconocimientos y estudios se leen desde Supabase `credentials` con `published = true`.
- Los articulos se publican en `/articulos` (espanol) y `/articles` (ingles), con una URL indexable por publicacion.
- El sitemap dinamico incluye automaticamente los articulos publicados en ambos idiomas.
- El idioma se mantiene con los campos `title_es`, `title_en`, `description_es` y `description_en`.
- Las imagenes subidas desde el panel se guardan en Supabase Storage y se persisten como URL publica en `image_url`.

## Estructura Breve
- `src/pages/articulos/` y `src/pages/articles/`: archivo y detalle bilingue de articulos.
- `src/pages/admin/`: rutas del panel administrativo.
- `src/components/sections/`: Hero, ProjectsSection, CoursesSection, ContactSection.
- `src/components/`: tarjetas reutilizables (`ProjectCard`, `CourseCard`), UI (`Modal`, `Card`), layout (`Navbar`, `Footer`).
- `src/lib/supabase.ts`: cliente reutilizable de Supabase.
- `src/types/content.ts`: tipos reutilizables de proyectos y credenciales.
- `supabase/schema.sql`: schema, RLS y Storage.
- `public/`: imagenes estaticas existentes.
