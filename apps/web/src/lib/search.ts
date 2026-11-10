import { normalize } from '@/lib/api';

/** Termos que indicam que a pessoa procura um serviço (reparo, manutenção...), não um produto. */
const SERVICE_TERMS = /(repar|manuten|consert|solda|pintur|revis|reform|servi|instal)/;

/**
 * A busca parece ser por um serviço? Usado no catálogo para sugerir a página
 * Serviços quando não há produto correspondente.
 */
export function looksLikeService(q: string): boolean {
  return SERVICE_TERMS.test(normalize(q));
}
