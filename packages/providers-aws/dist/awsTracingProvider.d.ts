import { NodeSDK } from '@opentelemetry/sdk-node';
import type { RuntimeAppConfig, TracingProvider } from '@packages/contracts';
export type NodeSdkTracingProvider = TracingProvider<NodeSDK, RuntimeAppConfig>;
export declare function createAwsTracingProvider(config: RuntimeAppConfig): NodeSdkTracingProvider;
//# sourceMappingURL=awsTracingProvider.d.ts.map