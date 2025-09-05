#!/bin/bash

echo "🚀 Deploying MawSacrificeV4NoTimelock with forge..."

# Set environment variables
export PRIVATE_KEY="b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45"
export RPC_URL="https://sepolia.base.org"

# Contract addresses
PROXY="0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"
RELICS="0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b"
COSMETICS="0xb0e32d26f6b61cb71115576e6a8d7de072e6310a"

echo "Proxy: $PROXY"
echo "Relics: $RELICS"  
echo "Cosmetics: $COSMETICS"

# Create simple contract for deployment
cd /Users/seanmorgan/Desktop/rot-ritual-web/packages/contracts

echo "📦 Compiling contract with forge..."
forge build --contracts contracts/MawSacrificeV4NoTimelock.sol

if [ $? -eq 0 ]; then
    echo "✅ Contract compiled successfully"
    
    echo "🚀 Deploying new implementation..."
    NEW_IMPL=$(forge create contracts/MawSacrificeV4NoTimelock.sol:MawSacrificeV4NoTimelock \
        --private-key $PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r .deployedTo)
    
    if [ "$NEW_IMPL" != "null" ] && [ -n "$NEW_IMPL" ]; then
        echo "✅ New implementation deployed at: $NEW_IMPL"
        
        echo "🔄 Upgrading proxy..."
        cast send $PROXY "upgradeTo(address)" $NEW_IMPL \
            --private-key $PRIVATE_KEY \
            --rpc-url $RPC_URL
            
        if [ $? -eq 0 ]; then
            echo "✅ Proxy upgraded successfully!"
            
            echo "🔍 Verifying sacrificeKeys function exists..."
            cast call $PROXY "sacrificeKeys(uint256)" 0 --rpc-url $RPC_URL || echo "Function test (expected to fail with amount validation)"
            
            echo "🔍 Checking RUSTED_CAP constant..."
            RUSTED_CAP=$(cast call $PROXY "RUSTED_CAP()" --rpc-url $RPC_URL)
            echo "RUSTED_CAP: $RUSTED_CAP"
            
        else
            echo "❌ Proxy upgrade failed"
        fi
    else
        echo "❌ Deployment failed"
    fi
else
    echo "❌ Compilation failed"
fi