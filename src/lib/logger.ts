type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogSink {
  write(level: Level, message: string, meta?: unknown): void;
}

/**
 * Logging goes through a sink so the transport can be swapped (console in
 * development, a hosted collector in production) without touching call sites.
 */
class ConsoleSink implements LogSink {
  write(level: Level, message: string, meta?: unknown): void {
    const line = `[pochtashop] ${message}`;
    if (level === 'error') console.error(line, meta ?? '');
    else if (level === 'warn') console.warn(line, meta ?? '');
    else if (level === 'info') console.info(line, meta ?? '');
    else if (process.env.NODE_ENV !== 'production') console.debug(line, meta ?? '');
  }
}

let sink: LogSink = new ConsoleSink();

export function setLogSink(next: LogSink): void {
  sink = next;
}

function serialise(meta: unknown): unknown {
  if (meta instanceof Error) return { name: meta.name, message: meta.message, stack: meta.stack };
  return meta;
}

export const logger = {
  debug: (message: string, meta?: unknown) => sink.write('debug', message, serialise(meta)),
  info: (message: string, meta?: unknown) => sink.write('info', message, serialise(meta)),
  warn: (message: string, meta?: unknown) => sink.write('warn', message, serialise(meta)),
  error: (message: string, meta?: unknown) => sink.write('error', message, serialise(meta)),
};
