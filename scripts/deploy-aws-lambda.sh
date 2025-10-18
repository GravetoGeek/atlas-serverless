#!/usr/bin/env bash
set -euo pipefail

# Atualiza o código de uma função AWS Lambda usando o artefato empacotado.
workspace_selector="${1:-lambdas/example-lambda}"
lambda_function_name="${2:-}"

if [[ -z "${lambda_function_name}" ]]; then
  echo "Nome da função Lambda não informado." >&2
  exit 1
fi

artifacts_dir="${ARTIFACTS_DIR:-build/artifacts}"
zip_basename="${ZIP_BASENAME:-${lambda_function_name}}"
publish_flag="${PUBLISH_RELEASE:-}" # Define --publish se desejado
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_script="${script_dir}/package-lambda.sh"

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI não encontrado no PATH." >&2
  exit 1
fi

prebuilt_path="${PACKAGE_PATH:-}"
if [[ -n "${prebuilt_path}" ]]; then
  if [[ ! -f "${prebuilt_path}" ]]; then
    echo "Arquivo informado em PACKAGE_PATH não encontrado: ${prebuilt_path}" >&2
    exit 1
  fi
  zip_path="${prebuilt_path}"
else
  zip_path="$(bash "${package_script}" "${workspace_selector}" "${artifacts_dir}" "${zip_basename}")"
fi

aws_region="${AWS_REGION:-}"
if [[ -z "${aws_region}" ]]; then
  echo "Variável AWS_REGION não definida." >&2
  exit 1
fi

if [[ -n "${publish_flag}" ]]; then
  aws lambda update-function-code \
    --region "${aws_region}" \
    --function-name "${lambda_function_name}" \
    --zip-file "fileb://${zip_path}" \
    --publish
else
  aws lambda update-function-code \
    --region "${aws_region}" \
    --function-name "${lambda_function_name}" \
    --zip-file "fileb://${zip_path}"
fi

echo "Deploy concluído para ${lambda_function_name} na região ${aws_region}."
