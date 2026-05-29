import pino from "pino";

const isBrowser = typeof window !== "undefined";

let logLevel = "info";
if (isBrowser) {
  logLevel = import.meta.env?.DEV ? "debug" : "info";
} else {
  logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
}

export const logger = pino({
  base: isBrowser
    ? { env: "browser" }
    : { env: "server", worker: "reluxury-web" },
  browser: {
    asObject: true,
    transmit: {
      level: "warn",
      send: (level, logEvent) => {
        // If we want to send client-side errors/warnings to Sentry or another logging service, we can do it here
        if (level === "error" || level === "fatal") {
          const message = logEvent.messages.join(" ");
          // Sentry is initialized globally on window, check if it exists safely
          if (typeof window !== "undefined") {
            const win = window as unknown as {
              Sentry?: { captureMessage: (msg: string) => void };
            };
            if (win.Sentry) {
              win.Sentry.captureMessage(`[pino-${level}] ${message}`);
            }
          }
        }
      },
    },
  },
  level: logLevel,
});

export default logger;
