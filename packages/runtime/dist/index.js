import { createHandlerRegistry } from '@packages/handler-registry';
export function createRuntimeEnvironment() {
    let currentSecretProvider;
    let currentTracingProvider;
    let tracingHandle;
    const ensureSecretProvider = () => {
        if (!currentSecretProvider) {
            throw new Error('No secret provider registered.');
        }
        return currentSecretProvider;
    };
    const shutdownActiveTracing = async () => {
        if (currentTracingProvider && tracingHandle && typeof currentTracingProvider.shutdown === 'function') {
            try {
                await currentTracingProvider.shutdown(tracingHandle);
            }
            catch (error) {
                console.error('Falha ao finalizar instância de tracing existente', error);
            }
        }
        tracingHandle = undefined;
    };
    return {
        registerSecretProvider(provider) {
            currentSecretProvider = provider;
        },
        async getSecret(secretName) {
            const provider = ensureSecretProvider();
            return provider.getSecret(secretName);
        },
        async registerTracingProvider(provider, options) {
            await shutdownActiveTracing();
            currentTracingProvider = provider;
            if (!options.config.ENABLE_TRACING) {
                tracingHandle = undefined;
                return;
            }
            try {
                const startOptions = {
                    config: options.config,
                    ...(options.startOptions ?? {}),
                };
                const handle = await provider.start(startOptions);
                tracingHandle = handle;
            }
            catch (error) {
                console.error('Falha ao iniciar tracing provider', error);
                tracingHandle = undefined;
            }
        },
        async shutdownTracing() {
            await shutdownActiveTracing();
            currentTracingProvider = undefined;
        },
        getTracingHandle() {
            return tracingHandle;
        },
    };
}
const defaultRuntime = createRuntimeEnvironment();
export const registerSecretProvider = defaultRuntime.registerSecretProvider;
export const getSecret = defaultRuntime.getSecret;
export const registerTracingProvider = defaultRuntime.registerTracingProvider;
export const shutdownTracing = defaultRuntime.shutdownTracing;
export const getTracingHandle = defaultRuntime.getTracingHandle;
export async function bootstrapRuntimeEnvironment(options) {
    const { config, loggerProvider } = options;
    const handlerRegistry = options.handlerRegistry ?? createHandlerRegistry();
    const runtime = options.runtime ?? createRuntimeEnvironment();
    const registrations = options.providerRegistrations ?? [];
    for (const registration of registrations) {
        await registration({ config, loggerProvider, handlerRegistry, runtime });
    }
    return { loggerProvider, handlerRegistry, runtime };
}
