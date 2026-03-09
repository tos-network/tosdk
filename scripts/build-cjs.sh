#!/usr/bin/env bash
set -euo pipefail

backup="$(mktemp)"
cp src/node/trustedSetups.ts "$backup"

restore() {
  cp "$backup" src/node/trustedSetups.ts
  rm -f "$backup"
}

trap restore EXIT

cp src/node/trustedSetups_cjs.ts src/node/trustedSetups.ts
tsc --project ./tsconfig.build.json --module commonjs --moduleResolution node --outDir ./src/_cjs --removeComments --verbatimModuleSyntax false
printf '{"type":"commonjs"}' > ./src/_cjs/package.json
