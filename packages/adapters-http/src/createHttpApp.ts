import crypto from 'node:crypto';
import express from 'express';
import type { BaseHandler, LambdaContext } from '@packages/core-di';
import type { AppLogger } from '@packages/contracts';
import type { HttpRouteDefinition, HttpMethod } from './types';

export interface CreateHttpAppOptions {
    routes: HttpRouteDefinition[];
    baseHandler: BaseHandler;
    logger: AppLogger;
    requestIdHeader?: string;
    configureApp?: (app: express.Express) => void;
}

function defaultRespond(res: express.Response, result: unknown) {
    const maybeResponse = result as { statusCode?: number; headers?: Record<string, string>; body?: unknown };
    const status = maybeResponse?.statusCode ?? 200;
    const headers = maybeResponse?.headers ?? { 'Content-Type': 'application/json' };
    const body = maybeResponse?.body ?? result;

    res.status(status).set(headers).send(body);
}

async function handleRequest(
    params: {
        route: HttpRouteDefinition;
        baseHandler: BaseHandler;
        req: express.Request;
        res: express.Response;
        logger: AppLogger;
        requestIdHeader: string;
    }
) {
    const { route, baseHandler, req, res, logger, requestIdHeader } = params;

    const requestId = (req.headers[requestIdHeader.toLowerCase()] as string | undefined) ?? crypto.randomUUID();
    const baseContext: Partial<LambdaContext> = {
        requestId,
    };
    const routeContext = route.buildContext ? route.buildContext(req) : {};
    const composedContext = { ...routeContext, ...baseContext } satisfies Partial<LambdaContext>;

    try {
        const event = route.toEvent ? route.toEvent(req) : (req.body as unknown);
        const result = await baseHandler.run(route.lambdaName, route.handler, event, composedContext);
        const responder = route.respond ?? defaultRespond;
        responder(res, result);
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to execute HTTP handler', {
            lambdaName: route.lambdaName,
            path: route.path,
            method: route.method,
            error: error.message,
            stack: error.stack,
            requestId,
        });
        res.status(500).json({ error: error.message });
    }
}

export function createHttpApp(options: CreateHttpAppOptions): express.Express {
    const { routes, baseHandler, logger, requestIdHeader = 'x-request-id', configureApp } = options;
    const app = express();

    app.use(express.json());
    configureApp?.(app);

    for (const route of routes) {
        const handler = (req: express.Request, res: express.Response) =>
            handleRequest({ route, baseHandler, req, res, logger, requestIdHeader });

        switch (route.method) {
            case 'get':
                app.get(route.path, handler);
                break;
            case 'post':
                app.post(route.path, handler);
                break;
            case 'put':
                app.put(route.path, handler);
                break;
            case 'patch':
                app.patch(route.path, handler);
                break;
            case 'delete':
                app.delete(route.path, handler);
                break;
            case 'options':
                app.options(route.path, handler);
                break;
            case 'head':
                app.head(route.path, handler);
                break;
            default: {
                const exhaustive: never = route.method as never;
                throw new Error(`Unsupported HTTP method: ${exhaustive as HttpMethod}`);
            }
        }

        logger.info('HTTP route registered', {
            path: route.path,
            method: route.method,
            lambdaName: route.lambdaName,
        });
    }

    return app;
}
