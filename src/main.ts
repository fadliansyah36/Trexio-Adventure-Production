import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const defaultAllowedOrigins = [
  'https://trexio.id',
  'https://www.trexio.id',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    try {
      const parsedUrl = new URL(origin);
      if (
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.endsWith('.run.app') ||
        parsedUrl.hostname.endsWith('.trexio.id')
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid URL
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error('CORS request blocked by origin whitelist policy'));
  },
  credentials: true,
};

export async function bootstrapNestApp(expressInstance?: any) {
  if (expressInstance) {
    const app = await NestFactory.create(AppModule, expressInstance, {
      logger: ['error', 'warn', 'log'],
    });
    app.enableCors(corsOptions);
    await app.init();
    return app;
  } else {
    const app = await NestFactory.create(AppModule);
    app.enableCors(corsOptions);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`[NestJS] Server listening on port ${port}`);
    return app;
  }
}

if (require.main === module) {
  bootstrapNestApp();
}
