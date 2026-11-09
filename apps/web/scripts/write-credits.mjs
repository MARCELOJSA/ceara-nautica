/** Gera IMAGE-CREDITS.md a partir de scripts/images.manifest.mjs. Uso: node scripts/write-credits.mjs */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGES } from './images.manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = IMAGES.map(
  (i) =>
    `| \`public/${i.out}.webp\` | ${i.author} | [photo-${i.id}](https://images.unsplash.com/photo-${i.id}) | Unsplash License |`,
).join('\n');

const md = `# Créditos das imagens

Todas as fotos abaixo são **ilustrativas**, obtidas no [Unsplash](https://unsplash.com) sob a
[Unsplash License](https://unsplash.com/license) (uso comercial gratuito, atribuição não obrigatória
— mantida aqui por boa prática). Elas **não mostram embarcações da Ceará Náutica** e devem ser
substituídas pelas fotos reais da empresa assim que disponíveis.

- Lista gerada a partir de \`scripts/images.manifest.mjs\` (\`node scripts/write-credits.mjs\`).
- Conversão para WebP responsivo: \`npm run images -w apps/web\` (variantes \`-640\`, \`-1280\`, \`-1920\`).
- Logo e favicons: recriação vetorial da logo original (\`public/brand/logo-original.jpg\`), de
  propriedade da Ceará Náutica.

| Arquivo | Fotógrafo(a) | Original | Licença |
|---|---|---|---|
${rows}
`;
await writeFile(path.join(root, 'IMAGE-CREDITS.md'), md, 'utf8');
console.log('IMAGE-CREDITS.md atualizado:', IMAGES.length, 'imagens');
