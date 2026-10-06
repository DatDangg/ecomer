import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorEnvelope, fail } from '../response';

interface NormalizedError {
  message: string;
  errors?: unknown[];
}

function normalizeError(exception: unknown): NormalizedError {
  if (!(exception instanceof HttpException)) {
    return { message: 'Internal server error' };
  }

  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { message: response };
  }

  const { message, error } = response as {
    message?: string | string[];
    error?: string;
  };

  if (Array.isArray(message)) {
    return { message: error ?? 'Validation failed', errors: message };
  }
  if (typeof message === 'string') {
    return { message };
  }
  return { message: exception.message || 'Error' };
}

/**
 * Catches every unhandled exception and renders the shared error envelope
 * `{ success: false, message, errors? }` (docs/API_SPEC.md §Response contract).
 * Validation errors (class-validator array messages) become `errors[]`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = normalizeError(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        stack,
      );
    }

    const body: ErrorEnvelope = fail(message, errors);
    response.status(status).json(body);
  }
}
