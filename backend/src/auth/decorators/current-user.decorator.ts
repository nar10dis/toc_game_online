import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
    sub: number;
    username: string;
}

export const CurrentUser = createParamDecorator(
    (
        (data: unknown, ctx: ExecutionContext): JwtPayload => {
            return ctx.switchToHttp().getRequest().user;
            
        }
    )
);
