import { context as otelContext, trace } from '@opentelemetry/api';
import type { TransformableInfo } from 'logform';
import { createLogger, format, transports, Logger as WinstonLogger, transport } from 'winston';
import type { AppLogger, LogMetadata, LoggerOptions, LoggerProvider } from '@packages/contracts';

const injectTraceContext = format((info: TransformableInfo) => {
    const span = trace.getSpan(otelContext.active());
    if (span) {
        const spanContext = span.spanContext();
        if (spanContext.traceId) {
            info.traceId = spanContext.traceId;
        }
        if (spanContext.spanId) {
            info.spanId = spanContext.spanId;
        }
    }
    return info;
});

const consolePrinter = (fallbackServiceName: string) =>
    format.printf((info: TransformableInfo) => {
        const {
            timestamp,
            level,
            message,
            traceId,
            spanId,
            serviceName,
            ...meta
        } = info as Record<string, unknown> & {
            timestamp?: string;
            level?: string;
            message?: string;
            traceId?: string;
            spanId?: string;
            serviceName?: string;
        };

        const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
        const traceSuffix = traceId ? ` traceId=${traceId}${spanId ? ` spanId=${spanId}` : ''}` : '';
        return `[${timestamp ?? ''}] [${serviceName ?? fallbackServiceName}] ${level ?? ''}: ${message ?? ''}${traceSuffix}${metaString ? ` ${metaString}` : ''}`.trim();
    });

class WinstonLoggerAdapter implements AppLogger {
    constructor(private readonly logger: WinstonLogger) { }

    info(message: string, metadata: LogMetadata = {}): void {
        this.logger.info(message, metadata);
    }

    warn(message: string, metadata: LogMetadata = {}): void {
        this.logger.warn(message, metadata);
    }

    error(message: string, metadata: LogMetadata = {}): void {
        this.logger.error(message, metadata);
    }

    debug(message: string, metadata: LogMetadata = {}): void {
        this.logger.debug(message, metadata);
    }

    child(bindings: LogMetadata): AppLogger {
        return new WinstonLoggerAdapter(this.logger.child(bindings));
    }
}

class WinstonLoggerProvider implements LoggerProvider {
    private rootLogger: WinstonLogger | undefined;

    private ensureRoot(options: LoggerOptions): WinstonLogger {
        if (!this.rootLogger) {
            const logTransports: transport[] = [
                new transports.Console({
                    format: format.combine(
                        injectTraceContext(),
                        format.timestamp(),
                        format.colorize({ all: true }),
                        consolePrinter(options.serviceName)
                    ),
                }),
            ];

            if (options.logToFile && options.logFilePath) {
                logTransports.push(
                    new transports.File({
                        filename: options.logFilePath,
                        format: format.combine(
                            injectTraceContext(),
                            format.timestamp(),
                            format.json()
                        ),
                    })
                );
            }

            this.rootLogger = createLogger({
                level: options.level,
                defaultMeta: { serviceName: options.serviceName },
                transports: logTransports,
            });
        }

        return this.rootLogger;
    }

    createLogger(options: LoggerOptions): AppLogger {
        const root = this.ensureRoot(options);
        const instance = root.child({ serviceName: options.serviceName });
        return new WinstonLoggerAdapter(instance);
    }
}

export const winstonLoggerProvider: LoggerProvider = new WinstonLoggerProvider();

export const createWinstonLoggerProvider = (): LoggerProvider => new WinstonLoggerProvider();