export type Lang = "es" | "en";

export type CredentialType = "degree" | "course" | "diploma" | "certification" | "recognition";

export type Project = {
  id: string;
  slug: string;
  title_es: string;
  title_en: string | null;
  description_es: string;
  description_en: string | null;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  tools: string[] | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Credential = {
  id: string;
  type: CredentialType;
  title_es: string;
  title_en: string | null;
  issuer: string;
  issued_date: string | null;
  description_es: string | null;
  description_en: string | null;
  image_url: string | null;
  credential_url: string | null;
  tags: string[] | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type NewsPost = {
  id: string;
  slug: string;
  title_es: string;
  title_en: string | null;
  excerpt_es: string;
  excerpt_en: string | null;
  content_es: string;
  content_en: string | null;
  app_name: string;
  image_url: string | null;
  image_urls: string[] | null;
  app_url: string | null;
  tags: string[] | null;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
