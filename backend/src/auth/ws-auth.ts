// Le cookie arrive brut dans le handshake : "jwt=xxx; refresh_token=yyy"
export function readCookie(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader)
        return null;
    for (const part of cookieHeader.split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name)
            return decodeURIComponent(value.join('='));
    }
    return null;
}
