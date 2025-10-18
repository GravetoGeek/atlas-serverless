import type {
    RuntimeAppConfig,
    SecretProvider,
    SecretValue,
    TracingProvider,
    TracingStartOptions,
    LoggerProvider,
} from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
import { createHandlerRegistry } from '@packages/handler-registry';

type TracingHandle = unknown;

export interface RegisterTracingProviderOptions<TConfig extends RuntimeAppConfig = RuntimeAppConfig> {
    config: TConfig;
    startOptions?: Partial<TracingStartOptions<TConfig>>;
}

export interface RuntimeEnvironment {
    registerSecretProvider(provider: SecretProvider): void;
    getSecret(secretName: string): Promise<SecretValue>;
    registerTracingProvider<THandle = unknown, TConfig extends RuntimeAppConfig = RuntimeAppConfig>(
        provider: TracingProvider<THandle, TConfig>,
        options: RegisterTracingProviderOptions<TConfig>
    ): Promise<void>;
    shutdownTracing(): Promise<void>;
    getTracingHandle<THandle = unknown>(): THandle | undefined;
}

export function createRuntimeEnvironment(): RuntimeEnvironment {
    let currentSecretProvider: SecretProvider | undefined;
    let currentTracingProvider: TracingProvider<TracingHandle, RuntimeAppConfig> | undefined;
    let tracingHandle: TracingHandle | undefined;

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
            } catch (error) {
                console.error('Falha ao finalizar instância de tracing existente', error);
            }
        }

        tracingHandle = undefined;
    };

    return {
        registerSecretProvider(provider: SecretProvider) {
            currentSecretProvider = provider;
        },
        async getSecret(secretName: string) {
            const provider = ensureSecretProvider();
            return provider.getSecret(secretName);
        },
        async registerTracingProvider<THandle = unknown, TConfig extends RuntimeAppConfig = RuntimeAppConfig>(
            provider: TracingProvider<THandle, TConfig>,
            options: RegisterTracingProviderOptions<TConfig>
        ) {
            await shutdownActiveTracing();

            currentTracingProvider = provider as TracingProvider<TracingHandle, RuntimeAppConfig>;

            if (!options.config.ENABLE_TRACING) {
                tracingHandle = undefined;
                return;
            }

            try {
                const startOptions: TracingStartOptions<TConfig> = {
                    config: options.config,
                    ...(options.startOptions ?? {}),
                };
                const handle = await provider.start(startOptions);
                tracingHandle = handle as TracingHandle;
            } catch (error) {
                console.error('Falha ao iniciar tracing provider', error);
                tracingHandle = undefined;
            }
        },
        async shutdownTracing() {
            await shutdownActiveTracing();
            currentTracingProvider = undefined;
        },
        getTracingHandle<THandle = unknown>() {
            return tracingHandle as THandle | undefined;
        },
    } satisfies RuntimeEnvironment;
}

const defaultRuntime = createRuntimeEnvironment();

export const registerSecretProvider = defaultRuntime.registerSecretProvider;
export const getSecret = defaultRuntime.getSecret;
export const registerTracingProvider = defaultRuntime.registerTracingProvider;
export const shutdownTracing = defaultRuntime.shutdownTracing;
export const getTracingHandle = defaultRuntime.getTracingHandle;

export interface RuntimeProviderRegistrationContext {
    config: RuntimeAppConfig;
    loggerProvider: LoggerProvider;
    handlerRegistry: HandlerRegistry;
    runtime: RuntimeEnvironment;
}

export type RuntimeProviderRegistration = (
    context: RuntimeProviderRegistrationContext
) => Promise<void> | void;

export interface BootstrapRuntimeOptions {
    config: RuntimeAppConfig;
    loggerProvider: LoggerProvider;
    handlerRegistry?: HandlerRegistry;
    runtime?: RuntimeEnvironment;
    providerRegistrations?: RuntimeProviderRegistration[];
}

export interface BootstrapRuntimeResult {
    loggerProvider: LoggerProvider;
    handlerRegistry: HandlerRegistry;
    runtime: RuntimeEnvironment;
}

export async function bootstrapRuntimeEnvironment(options: BootstrapRuntimeOptions): Promise<BootstrapRuntimeResult> {
    const { config, loggerProvider } = options;
    const handlerRegistry = options.handlerRegistry ?? createHandlerRegistry();
    const runtime = options.runtime ?? createRuntimeEnvironment();
    const registrations = options.providerRegistrations ?? [];

    for (const registration of registrations) {
        await registration({ config, loggerProvider, handlerRegistry, runtime });
    }

    return { loggerProvider, handlerRegistry, runtime } satisfies BootstrapRuntimeResult;
}
