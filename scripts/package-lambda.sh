#!/usr/bin/env bash
set -euo pipefail

# Empacota um workspace de Lambda em um artefato .zip pronto para deploy.
workspace_selector="${1:-lambdas/example-lambda}"
artifacts_dir="${2:-build/artifacts}"
zip_basename="${3:-}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "${script_dir}/.." && pwd)"

mkdir -p "${root_dir}/${artifacts_dir}"
temporary_dir="$(mktemp -d)"

pushd "${root_dir}" >/dev/null
npm pack --workspace "${workspace_selector}" --pack-destination "${temporary_dir}" >/dev/null
popd >/dev/null

package_file="$(find "${temporary_dir}" -maxdepth 1 -name '*.tgz' -print -quit)"
if [[ -z "${package_file}" ]]; then
  echo "Falha ao localizar pacote gerado para ${workspace_selector}" >&2
  exit 1
fi

package_basename="$(basename "${package_file}" .tgz)"
staging_dir="${root_dir}/${artifacts_dir}/${package_basename}"
rm -rf "${staging_dir}"
mkdir -p "${staging_dir}"

tar -xzf "${package_file}" -C "${staging_dir}" --strip-components=1
zip_name="${zip_basename:-${package_basename}}.zip"

pushd "${staging_dir}" >/dev/null
zip -r "../${zip_name}" . >/dev/null
popd >/dev/null

zip_path="${root_dir}/${artifacts_dir}/${zip_name}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "package_path=${zip_path}"
    echo "package_basename=${package_basename}"
  } >> "${GITHUB_OUTPUT}"
fi

echo "${zip_path}"
rm -rf "${temporary_dir}"
