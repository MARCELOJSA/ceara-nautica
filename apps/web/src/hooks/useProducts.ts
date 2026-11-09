import { useEffect, useState } from 'react';
import type { Product } from '@cn/shared';
import { getProduct, getProducts, getRelated, type ProductQuery } from '@/lib/api';

interface State<T> {
  data: T;
  loading: boolean;
  fallback: boolean;
}

/** Lista de produtos (filtragem fina é feita no cliente). */
export function useProducts(query: ProductQuery = {}): State<Product[]> {
  const [state, setState] = useState<State<Product[]>>({ data: [], loading: true, fallback: false });
  const { category, q, featured } = query;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    getProducts({ category, q, featured }).then((r) => {
      if (alive) setState({ data: r.data, loading: false, fallback: r.fallback });
    });
    return () => {
      alive = false;
    };
  }, [category, q, featured]);

  return state;
}

export function useProduct(slug: string | undefined): State<Product | null> {
  const [state, setState] = useState<State<Product | null>>({
    data: null,
    loading: true,
    fallback: false,
  });

  useEffect(() => {
    let alive = true;
    if (!slug) {
      setState({ data: null, loading: false, fallback: false });
      return;
    }
    setState({ data: null, loading: true, fallback: false });
    getProduct(slug).then((r) => {
      if (alive) setState({ data: r.data, loading: false, fallback: r.fallback });
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  return state;
}

export function useRelated(product: Product | null): Product[] {
  const [related, setRelated] = useState<Product[]>([]);
  useEffect(() => {
    let alive = true;
    if (!product) {
      setRelated([]);
      return;
    }
    getRelated(product).then((r) => alive && setRelated(r));
    return () => {
      alive = false;
    };
  }, [product]);
  return related;
}
