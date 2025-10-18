import { describe, it, expect, vi } from 'vitest';
import { bootstrapAwsInfrastructure, createAwsProviderRegistration } from './index';
describe('bootstrapAwsInfrastructure', () => {
    it('creates default logger and registry when not provided', async () => {
        const runtimeConfig = {
            NODE_ENV: 'local',
            LOG_LEVEL: 'info',
            ENABLE_TRACING: false,
        };
        const awsConfig = {
            region: 'sa-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
        };
        const result = await bootstrapAwsInfrastructure({
            runtimeConfig,
            awsConfig,
        });
        expect(result.loggerProvider).toBeDefined();
        expect(result.handlerRegistry).toBeDefined();
        expect(result.runtime).toBeDefined();
    });
    it('runs provided registrars', async () => {
        const registrationMock = vi.fn();
        const runtimeConfig = {
            NODE_ENV: 'local',
            LOG_LEVEL: 'info',
            ENABLE_TRACING: false,
        };
        const awsConfig = {
            region: 'sa-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
        };
        await bootstrapAwsInfrastructure({
            runtimeConfig,
            awsConfig,
            providerRegistrations: [registrationMock],
        });
        expect(registrationMock).toHaveBeenCalledTimes(1);
        const args = registrationMock.mock.calls[0][0];
        expect(args.loggerProvider).toBeDefined();
        expect(args.handlerRegistry).toBeDefined();
        expect(args.config).toEqual(runtimeConfig);
        expect(args.runtime).toBeDefined();
    });
});
describe('createAwsProviderRegistration', () => {
    it('registers AWS providers through runtime', async () => {
        const registerSecretSpy = vi.fn();
        const registerTracingSpy = vi.fn().mockResolvedValue(undefined);
        const runtimeConfig = {
            NODE_ENV: 'local',
            LOG_LEVEL: 'info',
            ENABLE_TRACING: true,
            OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
        };
        const awsConfig = {
            region: 'sa-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
            endpointUrl: 'http://localhost:4566',
        };
        const registration = createAwsProviderRegistration({ runtimeConfig, awsConfig });
        const runtimeEnv = {
            registerSecretProvider: registerSecretSpy,
            registerTracingProvider: registerTracingSpy,
            getSecret: vi.fn(),
            shutdownTracing: vi.fn(),
            getTracingHandle: vi.fn(),
        };
        await registration({
            loggerProvider: {},
            handlerRegistry: {},
            config: runtimeConfig,
            runtime: runtimeEnv,
        });
        expect(registerSecretSpy).toHaveBeenCalledTimes(1);
        expect(registerSecretSpy).toHaveBeenCalledWith(expect.anything());
        expect(registerTracingSpy).toHaveBeenCalledTimes(1);
        expect(registerTracingSpy).toHaveBeenCalledWith(expect.anything(), { config: runtimeConfig });
    });
});
