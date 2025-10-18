import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
export function createAwsSecretProvider(config, options = {}) {
    const client = options.client ||
        new SSMClient({
            region: config.region,
            endpoint: config.endpointUrl,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    const ensureSecretValue = (secretName, value) => {
        if (typeof value !== 'string' || value.length === 0) {
            throw new Error(`Secret '${secretName}' not found in SSM`);
        }
        return value;
    };
    return {
        async getSecret(secretName) {
            const command = new GetParameterCommand({
                Name: secretName,
                WithDecryption: true,
            });
            const response = await client.send(command);
            return ensureSecretValue(secretName, response.Parameter?.Value);
        },
    };
}
