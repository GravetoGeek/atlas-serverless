import type { Request, Response } from 'express';
import type { LambdaContext, LambdaHandler } from '@packages/core-di';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';

export interface HttpRouteDefinition<TEvent = any, TResult = any, TContext extends LambdaContext = LambdaContext> {
    method: HttpMethod;
    path: string;
    lambdaName: string;
    handler: LambdaHandler<TEvent, TResult, TContext>;
    toEvent?: (req: Request) => TEvent;
    buildContext?: (req: Request) => Partial<TContext>;
    respond?: (res: Response, result: TResult) => void;
}
