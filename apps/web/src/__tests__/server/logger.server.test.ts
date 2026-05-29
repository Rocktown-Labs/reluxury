import { describe, it, expect } from "vitest";

import { logger } from "../../lib/logger";

describe("Server-Side Pino Logger (in Cloudflare pool)", () => {
  it("should be successfully initialized in workerd environment", () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf("function");
    expect(logger.error).toBeTypeOf("function");
  });

  it("should log messages without raising errors inside the edge runtime", () => {
    // Calling the logging functions should succeed without throwing exceptions
    expect(() => {
      logger.info(
        { test: "metadata" },
        "Testing pino logger inside Cloudflare Worker"
      );
      logger.warn("Warning test");
      logger.error(new Error("Pino error test"), "Error test");
    }).not.toThrow();
  });
});
