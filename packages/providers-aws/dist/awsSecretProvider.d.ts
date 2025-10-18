import { SSMClient } from '@aws-sdk/client-ssm';
import type { AwsProviderConfig, SecretProvider } from '@packages/contracts';
export interface AwsSecretProviderOptions {
    client?: SSMClient;
}
export declare function createAwsSecretProvider(config: AwsProviderConfig, options?: AwsSecretProviderOptions): SecretProvider;
//# sourceMappingURL=awsSecretProvider.d.ts.map