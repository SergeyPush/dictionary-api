import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger(AppModule.name);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  app.enableCors({
    credentials: true,
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  logger.debug(`Server started on port ${PORT}`);
}
bootstrap();
