import pino from "pino";

// pino-pretty is a dev dependency, so it's only used where it's actually installed.
const isPrettyPrintAvailable = (): boolean => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
};

// LOG_LEVEL=debug also shows every expected error (wrong password, invalid token...) with its
// internal data, which is logged at debug level because it can hold ids and emails.
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isPrettyPrintAvailable() && { transport: { target: "pino-pretty" } }),
});

// Email link tokens can travel in the URL, and a log file is no place for a working link.
export const maskTokensInUrl = (url: string): string =>
  url.replace(/eyJ[\w-]*\.[\w-]*\.[\w-]*/g, "[token]");

export default logger;
