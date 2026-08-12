import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private requests = new Map<string, number[]>();

  check(key: string, windowMs: number, max: number) {
    const now = Date.now();
    const recent = (this.requests.get(key) ?? []).filter(
      (time) => now - time < windowMs,
    );

    if (recent.length >= max) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.requests.set(key, recent);
  }
}
