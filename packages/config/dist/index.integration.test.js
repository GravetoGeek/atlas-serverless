import { describe, it, expect, vi, afterEach } from 'vitest';
import { config, getTracingHandle, getSecret, registerSecretProvider, registerTracingProvider, shutdownTracing, } from './index';
afterEach(async () => {
    await shutdownTracing();
});
describe('Config - registro de providers', () => {
    it('inicia o tracing provider quando habilitado', async () => {
        const start = vi.fn().mockResolvedValue({ close: vi.fn() });
        const shutdown = vi.fn().mockResolvedValue(undefined);
        const provider = {
            start,
            shutdown,
        };
        await registerTracingProvider(provider);
        expect(start).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith({ config });
        expect(getTracingHandle()).toBeDefined();
    });
    it('permite registrar diferentes secret providers', async () => {
        registerSecretProvider({
            getSecret: async (name) => `valor:${name}`,
        });
        await expect(getSecret('meu-secret')).resolves.toBe('valor:meu-secret');
        registerSecretProvider({
            getSecret: async (name) => `override:${name}`,
        });
        await expect(getSecret('meu-secret')).resolves.toBe('override:meu-secret');
    });
});
