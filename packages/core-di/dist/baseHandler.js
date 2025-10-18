export class BaseHandler {
    defaultMiddlewares;
    loggerOptions;
    loggerProvider;
    config;
    constructor(options) {
        this.defaultMiddlewares = options.defaultMiddlewares || [];
        this.loggerProvider = options.loggerProvider;
        this.loggerOptions = options.loggerOptions || {};
        this.config = options.config;
    }
    async run(lambdaName, handler, event, context = {}) {
        const loggerConfig = {
            level: this.loggerOptions.level ?? this.config.LOG_LEVEL,
            serviceName: lambdaName,
            logToFile: this.loggerOptions.logToFile ?? false,
            logFilePath: this.loggerOptions.logFilePath,
        };
        const baseLogger = this.loggerProvider.createLogger(loggerConfig);
        const requestId = context?.requestId;
        const logger = requestId ? baseLogger.child({ requestId }) : baseLogger;
        const enrichedContext = {
            ...context,
            logger,
            config: this.config,
            lambdaName,
        };
        const composed = this.composeMiddlewares(handler, this.defaultMiddlewares);
        return composed(event, enrichedContext);
    }
    composeMiddlewares(handler, middlewares) {
        const adaptedHandler = async (event, context) => {
            return Promise.resolve(handler(event, context));
        };
        return middlewares.reduceRight((next, mw) => async (event, context) => mw(event, context, (evt, ctx) => Promise.resolve(next(evt, ctx))), adaptedHandler);
    }
}
