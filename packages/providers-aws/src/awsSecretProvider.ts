import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import type { AwsProviderConfig, SecretProvider, SecretValue } from '@packages/contracts';

export interface AwsSecretProviderOptions {
    client?: SSMClient;
}

export function createAwsSecretProvider(
    config: AwsProviderConfig,
    options: AwsSecretProviderOptions = {}
): SecretProvider {
    const client =
        options.client ||
        new SSMClient({
            region: config.region,
            endpoint: config.endpointUrl,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });

    const ensureSecretValue = (secretName: string, value: SecretValue | undefined): SecretValue => {
        if (typeof value !== 'string' || value.length === 0) {
            throw new Error(`Secret '${secretName}' not found in SSM`);
        }

        return value;
    };

    return {
        async getSecret(secretName: string): Promise<SecretValue> {
            const command = new GetParameterCommand({
                Name: secretName,
                WithDecryption: true,
            });

            const response = await client.send(command);
            return ensureSecretValue(secretName, response.Parameter?.Value);
        },
    };
}
