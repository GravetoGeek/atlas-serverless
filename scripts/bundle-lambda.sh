#!/usr/bin/env bash
set -euo pipefail

# Script para criar bundle standalone de lambda utilizando esbuild
# Uso: ./scripts/bundle-lambda.sh [lambda_workspace] [artifacts_dir] [bundle_name]

lambda_workspace="${1:-lambdas/example-lambda}"
artifacts_dir="${2:-build/artifacts}"
bundle_name="${3:-$(basename "${lambda_workspace}")}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"

bundle_dir="${root_dir}/${artifacts_dir}/${bundle_name}"
bundle_entry="${bundle_dir}/index.mjs"
zip_path="${root_dir}/${artifacts_dir}/${bundle_name}.zip"

echo "📦 Gerando bundle via esbuild para ${lambda_workspace}"

rm -rf "${bundle_dir}"
mkdir -p "${bundle_dir}"
rm -f "${zip_path}"

node "${script_dir}/esbuild-bundle.mjs" "${lambda_workspace}" "${artifacts_dir}/${bundle_name}/index.mjs"

if [ ! -f "${bundle_entry}" ]; then
    echo "❌ Bundle não foi gerado em ${bundle_entry}"
    exit 1
fi

pushd "${bundle_dir}" >/dev/null
zip -r "../${bundle_name}.zip" . >/dev/null
popd >/dev/null

zip_size=$(du -h "${zip_path}" | cut -f1)
echo "✅ Bundle criado: ${zip_path} (${zip_size})"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
        echo "bundle_path=${zip_path}"
        echo "bundle_name=${bundle_name}"
    } >> "${GITHUB_OUTPUT}"
fi

echo "${zip_path}"
