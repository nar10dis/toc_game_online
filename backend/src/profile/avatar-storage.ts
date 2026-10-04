import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');
const AVATAR_URL_PREFIX = '/api/uploads/avatars/';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

// Le mimetype envoye par le navigateur peut mentir, on lit les premiers octets.
// Pas de SVG : il peut contenir du JavaScript.
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'png';
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return 'jpg';
  if (buffer.subarray(0, 4).toString('latin1') === 'GIF8')
    return 'gif';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'webp';
  return null;
}

export async function saveAvatar(userId: number, buffer: Buffer): Promise<string | null> {
  const extension = detectImageExtension(buffer);
  if (!extension)
    return null;

  const fileName = `${userId}-${randomUUID()}.${extension}`;
  await mkdir(AVATARS_DIR, { recursive: true });
  await writeFile(join(AVATARS_DIR, fileName), buffer);
  return AVATAR_URL_PREFIX + fileName;
}

export async function deleteAvatar(avatarUrl: string | null) {
  // basename empeche de sortir du dossier
  if (!avatarUrl || !avatarUrl.startsWith(AVATAR_URL_PREFIX))
    return;
  try {
    await unlink(join(AVATARS_DIR, basename(avatarUrl)));
  }
  catch {
    // deja supprime : rien a faire
  }
}
