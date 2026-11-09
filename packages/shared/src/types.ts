import type { CategorySlug } from './categories';

export interface ProductImage {
  /** Caminho público (ex.: /images/products/lancha-1.webp) */
  src: string;
  alt: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  images: ProductImage[];
  specs: ProductSpec[];
  features: string[];
  /** null = não informado pela empresa */
  availability: string | null;
  featured: boolean;
  /** true = dado demonstrativo, deve ser substituído pelo catálogo oficial */
  isDemo: boolean;
  /** Origem da informação (ex.: publicação no Instagram oficial e data) */
  source?: string;
}

export interface CategoryWithCount {
  slug: CategorySlug;
  name: string;
  description: string;
  productCount: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface FormSubmissionResponse {
  ok: true;
  id: string;
}
