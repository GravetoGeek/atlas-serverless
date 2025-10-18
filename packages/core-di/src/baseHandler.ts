import type { AppLogger, LoggerOptions, LoggerProvider, RuntimeAppConfig } from '@packages/contracts';

export type LambdaContext = Record<string, unknown> & {
    logger: AppLogger;
    config: RuntimeAppConfig;
    lambdaName: string;
};

export type LambdaHandler<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext> = (
    event: TEvent,
    context: TContext
) => Promise<TResult> | TResult;

export type Middleware<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext> = (
    event: TEvent,
    context: TContext,
    next: (event: TEvent, context: TContext) => Promise<TResult>
) => Promise<TResult>;

export interface HandlerOptions {
    defaultMiddlewares?: Middleware<any, any, LambdaContext>[];
    loggerProvider: LoggerProvider;
    loggerOptions?: Partial<Omit<LoggerOptions, 'serviceName'>>;
    config: RuntimeAppConfig;
}

export class BaseHandler {
    private defaultMiddlewares: Middleware<any, any, LambdaContext>[];
    private loggerOptions: Partial<Omit<LoggerOptions, 'serviceName'>>;
    private loggerProvider: LoggerProvider;
    private config: RuntimeAppConfig;

    constructor(options: HandlerOptions) {
        this.defaultMiddlewares = options.defaultMiddlewares || [];
        this.loggerProvider = options.loggerProvider;
        this.loggerOptions = options.loggerOptions || {};
        this.config = options.config;
    }

    async run<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext>(
        lambdaName: string,
        handler: LambdaHandler<TEvent, TResult, TContext>,
        event: TEvent,
        context: Partial<TContext> = {}
    ) {
        const loggerConfig: LoggerOptions = {
            level: this.loggerOptions.level ?? this.config.LOG_LEVEL,
            serviceName: lambdaName,
            logToFile: this.loggerOptions.logToFile ?? false,
            logFilePath: this.loggerOptions.logFilePath,
        };
        const baseLogger = this.loggerProvider.createLogger(loggerConfig);
        const requestId = (context as Record<string, unknown>)?.requestId as string | undefined;
        const logger = requestId ? baseLogger.child({ requestId }) : baseLogger;

        const enrichedContext: TContext = {
            ...(context as TContext),
            logger,
            config: this.config,
            lambdaName,
        };

        const composed = this.composeMiddlewares<TEvent, TResult, TContext>(
            handler,
            this.defaultMiddlewares as Middleware<TEvent, TResult, TContext>[]
        );

        return composed(event, enrichedContext);
    }

    private composeMiddlewares<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext>(
        handler: LambdaHandler<TEvent, TResult, TContext>,
        middlewares: Middleware<TEvent, TResult, TContext>[]
    ) {
        const adaptedHandler = async (event: TEvent, context: TContext): Promise<TResult> => {
            return Promise.resolve(handler(event, context));
        };

        return middlewares.reduceRight<LambdaHandler<TEvent, TResult, TContext>>(
            (next, mw) => async (event, context) => mw(event, context, (evt, ctx) => Promise.resolve(next(evt, ctx))),
            adaptedHandler
        );
    }
}