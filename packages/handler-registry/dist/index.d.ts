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
    list(filter?: {
        eventKind?: EventKind;
    }): HandlerDescriptor[];
    resolve<TEvent = unknown, TResult = unknown>(name: string): Promise<LambdaHandler<TEvent, TResult>>;
    ensureLoaded(names: string[]): Promise<void>;
}
export declare function createHandlerRegistry(options?: CreateHandlerRegistryOptions): HandlerRegistry;
export declare const handlerRegistry: HandlerRegistry;
//# sourceMappingURL=index.d.ts.map