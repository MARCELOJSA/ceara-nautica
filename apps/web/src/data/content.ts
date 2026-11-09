import type { CategorySlug } from '@cn/shared';

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
}

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
    points: ['Avaliação da embarcação', 'Reparos em embarcações de alumínio', 'Indicação da solução adequada'],
    image: '/images/servicos/reparos.webp',
    imageAlt: 'Casco de alumínio desgastado aguardando reparo',
    cta: { label: 'Solicitar avaliação', to: '/orcamento?servico=reparos' },
  },
  {
    slug: 'manutencao',
    title: 'Manutenção náutica',
    kicker: 'Manutenção',
    summary:
      'Manutenção náutica em Manaus para manter a sua embarcação pronta para navegar e prolongar a vida útil do casco, dos equipamentos e do acabamento.',
    points: ['Manutenção preventiva e corretiva', 'Cuidado com casco e acabamento', 'Atendimento local em Manaus'],
    image: '/images/servicos/manutencao.webp',
    imageAlt: 'Profissional realizando solda em oficina',
    cta: { label: 'Agendar manutenção', to: '/orcamento?servico=manutencao' },
  },
  {
    slug: 'motores',
    title: 'Revenda de motores de popa',
    kicker: 'Motores de popa',
    summary:
      'Revenda de motores de popa em Manaus, com orientação para escolher a motorização certa para o seu tipo de embarcação e de uso.',
    points: ['Orientação na escolha da potência', 'Motor e embarcação pensados em conjunto', 'Marcas e modelos sob consulta'],
    image: '/images/servicos/motores.webp',
    imageAlt: 'Pequena embarcação com motor de popa em águas calmas',
    cta: { label: 'Consultar motores', to: '/orcamento?categoria=motores-de-popa' },
  },
  {
    slug: 'estofamento',
    title: 'Estofamento náutico',
    kicker: 'Estofamento',
    summary:
      'Estofamentos para embarcações: assentos, poltronas almofadadas e reforma de estofados, para mais conforto a bordo.',
    points: ['Assentos e poltronas sob medida', 'Reforma de estofados', 'Materiais e cores sob consulta'],
    image: '/images/servicos/estofamento.webp',
    imageAlt: 'Interior de embarcação com assentos estofados',
    cta: { label: 'Orçar estofamento', to: '/orcamento?categoria=estofamentos' },
  },
];

export interface GalleryImage {
  src: string;
  alt: string;
}

export const GALLERY: GalleryImage[] = [
  { src: '/images/galeria/rio-floresta.webp', alt: 'Rio largo margeado por floresta amazônica sob céu carregado' },
  { src: '/images/galeria/aluminio-atracado.webp', alt: 'Barcos de alumínio atracados lado a lado em um píer' },
  { src: '/images/galeria/porto.webp', alt: 'Embarcação regional atracada em porto fluvial' },
  { src: '/images/galeria/pesca.webp', alt: 'Pequena embarcação com pescadores em rio de águas barrentas' },
  { src: '/images/galeria/oficina.webp', alt: 'Faíscas de esmerilhadeira em trabalho com metal na oficina' },
  { src: '/images/galeria/passeio.webp', alt: 'Passeio de barco por rio cercado de vegetação' },
  { src: '/images/galeria/barco-regional.webp', alt: 'Barco de passageiros navegando em rio largo' },
  { src: '/images/galeria/igarape.webp', alt: 'Canoa navegando em igarapé cercado de árvores' },
];

/** Imagem de capa por categoria (usa fotos do catálogo). */
export const CATEGORY_COVERS: Record<CategorySlug, { src: string; alt: string }> = {
  lanchas: { src: '/images/products/lancha-aluminio-7m-1.webp', alt: 'Lancha de alumínio navegando' },
  canoas: { src: '/images/products/canoa-aluminio-7m-1.webp', alt: 'Canoas na margem do rio' },
  botes: { src: '/images/products/bote-aluminio-7m-1.webp', alt: 'Bote de alumínio na margem' },
  'semi-chatas': {
    src: '/images/products/semi-chata-aluminio-sob-medida-1.webp',
    alt: 'Embarcação semi-chata com cobertura no rio',
  },
  'motores-de-popa': { src: '/images/products/motores-de-popa-1.webp', alt: 'Motor de popa em embarcação' },
  estofamentos: { src: '/images/products/estofamento-nautico-1.webp', alt: 'Assentos estofados de embarcação' },
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

export const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/produtos', label: 'Embarcações' },
  { to: '/servicos', label: 'Serviços' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' },
] as const;
