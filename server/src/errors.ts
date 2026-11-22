import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody, ErrorCode } from '@bidrules/shared';
import { z } from 'zod';

/** Throw this from any route or service. The error handler turns it into the standard error body. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    /** Per-field messages for `VALIDATION_ERROR` (see ApiErrorBody). */
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what} not found`);

/** Parse `value` with a zod schema, or throw a 400 VALIDATION_ERROR. */
export function validate<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
      .join('; ');
    throw new HttpError(400, 'VALIDATION_ERROR', message);
  }
  return result.data;
}

export function errorBody(code: ErrorCode, message: string, fields?: Record<string, string>): ApiErrorBody {
  return { error: fields ? { code, message, fields } : { code, message } };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(errorBody('NOT_FOUND', `No route for ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(errorBody(err.code, err.message, err.fields));
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json(errorBody('VALIDATION_ERROR', 'Request body is not valid JSON'));
    return;
  }
  console.error(err);
  res.status(500).json(errorBody('INTERNAL', 'Something went wrong'));
};
