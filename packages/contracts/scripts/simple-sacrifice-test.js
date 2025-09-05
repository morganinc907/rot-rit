const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Simple sacrifice test...");
  
  const [deployer] = await ethers.getSigners();
  const mawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  
  // Try with lower level calls first
  console.log("📞 Testing with raw contract call...");
  
  const provider = ethers.provider;
  
  // Get the function selector for sacrificeKeys(uint256)
  const iface = new ethers.Interface([
    "function sacrificeKeys(uint256 amount)"
  ]);
  const data = iface.encodeFunctionData("sacrificeKeys", [1]);
  
  console.log("📝 Call data:", data);
  
  try {
    // Try a simple eth_call first
    const result = await provider.call({
      to: mawAddress,
      from: deployer.address,
      data: data
    });
    console.log("✅ eth_call succeeded:", result);
    
    // If that works, try estimating gas
    const gasEstimate = await provider.estimateGas({
      to: mawAddress,
      from: deployer.address,
      data: data
    });
    console.log("⛽ Gas estimate:", gasEstimate.toString());
    
    // If we get here, the transaction should work
    console.log("🚀 Sending actual transaction...");
    
    const tx = await deployer.sendTransaction({
      to: mawAddress,
      data: data,
      gasLimit: gasEstimate
    });
    
    console.log("📤 Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction succeeded:", receipt.status);
    
  } catch (error) {
    console.log("❌ Raw call failed:");
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("Data:", error.data);
    
    // Try to extract revert reason
    if (error.data) {
      try {
        console.log("🔍 Trying to decode error...");
        
        // Check if it's a simple revert string
        if (error.data.startsWith('0x08c379a0')) {
          const reason = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.data.slice(10));
          console.log("📝 Revert reason:", reason[0]);
        } else {
          console.log("🤷 Unknown error format");
        }
      } catch (decodeError) {
        console.log("Could not decode error");
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});