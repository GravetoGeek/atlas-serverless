import { BaseHandler } from '@packages/core-di';
import type { LambdaContext, Middleware } from '@packages/core-di';
import { appConfig } from '@packages/config';
import { createHttpApp } from '@packages/adapters-http';
import { createWinstonLoggerProvider } from '@packages/logger';
import { createLocalRuntimeEnvironment, type RuntimeEnvironmentOptions } from '@applications/handler-descriptors';
import { createLocalHandlerRegistry } from '@packages/registries';
import { createRoutes } from './routes';

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception capturada no servidor local:', error);
});

const runtimeOptions: RuntimeEnvironmentOptions = {
    loggerProvider: createWinstonLoggerProvider(),
    handlerRegistry: createLocalHandlerRegistry(),
};

const { loggerProvider, handlerRegistry } = await createLocalRuntimeEnvironment(runtimeOptions).catch((error) => {
    console.error('Failed to initialize runtime environment', error);
    return {
        loggerProvider: runtimeOptions.loggerProvider,
        handlerRegistry: runtimeOptions.handlerRegistry,
    };
});

const gatewayLogger = loggerProvider.createLogger({
    level: appConfig.LOG_LEVEL,
    serviceName: 'api-gateway',
    logToFile: false,
});

const logInvocationMiddleware: Middleware<unknown, unknown, LambdaContext> = async (
    event: unknown,
    context: LambdaContext,
    next: (evt: unknown, ctx: LambdaContext) => Promise<unknown>
) => {
    const { preview, truncated } = (() => {
        try {
            const serialized = JSON.stringify(event);
            const isTruncated = serialized.length > 200;
            return {
                preview: isTruncated ? `${serialized.slice(0, 197)}...` : serialized,
                truncated: isTruncated,
            };
        } catch {
            return { preview: '[unserializable]', truncated: false };
        }
    })();

    context.logger.info('Lambda invocation received', {
        lambdaName: context.lambdaName,
        requestId: (context as Record<string, unknown>).requestId,
        payloadPreview: preview,
        payloadTruncated: truncated,
    });

    return next(event, context);
};

const baseHandler = new BaseHandler({
    defaultMiddlewares: [logInvocationMiddleware],
    loggerProvider,
    config: appConfig,
});

const routes = await createRoutes(handlerRegistry);

const app = createHttpApp({
    routes,
    baseHandler,
    logger: gatewayLogger,
});

app.listen(3000, () => {
    gatewayLogger.info('Servidor de lambdas rodando', { port: 3000, url: 'http://localhost:3000' });
});