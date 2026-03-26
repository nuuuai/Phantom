/** Thrown inside a transaction when free-tier rolling quota is exceeded. */
export class BrokerScanRateLimitedError extends Error {
  constructor(
    public readonly gate: {
      ok: false;
      code: "scan_rate_limited";
      message: string;
      retryAfterSeconds: number;
    }
  ) {
    super(gate.message);
    this.name = "BrokerScanRateLimitedError";
  }
}

/** Thrown when `DataBroker` catalog has no active rows (seed required). */
export class BrokerCatalogEmptyError extends Error {
  constructor() {
    super("Broker catalog not seeded");
    this.name = "BrokerCatalogEmptyError";
  }
}
