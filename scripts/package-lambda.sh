#!/usr/bin/env bash
set -euo pipefail

# Empacota um workspace de Lambda em um artefato .zip pronto para deploy usando esbuild.
workspace_selector="${1:-lambdas/example-lambda}"
artifacts_dir="${2:-build/artifacts}"
zip_basename="${3:-}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"

mkdir -p "${root_dir}/${artifacts_dir}"

bundle_name="${zip_basename:-$(basename "${workspace_selector}")}"
zip_path="$(bash "${script_dir}/bundle-lambda.sh" "${workspace_selector}" "${artifacts_dir}" "${bundle_name}")"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "package_path=${zip_path}"
    echo "package_basename=${bundle_name}"
  } >> "${GITHUB_OUTPUT}"
fi

echo "${zip_path}"
