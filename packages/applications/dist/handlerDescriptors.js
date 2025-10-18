import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const applicationDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(applicationDir, '../../..');
function resolveModulePath(relativePath) {
    return pathToFileURL(path.resolve(projectRoot, relativePath)).href;
}
export const handlerDescriptors = [
    {
        name: 'example-lambda',
        modulePath: resolveModulePath('lambdas/example-lambda/src/index.ts'),
        exportName: 'handler',
        eventKind: 'http',
        description: 'Lambda de exemplo usada em ambiente local',
    },
    {
        name: 'example-lambda2',
        modulePath: resolveModulePath('lambdas/example-lambda2/src/index.ts'),
        exportName: 'handler',
        eventKind: 'http',
        description: 'Lambda de exemplo usada em ambiente local',
    },
];
