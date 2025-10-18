import { appConfig, awsConfig, projectConfig } from '@packages/config';
import type { LoggerProvider } from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
import { bootstrapRuntimeEnvironment, type BootstrapRuntimeResult, type RuntimeProviderRegistration } from '@packages/runtime';
import { createAwsProviderRegistration } from '@packages/infrastructure-aws';

function resolveProviderRegistrations(): RuntimeProviderRegistration[] {
    const registrations: RuntimeProviderRegistration[] = [];
    const enabledProviders = new Set(projectConfig.providers.enabled);

    if (enabledProviders.has('aws')) {
        if (!awsConfig) {
            throw new Error('AWS provider habilitado, porém configuração não foi encontrada.');
        }
        registrations.push(
            createAwsProviderRegistration({
                runtimeConfig: appConfig,
                awsConfig,
            })
        );
    }

    return registrations;
}

export interface RuntimeEnvironmentOptions {
    loggerProvider: LoggerProvider;
    handlerRegistry: HandlerRegistry;
}

export async function createLocalRuntimeEnvironment(
    options: RuntimeEnvironmentOptions
): Promise<BootstrapRuntimeResult> {
    return bootstrapRuntimeEnvironment({
        config: appConfig,
        loggerProvider: options.loggerProvider,
        handlerRegistry: options.handlerRegistry,
        providerRegistrations: resolveProviderRegistrations(),
    });
}

export async function createAwsLambdaRuntimeEnvironment(
    options: RuntimeEnvironmentOptions
): Promise<BootstrapRuntimeResult> {
    if (!awsConfig) {
        throw new Error('AWS provider configuration não encontrada. Defina as variáveis de ambiente necessárias.');
    }

    return bootstrapRuntimeEnvironment({
        config: appConfig,
        loggerProvider: options.loggerProvider,
        handlerRegistry: options.handlerRegistry,
        providerRegistrations: resolveProviderRegistrations(),
    });
}
