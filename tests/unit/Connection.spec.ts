import { describe, expect, it } from 'vitest';
import { Connection } from '../../src/core/Connection';
import { ConnectionConfig } from '../../src/interfaces/ConnectionConfig';
import { MemorySourceDriver } from '../../src/sources/drivers/MemorySourceDriver';

describe('Connection', () => {
  it('should initialize the configured memory driver', () => {
    expect(new Connection({ source: 'memory' }).connect())
      .toBeInstanceOf(MemorySourceDriver);
  });

  it('should reject an unregistered driver name', () => {
    const invalidConfig = { source: 'unknown' } as unknown as ConnectionConfig;

    expect(() => new Connection(invalidConfig).connect())
      .toThrow("Driver 'unknown' não registrado.");
  });
});
