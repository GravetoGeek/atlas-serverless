import type { AwsProviderConfig, LoggerProvider, RuntimeAppConfig } from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
import { type BootstrapRuntimeResult, type RuntimeEnvironment, type RuntimeProviderRegistration } from '@packages/runtime';
export interface AwsProviderRegistrationOptions {
    runtimeConfig: RuntimeAppConfig;
    awsConfig: AwsProviderConfig;
}
export declare function createAwsProviderRegistration(options: AwsProviderRegistrationOptions): RuntimeProviderRegistration;
export interface AwsInfrastructureOptions {
    runtimeConfig: RuntimeAppConfig;
    awsConfig: AwsProviderConfig;
    loggerProvider?: LoggerProvider;
    handlerRegistry?: HandlerRegistry;
    runtime?: RuntimeEnvironment;
    providerRegistrations?: RuntimeProviderRegistration[];
}
export declare function bootstrapAwsInfrastructure(options: AwsInfrastructureOptions): Promise<BootstrapRuntimeResult>;
//# sourceMappingURL=index.d.ts.map