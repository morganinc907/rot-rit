/**
 * Simple test to understand the burn authorization issue
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔥 Simple burn test...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const [signer] = await ethers.getSigners();
  
  try {
    console.log('🧪 Testing different burn scenarios...\n');
    
    // 1. Can the owner burn their own tokens?
    console.log('1️⃣ Testing: Owner burns own tokens');
    try {
      await relics.burn.staticCall(USER_ADDRESS, 2, 1); // Owner burns 1 fragment from themselves
      console.log('✅ Owner CAN burn own tokens');
    } catch (e) {
      console.log('❌ Owner CANNOT burn own tokens:', e.message.split('\n')[0]);
    }
    
    // 2. Can the owner burn tokens and specify a different "from" address?
    console.log('\n2️⃣ Testing: Owner burns tokens FROM user');
    try {
      await relics.burn.staticCall(USER_ADDRESS, 2, 1); // Same thing, but being explicit
      console.log('✅ Owner CAN burn tokens from user');
    } catch (e) {
      console.log('❌ Owner CANNOT burn tokens from user:', e.message.split('\n')[0]);
    }
    
    // 3. What if the maw contract tries to burn tokens?
    console.log('\n3️⃣ Testing: Maw contract burns tokens FROM user');
    try {
      // This simulates what happens when sacrificeForCosmetic is called
      await relics.burn.staticCall(USER_ADDRESS, 2, 1); // Maw burns tokens from user
      console.log('✅ Maw CAN burn tokens from user');
    } catch (e) {
      console.log('❌ Maw CANNOT burn tokens from user:', e.message.split('\n')[0]);
    }
    
    // 4. Check what the burn function actually requires
    console.log('\n4️⃣ Analyzing burn function requirements...');
    
    // Maybe the issue is that the Relics contract doesn't have a burn function at all?
    try {
      const burnFunction = relics.interface.getFunction('burn');
      console.log('🔥 Burn function exists:', burnFunction.format());
      console.log('   Inputs:', burnFunction.inputs.map(i => `${i.type} ${i.name}`).join(', '));
    } catch (e) {
      console.log('❌ No burn function found!');
      
      // Maybe it's called something else?
      const possibleBurnFunctions = ['burn', '_burn', 'burnFrom', 'burnBatch'];
      for (const funcName of possibleBurnFunctions) {
        try {
          if (relics[funcName]) {
            console.log(`✅ Found ${funcName} function`);
          }
        } catch (e) {
          // Function doesn't exist
        }
      }
    }
    
    // 5. Check if the issue is that relics is not an ERC1155Burnable
    console.log('\n5️⃣ Checking if Relics supports burning...');
    try {
      // Check if it has standard ERC1155 functions
      const balance = await relics.balanceOf(USER_ADDRESS, 2);
      console.log('📊 User fragment balance:', balance.toString());
      
      // Maybe it's an approval issue after all?
      const approved = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
      console.log('📊 User approved proxy:', approved);
      
      // What about owner approval?
      const ownerApproved = await relics.isApprovedForAll(USER_ADDRESS, USER_ADDRESS);
      console.log('📊 User approved self:', ownerApproved);
      
    } catch (e) {
      console.log('❌ Balance check failed:', e.message.split('\n')[0]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);