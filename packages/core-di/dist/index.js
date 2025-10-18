// Define interfaces básicas e um container simples.
// Ajuste conforme necessidades (ex.: adicionar escopos, singleton, etc.).
export class Container {
    registry = new Map();
    register(token, resolver) {
        this.registry.set(token, resolver);
    }
    resolve(token) {
        const resolver = this.registry.get(token);
        if (!resolver)
            throw new Error(`Token não registrado: ${token}`);
        return resolver();
    }
}
export const container = new Container();
export { BaseHandler } from './baseHandler';
