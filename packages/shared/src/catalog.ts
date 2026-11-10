import type { Product } from './types';

/**
 * CATÁLOGO — PROJETOS PUBLICADOS PELA CEARÁ NÁUTICA
 * ----------------------------------------------------------------------------
 * Embarcações com medidas/especificações extraídas das publicações oficiais do
 * Instagram @cearanautica (fonte indicada em `source`). Cada embarcação é
 * fabricada sob medida: as medidas são as do projeto publicado, não um estoque.
 *
 * Regras:
 *  - Preços NÃO são exibidos (os publicados são antigos e podem ter mudado).
 *  - O que não foi publicado pela empresa fica como "Sob consulta".
 *  - `availability: null` = disponibilidade não informada.
 *  - As FOTOS do site ainda são ilustrativas (bancos de imagem) até a empresa
 *    enviar as fotos reais — substituir em apps/web/public/images/products.
 *  - Nome do export mantido como DEMO_PRODUCTS por compatibilidade.
 */

const SOB_CONSULTA = 'Sob consulta';
const IG = (data: string) => `Instagram oficial @cearanautica — publicação de ${data}`;

const img = (slug: string, n: number, alt: string) => ({
  src: `/images/products/${slug}-${n}.webp`,
  alt,
});

export const DEMO_PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- Lanchas
  {
    slug: 'lancha-cargueira-iguaracu-9m',
    name: 'Lancha Cargueira tipo Iguaraçu 9 m',
    category: 'lanchas',
    shortDescription:
      'Lancha cargueira em alumínio, feita para trabalho e transporte, com fundo e laterais em chapa de 3 mm.',
    description:
      'Lancha cargueira tipo Iguaraçu fabricada pela Ceará Náutica, feita para trabalho e transporte. Uma embarcação funcional, segura e preparada para diferentes operações nos rios da Amazônia. O projeto pode ser adaptado à necessidade de cada cliente.',
    images: [
      img('lancha-cargueira-iguaracu-9m', 1, 'Lancha cargueira de alumínio tipo Iguaraçu no rio'),
    ],
    specs: [
      { label: 'Dimensões', value: '9 m x 2,20 m x 0,70 m' },
      { label: 'Casco', value: 'Fundo e laterais em alumínio de 3 mm' },
      { label: 'Tanque', value: '1.000 litros' },
      { label: 'Assentos', value: '6 poltronas almofadadas' },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: [
      'Popa lavada',
      'Piso antiderrapante',
      'Janelas em acrílico',
      'Bomba de porão automática',
      'Par de mastros',
      'Luzes de navegação',
    ],
    availability: null,
    featured: true,
    isDemo: false,
    source: IG('15/09/2026'),
  },
  {
    slug: 'lancha-aluminio-10m',
    name: 'Lancha de Alumínio 10 m',
    category: 'lanchas',
    shortDescription:
      'Lancha de 10 metros fabricada com foco em resistência, segurança e desempenho.',
    description:
      'Lancha de alumínio de 10 metros construída no estaleiro da Ceará Náutica com foco em resistência, segurança e desempenho. Um dos projetos publicados foi entregue de Manaus para o Suriname — a empresa realiza entregas para diferentes regiões.',
    images: [img('lancha-aluminio-10m', 1, 'Lancha de alumínio de 10 metros')],
    specs: [
      { label: 'Dimensões', value: '10 m x 1,45 m x 0,50 m' },
      { label: 'Material do casco', value: 'Alumínio' },
      { label: 'Motorização', value: SOB_CONSULTA },
      { label: 'Capacidade', value: SOB_CONSULTA },
    ],
    features: [
      'Projeto sob medida',
      'Entrega para outras regiões',
      'Foco em resistência e desempenho',
    ],
    availability: null,
    featured: true,
    isDemo: false,
    source: IG('15/07/2026'),
  },
  {
    slug: 'lancha-aluminio-7m',
    name: 'Lancha de Alumínio 7 m',
    category: 'lanchas',
    shortDescription: 'Lancha de alumínio completa, com capacidade total para 11 passageiros.',
    description:
      'Lancha de alumínio de 7 metros, completa, ideal para passeio, pesca ou trabalho. Aceita motorização de 115 hp a 300 hp, conforme o projeto publicado. Acabamento e configuração definidos com a equipe.',
    images: [img('lancha-aluminio-7m', 1, 'Lancha de alumínio de 7 metros navegando')],
    specs: [
      { label: 'Dimensões', value: '7 m x 1,90 m x 0,65 m' },
      { label: 'Capacidade', value: '11 passageiros' },
      { label: 'Motorização', value: '115 hp a 300 hp' },
      { label: 'Material do casco', value: 'Alumínio' },
    ],
    features: ['Embarcação completa', 'Passeio, pesca ou trabalho', 'Acabamento personalizado'],
    availability: null,
    featured: true,
    isDemo: false,
    source: IG('09/12/2023'),
  },
  // ---------------------------------------------------------------- Botes
  {
    slug: 'bote-aluminio-7m',
    name: 'Bote de Alumínio 7 m',
    category: 'botes',
    shortDescription:
      'Bote de 7 metros com pintura personalizada — no projeto publicado, acabamento camuflado.',
    description:
      'Bote de alumínio de 7 metros fabricado pela Ceará Náutica. A pintura é personalizada: o cliente escolhe a cor e o acabamento (no projeto publicado, acabamento camuflado). Robusto para pesca esportiva e uso no dia a dia.',
    images: [
      img('bote-aluminio-7m', 1, 'Bote de alumínio de 7 metros com pintura camuflada'),
      img('bote-aluminio-7m', 2, 'Bote de alumínio sobre carreta para entrega'),
    ],
    specs: [
      { label: 'Comprimento', value: '7 m' },
      { label: 'Material do casco', value: 'Alumínio' },
      { label: 'Pintura', value: 'Personalizada' },
      { label: 'Boca / Pontal', value: SOB_CONSULTA },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: ['Pintura personalizada', 'Ideal para pesca esportiva'],
    availability: null,
    featured: true,
    isDemo: false,
    source: IG('04/11/2026'),
  },
  {
    slug: 'bote-aluminio-6m',
    name: 'Bote de Alumínio 6 m',
    category: 'botes',
    shortDescription:
      'Bote de 6 m com 4 bancos atravessados, pintura personalizada e documentação.',
    description:
      'Bote de alumínio de 6 metros com 4 bancos atravessados e pintura personalizada. No projeto publicado, embarque e documentação estavam inclusos.',
    images: [
      img('bote-aluminio-6m', 1, 'Bote de alumínio de 6 metros com bancos atravessados'),
      img('bote-aluminio-6m', 2, 'Bote de alumínio com pintura personalizada'),
    ],
    specs: [
      { label: 'Dimensões', value: '6 m x 1 m x 0,35 m' },
      { label: 'Bancos', value: '4 bancos atravessados' },
      { label: 'Pintura', value: 'Personalizada' },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: ['Pintura personalizada', 'Embarque incluso*', 'Documentação*'],
    availability: null,
    featured: false,
    isDemo: false,
    source: IG('27/07/2026'),
  },
  {
    slug: 'bote-aluminio-6m-90hp',
    name: 'Bote de Alumínio 6 m — 90 hp',
    category: 'botes',
    shortDescription: 'Bote de 6 m x 1,90 m, motorização 90 hp, para 8 pessoas e 1 tripulante.',
    description:
      'Bote de alumínio de 6 metros com boca de 1,90 m, preparado para motorização de 90 hp e capacidade para 8 pessoas mais 1 tripulante, conforme o projeto publicado.',
    images: [img('bote-aluminio-6m-90hp', 1, 'Bote de alumínio com motor de popa de 90 hp')],
    specs: [
      { label: 'Dimensões', value: '6 m x 1,90 m x 0,65 m' },
      { label: 'Motorização', value: '90 hp' },
      { label: 'Capacidade', value: '8 pessoas + 1 tripulante' },
      { label: 'Material do casco', value: 'Alumínio' },
    ],
    features: ['Boa capacidade de passageiros', 'Projeto sob medida'],
    availability: null,
    featured: false,
    isDemo: false,
    source: IG('05/02/2023'),
  },
  // ---------------------------------------------------------------- Canoas
  {
    slug: 'canoa-aluminio-7m',
    name: 'Canoa de Alumínio 7 m',
    category: 'canoas',
    shortDescription: 'Canoa de 7 metros com espaço, conforto e potência na medida certa.',
    description:
      'Canoa de alumínio de 7 metros, com espaço e conforto para passeios e pesca. Construída sob medida pela Ceará Náutica.',
    images: [
      img('canoa-aluminio-7m', 1, 'Canoa de alumínio de 7 metros no rio'),
      img('canoa-aluminio-7m', 2, 'Canoa de alumínio vista de cima'),
    ],
    specs: [
      { label: 'Comprimento', value: '7 m' },
      { label: 'Boca / Pontal', value: SOB_CONSULTA },
      { label: 'Material do casco', value: 'Alumínio' },
      { label: 'Capota', value: SOB_CONSULTA },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: ['Projeto sob medida', 'Passeio e pesca'],
    availability: null,
    featured: true,
    isDemo: false,
    source: IG('23/10/2025'),
  },
  {
    slug: 'canoa-aluminio-6m',
    name: 'Canoa de Alumínio 6 m',
    category: 'canoas',
    shortDescription: 'Canoa de 6 m em chapa de 2 mm, com capota conversível em vinil.',
    description:
      'Canoa de alumínio de 6 metros construída em chapa de 2 mm de espessura, com opção de capota conversível em vinil, conforme o projeto publicado.',
    images: [img('canoa-aluminio-6m', 1, 'Canoa de alumínio no rio (foto ilustrativa)')],
    specs: [
      // Medidas publicadas: 6 m x 1,30 m x 0,45 m (comprimento × boca × pontal)
      { label: 'Comprimento', value: '6 m' },
      { label: 'Boca / Pontal', value: '1,30 m / 0,45 m' },
      { label: 'Material do casco', value: 'Alumínio, chapa de 2 mm' },
      { label: 'Capota', value: 'Conversível em vinil' },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: ['Capota conversível', 'Leve e resistente'],
    availability: null,
    featured: false,
    isDemo: false,
    source: IG('29/08/2022'),
  },
  // ---------------------------------------------------------------- Semi-chatas
  {
    slug: 'semi-chata-aluminio-sob-medida',
    name: 'Semi-chata de Alumínio Sob Medida',
    category: 'semi-chatas',
    shortDescription: 'Semi-chata em alumínio fabricada sob medida para lazer, pesca ou trabalho.',
    description:
      'A Ceará Náutica fabrica semi-chatas em alumínio sob medida. Medidas, layout e motorização são definidos com a equipe conforme o uso da embarcação.',
    images: [img('semi-chata-aluminio-sob-medida', 1, 'Embarcação semi-chata de alumínio no rio')],
    specs: [
      { label: 'Material do casco', value: 'Alumínio' },
      { label: 'Dimensões', value: SOB_CONSULTA },
      { label: 'Motorização', value: SOB_CONSULTA },
    ],
    features: ['Projeto 100% personalizado', 'Boa estabilidade'],
    availability: null,
    featured: true,
    isDemo: false,
  },
  // ---------------------------------------------------------------- Motores
  {
    slug: 'motores-de-popa',
    name: 'Motores de popa',
    category: 'motores-de-popa',
    shortDescription: 'Revenda de motores de popa, com orientação para escolher a potência certa.',
    description:
      'A Ceará Náutica trabalha com revenda de motores de popa. Marcas, modelos e potências disponíveis devem ser consultados com a equipe, que ajuda a escolher o motor ideal para a sua embarcação.',
    images: [img('motores-de-popa', 1, 'Motor de popa instalado em embarcação de alumínio')],
    specs: [
      { label: 'Marcas', value: SOB_CONSULTA },
      { label: 'Potências', value: SOB_CONSULTA },
    ],
    features: ['Revenda de motores de popa', 'Orientação na escolha da motorização'],
    availability: null,
    featured: true,
    isDemo: false,
  },
  // ---------------------------------------------------------------- Estofamentos
  {
    slug: 'estofamento-nautico',
    name: 'Estofamento Náutico',
    category: 'estofamentos',
    shortDescription: 'Estofamentos e poltronas almofadadas para embarcações.',
    description:
      'Serviço de estofamento para embarcações: assentos, poltronas almofadadas e reforma de estofados. Materiais, cores e prazos sob consulta.',
    images: [
      img('estofamento-nautico', 1, 'Poltronas estofadas em embarcação'),
      img('estofamento-nautico', 2, 'Detalhe de estofamento náutico'),
    ],
    specs: [
      { label: 'Materiais', value: SOB_CONSULTA },
      { label: 'Cores', value: SOB_CONSULTA },
      { label: 'Prazo', value: SOB_CONSULTA },
    ],
    features: ['Sob medida', 'Reforma de estofados'],
    availability: null,
    featured: true,
    isDemo: false,
  },
];

export const CATALOG_PRODUCTS = DEMO_PRODUCTS;
