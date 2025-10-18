import { appConfig, awsConfig, projectConfig } from '@packages/config';
import { bootstrapRuntimeEnvironment } from '@packages/runtime';
import { createAwsProviderRegistration } from '@packages/infrastructure-aws';
function resolveProviderRegistrations() {
    const registrations = [];
    const enabledProviders = new Set(projectConfig.providers.enabled);
    if (enabledProviders.has('aws')) {
        if (!awsConfig) {
            throw new Error('AWS provider habilitado, porém configuração não foi encontrada.');
        }
        registrations.push(createAwsProviderRegistration({
            runtimeConfig: appConfig,
            awsConfig,
        }));
    }
    return registrations;
}
export async function createLocalRuntimeEnvironment(options) {
    return bootstrapRuntimeEnvironment({
        config: appConfig,
        loggerProvider: options.loggerProvider,
        handlerRegistry: options.handlerRegistry,
        providerRegistrations: resolveProviderRegistrations(),
    });
}
export async function createAwsLambdaRuntimeEnvironment(options) {
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
