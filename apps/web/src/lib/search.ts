import { normalizeText } from '@cn/shared';

/**
 * Radicais que indicam que a pessoa procura um SERVIÇO (reparo, manutenção...)
 * e não um produto do catálogo. Inclui grafias comuns com erro ("concerto",
 * "manutençao" sem til) e descrições de problema ("furo", "vazando").
 */
const SERVICE_STEMS =
  /(repar|reparo|manuten|consert|concert|arrum|solda|pintur|pintar|revis|reform|servi|instal|estofar|furo|furad|vazam|vazand|infiltr|trinc|rachad|amass|quebr|defeit)/;

/**
 * Sintomas de defeito (UX-27): quem descreve o problema ("motor falhando",
 * "não liga", "barco furado") também procura um serviço. Testado sobre o texto
 * normalizado (sem acento, minúsculo). "liga"/"pega"/"funciona" só contam com
 * "não" antes, para "liga de alumínio" não virar serviço.
 */
const DEFECT_PATTERNS = [
  /(^| )falh/, // falha, falhando, falhou
  /defeit/,
  /quebr/,
  /(^| )pif/, // pifou
  /engasg/,
  /furad|(^| )furo/,
  /vaza/, // vazando, vazamento, vazou
  /problem/,
  /estragad|estragou/,
  /(^| )(nao|n) (liga|ligou|pega|pegou|funciona|funcionou|da partida|anda|acelera)( |$)/,
  /(^| )parou( |$)/,
  /(^| )morrendo( |$)|(^| )morre( |$)/,
  /superaquec|esquentando/,
  /fumac/,
];

const MOTOR_WORD = /(^| )(motor|motores|motr|moto|popa|rabeta)( |$)/;

/** A busca descreve um defeito/sintoma? (texto já normalizado) */
function hasDefect(text: string): boolean {
  return DEFECT_PATTERNS.some((re) => re.test(text));
}

/** Palavras de serviço usadas para tolerar 1 erro de digitação ("repraro", "manutencao"). */
const SERVICE_WORDS = [
  'reparo',
  'reparar',
  'conserto',
  'consertar',
  'manutencao',
  'revisao',
  'reforma',
  'reformar',
  'arrumar',
  'estofar',
  'solda',
  'soldar',
  'pintura',
  'servico',
  'servicos',
  'instalacao',
];

/** Distância de edição ≤ 1 (troca, inserção, remoção ou inversão de vizinhas). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * A busca parece ser por um serviço? Usado no catálogo para sugerir a página
 * Serviços quando não há produto correspondente.
 */
export function looksLikeService(q: string): boolean {
  const text = normalizeText(q);
  if (!text) return false;
  if (SERVICE_STEMS.test(text) || hasDefect(text)) return true;
  return text
    .split(' ')
    .some((w) => w.length >= 5 && SERVICE_WORDS.some((s) => withinOneEdit(w, s)));
}

/**
 * A busca fala de problema no motor ("motor falhando", "motor não liga",
 * "problema no motor", "conserto de motor")? No catálogo, leva ao pedido
 * "Problema ou revisão no motor" (MOTOR_ISSUE_HREF). Só "motor" não basta:
 * quem quer comprar um motor encontra os motores de popa normalmente.
 */
export function looksLikeMotorIssue(q: string): boolean {
  const text = normalizeText(q);
  if (!text || !MOTOR_WORD.test(text)) return false;
  return looksLikeService(text);
}
