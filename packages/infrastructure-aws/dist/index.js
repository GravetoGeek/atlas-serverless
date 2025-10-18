import { createWinstonLoggerProvider } from '@packages/logger';
import { createAwsSecretProvider, createAwsTracingProvider } from '@packages/providers-aws';
import { bootstrapRuntimeEnvironment, } from '@packages/runtime';
export function createAwsProviderRegistration(options) {
    const { runtimeConfig, awsConfig } = options;
    return async ({ runtime }) => {
        runtime.registerSecretProvider(createAwsSecretProvider(awsConfig));
        await runtime.registerTracingProvider(createAwsTracingProvider(runtimeConfig), { config: runtimeConfig });
    };
}
export async function bootstrapAwsInfrastructure(options) {
    const loggerProvider = options.loggerProvider ?? createWinstonLoggerProvider();
    const handlerRegistry = options.handlerRegistry;
    const registrations = [
        createAwsProviderRegistration({ runtimeConfig: options.runtimeConfig, awsConfig: options.awsConfig }),
        ...(options.providerRegistrations ?? []),
    ];
    return bootstrapRuntimeEnvironment({
        config: options.runtimeConfig,
        loggerProvider,
        handlerRegistry,
        runtime: options.runtime,
        providerRegistrations: registrations,
    });
}
