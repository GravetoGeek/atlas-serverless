export type AppEnvironment = 'development' | 'production' | 'test' | 'local';

export interface RuntimeAppConfig {
    NODE_ENV: AppEnvironment;
    LOG_LEVEL: string;
    ENABLE_TRACING: boolean;
    OTEL_EXPORTER_OTLP_ENDPOINT?: string;
}

export interface AwsProviderConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpointUrl?: string;
}

export interface ConfigProvider {
    getConfig(): RuntimeAppConfig;
}

export type SecretValue = string;

export interface SecretProvider {
    getSecret(name: string): Promise<SecretValue>;
}

export interface TracingStartOptions<TConfig = RuntimeAppConfig> {
    config: TConfig;
}

export interface TracingProvider<THandle = unknown, TConfig = RuntimeAppConfig> {
    start(options: TracingStartOptions<TConfig>): Promise<THandle> | THandle;
    shutdown?(handle: THandle): Promise<void> | void;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | string;

export type LogMetadata = Record<string, unknown>;

export interface AppLogger {
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    child(bindings: LogMetadata): AppLogger;
}

export interface LoggerOptions {
    level: LogLevel;
    serviceName: string;
    logToFile?: boolean;
    logFilePath?: string;
}

export interface LoggerProvider {
    createLogger(options: LoggerOptions): AppLogger;
}
