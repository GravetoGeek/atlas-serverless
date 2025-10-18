// Define interfaces básicas e um container simples.
// Ajuste conforme necessidades (ex.: adicionar escopos, singleton, etc.).

export type Resolver<T> = () => T;

export class Container {
    private readonly registry = new Map<string, Resolver<unknown>>();

    register<T>(token: string, resolver: Resolver<T>) {
        this.registry.set(token, resolver);
    }

    resolve<T>(token: string): T {
        const resolver = this.registry.get(token);
        if (!resolver) throw new Error(`Token não registrado: ${token}`);
        return resolver() as T;
    }
}

export const container = new Container();

export { BaseHandler } from './baseHandler';
export type { LambdaContext, LambdaHandler, Middleware } from './baseHandler';