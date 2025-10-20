#!/usr/bin/env bash
set -euo pipefail

# Script para deploy de lambdas no LocalStack
# Uso: ./scripts/deploy-localstack.sh [lambda_workspace] [function_name]

lambda_workspace="${1:-lambdas/example-lambda}"
function_name="${2:-$(basename "${lambda_workspace}")}"
localstack_endpoint="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
aws_region="${AWS_REGION:-sa-east-1}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"
artifacts_dir="${ARTIFACTS_DIR:-build/artifacts}"
handler_entry="${HANDLER_ENTRY:-index.handler}"

echo "🚀 Iniciando deploy no LocalStack..."
echo "📦 Lambda: ${lambda_workspace}"
echo "🏷️  Nome da função: ${function_name}"
echo "🌐 Endpoint: ${localstack_endpoint}"
echo "📍 Região: ${aws_region}"
echo ""

# 1. Empacotar a lambda
echo "📦 Empacotando lambda..."
zip_path=$(bash "${script_dir}/bundle-lambda.sh" "${lambda_workspace}" "${artifacts_dir}" "${function_name}" 2>/dev/null | tail -1)
echo "✅ Bundle criado: ${zip_path}"
echo ""

# 2. Verificar se role existe, senão criar
echo "🔐 Verificando role IAM..."
role_name="lambda-execution-role"
role_arn="arn:aws:iam::000000000000:role/${role_name}"

if ! aws --endpoint-url="${localstack_endpoint}" iam get-role \
    --role-name "${role_name}" \
    --region "${aws_region}" >/dev/null 2>&1; then
    
    echo "📝 Criando role IAM: ${role_name}..."
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
    
    echo "✅ Role criada com sucesso"
else
    echo "✅ Role já existe"
fi
echo ""

# 3. Verificar se função existe
echo "🔍 Verificando se função já existe..."
function_exists=false
if aws --endpoint-url="${localstack_endpoint}" lambda get-function \
    --function-name "${function_name}" \
    --region "${aws_region}" >/dev/null 2>&1; then
    function_exists=true
fi

# 4. Criar ou atualizar função
if [ "${function_exists}" = false ]; then
    echo "📝 Criando nova função Lambda: ${function_name}..."
    aws --endpoint-url="${localstack_endpoint}" lambda create-function \
        --function-name "${function_name}" \
        --runtime nodejs20.x \
        --role "${role_arn}" \
    --handler "${handler_entry}" \
        --zip-file "fileb://${zip_path}" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={NODE_ENV=local,LOG_LEVEL=info,CLOUD_REGION=${aws_region},CLOUD_ENDPOINT_URL=${localstack_endpoint}}" \
        --region "${aws_region}" >/dev/null
    echo "✅ Função criada com sucesso"
else
    echo "🔄 Atualizando código da função existente..."
    aws --endpoint-url="${localstack_endpoint}" lambda update-function-configuration \
        --function-name "${function_name}" \
        --handler "${handler_entry}" \
        --region "${aws_region}" >/dev/null
    aws --endpoint-url="${localstack_endpoint}" lambda update-function-code \
        --function-name "${function_name}" \
        --zip-file "fileb://${zip_path}" \
        --region "${aws_region}" >/dev/null
    echo "✅ Código atualizado com sucesso"
fi
echo ""

# 5. Aguardar função estar pronta
echo "⏳ Aguardando função ficar ativa..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    state=$(aws --endpoint-url="${localstack_endpoint}" lambda get-function \
        --function-name "${function_name}" \
        --region "${aws_region}" \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")
    
    if [ "$state" = "Active" ]; then
        echo "✅ Função ativa e pronta para uso"
        break
    fi
    
    attempt=$((attempt + 1))
    sleep 1
done
echo ""

# 6. Testar invocação
echo "🧪 Testando invocação da lambda..."
test_payload='{"test": "deploy-localstack", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
response_file="${root_dir}/${artifacts_dir}/${function_name}-response.json"
payload_file="${root_dir}/${artifacts_dir}/${function_name}-payload.json"

echo "${test_payload}" > "${payload_file}"

aws --endpoint-url="${localstack_endpoint}" lambda invoke \
    --function-name "${function_name}" \
    --cli-binary-format raw-in-base64-out \
    --payload "file://${payload_file}" \
    --region "${aws_region}" \
    "${response_file}" >/dev/null 2>&1 || true

if [ -f "${response_file}" ]; then
    echo "📄 Resposta da lambda:"
    cat "${response_file}" | jq . 2>/dev/null || cat "${response_file}"
    echo ""
else
    echo "⚠️  Não foi possível testar a invocação automaticamente"
    echo ""
fi

# 7. Exibir informações da função
echo "ℹ️  Informações da função:"
aws --endpoint-url="${localstack_endpoint}" lambda get-function \
    --function-name "${function_name}" \
    --region "${aws_region}" \
    --query 'Configuration.[FunctionName,Runtime,Handler,Timeout,MemorySize,LastModified]' \
    --output table

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📌 Para invocar a função manualmente:"
echo "   aws --endpoint-url=${localstack_endpoint} lambda invoke \\"
echo "     --function-name ${function_name} \\"
echo "     --payload '{\"key\": \"value\"}' \\"
echo "     --region ${aws_region} \\"
echo "     response.json"
