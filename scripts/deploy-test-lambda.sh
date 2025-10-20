#!/usr/bin/env bash
set -euo pipefail

# Script para criar uma Lambda de teste simples sem dependências internas
lambda_name="${1:-test-lambda}"
localstack_endpoint="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
aws_region="${AWS_REGION:-sa-east-1}"

echo "🚀 Criando Lambda de teste simples..."

# Criar diretório temporário
temp_dir=$(mktemp -d)
cd "${temp_dir}"

# Criar handler simples
cat > index.mjs << 'EOF'
export const handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Hello from LocalStack Lambda!',
            event: event,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
        })
    };
};
EOF

# Criar zip
zip -q lambda.zip index.mjs

# Criar role se necessário
role_name="lambda-execution-role"
role_arn="arn:aws:iam::000000000000:role/${role_name}"

if ! aws --endpoint-url="${localstack_endpoint}" iam get-role \
    --role-name "${role_name}" \
    --region "${aws_region}" >/dev/null 2>&1; then
    
    echo "📝 Criando role IAM..."
    aws --endpoint-url="${localstack_endpoint}" iam create-role \
        --role-name "${role_name}" \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }' \
        --region "${aws_region}" >/dev/null
fi

# Criar/atualizar função
if aws --endpoint-url="${localstack_endpoint}" lambda get-function \
    --function-name "${lambda_name}" \
    --region "${aws_region}" >/dev/null 2>&1; then
    
    echo "🔄 Atualizando função existente..."
    aws --endpoint-url="${localstack_endpoint}" lambda update-function-code \
        --function-name "${lambda_name}" \
        --zip-file fileb://lambda.zip \
        --region "${aws_region}" >/dev/null
else
    echo "📝 Criando nova função..."
    aws --endpoint-url="${localstack_endpoint}" lambda create-function \
        --function-name "${lambda_name}" \
        --runtime nodejs20.x \
        --role "${role_arn}" \
        --handler index.handler \
        --zip-file fileb://lambda.zip \
        --region "${aws_region}" >/dev/null
fi

# Aguardar ficar ativa
sleep 2

# Testar
echo "🧪 Testando invocação..."
aws --endpoint-url="${localstack_endpoint}" lambda invoke \
    --function-name "${lambda_name}" \
    --cli-binary-format raw-in-base64-out \
    --payload '{"test": "hello from script"}' \
    --region "${aws_region}" \
    response.json >/dev/null 2>&1

echo "📄 Resposta:"
cat response.json | jq . 2>/dev/null || cat response.json
echo ""

# Limpar
cd -
rm -rf "${temp_dir}"

echo "✅ Lambda de teste deployada com sucesso!"
echo "📌 Para invocar:"
echo "   aws --endpoint-url=${localstack_endpoint} lambda invoke \\"
echo "     --function-name ${lambda_name} \\"
echo "     --payload '{\"message\": \"test\"}' \\"
echo "     response.json"
