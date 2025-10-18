import type { AppLogger, LoggerOptions, LoggerProvider, RuntimeAppConfig } from '@packages/contracts';
export type LambdaContext = Record<string, unknown> & {
    logger: AppLogger;
    config: RuntimeAppConfig;
    lambdaName: string;
};
export type LambdaHandler<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext> = (event: TEvent, context: TContext) => Promise<TResult> | TResult;
export type Middleware<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext> = (event: TEvent, context: TContext, next: (event: TEvent, context: TContext) => Promise<TResult>) => Promise<TResult>;
export interface HandlerOptions {
    defaultMiddlewares?: Middleware<any, any, LambdaContext>[];
    loggerProvider: LoggerProvider;
    loggerOptions?: Partial<Omit<LoggerOptions, 'serviceName'>>;
    config: RuntimeAppConfig;
}
export declare class BaseHandler {
    private defaultMiddlewares;
    private loggerOptions;
    private loggerProvider;
    private config;
    constructor(options: HandlerOptions);
    run<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext>(lambdaName: string, handler: LambdaHandler<TEvent, TResult, TContext>, event: TEvent, context?: Partial<TContext>): Promise<TResult>;
    private composeMiddlewares;
}
//# sourceMappingURL=baseHandler.d.ts.map