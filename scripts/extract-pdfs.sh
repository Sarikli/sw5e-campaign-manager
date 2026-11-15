#!/usr/bin/env bash
# Extracts layout-preserving text from the source PDFs into _extract/ (git-ignored).
# Usage: scripts/extract-pdfs.sh <pdf-dir>
set -euo pipefail
src="${1:-/home/berdan/Belgeler/SW5E}"
out="$(cd "$(dirname "$0")/.." && pwd)/_extract"
mkdir -p "$out"
for f in "$src"/*.pdf; do
  name="$(basename "$f" .pdf)"
  pdftotext -layout "$f" "$out/$name.txt"
done
wc -c "$out"/*.txt
