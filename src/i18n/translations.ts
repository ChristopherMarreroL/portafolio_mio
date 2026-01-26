export type Lang = "es" | "en";

export const t = {
  es: {
    nav: { projects: "Proyectos", courses: "Cursos", contact: "Contacto" },
    hero: {
      hi: "Hola, soy",
      subtitle: "Desarrollador de Software Full Stack enfocado en la creación de soluciones web y móviles. Construyo aplicaciones escalables, con buena experiencia de usuario y mantenimiento a largo plazo.",
      viewProjects: "Ver proyectos"
    },
    sections: {
      projects: "Proyectos",
      courses: "Cursos y certificaciones",
      contact: "Contacto",
    },
    buttons: { 
      open: "Abrir", 
      preview: "Vista previa", 
      sendEmail: "Enviar correo" 
    },
    footer: {
      rights: "Todos los derechos reservados.",
      techTitle: "Tecnologías"
    },
  },
  en: {
    nav: { projects: "Projects", courses: "Courses", contact: "Contact" },
    hero: {
      hi: "Hi, I'm",
      subtitle: "Full Stack Software Developer focused on building web and mobile solutions. I create scalable applications with strong UX and long-term maintainability.",
      viewProjects: "View projects"
    },
    sections: {
      projects: "Projects",
      courses: "Courses & certifications",
      contact: "Contact",
    },
    buttons: { 
      open: "Open", 
      preview: "Preview", 
      sendEmail: "Send email" 
    },
    footer: {
      rights: "All rights reserved.",
      techTitle: "Technologies"
    },
  },
} as const;
