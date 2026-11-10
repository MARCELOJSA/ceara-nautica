import { Link } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';
import { breadcrumbJsonLd } from '@/components/seo/jsonld';
import { PageHeader } from '@/components/layout/PageHeader';
import { openCookiePreferences } from '@/lib/consent';
import { site } from '@/config/site';

const UPDATED = '09/11/2026';

export default function Privacy() {
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Política de Privacidade', path: '/politica-de-privacidade' },
  ];
  return (
    <>
      <Seo
        title="Política de Privacidade"
        description="Como a Ceará Náutica trata os dados pessoais enviados pelos formulários do site e como usa cookies, conforme a LGPD (Lei 13.709/2018)."
        path="/politica-de-privacidade"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <PageHeader
        eyebrow="LGPD"
        title="Política de Privacidade"
        intro={`Última atualização: ${UPDATED}.`}
        crumbs={crumbs}
      />
      <article className="container-x py-14 lg:py-20">
        <div className="max-w-3xl space-y-10 text-[1.0625rem] leading-relaxed text-graphite [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:uppercase [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
          <section>
            <h2>1. Quem somos</h2>
            <p className="mt-3">
              Este site é da {site.name} ({site.tagline}), com atuação em {site.locationLabel}. Esta
              política explica, em linguagem simples, quais dados coletamos, por que e quais são os
              seus direitos segundo a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2>2. Dados que coletamos nos formulários</h2>
            <p className="mt-3">
              Quando você envia o formulário de contato ou de orçamento, recebemos:
            </p>
            <ul>
              <li>nome e telefone/WhatsApp (obrigatórios);</li>
              <li>e-mail e cidade (opcionais);</li>
              <li>categoria, modelo de interesse, assunto e mensagem que você escrever;</li>
              <li>
                dados de origem da visita (ex.: parâmetros UTM de campanhas, página de entrada e
                site de origem), usados para saber quais canais trazem contatos;
              </li>
              <li>
                dados técnicos mínimos de segurança (ex.: endereço IP), para evitar spam e abuso.
              </li>
            </ul>
            <p>
              <strong>Finalidade:</strong> responder à sua solicitação, elaborar orçamentos e manter
              o histórico do atendimento. <strong>Base legal:</strong> seu consentimento (art. 7º,
              I) e procedimentos preliminares a um contrato a seu pedido (art. 7º, V).
            </p>
            <p>
              Não vendemos seus dados e não os usamos para finalidades diferentes das descritas
              aqui.
            </p>
          </section>

          <section>
            <h2>3. Cookies e tecnologias de medição</h2>
            <p className="mt-3">Usamos três categorias:</p>
            <ul>
              <li>
                <strong>Essenciais</strong> — guardam a sua escolha de cookies e a origem da visita
                durante a sessão. Sempre ativos.
              </li>
              <li>
                <strong>Medição</strong> — estatísticas de uso do site (ex.: Google Analytics). Só
                são carregados se você autorizar.
              </li>
              <li>
                <strong>Marketing</strong> — medição de anúncios (ex.: Meta Pixel, Google Ads). Só
                são carregados se você autorizar.
              </li>
            </ul>
            <p>
              Você pode mudar sua escolha a qualquer momento:{' '}
              <button
                type="button"
                onClick={openCookiePreferences}
                className="link-underline font-medium"
              >
                abrir preferências de cookies
              </button>
              .
            </p>
          </section>

          <section>
            <h2>4. Compartilhamento</h2>
            <p className="mt-3">
              Os dados podem ser processados por fornecedores que nos ajudam a operar o site
              (hospedagem, banco de dados e, se autorizados por você, ferramentas de medição),
              sempre para as finalidades acima. Também podemos compartilhar dados quando exigido por
              lei ou autoridade competente.
            </p>
          </section>

          <section>
            <h2>5. Por quanto tempo guardamos</h2>
            <p className="mt-3">
              Pelo tempo necessário para atender à sua solicitação e manter o histórico comercial,
              ou pelo prazo exigido por lei. Depois disso, os dados são excluídos ou anonimizados.
            </p>
          </section>

          <section>
            <h2>6. Seus direitos</h2>
            <p className="mt-3">Você pode, a qualquer momento, pedir:</p>
            <ul>
              <li>confirmação e acesso aos seus dados;</li>
              <li>correção de dados incompletos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>portabilidade e informação sobre compartilhamentos;</li>
              <li>revogação do consentimento.</li>
            </ul>
            <p>
              Para exercer seus direitos, fale conosco pelo{' '}
              <Link to="/contato" className="link-underline">
                formulário de contato
              </Link>
              {site.email ? (
                <>
                  , pelo e-mail{' '}
                  <a href={`mailto:${site.email}`} className="link-underline">
                    {site.email}
                  </a>
                </>
              ) : null}{' '}
              ou pelo Instagram{' '}
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {site.instagramHandle}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              . Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </section>

          <section>
            <h2>7. Segurança</h2>
            <p className="mt-3">
              Adotamos medidas técnicas para proteger os dados, como conexão segura, validação das
              informações enviadas, limitação de tentativas e acesso restrito. Nenhum sistema é
              totalmente imune a falhas, mas trabalhamos para reduzir riscos.
            </p>
          </section>

          <section>
            <h2>8. Alterações</h2>
            <p className="mt-3">
              Esta política pode ser atualizada. A data da última atualização fica no topo da
              página.
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
