export type Resolver<T> = () => T;
export declare class Container {
    private readonly registry;
    register<T>(token: string, resolver: Resolver<T>): void;
    resolve<T>(token: string): T;
}
export declare const container: Container;
export { BaseHandler } from './baseHandler';
export type { LambdaContext, LambdaHandler, Middleware } from './baseHandler';
//# sourceMappingURL=index.d.ts.map