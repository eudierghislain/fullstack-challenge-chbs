import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';

const MainLogger: Logger = new Logger('Main');
const TCP_PORT = process.env.TCP_PORT;
const HTTP_PORT = process.env.HTTP_PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(TCP_PORT),
    },
  });

  app.enableCors();
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.startAllMicroservices();
  await app.listen(Number(HTTP_PORT));

  MainLogger.log(`Database API is running on port ${HTTP_PORT}`);
  MainLogger.log(`Database Microservice is running on port ${TCP_PORT}`);
}

bootstrap();
