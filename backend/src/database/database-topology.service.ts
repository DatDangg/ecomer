import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface ReplicaSetHello {
  setName?: string;
}

/**
 * Verifies the connected MongoDB is a replica set, which is mandatory for
 * multi-document transactions (BR-CHK-010). A standalone server would let the
 * app boot and then fail later inside `session.withTransaction`, so startup
 * fails instead with an actionable configuration error.
 */
export async function assertReplicaSetTopology(
  connection: Connection,
): Promise<void> {
  const db = connection.db;
  if (!db) {
    throw new Error(
      'MongoDB connection is not ready; cannot verify replica set topology.',
    );
  }

  const hello = (await db.admin().command({ hello: 1 })) as ReplicaSetHello;
  if (!hello.setName) {
    throw new Error(
      'MongoDB must run as a replica set because transactions require one. ' +
        'Point MONGODB_URI at MongoDB Atlas (M0) or a local single-node replica set.',
    );
  }
}

/**
 * Runs the replica-set guard once at startup. In tests the connection is lazy
 * and no MongoDB is required, so the guard is skipped for `NODE_ENV=test`.
 */
@Injectable()
export class DatabaseTopologyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseTopologyService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const nodeEnv = this.config.get<string>('nodeEnv') ?? 'development';
    if (nodeEnv === 'test') {
      return;
    }

    await assertReplicaSetTopology(this.connection);
    this.logger.log('MongoDB replica set topology verified');
  }
}
