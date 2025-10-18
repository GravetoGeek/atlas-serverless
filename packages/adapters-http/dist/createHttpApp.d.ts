import express from 'express';
import type { BaseHandler } from '@packages/core-di';
import type { AppLogger } from '@packages/contracts';
import type { HttpRouteDefinition } from './types';
export interface CreateHttpAppOptions {
    routes: HttpRouteDefinition[];
    baseHandler: BaseHandler;
    logger: AppLogger;
    requestIdHeader?: string;
    configureApp?: (app: express.Express) => void;
}
export declare function createHttpApp(options: CreateHttpAppOptions): express.Express;
//# sourceMappingURL=createHttpApp.d.ts.map