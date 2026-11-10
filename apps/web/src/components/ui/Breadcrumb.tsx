import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumb({ items, tone = 'light' }: { items: Crumb[]; tone?: 'light' | 'dark' }) {
  const muted =
    tone === 'dark' ? 'text-white/70 hover:text-white' : 'text-steel hover:text-graphite-deep';
  const current = tone === 'dark' ? 'text-white' : 'text-graphite-deep';
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className={`font-medium ${current}`}>
                  {it.name}
                </span>
              ) : (
                <>
                  <Link to={it.path} className={`inline-flex min-h-8 items-center ${muted}`}>
                    {it.name}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
