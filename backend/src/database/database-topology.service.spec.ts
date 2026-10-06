import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import {
  assertReplicaSetTopology,
  DatabaseTopologyService,
} from './database-topology.service';

function createConnection(command: jest.Mock): Connection {
  return {
    db: { admin: () => ({ command }) },
  } as unknown as Connection;
}

function createConfig(nodeEnv: string): ConfigService {
  return { get: () => nodeEnv } as unknown as ConfigService;
}

describe('assertReplicaSetTopology', () => {
  it('accepts a replica set topology', async () => {
    const command = jest.fn().mockResolvedValue({ setName: 'rs0' });

    await expect(
      assertReplicaSetTopology(createConnection(command)),
    ).resolves.toBeUndefined();
    expect(command).toHaveBeenCalledWith({ hello: 1 });
  });

  it('rejects a standalone topology with an actionable error', async () => {
    const command = jest.fn().mockResolvedValue({ msg: 'isdbgrid' });

    await expect(
      assertReplicaSetTopology(createConnection(command)),
    ).rejects.toThrow(/replica set/);
  });

  it('rejects when the connection is not ready', async () => {
    const connection = { db: undefined } as unknown as Connection;

    await expect(assertReplicaSetTopology(connection)).rejects.toThrow(
      /not ready/,
    );
  });
});

describe('DatabaseTopologyService', () => {
  it('skips the topology check in the test environment', async () => {
    const command = jest.fn();
    const service = new DatabaseTopologyService(
      createConnection(command),
      createConfig('test'),
    );

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(command).not.toHaveBeenCalled();
  });

  it('checks topology outside the test environment', async () => {
    const command = jest.fn().mockResolvedValue({ setName: 'rs0' });
    const service = new DatabaseTopologyService(
      createConnection(command),
      createConfig('production'),
    );

    await service.onApplicationBootstrap();

    expect(command).toHaveBeenCalledTimes(1);
  });

  it('surfaces a standalone topology as a startup failure', async () => {
    const command = jest.fn().mockResolvedValue({});
    const service = new DatabaseTopologyService(
      createConnection(command),
      createConfig('production'),
    );

    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      /replica set/,
    );
  });
});
