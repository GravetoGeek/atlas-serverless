import { context as otelContext, trace } from '@opentelemetry/api';
import { createLogger, format, transports } from 'winston';
const injectTraceContext = format((info) => {
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
const consolePrinter = (fallbackServiceName) => format.printf((info) => {
    const { timestamp, level, message, traceId, spanId, serviceName, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const traceSuffix = traceId ? ` traceId=${traceId}${spanId ? ` spanId=${spanId}` : ''}` : '';
    return `[${timestamp ?? ''}] [${serviceName ?? fallbackServiceName}] ${level ?? ''}: ${message ?? ''}${traceSuffix}${metaString ? ` ${metaString}` : ''}`.trim();
});
class WinstonLoggerAdapter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    info(message, metadata = {}) {
        this.logger.info(message, metadata);
    }
    warn(message, metadata = {}) {
        this.logger.warn(message, metadata);
    }
    error(message, metadata = {}) {
        this.logger.error(message, metadata);
    }
    debug(message, metadata = {}) {
        this.logger.debug(message, metadata);
    }
    child(bindings) {
        return new WinstonLoggerAdapter(this.logger.child(bindings));
    }
}
class WinstonLoggerProvider {
    rootLogger;
    ensureRoot(options) {
        if (!this.rootLogger) {
            const logTransports = [
                new transports.Console({
                    format: format.combine(injectTraceContext(), format.timestamp(), format.colorize({ all: true }), consolePrinter(options.serviceName)),
                }),
            ];
            if (options.logToFile && options.logFilePath) {
                logTransports.push(new transports.File({
                    filename: options.logFilePath,
                    format: format.combine(injectTraceContext(), format.timestamp(), format.json()),
                }));
            }
            this.rootLogger = createLogger({
                level: options.level,
                defaultMeta: { serviceName: options.serviceName },
                transports: logTransports,
            });
        }
        return this.rootLogger;
    }
    createLogger(options) {
        const root = this.ensureRoot(options);
        const instance = root.child({ serviceName: options.serviceName });
        return new WinstonLoggerAdapter(instance);
    }
}
export const winstonLoggerProvider = new WinstonLoggerProvider();
export const createWinstonLoggerProvider = () => new WinstonLoggerProvider();
