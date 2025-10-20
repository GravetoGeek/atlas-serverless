#!/usr/bin/env node
import { build } from 'esbuild';
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const [, , workspaceArg, outfileArg] = process.argv;

if (!workspaceArg || !outfileArg) {
    console.error('Uso: node scripts/esbuild-bundle.mjs <workspace> <outfile>');
    process.exit(1);
}

const workspaceDir = path.resolve(rootDir, workspaceArg);

async function pathExists(candidate) {
    try {
        await fs.access(candidate);
        return true;
    } catch {
        return false;
    }
}

const entryCandidates = [
    path.join(workspaceDir, 'src/index.ts'),
    path.join(workspaceDir, 'src/index.tsx'),
    path.join(workspaceDir, 'src/index.js'),
    path.join(workspaceDir, 'index.ts'),
    path.join(workspaceDir, 'index.js'),
];

let entryPoint;
for (const candidate of entryCandidates) {
    if (await pathExists(candidate)) {
        entryPoint = candidate;
        break;
    }
}

if (!entryPoint) {
    console.error(`Arquivo de entrada não encontrado para workspace ${workspaceArg}`);
    process.exit(1);
}

const tsconfigPath = path.resolve(rootDir, 'tsconfig.json');

await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: path.resolve(rootDir, outfileArg),
    sourcemap: 'external',
    sourcesContent: false,
    logLevel: 'info',
    keepNames: true,
    plugins: [
        TsconfigPathsPlugin({ tsconfig: tsconfigPath }),
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    banner: {
        js: "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);",
    },
    tsconfig: tsconfigPath,
});
