import { useEffect } from 'react';
import { wakeApi } from '@/lib/api';

/**
 * Páginas que levam a um envio (orçamento, contato, produto) acordam a API
 * assim que abrem, para ela estar pronta quando a pessoa enviar o formulário.
 */
export function useWakeApi(): void {
  useEffect(() => {
    wakeApi();
  }, []);
}
