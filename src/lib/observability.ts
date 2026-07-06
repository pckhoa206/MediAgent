export interface LogEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export function logEvent(event: LogEvent) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...event }));
  }
}

export function withRequestLogging<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return fn();
}
