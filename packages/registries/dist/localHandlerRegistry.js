import { createHandlerRegistry } from '@packages/handler-registry';
import { handlerDescriptors } from '@applications/handler-descriptors';
export function createLocalHandlerRegistry() {
    return createHandlerRegistry({
        initialDescriptors: handlerDescriptors,
    });
}
