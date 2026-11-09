import type { ApiError } from '@cn/shared';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: ApiError['details'],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Recurso não encontrado.') => new HttpError(404, message);
