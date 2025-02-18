#!/bin/bash

ROOT=$(git rev-parse --show-toplevel)

echo "Autoformatting rust..."
rustfmt --edition 2018 ${ROOT}/src/bin/*.rs ${ROOT}/src/*.rs
echo "Done."
echo "Autoformatting js..."
prettier ${ROOT}/js/src/** -w
echo "Done."
