import type { HttpRouteDefinition } from '@packages/adapters-http';
import type { HandlerRegistry } from '@packages/handler-registry';

async function resolveHttpHandler(registry: HandlerRegistry, name: string) {
    const descriptor = registry.getDescriptor(name);
    if (!descriptor) {
        throw new Error(`Handler não encontrado no registro: ${name}`);
    }
    if (descriptor.eventKind !== 'http') {
        throw new Error(`Handler ${name} não está marcado como HTTP (eventKind=${descriptor.eventKind})`);
    }
    const handler = await registry.resolve(name);
    return { descriptor, handler };
}

export async function createRoutes(registry: HandlerRegistry): Promise<HttpRouteDefinition[]> {
    const exampleLambda = await resolveHttpHandler(registry, 'example-lambda');
    const exampleLambdaTwo = await resolveHttpHandler(registry, 'example-lambda2');

    return [
        {
            method: 'post',
            path: '/lambda/example-lambda',
            lambdaName: exampleLambda.descriptor.name,
            handler: exampleLambda.handler,
            toEvent: (req) => req.body,
        },
        {
            method: 'post',
            path: '/lambda/example-lambda2',
            lambdaName: exampleLambdaTwo.descriptor.name,
            handler: exampleLambdaTwo.handler,
            toEvent: (req) => req.body,
        },
    ];
}
