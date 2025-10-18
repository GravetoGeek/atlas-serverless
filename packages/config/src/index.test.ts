import { describe, it, expect } from 'vitest';
import { loadAwsProviderConfig, loadProjectConfig, loadRuntimeConfig } from './index';

describe('Config package', () => {
    it('carrega configuração de runtime com valores padrão', () => {
        const runtime = loadRuntimeConfig({
            ENABLE_TRACING: 'false',
        } as NodeJS.ProcessEnv);

        expect(runtime.NODE_ENV).toBe('local');
        expect(runtime.LOG_LEVEL).toBe('info');
        expect(runtime.ENABLE_TRACING).toBe(false);
    });

    it('retorna undefined quando credenciais AWS estão incompletas', () => {
        const awsConfig = loadAwsProviderConfig({
            CLOUD_REGION: 'sa-east-1',
        } as NodeJS.ProcessEnv);

        expect(awsConfig).toBeUndefined();
    });

    it('carrega configuração AWS completa quando disponível', () => {
        const awsConfig = loadAwsProviderConfig({
            CLOUD_REGION: 'sa-east-1',
            CLOUD_ACCESS_KEY_ID: 'key',
            CLOUD_SECRET_ACCESS_KEY: 'secret',
            CLOUD_ENDPOINT_URL: 'http://localhost:4566',
        } as NodeJS.ProcessEnv);

        expect(awsConfig).toEqual({
            region: 'sa-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
            endpointUrl: 'http://localhost:4566',
        });
    });

    it('usa lista declarativa de providers quando informada', () => {
        const project = loadProjectConfig({
            PROVIDERS_ENABLED: 'aws,custom',
            CLOUD_REGION: 'sa-east-1',
            CLOUD_ACCESS_KEY_ID: 'key',
            CLOUD_SECRET_ACCESS_KEY: 'secret',
        } as NodeJS.ProcessEnv);

        expect(project.providers.enabled).toEqual(['aws', 'custom']);
    });

    it('habilita aws automaticamente quando config está presente sem lista explícita', () => {
        const project = loadProjectConfig({
            CLOUD_REGION: 'sa-east-1',
            CLOUD_ACCESS_KEY_ID: 'key',
            CLOUD_SECRET_ACCESS_KEY: 'secret',
        } as NodeJS.ProcessEnv);

        expect(project.providers.enabled).toEqual(['aws']);
    });
});
