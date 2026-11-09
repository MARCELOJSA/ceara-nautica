/**
 * Manifesto das imagens ilustrativas (Unsplash License — https://unsplash.com/license).
 * Usado por scripts/process-images.mjs para baixar, recortar e converter em WebP.
 *
 * id      → identificador do arquivo no CDN images.unsplash.com (photo-<id>)
 * out     → caminho de saída relativo a public/ (sem extensão)
 * widths  → larguras geradas; a maior vira <out>.webp e as demais <out>-<w>.webp
 * ratio   → proporção do recorte (largura/altura)
 * author  → crédito do fotógrafo
 *
 * As fotos são ILUSTRATIVAS e devem ser substituídas pelas fotos reais da empresa.
 */

const PRODUCT = { widths: [640, 1280], ratio: 4 / 3 };
const SECTION = { widths: [640, 1280], ratio: 4 / 3 };
const WIDE = { widths: [640, 1280, 1920], ratio: 16 / 9 };

export const IMAGES = [
  // Hero e faixas
  { id: '1788225413412-96cf476069fa', out: 'images/hero', author: 'Anthony Bringas', ...WIDE, widths: [640, 1280, 1920, 2560], position: 'centre' },
  { id: '1769794142275-ed099e69b59b', out: 'images/cta-rio', author: 'Rohit Tandon', ...WIDE },
  { id: '1649681357620-54170d946bb0', out: 'images/sobre', author: 'Thiago Rosa', ...SECTION },

  // Serviços
  { id: '1455165814004-1126a7199f9b', out: 'images/servicos/fabricacao', author: 'Rob Lambert', ...SECTION },
  { id: '1779534147832-59b4ec9d7b1f', out: 'images/servicos/reparos', author: 'Ciro Magliano', ...SECTION },
  { id: '1504328345606-18bbc8c9d7d1', out: 'images/servicos/manutencao', author: 'Christopher Burns', ...SECTION },
  { id: '1790704981279-6287d717ceb7', out: 'images/servicos/motores', author: 'Juan Bacab', ...SECTION },
  { id: '1684849843504-7919ac9ede9c', out: 'images/servicos/estofamento', author: 'igor constantino', ...SECTION },

  // Galeria
  { id: '1769795082395-39b0ee92ddb3', out: 'images/galeria/rio-floresta', author: 'Rohit Tandon', ...SECTION },
  { id: '1649681358724-db5b1f1c5e73', out: 'images/galeria/porto', author: 'Thiago Rosa', ...SECTION },
  { id: '1742648601638-c3062e720d29', out: 'images/galeria/passeio', author: 'Azzedine Rouichi', ...SECTION },
  { id: '1774453262743-451850856acf', out: 'images/galeria/barco-regional', author: 'Italo Guimas', ...SECTION },
  { id: '1691098343433-05584b38e1bc', out: 'images/galeria/igarape', author: 'Juan Orestes', ...SECTION },
  { id: '1773967671015-0f78d6c092d5', out: 'images/galeria/aluminio-atracado', author: 'Jeff McLain', ...SECTION },
  { id: '1564182998523-6923112e7d6b', out: 'images/galeria/oficina', author: 'Spencer Davis', ...SECTION },
  { id: '1788225247365-ffa243a47619', out: 'images/galeria/pesca', author: 'Anthony Bringas', ...SECTION },

  // Produtos (caminhos batem com packages/shared/src/catalog.ts)
  { id: '1788225247365-ffa243a47619', out: 'images/products/lancha-cargueira-iguaracu-9m-1', author: 'Anthony Bringas', ...PRODUCT },
  { id: '1684849843504-7919ac9ede9c', out: 'images/products/lancha-cargueira-iguaracu-9m-2', author: 'igor constantino', ...PRODUCT },
  { id: '1778775454256-ec1b63776bc4', out: 'images/products/lancha-aluminio-10m-1', author: 'Margo Evardson', ...PRODUCT },
  { id: '1761082514914-a4f46c69976a', out: 'images/products/lancha-aluminio-10m-2', author: 'porter vest', ...PRODUCT },
  { id: '1771380451033-8b6772915d79', out: 'images/products/lancha-aluminio-7m-1', author: 'Akbar Rahmat Dhani', ...PRODUCT },
  { id: '1670992511182-3607a85b7ac9', out: 'images/products/lancha-aluminio-7m-2', author: 'Enrique Leyva', ...PRODUCT },
  { id: '1678687974700-bfa0518bbc87', out: 'images/products/bote-aluminio-7m-1', author: 'Evgeny Shevchenko', ...PRODUCT },
  { id: '1731161468331-a8a396f3f9e2', out: 'images/products/bote-aluminio-7m-2', author: 'Joseph Corl', ...PRODUCT },
  { id: '1697091090368-761fea2477f9', out: 'images/products/bote-aluminio-6m-1', author: 'Richard R', ...PRODUCT },
  { id: '1773967671015-0f78d6c092d5', out: 'images/products/bote-aluminio-6m-2', author: 'Jeff McLain', ...PRODUCT },
  { id: '1766520791943-0c1f8ac1933b', out: 'images/products/bote-aluminio-6m-90hp-1', author: 'Mohammad Bahadori', ...PRODUCT },
  { id: '1628517273913-8d3da3700c10', out: 'images/products/canoa-aluminio-7m-1', author: 'Dawn McDonald', ...PRODUCT },
  { id: '1685003361221-e4fc3ad79dd9', out: 'images/products/canoa-aluminio-7m-2', author: 'Amal Rajeev', ...PRODUCT },
  { id: '1620050422138-e68fd2f6f781', out: 'images/products/canoa-aluminio-6m-1', author: 'R K', ...PRODUCT },
  { id: '1718487829635-de4ccb68474b', out: 'images/products/semi-chata-aluminio-sob-medida-1', author: 'Mark Kuiper', ...PRODUCT },
  { id: '1778682506874-87f6526a757f', out: 'images/products/motores-de-popa-1', author: 'Tijana Mihajlovic', ...PRODUCT },
  { id: '1778682507010-42dc72d1249f', out: 'images/products/motores-de-popa-2', author: 'Tijana Mihajlovic', ...PRODUCT },
  { id: '1788981685199-e01d01f1ee38', out: 'images/products/estofamento-nautico-1', author: 'Ahmed Al-Ghabban', ...PRODUCT },
  { id: '1770630927895-2057aa3a5673', out: 'images/products/estofamento-nautico-2', author: '一只猫的橘', ...PRODUCT },
];
