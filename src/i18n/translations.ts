export type Lang = "es" | "en";

export const t = {
  es: {
    nav: { projects: "Proyectos", courses: "Cursos", contact: "Contacto" },
    hero: {
      hi: "Hola, soy",
      subtitle:
        "Desarrollador enfocado en C# .NET y SQL Server. Construyo soluciones web y móviles con buena UX y mantenimiento.",
      viewProjects: "Ver proyectos",
    },
    sections: {
      projects: "Proyectos",
      courses: "Cursos y certificaciones",
      contact: "Contacto",
    },
    buttons: { open: "Abrir", preview: "Vista previa", sendEmail: "Enviar correo" },
  },
  en: {
    nav: { projects: "Projects", courses: "Courses", contact: "Contact" },
    hero: {
      hi: "Hi, I'm",
      subtitle:
        "Developer focused on C# .NET and SQL Server. I build web and mobile solutions with good UX and maintainability.",
      viewProjects: "View projects",
    },
    sections: {
      projects: "Projects",
      courses: "Courses & certifications",
      contact: "Contact",
    },
    buttons: { open: "Open", preview: "Preview", sendEmail: "Send email" },
  },
} as const;
