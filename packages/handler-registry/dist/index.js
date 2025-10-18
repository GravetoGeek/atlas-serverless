import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
export function createHandlerRegistry(options = {}) {
    const descriptors = new Map();
    const loadedHandlers = new Map();
    const registryDir = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = options.projectRoot ?? path.resolve(registryDir, '..', '..', '..');
    const importFn = options.importFn ?? ((specifier) => import(specifier));
    function toFileModuleSpecifier(modulePath) {
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
    function register(descriptor) {
        if (descriptors.has(descriptor.name)) {
            throw new Error(`Handler already registered: ${descriptor.name}`);
        }
        const normalizedDescriptor = {
            ...descriptor,
            modulePath: isBareModuleSpecifier(descriptor.modulePath)
                ? descriptor.modulePath
                : toFileModuleSpecifier(descriptor.modulePath),
        };
        descriptors.set(descriptor.name, normalizedDescriptor);
    }
    async function loadHandler(name) {
        if (loadedHandlers.has(name)) {
            return loadedHandlers.get(name);
        }
        const descriptor = descriptors.get(name);
        if (!descriptor) {
            throw new Error(`Handler não registrado: ${name}`);
        }
        const isBareSpecifier = isBareModuleSpecifier(descriptor.modulePath);
        const primarySpecifier = descriptor.modulePath;
        const fallbackSpecifier = isBareSpecifier ? toFileModuleSpecifier(descriptor.modulePath) : undefined;
        const moduleExports = (await importWithFallback(importFn, primarySpecifier, fallbackSpecifier));
        const exportName = descriptor.exportName ?? 'handler';
        const candidate = moduleExports[exportName];
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
        getDescriptor(name) {
            return descriptors.get(name);
        },
        list(filter) {
            let entries = Array.from(descriptors.values());
            if (filter?.eventKind) {
                entries = entries.filter((entry) => entry.eventKind === filter.eventKind);
            }
            return entries;
        },
        async resolve(name) {
            return loadHandler(name);
        },
        async ensureLoaded(names) {
            await Promise.all(names.map((name) => loadHandler(name)));
        },
    };
}
export const handlerRegistry = createHandlerRegistry();
function isBareModuleSpecifier(specifier) {
    return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.includes(':');
}
async function importWithFallback(importFn, primary, fallback) {
    try {
        return await importFn(primary);
    }
    catch (error) {
        if (fallback &&
            error instanceof Error &&
            'code' in error &&
            error.code === 'ERR_MODULE_NOT_FOUND') {
            return importFn(fallback);
        }
        throw error;
    }
}
