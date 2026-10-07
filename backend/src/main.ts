import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { UPLOADS_DIR } from './profile/avatar-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true});
  
  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.useLogger(app.get(Logger));
  
  // setGlobalPrefix ne s'applique pas aux fichiers statiques
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/api/uploads/',
    setHeaders: (res: { setHeader(name: string, value: string): void }) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
