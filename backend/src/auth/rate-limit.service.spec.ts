import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
  });

  it('allows requests under the limit', () => {
    expect(() => service.check('key', 60_000, 2)).not.toThrow();
    expect(() => service.check('key', 60_000, 2)).not.toThrow();
  });

  it('blocks when the limit is reached', () => {
    service.check('key', 60_000, 1);

    expect(() => service.check('key', 60_000, 1)).toThrow(
      new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  it('tracks different keys separately', () => {
    service.check('a', 60_000, 1);
    expect(() => service.check('b', 60_000, 1)).not.toThrow();
  });
});
