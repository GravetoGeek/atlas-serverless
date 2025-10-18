import type { LoggerProvider } from '@packages/contracts';
import type { HandlerRegistry } from '@packages/handler-registry';
import { type BootstrapRuntimeResult } from '@packages/runtime';
export interface RuntimeEnvironmentOptions {
    loggerProvider: LoggerProvider;
    handlerRegistry: HandlerRegistry;
}
export declare function createLocalRuntimeEnvironment(options: RuntimeEnvironmentOptions): Promise<BootstrapRuntimeResult>;
export declare function createAwsLambdaRuntimeEnvironment(options: RuntimeEnvironmentOptions): Promise<BootstrapRuntimeResult>;
//# sourceMappingURL=runtimeEnvironment.d.ts.map