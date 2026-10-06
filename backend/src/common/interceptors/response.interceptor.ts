import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ok, SuccessEnvelope } from '../response';

/**
 * Wraps every successful controller payload in the shared envelope
 * `{ success: true, data, message }` (docs/API_SPEC.md §Response contract).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessEnvelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessEnvelope<T>> {
    return next.handle().pipe(map((data) => ok(data)));
  }
}
