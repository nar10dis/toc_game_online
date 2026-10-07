import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true});
  
  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
