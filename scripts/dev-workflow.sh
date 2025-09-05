#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Starting ABI Development Workflow${NC}"
echo "======================================"

# Step 1: Compile contracts with Foundry
echo -e "\n${YELLOW}Step 1: Compiling contracts with Foundry...${NC}"
cd packages/contracts
forge clean
forge build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Contracts compiled successfully${NC}"

# Step 2: Generate ABIs from artifacts
echo -e "\n${YELLOW}Step 2: Extracting ABIs from artifacts...${NC}"
cd ../..
node scripts/build-abis.mjs
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ABI extraction failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ ABIs extracted successfully${NC}"

# Step 3: Verify ABI integrity
echo -e "\n${YELLOW}Step 3: Verifying ABI integrity...${NC}"
node scripts/check-abis.mjs
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ABI verification failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ ABIs verified successfully${NC}"

# Step 4: Reinstall workspaces so frontend picks up @rot-ritual/abi
echo -e "\n${YELLOW}Step 4: Reinstalling npm workspaces...${NC}"
if [ -f "package.json" ]; then
    npm i
else
    echo -e "${YELLOW}No root package.json found, skipping workspace install${NC}"
fi

# Step 5: Clear Vite cache (optional, pass --clear-cache flag)
if [[ "$1" == "--clear-cache" ]]; then
    echo -e "\n${YELLOW}Step 5: Clearing Vite cache...${NC}"
    rm -rf node_modules/.vite apps/web/dist apps/web/node_modules/.vite
    echo -e "${GREEN}✓ Cache cleared${NC}"
fi

# Step 6: Start dev server (optional, pass --dev flag)
if [[ "$1" == "--dev" ]] || [[ "$2" == "--dev" ]]; then
    echo -e "\n${YELLOW}Step 6: Starting development server...${NC}"
    cd apps/web
    npm run dev
fi

echo -e "\n${GREEN}✅ ABI workflow complete!${NC}"
echo -e "Next steps:"
echo -e "  • Run ${YELLOW}cd apps/web && npm run dev${NC} to start the frontend"
echo -e "  • Clear browser cache if you see stale data"
echo -e "  • Run with ${YELLOW}--clear-cache${NC} to clear Vite cache"
echo -e "  • Run with ${YELLOW}--dev${NC} to start dev server automatically"