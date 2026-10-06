import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { DatabaseTopologyService } from './database-topology.service';

export interface DatabaseOptions {
  uri: string;
  nodeEnv: string;
  serverSelectionTimeoutMS: number;
}

/**
 * Builds the Mongoose connection options. The URI must point at a replica set
 * (Atlas M0 or a local single-node replica set) so transactions are available
 * (BR-CHK-010). Missing config fails fast with an actionable message.
 *
 * In tests the connection is created lazily so `npm test` never needs a live
 * MongoDB; every other environment connects eagerly and fails fast.
 */
export function createMongooseOptions({
  uri,
  nodeEnv,
  serverSelectionTimeoutMS,
}: DatabaseOptions): MongooseModuleOptions {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Configure it before starting the API.',
    );
  }

  return {
    uri,
    serverSelectionTimeoutMS,
    lazyConnection: nodeEnv === 'test',
  };
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createMongooseOptions({
          uri: config.get<string>('mongodbUri') ?? '',
          nodeEnv: config.get<string>('nodeEnv') ?? 'development',
          serverSelectionTimeoutMS:
            config.get<number>('mongoServerSelectionTimeoutMs') ?? 5000,
        }),
    }),
  ],
  providers: [DatabaseTopologyService],
})
export class DatabaseModule {}
