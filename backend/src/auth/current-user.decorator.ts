import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export interface JwtUser {
  sub: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    return ctx.switchToHttp().getRequest<Request & { user: JwtUser }>().user;
  },
);
