import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { BoatMark } from '@/components/brand/Logo';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <>
      <Seo title="Página não encontrada" description="A página procurada não existe ou foi movida." path={pathname} noindex />
      <section className="container-x flex min-h-[70vh] flex-col items-start justify-center py-20">
        <BoatMark className="h-16 w-auto text-steel-light" />
        <p className="eyebrow mt-8 text-orange-ink">Erro 404</p>
        <h1 className="mt-3 text-5xl font-bold uppercase sm:text-7xl">Essa rota não está no mapa.</h1>
        <p className="mt-4 max-w-xl text-lg text-steel">
          A página que você procura não existe ou mudou de endereço. Que tal voltar para terra firme?
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            Página inicial <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link to="/produtos" className="btn-outline">
            Ver embarcações
          </Link>
        </div>
      </section>
    </>
  );
}
