import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { RuntimeAppConfig, TracingProvider, TracingStartOptions } from '@packages/contracts';

const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4318/v1/traces';

export type NodeSdkTracingProvider = TracingProvider<NodeSDK, RuntimeAppConfig>;

export function createAwsTracingProvider(config: RuntimeAppConfig): NodeSdkTracingProvider {
    return {
        async start({ config: appConfig }: TracingStartOptions<RuntimeAppConfig>): Promise<NodeSDK> {
            const endpoint = appConfig.OTEL_EXPORTER_OTLP_ENDPOINT ?? config.OTEL_EXPORTER_OTLP_ENDPOINT ?? DEFAULT_OTLP_ENDPOINT;

            const sdk = new NodeSDK({
                traceExporter: new OTLPTraceExporter({
                    url: endpoint,
                }),
                instrumentations: [getNodeAutoInstrumentations()],
            });

            await sdk.start();
            return sdk;
        },
        async shutdown(handle: NodeSDK): Promise<void> {
            await handle.shutdown();
        },
    };
}
