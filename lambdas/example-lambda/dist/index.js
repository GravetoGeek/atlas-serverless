import { createAwsLambdaRuntimeEnvironment, createLocalRuntimeEnvironment } from '@applications/handler-descriptors';
import { createAwsHandlerRegistry, createLocalHandlerRegistry } from '@packages/registries';
import { createWinstonLoggerProvider } from '@packages/logger';
import { awsConfig, projectConfig } from '@packages/config';
async function bootstrapLoggerProvider() {
    const loggerProvider = createWinstonLoggerProvider();
    const awsEnabled = projectConfig.providers.enabled.includes('aws') && awsConfig;
    if (awsEnabled && awsConfig) {
        const runtimeOptions = {
            loggerProvider,
            handlerRegistry: createAwsHandlerRegistry(awsConfig),
        };
        await createAwsLambdaRuntimeEnvironment(runtimeOptions);
        return loggerProvider;
    }
    console.warn('Executando example-lambda em modo local, sem providers AWS ativos.');
    const runtimeOptions = {
        loggerProvider,
        handlerRegistry: createLocalHandlerRegistry(),
    };
    await createLocalRuntimeEnvironment(runtimeOptions);
    return loggerProvider;
}
const loggerProvider = await bootstrapLoggerProvider();
const logger = loggerProvider.createLogger({
    level: 'info',
    serviceName: 'example-lambda',
    logToFile: false,
    logFilePath: './logs/example-lambda.log',
});
export const handler = async (event) => {
    logger.info('Lambda started', { event });
    try {
        // Lambda logic placeholder
        logger.info('Processing event...');
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Lambda executed successfully!' }),
        };
    }
    catch (error) {
        logger.error('Lambda failed', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal error' }),
        };
    }
};
if (import.meta.url === process.argv[1]) {
    handler({ key: 'value' }).then(console.log).catch(console.error);
}
