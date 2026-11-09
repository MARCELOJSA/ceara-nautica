import { Helmet } from 'react-helmet-async';
import { absoluteUrl, site } from '@/config/site';
import { serializeJsonLd } from './jsonld';

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
}

export function Seo({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const fullTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  const url = absoluteUrl(path);
  const img = absoluteUrl(image ?? '/og-image.jpg');
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type === 'product' ? 'product' : type} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(b)}
        </script>
      ))}
    </Helmet>
  );
}
