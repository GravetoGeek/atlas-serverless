import type { AwsProviderConfig, LoggerProvider, RuntimeAppConfig } from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
import { createWinstonLoggerProvider } from '@packages/logger';
import { createAwsSecretProvider, createAwsTracingProvider } from '@packages/providers-aws';
import {
    bootstrapRuntimeEnvironment,
    type BootstrapRuntimeResult,
    type RuntimeEnvironment,
    type RuntimeProviderRegistration,
} from '@packages/runtime';

export interface AwsProviderRegistrationOptions {
    runtimeConfig: RuntimeAppConfig;
    awsConfig: AwsProviderConfig;
}

export function createAwsProviderRegistration(options: AwsProviderRegistrationOptions): RuntimeProviderRegistration {
    const { runtimeConfig, awsConfig } = options;

    return async ({ runtime }) => {
        runtime.registerSecretProvider(createAwsSecretProvider(awsConfig));
        await runtime.registerTracingProvider(createAwsTracingProvider(runtimeConfig), { config: runtimeConfig });
    };
}

export interface AwsInfrastructureOptions {
    runtimeConfig: RuntimeAppConfig;
    awsConfig: AwsProviderConfig;
    loggerProvider?: LoggerProvider;
    handlerRegistry?: HandlerRegistry;
    runtime?: RuntimeEnvironment;
    providerRegistrations?: RuntimeProviderRegistration[];
}

export async function bootstrapAwsInfrastructure(options: AwsInfrastructureOptions): Promise<BootstrapRuntimeResult> {
    const loggerProvider = options.loggerProvider ?? createWinstonLoggerProvider();
    const handlerRegistry = options.handlerRegistry;

    const registrations: RuntimeProviderRegistration[] = [
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
