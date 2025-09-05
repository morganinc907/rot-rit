// Runtime ABI verification
// This ensures the frontend doesn't run with stale or mismatched ABIs

import { mawAbi, relicsAbi, cosmeticsAbi } from "../abi";

interface ABIFunction {
  type: string;
  name?: string;
  inputs?: Array<{ type: string }>;
}

/**
 * Verify that critical function signatures exist in the ABI
 * This prevents the frontend from running with incorrect ABIs
 */
export function verifyABIIntegrity(): void {
  console.log("[ABI Verification] Starting runtime ABI verification...");
  console.log("[ABI Verification] MAW ABI length:", mawAbi?.length);
  console.log("[ABI Verification] Relics ABI length:", relicsAbi?.length);
  console.log("[ABI Verification] Cosmetics ABI length:", cosmeticsAbi?.length);
  
  // Check MAW contract critical functions
  verifyContract("MAW", mawAbi as ABIFunction[], [
    { name: "sacrificeForCosmetic", inputs: 2 },
    { name: "sacrificeKeys", inputs: 1 },
    { name: "convertShardsToRustedCaps", inputs: 1 },
    { name: "sacrificesPaused", inputs: 0 },
    { name: "pauseSacrifices", inputs: 0 },
    { name: "unpauseSacrifices", inputs: 0 }
  ]);

  // Check Relics contract critical functions
  verifyContract("Relics", relicsAbi as ABIFunction[], [
    { name: "balanceOf", inputs: 2 },
    { name: "balanceOfBatch", inputs: 2 },
    { name: "burn", inputs: 3 },
    { name: "burnBatch", inputs: 3 },
    { name: "safeTransferFrom", inputs: 5 }
  ]);

  // Check Cosmetics contract critical functions
  verifyContract("Cosmetics", cosmeticsAbi as ABIFunction[], [
    { name: "mintTo", inputs: 2 },
    { name: "getCosmeticInfo", inputs: 1 },
    { name: "createCosmeticType", inputs: 7 },
    { name: "balanceOf", inputs: 2 }
  ]);

  console.log("[ABI Verification] ✅ All critical ABIs verified successfully");
}

function verifyContract(
  contractName: string,
  abi: ABIFunction[],
  requiredFunctions: Array<{ name: string; inputs: number }>
): void {
  const functions = abi.filter(item => item.type === "function");
  
  for (const required of requiredFunctions) {
    const found = functions.find(
      fn => fn.name === required.name && 
            (fn.inputs?.length || 0) === required.inputs
    );
    
    if (!found) {
      const error = `[ABI Verification] ❌ ${contractName} ABI missing critical function: ${required.name}(${required.inputs} params)`;
      console.error(error);
      throw new Error(error);
    }
  }
  
  console.log(`[ABI Verification] ✓ ${contractName} ABI verified (${functions.length} functions)`);
}

/**
 * Get function selector from ABI
 */
export function getFunctionSelector(abi: any[], functionName: string): string | null {
  const fn = abi.find(item => item.type === "function" && item.name === functionName);
  if (!fn) return null;
  
  // Create function signature
  const inputs = fn.inputs?.map((input: any) => input.type).join(",") || "";
  const signature = `${functionName}(${inputs})`;
  
  // In production, you'd use ethers.utils.id or viem's getFunctionSelector
  // For now, return a placeholder
  return `0x${signature.substring(0, 8)}`;
}

/**
 * Verify specific function exists and is callable
 */
export function verifyFunctionExists(abi: any[], functionName: string): boolean {
  return abi.some(item => item.type === "function" && item.name === functionName);
}