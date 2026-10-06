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

/** MongoDB duplicate-key error code. */
const MONGO_DUPLICATE_KEY_CODE = 11000;

export interface NormalizedException {
  status: number;
  message: string;
  errors?: unknown[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeHttpResponse(
  exception: HttpException,
): Pick<NormalizedException, 'message' | 'errors'> {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { message: response };
  }

  const { message, error } = response as {
    message?: string | string[];
    error?: string;
  };

  if (Array.isArray(message)) {
    // class-validator flattens its constraints into a string[] message.
    return { message: error ?? 'Validation failed', errors: message };
  }
  if (typeof message === 'string') {
    return { message };
  }
  return { message: exception.message || 'Error' };
}

/**
 * Maps any thrown value to the shared error contract
 * `{ status, message, errors? }` (docs/API_SPEC.md §Response contract).
 * HttpException keeps its status; driver-level failures (duplicate key,
 * invalid ObjectId) are mapped to 409/400 instead of leaking as 500.
 */
export function normalizeException(exception: unknown): NormalizedException {
  if (exception instanceof HttpException) {
    return {
      status: exception.getStatus(),
      ...normalizeHttpResponse(exception),
    };
  }
  if (isRecord(exception) && exception.code === MONGO_DUPLICATE_KEY_CODE) {
    return { status: HttpStatus.CONFLICT, message: 'Resource already exists' };
  }
  if (isRecord(exception) && exception.name === 'CastError') {
    return { status: HttpStatus.BAD_REQUEST, message: 'Invalid identifier' };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  };
}

/**
 * Catches every unhandled exception and renders the shared error envelope
 * `{ success: false, message, errors? }` (docs/API_SPEC.md §Response contract).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errors } = normalizeException(exception);

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
