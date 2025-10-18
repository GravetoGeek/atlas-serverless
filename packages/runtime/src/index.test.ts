import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SecretProvider, TracingProvider, RuntimeAppConfig } from '@packages/contracts';
import {
    createRuntimeEnvironment,
    getSecret,
    getTracingHandle,
    registerSecretProvider,
    registerTracingProvider,
    shutdownTracing,
} from './index';

describe('Runtime - Secret provider registry', () => {
    beforeEach(() => {
        const stubProvider: SecretProvider = {
            getSecret: async (name) => `secret:${name}`,
        };

        registerSecretProvider(stubProvider);
    });

    it('delegates retrieval to the registered secret provider', async () => {
        const actual = await getSecret('nome_do_secret');

        expect(actual).toBe('secret:nome_do_secret');
    });

    it('permite substituir o provider existente', async () => {
        const alternative: SecretProvider = {
            getSecret: async (name) => `alt:${name}`,
        };

        registerSecretProvider(alternative);

        const actual = await getSecret('outro_secret');

        expect(actual).toBe('alt:outro_secret');
    });
});

describe('RuntimeEnvironment instances', () => {
    it('mantém providers isolados por instância', async () => {
        const first = createRuntimeEnvironment();
        const second = createRuntimeEnvironment();

        first.registerSecretProvider({
            getSecret: async () => 'first',
        });

        second.registerSecretProvider({
            getSecret: async () => 'second',
        });

        await expect(first.getSecret('any')).resolves.toBe('first');
        await expect(second.getSecret('any')).resolves.toBe('second');
    });

    it('gerencia lifecycle de tracing independente', async () => {
        const runtime = createRuntimeEnvironment();
        const shutdownSpy = vi.fn();
        const provider: TracingProvider<{ closed: boolean }, RuntimeAppConfig> = {
            async start() {
                return { closed: false };
            },
            async shutdown(handle) {
                shutdownSpy(handle);
            },
        };

        const config: RuntimeAppConfig = {
            NODE_ENV: 'local',
            LOG_LEVEL: 'info',
            ENABLE_TRACING: true,
        };

        await runtime.registerTracingProvider(provider, { config });
        expect(runtime.getTracingHandle()).toEqual({ closed: false });

        await runtime.shutdownTracing();
        expect(shutdownSpy).toHaveBeenCalledTimes(1);
    });
});
