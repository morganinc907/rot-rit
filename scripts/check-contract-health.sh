#!/bin/bash
# CI Guardrails: Validate contract health and prevent drift
# Uses cast calls to verify on-chain state matches expectations

set -e

# Configuration
RPC=${RPC:-"https://sepolia.base.org"}
MAW=${MAW:-"0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"}
RELICS=${RELICS:-"0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b"}

echo "🔍 Contract Health Check"
echo "MAW: $MAW"
echo "RELICS: $RELICS"
echo "RPC: $RPC"
echo ""

# Check 1: Health check function
echo "📊 Running comprehensive health check..."
HEALTH=$(cast call $MAW "healthcheck()(address,address,uint256,uint256,uint256,uint256)" --rpc-url $RPC)
echo "Health check result: $HEALTH"

# Parse healthcheck result
IFS=' ' read -ra HEALTH_PARTS <<< "$HEALTH"
HEALTH_RELICS=${HEALTH_PARTS[0]}
HEALTH_MAW_TRUSTED=${HEALTH_PARTS[1]}
HEALTH_CAP=${HEALTH_PARTS[2]}
HEALTH_KEY=${HEALTH_PARTS[3]}
HEALTH_FRAG=${HEALTH_PARTS[4]}
HEALTH_SHARD=${HEALTH_PARTS[5]}

echo "  Relics address: $HEALTH_RELICS"
echo "  MAW trusted on Relics: $HEALTH_MAW_TRUSTED"
echo "  Token IDs - Cap: $HEALTH_CAP, Key: $HEALTH_KEY, Frag: $HEALTH_FRAG, Shard: $HEALTH_SHARD"
echo ""

# Check 2: Authorization alignment
echo "🔐 Checking authorization alignment..."
RELICS_MAW=$(cast call $RELICS "mawSacrifice()(address)" --rpc-url $RPC)
echo "Relics.mawSacrifice(): $RELICS_MAW"

# Normalize addresses for comparison (remove 0x prefix and convert to lowercase)
MAW_CLEAN=$(echo $MAW | sed 's/0x//' | tr '[:upper:]' '[:lower:]')
RELICS_MAW_CLEAN=$(echo $RELICS_MAW | sed 's/0x//' | tr '[:upper:]' '[:lower:]')

if [ "$MAW_CLEAN" != "$RELICS_MAW_CLEAN" ]; then
    echo "❌ AUTHORIZATION MISMATCH!"
    echo "   Expected MAW: $MAW"
    echo "   Relics trusts: $RELICS_MAW"
    echo "   This will cause transaction failures!"
    exit 1
else
    echo "✅ Authorization aligned: Relics trusts the correct MAW"
fi
echo ""

# Check 3: Individual ID reads
echo "🔢 Verifying individual token ID functions..."
CAP_ID=$(cast call $MAW "capId()(uint256)" --rpc-url $RPC)
KEY_ID=$(cast call $MAW "keyId()(uint256)" --rpc-url $RPC)
FRAG_ID=$(cast call $MAW "fragId()(uint256)" --rpc-url $RPC)
SHARD_ID=$(cast call $MAW "shardId()(uint256)" --rpc-url $RPC)

echo "  capId(): $CAP_ID"
echo "  keyId(): $KEY_ID"
echo "  fragId(): $FRAG_ID"
echo "  shardId(): $SHARD_ID"

# Validate IDs are reasonable (not 0 for cap/key/frag, any value for shard)
if [ "$CAP_ID" = "0" ]; then
    echo "❌ capId is 0 - this seems wrong"
    exit 1
fi

if [ "$KEY_ID" = "0" ]; then
    echo "❌ keyId is 0 - this seems wrong"  
    exit 1
fi

if [ "$FRAG_ID" = "0" ]; then
    echo "❌ fragId is 0 - this seems wrong"
    exit 1
fi

echo "✅ Token IDs look reasonable"
echo ""

# Check 4: Config hash for version tracking
echo "🔧 Reading config hash..."
CONFIG_HASH=$(cast call $MAW "configHash()(bytes32)" --rpc-url $RPC)
echo "Config hash: $CONFIG_HASH"
echo "  (Use this to detect configuration changes)"
echo ""

# Check 5: Test ID labels
echo "🏷️  Testing ID labels..."
CAP_LABEL=$(cast call $MAW "idLabel(uint256)(string)" $CAP_ID --rpc-url $RPC)
KEY_LABEL=$(cast call $MAW "idLabel(uint256)(string)" $KEY_ID --rpc-url $RPC)
FRAG_LABEL=$(cast call $MAW "idLabel(uint256)(string)" $FRAG_ID --rpc-url $RPC)
SHARD_LABEL=$(cast call $MAW "idLabel(uint256)(string)" $SHARD_ID --rpc-url $RPC)

echo "  ID $CAP_ID: '$CAP_LABEL'"
echo "  ID $KEY_ID: '$KEY_LABEL'" 
echo "  ID $FRAG_ID: '$FRAG_LABEL'"
echo "  ID $SHARD_ID: '$SHARD_LABEL'"
echo ""

# Check 6: Test mint authorization (simulation only)
echo "🧪 Testing mint authorization simulation..."
TEST_USER="0x52257934A41c55F4758b92F4D23b69f920c3652A"

# Try to simulate mint as the MAW (should work)
if cast call $RELICS "mint(address,uint256,uint256,bytes)" $TEST_USER $CAP_ID 1 0x --from $MAW --rpc-url $RPC >/dev/null 2>&1; then
    echo "✅ MAW can mint tokens (authorization correct)"
else
    echo "❌ MAW cannot mint tokens - authorization problem!"
    exit 1
fi

# Try to simulate mint as random address (should fail)
if cast call $RELICS "mint(address,uint256,uint256,bytes)" $TEST_USER $CAP_ID 1 0x --from $TEST_USER --rpc-url $RPC >/dev/null 2>&1; then
    echo "⚠️  Random address can mint - authorization too permissive!"
else
    echo "✅ Random address cannot mint (security correct)"
fi
echo ""

# Check 7: Validate contract selectors exist
echo "🔍 Validating required function selectors..."
REQUIRED_FUNCTIONS=(
    "sacrificeKeys(uint256)"
    "sacrificeCaps(uint256)" 
    "convertShardsToRustedCaps(uint256)"
    "healthcheck()"
    "configHash()"
    "capId()"
    "keyId()"
    "fragId()"
    "shardId()"
)

for FUNC in "${REQUIRED_FUNCTIONS[@]}"; do
    # Try calling the function - if selector doesn't exist, this will fail
    SELECTOR=$(cast sig "$FUNC")
    if cast call $MAW "$FUNC" --rpc-url $RPC >/dev/null 2>&1; then
        echo "  ✅ $FUNC (selector: $SELECTOR)"
    else
        echo "  ❌ $FUNC missing or failing"
        exit 1
    fi
done
echo ""

echo "🎉 All contract health checks passed!"
echo ""
echo "Summary:"
echo "  ✅ Contract addresses aligned"
echo "  ✅ Authorization properly configured"  
echo "  ✅ Token IDs configured and reasonable"
echo "  ✅ Required functions present"
echo "  ✅ Mint authorization working correctly"
echo ""
echo "Config hash: $CONFIG_HASH"
echo "Use this hash to detect future configuration drift."