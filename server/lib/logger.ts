/**
 * Simple logger utility for consistent logging
 */

/**
 * Creates a logger with a specific namespace/prefix
 * @param namespace The prefix for log messages
 * @returns A logger object with standard log methods
 */
export function createLogger(namespace: string) {
  return {
    info: (message: string, ...meta: any[]) => {
      console.log(`[INFO] [${namespace}] ${message}`, ...meta);
    },
    warn: (message: string, ...meta: any[]) => {
      console.warn(`[WARN] [${namespace}] ${message}`, ...meta);
    },
    error: (message: string, ...meta: any[]) => {
      console.error(`[ERROR] [${namespace}] ${message}`, ...meta);
    },
    debug: (message: string, ...meta: any[]) => {
      if (process.env.DEBUG) {
        console.debug(`[DEBUG] [${namespace}] ${message}`, ...meta);
      }
    }
  };
} 