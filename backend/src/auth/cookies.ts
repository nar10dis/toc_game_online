import type { CookieOptions } from 'express';

export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
};

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
