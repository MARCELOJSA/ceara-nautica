import type { CategorySlug, RequestType } from '@cn/shared';

/**
 * Conteúdo editorial do site. SOMENTE fatos confirmados pela empresa
 * (bio e publicações do Instagram oficial). Nada de números, prazos, marcas
 * ou garantias que não tenham sido publicados.
 */

export interface Service {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  points: string[];
  image: string;
  imageAlt: string;
  cta: { label: string; to: string };
  /** Caminho extra e explícito (ex.: motor com problema → tipo "motor-revisao"). UX-22 */
  secondaryCta?: { label: string; to: string };
}

/** Link do orçamento já com o tipo "Problema ou revisão no motor" (UX-22). */
export const MOTOR_ISSUE_HREF = '/orcamento?servico=motor-revisao';
export const MOTOR_ISSUE_LABEL = 'Problema no motor? Descreva aqui';

export const SERVICES: Service[] = [
  {
    slug: 'fabricacao',
    title: 'Fabricação de embarcações em alumínio',
    kicker: 'Estaleiro',
    summary:
      'Fabricamos embarcações em alumínio com projeto 100% personalizado — lanchas, canoas, botes e semi-chatas pensados para os rios da Amazônia, com foco em resistência, leveza, segurança, conforto e durabilidade.',
    points: [
      'Projeto definido junto com você, conforme o uso',
      'Pintura personalizada: você escolhe a cor',
      'Entrega para outras regiões — já entregamos em Belém e no Suriname',
    ],
    image: '/images/servicos/fabricacao.webp',
    imageAlt: 'Soldador trabalhando em estrutura metálica no estaleiro',
    cta: { label: 'Orçar uma embarcação', to: '/orcamento?servico=fabricacao' },
  },
  {
    slug: 'reparos',
    title: 'Reparos em embarcações',
    kicker: 'Reparos',
    summary:
      'Reparos em embarcações de alumínio para recolocar o seu barco na água com segurança. Avaliamos o problema e indicamos a solução adequada.',
    points: [
      'Avaliação da embarcação',
      'Reparos em embarcações de alumínio',
      'Indicação da solução adequada',
    ],
    image: '/images/servicos/reparos.webp',
    imageAlt: 'Casco de alumínio desgastado aguardando reparo',
    cta: { label: 'Solicitar avaliação', to: '/orcamento?servico=reparos' },
  },
  {
    slug: 'manutencao',
    title: 'Manutenção náutica',
    kicker: 'Manutenção',
    summary:
      'Manutenção náutica em Manaus para manter a sua embarcação pronta para navegar e prolongar a vida útil do casco e do acabamento. Descreva o que precisa no pedido e a equipe confirma se atende o seu caso.',
    points: [
      'Manutenção de embarcações',
      'Cuidado com casco e acabamento',
      'Motor de popa: descreva o problema e a equipe confirma se atende',
    ],
    image: '/images/servicos/manutencao.webp',
    imageAlt: 'Profissional fazendo manutenção na hélice de uma embarcação',
    cta: { label: 'Solicitar manutenção', to: '/orcamento?servico=manutencao' },
    secondaryCta: { label: MOTOR_ISSUE_LABEL, to: MOTOR_ISSUE_HREF },
  },
  {
    slug: 'motores',
    title: 'Revenda de motores de popa',
    kicker: 'Motores de popa',
    summary:
      'Revendemos motores de popa em Manaus, com orientação para escolher a motorização certa para o seu tipo de embarcação e de uso. Para manutenção ou revisão do motor, descreva o problema no pedido de orçamento e a equipe confirma se atende.',
    points: [
      'Orientação na escolha da potência',
      'Motor e embarcação pensados em conjunto',
      'Marcas e modelos sob consulta',
    ],
    image: '/images/servicos/motores.webp',
    imageAlt: 'Motor de popa instalado na popa de uma embarcação',
    cta: { label: 'Consultar motores', to: '/orcamento?servico=motores&categoria=motores-de-popa' },
    secondaryCta: { label: MOTOR_ISSUE_LABEL, to: MOTOR_ISSUE_HREF },
  },
  {
    slug: 'estofamento',
    title: 'Estofamento náutico',
    kicker: 'Estofamento',
    summary:
      'Estofamentos para embarcações: assentos, poltronas almofadadas e reforma de estofados, para mais conforto a bordo.',
    points: [
      'Assentos e poltronas sob medida',
      'Reforma de estofados',
      'Materiais e cores sob consulta',
    ],
    image: '/images/servicos/estofamento.webp',
    imageAlt: 'Assentos e almofadas estofados a bordo de uma embarcação',
    cta: {
      label: 'Orçar estofamento',
      to: '/orcamento?servico=estofamento&categoria=estofamentos',
    },
  },
];

export interface GalleryImage {
  src: string;
  alt: string;
}

export const GALLERY: GalleryImage[] = [
  {
    src: '/images/galeria/rio-floresta.webp',
    alt: 'Rio largo margeado por floresta amazônica sob céu carregado',
  },
  { src: '/images/galeria/porto.webp', alt: 'Embarcação regional atracada em porto fluvial' },
  {
    src: '/images/galeria/pesca.webp',
    alt: 'Pequena embarcação com pescadores em rio de águas barrentas',
  },
  {
    src: '/images/galeria/canoa-anoitecer.webp',
    alt: 'Canoa amarrada na margem ao anoitecer',
  },
  { src: '/images/galeria/passeio.webp', alt: 'Passeio de barco por rio cercado de vegetação' },
  {
    src: '/images/galeria/barco-regional.webp',
    alt: 'Barco de passageiros navegando em rio largo',
  },
  { src: '/images/galeria/igarape.webp', alt: 'Canoa navegando em igarapé cercado de árvores' },
  {
    src: '/images/galeria/aguapes.webp',
    alt: 'Margem de rio coberta de aguapés, com palmeiras ao fundo',
  },
];

/**
 * Imagem de capa por categoria na Home (UX-18). Nenhuma capa pode ser a foto
 * principal de um card de "Projetos em destaque" na mesma página: a seção de
 * destaques da Home pula produtos cuja foto principal já é capa (ver
 * `homeFeatured` em lib/featured.ts). Só fotos já existentes em public/images.
 */
export const CATEGORY_COVERS: Record<CategorySlug, { src: string; alt: string }> = {
  lanchas: {
    src: '/images/products/lancha-aluminio-10m-1.webp',
    alt: 'Lancha de alumínio com capota navegando',
  },
  canoas: { src: '/images/products/canoa-aluminio-6m-1.webp', alt: 'Canoa de alumínio no rio' },
  botes: {
    src: '/images/products/bote-aluminio-6m-90hp-1.webp',
    alt: 'Bote de alumínio ancorado em águas calmas',
  },
  'semi-chatas': {
    // a única foto de semi-chata é a de um destaque; usa a foto ilustrativa de
    // embarcação coberta no rio (mesmo estilo), distante na página da galeria
    src: '/images/galeria/passeio.webp',
    alt: 'Embarcação com cobertura navegando no rio',
  },
  'motores-de-popa': {
    src: '/images/servicos/motores.webp',
    alt: 'Motor de popa instalado na popa de uma embarcação',
  },
  estofamentos: {
    src: '/images/products/estofamento-nautico-2.webp',
    alt: 'Assentos estofados de embarcação',
  },
};

export const DIFFERENTIALS = [
  {
    title: 'Embarcações em alumínio',
    text: 'Lanchas, canoas, botes e semi-chatas em alumínio: leves, resistentes e feitas para o dia a dia nos rios da Amazônia.',
  },
  {
    title: 'Fabricação própria, projeto 100% personalizado',
    text: 'Somos náutica e estaleiro. A embarcação é projetada conforme o uso — lazer, pesca, trabalho ou transporte.',
  },
  {
    title: 'Pintura personalizada',
    text: 'Você escolhe a cor e o acabamento da sua embarcação.',
  },
  {
    title: 'Reparos e manutenção',
    text: 'Cuidamos da sua embarcação depois da entrega, com reparos e manutenção náutica.',
  },
  {
    title: 'Motores de popa',
    text: 'Revenda de motores de popa e orientação para escolher a motorização certa.',
  },
  {
    title: 'Estofamento',
    text: 'Assentos, poltronas e reforma de estofados para mais conforto a bordo.',
  },
  {
    title: 'Atendimento local em Manaus',
    text: 'Equipe em Manaus – AM, com vendedores para atender você do projeto à entrega.',
  },
  {
    title: 'Entrega para outras regiões',
    text: 'Já entregamos embarcações em Belém e no Suriname.',
  },
];

/** Serviço (?servico=) → tipo de solicitação do quoteSchema. */
export const SERVICE_TO_REQUEST_TYPE: Record<string, RequestType> = {
  fabricacao: 'nova-embarcacao',
  reparos: 'reparo',
  manutencao: 'manutencao',
  motores: 'motor',
  'motor-revisao': 'motor-revisao',
  estofamento: 'estofamento',
};

/**
 * Pré-preenchimento do orçamento por ?servico= (tipo e categoria).
 * UX-28: a mensagem NÃO vem mais escrita — o roteiro virou texto de exemplo
 * (placeholder) e dica abaixo do campo, para não contar como descrição.
 */
export interface QuotePreset {
  requestType: RequestType;
  category?: CategorySlug;
}

export const QUOTE_PRESETS: Record<string, QuotePreset> = {
  ...Object.fromEntries(
    SERVICES.map((s) => [s.slug, { requestType: SERVICE_TO_REQUEST_TYPE[s.slug]! }]),
  ),
  // UX-22: motor falhando tem caminho próprio (não é "comprar motor")
  'motor-revisao': { requestType: 'motor-revisao', category: 'motores-de-popa' },
};

/** Preset do ?servico= (ignora chaves herdadas como "constructor"). */
export function quotePreset(servico: string | null | undefined): QuotePreset | undefined {
  if (!servico || !Object.prototype.hasOwnProperty.call(QUOTE_PRESETS, servico)) return undefined;
  return QUOTE_PRESETS[servico];
}

/**
 * Tipos de serviço (conserto/cuidado de algo que a pessoa já tem): no
 * orçamento, "Categoria" e "Modelo de referência" não fazem sentido (UX-24).
 */
export const SERVICE_REQUEST_TYPES: readonly RequestType[] = [
  'reparo',
  'manutencao',
  'motor-revisao',
  'estofamento',
];

/** Dica do campo de mensagem conforme o tipo de solicitação. */
export const QUOTE_MESSAGE_HINTS: Partial<Record<RequestType, string>> & { default: string } = {
  default: 'Ex.: tipo de uso (lazer, pesca, trabalho), tamanho desejado, motorização, cor, prazo.',
  reparo:
    'Ex.: tipo e tamanho da embarcação, o que aconteceu e onde ela está. A equipe confirma se atende o seu caso.',
  manutencao:
    'Ex.: tipo e tamanho da embarcação, o que precisa ser feito e onde ela está. A equipe confirma se atende o seu caso.',
  'motor-revisao':
    'Ex.: marca, modelo e potência do motor, o que está acontecendo e desde quando. A equipe confirma se atende o seu caso.',
  estofamento: 'Ex.: quais assentos ou almofadas, quantidade, cor desejada e tipo de embarcação.',
  motor: 'Ex.: tipo e tamanho da embarcação, uso e potência que você procura.',
};

/**
 * Texto de exemplo (placeholder) do campo de mensagem conforme o tipo (UX-28).
 * Some ao digitar; a dica abaixo do campo continua visível.
 */
export const QUOTE_MESSAGE_PLACEHOLDERS: Partial<Record<RequestType, string>> & {
  default: string;
} = {
  default: 'Escreva com suas palavras o que você precisa.',
  'nova-embarcacao': 'Ex.: canoa de uns 6 m para pesca, com motor de 15 hp.',
  reparo: 'Ex.: lancha de 7 m com o casco amassado na proa. Está em Manaus.',
  manutencao: 'Ex.: canoa de 6 m; o casco e o acabamento precisam de cuidado.',
  'motor-revisao': 'Modelo/potência do motor e o que está acontecendo…',
  estofamento: 'Ex.: 4 assentos de lancha para reformar.',
  motor: 'Ex.: bote de 6 m para pesca; procuro motor de uns 25 hp.',
};

/**
 * Erro do campo de mensagem vazia/curta em pedidos de serviço (UX-28): diz
 * com clareza o que falta escrever, em vez do genérico "Descreva o que você precisa".
 */
export const QUOTE_MESSAGE_REQUIRED: Partial<Record<RequestType, string>> = {
  'motor-revisao': 'Conte o que está acontecendo com o motor.',
  reparo: 'Conte o que aconteceu com a embarcação.',
  manutencao: 'Conte o que precisa ser feito na embarcação.',
  estofamento: 'Conte o que precisa no estofamento.',
};

export interface QuotePageCopy {
  title: string;
  intro: string;
  steps: { title: string; text: string }[];
}

const STEP_CALLBACK = {
  title: 'A equipe retorna',
  text: 'Retornamos pelo telefone informado (ligação ou WhatsApp).',
};

/**
 * Topo e "Como funciona" do /orcamento conforme o tipo do pedido (UX-30).
 * Conserto não é compra de barco novo; e em motor com problema a equipe
 * confirma se atende (nada prometido).
 */
export const QUOTE_PAGE_COPY: Record<
  'embarcacao' | 'servico' | 'motor-revisao' | 'motor',
  QuotePageCopy
> = {
  embarcacao: {
    title: 'Solicite seu orçamento',
    intro:
      'Cada embarcação é feita sob medida. Quanto mais detalhes você enviar, mais preciso será o retorno da nossa equipe.',
    steps: [
      {
        title: 'Você conta o que precisa',
        text: 'Tipo de embarcação, uso, tamanho, motorização e cor.',
      },
      {
        title: 'Um vendedor retorna',
        text: 'Retornamos pelo telefone informado (ligação ou WhatsApp).',
      },
      {
        title: 'Orçamento completo',
        text: 'Prazo, pagamento e demais condições são informados no orçamento.',
      },
    ],
  },
  servico: {
    title: 'Peça o orçamento do serviço',
    intro:
      'Conte com suas palavras o que precisa ser feito e onde a embarcação está. A equipe analisa o pedido e retorna.',
    steps: [
      {
        title: 'Você conta o que precisa',
        text: 'Tipo e tamanho da embarcação, o que precisa ser feito e onde ela está.',
      },
      STEP_CALLBACK,
      {
        title: 'Avaliação e orçamento',
        text: 'A equipe confirma se atende o seu caso. Preço e prazo são informados no orçamento.',
      },
    ],
  },
  'motor-revisao': {
    title: 'Problema ou revisão no motor',
    intro:
      'Conte qual é o motor e o que está acontecendo. A equipe analisa o pedido e confirma se atende o seu caso.',
    steps: [
      {
        title: 'Você descreve o problema',
        text: 'Marca, modelo e potência do motor, o que está acontecendo e desde quando.',
      },
      STEP_CALLBACK,
      {
        title: 'Resposta da equipe',
        text: 'A equipe confirma se atende o seu caso. Se atender, preço e prazo são informados no orçamento.',
      },
    ],
  },
  motor: {
    title: 'Orçamento de motor de popa',
    intro:
      'Conte qual é a sua embarcação e como você vai usá-la. Marcas, modelos e potências disponíveis são informados no orçamento.',
    steps: [
      {
        title: 'Você conta o que precisa',
        text: 'Tipo e tamanho da embarcação, uso e potência que você procura.',
      },
      {
        title: 'Um vendedor retorna',
        text: 'Retornamos pelo telefone informado (ligação ou WhatsApp).',
      },
      {
        title: 'Orçamento completo',
        text: 'Modelos disponíveis, preço e condições são informados no orçamento.',
      },
    ],
  },
};

/** Textos do /orcamento para o tipo de pedido atual (vazio/outro = embarcação). */
export function quotePageCopy(requestType: string | undefined): QuotePageCopy {
  if (requestType === 'motor-revisao') return QUOTE_PAGE_COPY['motor-revisao'];
  if (requestType === 'motor') return QUOTE_PAGE_COPY.motor;
  if (requestType && (SERVICE_REQUEST_TYPES as readonly string[]).includes(requestType))
    return QUOTE_PAGE_COPY.servico;
  return QUOTE_PAGE_COPY.embarcacao;
}

/** Perguntas frequentes — respostas só com fatos confirmados; o resto, "no orçamento". */
export const FAQ = [
  {
    q: 'Vocês fazem a embarcação do jeito que eu quiser?',
    a: 'Sim. Fabricamos embarcações em alumínio com projeto 100% personalizado: medidas, layout e configuração são definidos com a nossa equipe conforme o uso — lazer, pesca, trabalho ou transporte.',
  },
  {
    q: 'Posso escolher a cor da embarcação?',
    a: 'Pode. A pintura é personalizada: você escolhe a cor e o acabamento.',
  },
  {
    q: 'Vocês entregam fora de Manaus?',
    a: 'Sim. Já entregamos embarcações para outras regiões, como Belém e o Suriname. As condições de entrega para o seu destino são informadas no orçamento.',
  },
  {
    q: 'Qual é o prazo de fabricação, as formas de pagamento e a garantia?',
    a: 'Esses itens dependem do projeto e são informados no orçamento. Envie o seu pedido e a equipe retorna pelo telefone informado.',
  },
  {
    q: 'Que tipos de reparo e manutenção vocês fazem?',
    a: 'Fazemos reparos e manutenção em embarcações de alumínio. Para saber se atendemos o seu caso, descreva o problema no pedido de orçamento ou consulte a equipe pelo Instagram.',
  },
  {
    q: 'Vocês vendem motores de popa?',
    a: 'Sim, trabalhamos com revenda de motores de popa. Marcas, modelos e potências disponíveis são informados no orçamento.',
  },
  {
    q: 'Vocês fazem manutenção ou conserto de motor de popa?',
    a: 'Revendemos motores de popa. Se o seu motor está com problema ou precisa de revisão, peça um orçamento com o tipo "Problema ou revisão no motor" (em Serviços, botão "Problema no motor? Descreva aqui"), informando modelo, potência e o que está acontecendo. A equipe confirma se atende o seu caso.',
  },
  {
    q: 'Como recebo o retorno do meu pedido?',
    a: 'Retornamos pelo telefone informado no formulário, por ligação ou WhatsApp.',
  },
];

export const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/produtos', label: 'Catálogo' },
  { to: '/servicos', label: 'Serviços' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' },
] as const;
