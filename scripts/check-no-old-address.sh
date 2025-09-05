#!/bin/bash
# CI Guardrail: Fail build if old MawSacrifice address appears anywhere

echo "🔍 Checking for old MawSacrifice address in codebase..."

# Check for old address in frontend code only (most critical)
if grep -rn --ignore-case "32833358cc1f4ec6e05ff7014abc1b6b09119625" apps/web/src \
    --exclude="addresses.ts" \
    --exclude="contracts.ts" > /dev/null; then
    echo "❌ OLD MawSacrifice address found in repo - aborting build!"
    echo ""
    echo "Found in frontend src:"
    grep -rn --ignore-case "32833358cc1f4ec6e05ff7014abc1b6b09119625" apps/web/src \
        --exclude="addresses.ts" \
        --exclude="contracts.ts"
    echo ""
    echo "The old contract address 0x32833358cc1f4ec6e05ff7014abc1b6b09119625 should not appear anywhere."
    echo "Use the correct V4NoTimelock address: 0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"
    exit 1
else 
    echo "✅ No old addresses found - build can proceed"
    exit 0
fi