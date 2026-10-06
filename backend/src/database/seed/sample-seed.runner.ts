import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SampleSeedModule } from './sample-seed.module';
import { SampleSeedService } from './sample-seed.service';

/**
 * Manual entry point for `npm run seed:sample`. Boots a headless Nest context
 * (no HTTP server) against the configured `MONGODB_URI` and runs the
 * idempotent sample seed. Refuses to run in production.
 */
async function runSampleSeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed:sample is disabled when NODE_ENV=production');
  }

  const app = await NestFactory.createApplicationContext(SampleSeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const result = await app.get(SampleSeedService).run();
    Logger.log(
      `Sample seed done: ${result.categories} categories, ` +
        `${result.productsCreated} created, ${result.productsSkipped} skipped`,
      'SampleSeed',
    );
  } finally {
    await app.close();
  }
}

void runSampleSeed().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : String(error),
    undefined,
    'SampleSeed',
  );
  process.exitCode = 1;
});
