import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { normalizeException } from './all-exceptions.filter';

describe('normalizeException', () => {
  it.each([
    [new BadRequestException('bad input'), HttpStatus.BAD_REQUEST],
    [new UnauthorizedException(), HttpStatus.UNAUTHORIZED],
    [new ForbiddenException(), HttpStatus.FORBIDDEN],
    [new NotFoundException(), HttpStatus.NOT_FOUND],
    [new ConflictException('email exists'), HttpStatus.CONFLICT],
    [
      new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
      HttpStatus.TOO_MANY_REQUESTS,
    ],
  ])('maps %p to HTTP %i', (exception, expectedStatus) => {
    expect(normalizeException(exception).status).toBe(expectedStatus);
  });

  it('turns class-validator array messages into the errors array', () => {
    const exception = new BadRequestException({
      message: ['name should not be empty', 'price must be positive'],
      error: 'Bad Request',
    });

    expect(normalizeException(exception)).toEqual({
      status: HttpStatus.BAD_REQUEST,
      message: 'Bad Request',
      errors: ['name should not be empty', 'price must be positive'],
    });
  });

  it('maps a MongoDB duplicate key error to 409 without leaking details', () => {
    const duplicateKeyError = { code: 11000, message: 'E11000 duplicate key' };

    expect(normalizeException(duplicateKeyError)).toEqual({
      status: HttpStatus.CONFLICT,
      message: 'Resource already exists',
    });
  });

  it('maps a Mongoose CastError to 400', () => {
    const castError = { name: 'CastError', message: 'Cast to ObjectId failed' };

    expect(normalizeException(castError).status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('maps an unknown error to a generic 500', () => {
    expect(normalizeException(new Error('boom'))).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
