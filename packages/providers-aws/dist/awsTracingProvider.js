import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4318/v1/traces';
export function createAwsTracingProvider(config) {
    return {
        async start({ config: appConfig }) {
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
        async shutdown(handle) {
            await handle.shutdown();
        },
    };
}
