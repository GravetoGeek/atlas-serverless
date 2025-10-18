import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import type { LambdaHandler } from '@packages/core-di';

export type EventKind = 'http' | 'sqs' | 'sns' | 'eventbridge' | 'stream' | 'custom';

export interface HandlerDescriptor {
    name: string;
    modulePath: string;
    exportName?: string;
    eventKind: EventKind;
    description?: string;
}

export interface CreateHandlerRegistryOptions {
    projectRoot?: string;
    importFn?: (specifier: string) => Promise<unknown>;
    initialDescriptors?: HandlerDescriptor[];
}

export interface HandlerRegistry {
    register(descriptor: HandlerDescriptor): void;
    getDescriptor(name: string): HandlerDescriptor | undefined;
    list(filter?: { eventKind?: EventKind }): HandlerDescriptor[];
    resolve<TEvent = unknown, TResult = unknown>(name: string): Promise<LambdaHandler<TEvent, TResult>>;
    ensureLoaded(names: string[]): Promise<void>;
}

export function createHandlerRegistry(options: CreateHandlerRegistryOptions = {}): HandlerRegistry {
    const descriptors = new Map<string, HandlerDescriptor>();
    const loadedHandlers = new Map<string, LambdaHandler>();

    const registryDir = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = options.projectRoot ?? path.resolve(registryDir, '..', '..', '..');
    const importFn = options.importFn ?? ((specifier: string) => import(specifier));

    function toFileModuleSpecifier(modulePath: string) {
        if (modulePath.startsWith('file:')) {
            return modulePath;
        }

        if (path.isAbsolute(modulePath)) {
            return pathToFileURL(modulePath).href;
        }

        const baseDir = modulePath.startsWith('.') ? registryDir : projectRoot;
        const resolved = path.resolve(baseDir, modulePath);
        return pathToFileURL(resolved).href;
    }

    function register(descriptor: HandlerDescriptor) {
        if (descriptors.has(descriptor.name)) {
            throw new Error(`Handler already registered: ${descriptor.name}`);
        }

        const normalizedDescriptor: HandlerDescriptor = {
            ...descriptor,
            modulePath: isBareModuleSpecifier(descriptor.modulePath)
                ? descriptor.modulePath
                : toFileModuleSpecifier(descriptor.modulePath),
        };

        descriptors.set(descriptor.name, normalizedDescriptor);
    }

    async function loadHandler<TEvent = unknown, TResult = unknown>(
        name: string
    ): Promise<LambdaHandler<TEvent, TResult>> {
        if (loadedHandlers.has(name)) {
            return loadedHandlers.get(name) as LambdaHandler<TEvent, TResult>;
        }

        const descriptor = descriptors.get(name);
        if (!descriptor) {
            throw new Error(`Handler não registrado: ${name}`);
        }

        const isBareSpecifier = isBareModuleSpecifier(descriptor.modulePath);
        const primarySpecifier = descriptor.modulePath;
        const fallbackSpecifier = isBareSpecifier ? toFileModuleSpecifier(descriptor.modulePath) : undefined;

        const moduleExports = (await importWithFallback(
            importFn,
            primarySpecifier,
            fallbackSpecifier
        )) as Record<string, unknown>;
        const exportName = descriptor.exportName ?? 'handler';
        const candidate = moduleExports[exportName] as LambdaHandler<TEvent, TResult> | undefined;

        if (typeof candidate !== 'function') {
            throw new Error(`Export '${exportName}' inválido na module ${descriptor.modulePath}`);
        }

        loadedHandlers.set(name, candidate);
        return candidate;
    }

    if (options.initialDescriptors) {
        for (const descriptor of options.initialDescriptors) {
            register(descriptor);
        }
    }

    return {
        register,
        getDescriptor(name: string): HandlerDescriptor | undefined {
            return descriptors.get(name);
        },
        list(filter?: { eventKind?: EventKind }): HandlerDescriptor[] {
            let entries = Array.from(descriptors.values());
            if (filter?.eventKind) {
                entries = entries.filter((entry) => entry.eventKind === filter.eventKind);
            }
            return entries;
        },
        async resolve<TEvent = unknown, TResult = unknown>(name: string): Promise<LambdaHandler<TEvent, TResult>> {
            return loadHandler<TEvent, TResult>(name);
        },
        async ensureLoaded(names: string[]): Promise<void> {
            await Promise.all(names.map((name) => loadHandler(name)));
        },
    } satisfies HandlerRegistry;
}

export const handlerRegistry = createHandlerRegistry();

function isBareModuleSpecifier(specifier: string): boolean {
    return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.includes(':');
}

async function importWithFallback(
    importFn: (specifier: string) => Promise<unknown>,
    primary: string,
    fallback?: string
) {
    try {
        return await importFn(primary);
    } catch (error) {
        if (
            fallback &&
            error instanceof Error &&
            'code' in error &&
            (error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND'
        ) {
            return importFn(fallback);
        }
        throw error;
    }
}

