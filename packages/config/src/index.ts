import dotenv from 'dotenv';
import { z } from 'zod';
import type { AwsProviderConfig, RuntimeAppConfig } from '@packages/contracts';

dotenv.config();


const booleanFromEnv = z.preprocess(
    (value) => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            return value.toLowerCase() !== 'false';
        }
        return true;
    },
    z.boolean()
);

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

export type RuntimeConfigType = RuntimeAppConfig;

export interface ProjectConfig {
    app: RuntimeAppConfig;
    providers: {
        enabled: string[];
        aws?: AwsProviderConfig;
    };
}

function parseEnabledProviders(env: NodeJS.ProcessEnv): string[] {
    const raw = env.PROVIDERS_ENABLED ?? env.APP_PROVIDERS;
    if (!raw) {
        return [];
    }

    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeAppConfig {
    return RuntimeConfigSchema.parse(env) as RuntimeAppConfig;
}

export function loadAwsProviderConfig(env: NodeJS.ProcessEnv = process.env): AwsProviderConfig | undefined {
    const raw = AwsConfigSchema.parse(env);

    if (!raw.CLOUD_REGION || !raw.CLOUD_ACCESS_KEY_ID || !raw.CLOUD_SECRET_ACCESS_KEY) {
        return undefined;
    }

    return {
        region: raw.CLOUD_REGION,
        accessKeyId: raw.CLOUD_ACCESS_KEY_ID,
        secretAccessKey: raw.CLOUD_SECRET_ACCESS_KEY,
        endpointUrl: raw.CLOUD_ENDPOINT_URL,
    } satisfies AwsProviderConfig;
}

export function loadProjectConfig(env: NodeJS.ProcessEnv = process.env): ProjectConfig {
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
    } satisfies ProjectConfig;
}

export const projectConfig: ProjectConfig = loadProjectConfig();
export const appConfig: RuntimeAppConfig = projectConfig.app;
export const awsConfig: AwsProviderConfig | undefined = projectConfig.providers.aws;