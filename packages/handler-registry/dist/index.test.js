import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHandlerRegistry } from './index';
describe('createHandlerRegistry', () => {
    it('registra descritores iniciais e resolve handlers', async () => {
        const handler = vi.fn();
        const registry = createHandlerRegistry({
            importFn: vi.fn(async () => ({ handler })),
            initialDescriptors: [
                {
                    name: 'sample-handler',
                    modulePath: pathToFileURL(path.resolve('sample-handler.js')).href,
                    eventKind: 'custom',
                },
            ],
        });
        const resolved = await registry.resolve('sample-handler');
        expect(resolved).toBe(handler);
        const descriptors = registry.list();
        expect(descriptors).toHaveLength(1);
        expect(descriptors[0]?.name).toBe('sample-handler');
    });
    it('usa o fallback para módulos bare specifier', async () => {
        const handler = vi.fn();
        const importFn = vi.fn(async (specifier) => {
            if (specifier === 'bare-module') {
                const error = new Error('not found');
                error.code = 'ERR_MODULE_NOT_FOUND';
                throw error;
            }
            expect(specifier.startsWith('file:')).toBe(true);
            return { handler };
        });
        const registry = createHandlerRegistry({
            projectRoot: path.resolve('.'),
            importFn,
            initialDescriptors: [
                {
                    name: 'bare-module-handler',
                    modulePath: 'bare-module',
                    eventKind: 'custom',
                },
            ],
        });
        const resolved = await registry.resolve('bare-module-handler');
        expect(resolved).toBe(handler);
        expect(importFn).toHaveBeenCalledTimes(2);
    });
    it('lança erro ao registrar descritor duplicado', () => {
        const registry = createHandlerRegistry();
        registry.register({
            name: 'duplicate',
            modulePath: pathToFileURL(path.resolve('duplicate.js')).href,
            eventKind: 'custom',
        });
        expect(() => registry.register({
            name: 'duplicate',
            modulePath: pathToFileURL(path.resolve('duplicate.js')).href,
            eventKind: 'custom',
        })).toThrowError('Handler already registered: duplicate');
    });
    it('garante pré-carregamento com ensureLoaded', async () => {
        const handler = vi.fn();
        const importFn = vi.fn(async () => ({ handler }));
        const registry = createHandlerRegistry({
            importFn,
            initialDescriptors: [
                {
                    name: 'preload',
                    modulePath: pathToFileURL(path.resolve('preload.js')).href,
                    eventKind: 'custom',
                },
            ],
        });
        await registry.ensureLoaded(['preload']);
        const resolved = await registry.resolve('preload');
        expect(resolved).toBe(handler);
        expect(importFn).toHaveBeenCalledTimes(1);
    });
});
