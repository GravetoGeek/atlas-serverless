import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const booleanFromEnv = z.preprocess((value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() !== 'false';
    }
    return true;
}, z.boolean());
const RuntimeConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test', 'local']).default('local'),
    LOG_LEVEL: z.string().default('info'),
    ENABLE_TRACING: booleanFromEnv.optional().default(true),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
});
const AwsConfigSchema = z.object({
    CLOUD_REGION: z.string().optional(),
    CLOUD_ACCESS_KEY_ID: z.string().optional(),
    CLOUD_SECRET_ACCESS_KEY: z.string().optional(),
    CLOUD_ENDPOINT_URL: z.string().optional(),
});
function parseEnabledProviders(env) {
    const raw = env.PROVIDERS_ENABLED ?? env.APP_PROVIDERS;
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
export function loadRuntimeConfig(env = process.env) {
    return RuntimeConfigSchema.parse(env);
}
export function loadAwsProviderConfig(env = process.env) {
    const raw = AwsConfigSchema.parse(env);
    if (!raw.CLOUD_REGION || !raw.CLOUD_ACCESS_KEY_ID || !raw.CLOUD_SECRET_ACCESS_KEY) {
        return undefined;
    }
    return {
        region: raw.CLOUD_REGION,
        accessKeyId: raw.CLOUD_ACCESS_KEY_ID,
        secretAccessKey: raw.CLOUD_SECRET_ACCESS_KEY,
        endpointUrl: raw.CLOUD_ENDPOINT_URL,
    };
}
export function loadProjectConfig(env = process.env) {
    const runtime = loadRuntimeConfig(env);
    const aws = loadAwsProviderConfig(env);
    const enabledProviders = parseEnabledProviders(env);
    const providersEnabled = enabledProviders.length > 0
        ? enabledProviders
        : aws
            ? ['aws']
            : [];
    return {
        app: runtime,
        providers: {
            enabled: providersEnabled,
            aws,
        },
    };
}
export const projectConfig = loadProjectConfig();
export const appConfig = projectConfig.app;
export const awsConfig = projectConfig.providers.aws;
