import { ConnectionConfig } from "@interfaces/ConnectionConfig";
import { GASSourceDriver } from "@sources/drivers/GASSourceDriver";
import { MemorySourceDriver } from "@sources/drivers/MemorySourceDriver";
import { SourceDriver } from "@sources/drivers/SourceDriver";

/**
 * Selects and initializes the storage driver requested by a connection config.
 */
export class Connection {

  private readonly DRIVERS = {
    google: GASSourceDriver,
    memory: MemorySourceDriver
  };

  constructor(private readonly config: ConnectionConfig) {}
  
  /**
   * Initializes the configured storage driver.
   *
   * @returns The initialized driver.
   * @throws {Error} If the configured driver cannot be initialized.
   */
  connect(): SourceDriver {
    const Driver = this.DRIVERS[this.config.source];

    if (!Driver) {
      throw new Error(`Driver '${this.config.source}' não registrado.`);
    }

    return new Driver(this.config.properties);
  }

}