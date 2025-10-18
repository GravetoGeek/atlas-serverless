import { createHandlerRegistry } from '@packages/handler-registry';
import { handlerDescriptors } from '@applications/handler-descriptors';
export function createAwsHandlerRegistry(config) {
    const region = config.region;
    return createHandlerRegistry({
        initialDescriptors: handlerDescriptors.map((descriptor) => ({
            ...descriptor,
            description: descriptor.description
                ? `${descriptor.description} (region=${region})`
                : `Handler ${descriptor.name} (region=${region})`,
        })),
    });
}
