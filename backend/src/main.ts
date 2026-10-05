import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { UPLOADS_DIR } from './profile/avatar-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setGlobalPrefix('api');

  app.use(cookieParser());

  // setGlobalPrefix ne s'applique pas aux fichiers statiques
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/api/uploads/',
    setHeaders: (res: { setHeader(name: string, value: string): void }) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
