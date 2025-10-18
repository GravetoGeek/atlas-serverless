import type { AwsProviderConfig, RuntimeAppConfig } from '@packages/contracts';
export type RuntimeConfigType = RuntimeAppConfig;
export interface ProjectConfig {
    app: RuntimeAppConfig;
    providers: {
        enabled: string[];
        aws?: AwsProviderConfig;
    };
}
export declare function loadRuntimeConfig(env?: NodeJS.ProcessEnv): RuntimeAppConfig;
export declare function loadAwsProviderConfig(env?: NodeJS.ProcessEnv): AwsProviderConfig | undefined;
export declare function loadProjectConfig(env?: NodeJS.ProcessEnv): ProjectConfig;
export declare const projectConfig: ProjectConfig;
export declare const appConfig: RuntimeAppConfig;
export declare const awsConfig: AwsProviderConfig | undefined;
//# sourceMappingURL=index.d.ts.map