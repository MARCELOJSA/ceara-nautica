import { Link } from 'react-router-dom';
import { Clock, ExternalLink, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import { mapUrlFor, site } from '@/config/site';
import { whatsappUrl } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

function ChannelCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 border-b border-steel-light py-5 first:pt-0 last:border-b-0">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-graphite-deep text-orange">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="eyebrow text-graphite-deep">{title}</h2>
        <div className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">{children}</div>
      </div>
    </li>
  );
}

export default function Contact() {
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Contato', path: '/contato' },
  ];
  const wa = whatsappUrl();

  return (
    <>
      <Seo
        title="Contato — Ceará Náutica em Manaus"
        description="Fale com a Ceará Náutica, náutica e estaleiro em Manaus – AM. Envie sua mensagem, chame no Instagram ou solicite um orçamento."
        path="/contato"
        jsonLd={[localBusinessJsonLd(), breadcrumbJsonLd(crumbs)]}
      />
      <PageHeader
        eyebrow="Contato"
        title="Fale com a Ceará Náutica"
        intro="Mande sua mensagem pelo formulário ou pelo Instagram. Para pedir preço de uma embarcação, use o pedido de orçamento."
        crumbs={crumbs}
      />

      <section className="py-14 lg:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <aside aria-label="Canais de atendimento">
            <ul>
              {wa && (
                <ChannelCard
                  icon={<MessageCircle aria-hidden="true" className="size-5" />}
                  title="WhatsApp"
                >
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('whatsapp_click', { location: 'contato' })}
                    className="link-underline font-medium"
                  >
                    Conversar no WhatsApp
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </ChannelCard>
              )}
              <ChannelCard
                icon={<Instagram aria-hidden="true" className="size-5" />}
                title="Instagram"
              >
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('instagram_click', { location: 'contato' })}
                  className="link-underline font-medium"
                >
                  {site.instagramHandle}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                <p className="mt-1 text-sm text-steel">
                  Envie uma mensagem direta e veja os projetos publicados.
                </p>
              </ChannelCard>
              {site.email && (
                <ChannelCard icon={<Mail aria-hidden="true" className="size-5" />} title="E-mail">
                  <a href={`mailto:${site.email}`} className="link-underline font-medium break-all">
                    {site.email}
                  </a>
                </ChannelCard>
              )}
              <ChannelCard
                icon={<MapPin aria-hidden="true" className="size-5" />}
                title="Localização"
              >
                {site.address ? (
                  <>
                    <p>{site.address}</p>
                    <a
                      href={mapUrlFor(site.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline mt-1 inline-flex items-center gap-1 text-sm font-medium"
                    >
                      Ver no mapa <ExternalLink aria-hidden="true" className="size-3.5" />
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-graphite-deep">{site.locationLabel}</p>
                    <p className="mt-1 text-sm text-steel">
                      Atendemos em Manaus e entregamos para outras regiões. Para visitar, combine
                      com a equipe pelo formulário ou pelo Instagram.
                    </p>
                    <a
                      href={site.cityMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline mt-1 inline-flex items-center gap-1 text-sm font-medium"
                    >
                      Manaus no mapa <ExternalLink aria-hidden="true" className="size-3.5" />
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </>
                )}
              </ChannelCard>
              {site.businessHours && (
                <ChannelCard icon={<Clock aria-hidden="true" className="size-5" />} title="Horário">
                  {site.businessHours}
                </ChannelCard>
              )}
            </ul>
            <div className="mt-8 rounded-md bg-graphite-deep p-6 text-white">
              <p className="eyebrow text-orange">Quer um orçamento?</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Conte o tipo de embarcação e o uso — um vendedor retorna com o projeto.
              </p>
              <Link to="/orcamento" className="btn-primary mt-4 w-full">
                Solicitar orçamento
              </Link>
            </div>
          </aside>

          <div>
            <h2 className="text-4xl font-bold uppercase">Envie uma mensagem</h2>
            <p className="mt-2 mb-8 text-steel">Campos com * são obrigatórios.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
