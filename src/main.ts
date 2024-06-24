import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS aktivieren für die spezifische Origin (https://erpnext.brlab.duckdns.org)
  app.use(
    cors({
      //origin: 'https://erpnext.brlab.duckdns.org',
      origin: 'http://192.168.8.57:8080',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true, // Wenn Cookies oder Authentifizierung verwendet werden
    }),
  );
  await app.listen(3000);
}

bootstrap();
