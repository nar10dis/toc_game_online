import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @currentUser() dans un controller = req.user (le payload du jwt, mis par l'AuthGuard)
export const currentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        return req.user;
    },
);
