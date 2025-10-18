import type { RuntimeAppConfig, SecretProvider, SecretValue, TracingProvider, TracingStartOptions, LoggerProvider } from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
export interface RegisterTracingProviderOptions<TConfig extends RuntimeAppConfig = RuntimeAppConfig> {
    config: TConfig;
    startOptions?: Partial<TracingStartOptions<TConfig>>;
}
export interface RuntimeEnvironment {
    registerSecretProvider(provider: SecretProvider): void;
    getSecret(secretName: string): Promise<SecretValue>;
    registerTracingProvider<THandle = unknown, TConfig extends RuntimeAppConfig = RuntimeAppConfig>(provider: TracingProvider<THandle, TConfig>, options: RegisterTracingProviderOptions<TConfig>): Promise<void>;
    shutdownTracing(): Promise<void>;
    getTracingHandle<THandle = unknown>(): THandle | undefined;
}
export declare function createRuntimeEnvironment(): RuntimeEnvironment;
export declare const registerSecretProvider: (provider: SecretProvider) => void;
export declare const getSecret: (secretName: string) => Promise<SecretValue>;
export declare const registerTracingProvider: <THandle = unknown, TConfig extends RuntimeAppConfig = RuntimeAppConfig>(provider: TracingProvider<THandle, TConfig>, options: RegisterTracingProviderOptions<TConfig>) => Promise<void>;
export declare const shutdownTracing: () => Promise<void>;
export declare const getTracingHandle: <THandle = unknown>() => THandle | undefined;
export interface RuntimeProviderRegistrationContext {
    config: RuntimeAppConfig;
    loggerProvider: LoggerProvider;
    handlerRegistry: HandlerRegistry;
    runtime: RuntimeEnvironment;
}
export type RuntimeProviderRegistration = (context: RuntimeProviderRegistrationContext) => Promise<void> | void;
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
export declare function bootstrapRuntimeEnvironment(options: BootstrapRuntimeOptions): Promise<BootstrapRuntimeResult>;
//# sourceMappingURL=index.d.ts.map