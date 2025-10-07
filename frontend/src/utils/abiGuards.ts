/**
 * ABI Guards - Startup validation to prevent drift and ensure contracts match expectations
 * Validates that ABIs contain required functions before allowing the app to start
 */
import canonicalAbis from './canonical-abis';

export interface ABIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that MawSacrifice ABI has required V5 functions
 */
export function validateMawSacrificeABI(): ABIValidationResult {
  const abi = canonicalAbis.MawSacrifice;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!abi || !Array.isArray(abi)) {
    errors.push('MawSacrifice ABI not found or invalid format');
    return { isValid: false, errors, warnings };
  }

  // Required V5 functions
  const requiredFunctions = [
    'sacrificeKeys',
    'convertShardsToRustedCaps', 
    'capId',
    'keyId',
    'fragId', 
    'shardId',
    'initializeV5'
  ];

  const functionNames = abi
    .filter((item: any) => item.type === 'function')
    .map((item: any) => item.name);

  for (const fnName of requiredFunctions) {
    if (!functionNames.includes(fnName)) {
      if (fnName === 'initializeV5') {
        warnings.push(`Missing V5 function: ${fnName} (might be older version)`);
      } else {
        errors.push(`Missing required function: ${fnName}`);
      }
    }
  }

  // Check for V5-specific configurable ID functions
  const v5ConfigFunctions = ['capId', 'keyId', 'fragId', 'shardId'];
  const hasV5Config = v5ConfigFunctions.every(fn => functionNames.includes(fn));
  
  if (!hasV5Config) {
    warnings.push('Missing V5 configurable ID functions - using older contract version');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate that Relics ABI has required ERC1155 functions
 */
export function validateRelicsABI(): ABIValidationResult {
  const abi = canonicalAbis.Relics;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!abi || !Array.isArray(abi)) {
    errors.push('Relics ABI not found or invalid format');
    return { isValid: false, errors, warnings };
  }

  const requiredFunctions = [
    'balanceOf',
    'balanceOfBatch',
    'burn',
    'mint',
    'mawSacrifice' // Critical for address reading
  ];

  const functionNames = abi
    .filter((item: any) => item.type === 'function')
    .map((item: any) => item.name);

  for (const fnName of requiredFunctions) {
    if (!functionNames.includes(fnName)) {
      errors.push(`Missing required function: ${fnName}`);
    }
  }

  // Check for required events
  const eventNames = abi
    .filter((item: any) => item.type === 'event')
    .map((item: any) => item.name);

  const requiredEvents = ['TransferSingle', 'TransferBatch'];
  for (const eventName of requiredEvents) {
    if (!eventNames.includes(eventName)) {
      errors.push(`Missing required event: ${eventName}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all critical ABIs at startup
 */
export function validateAllABIs(): ABIValidationResult {
  const mawResult = validateMawSacrificeABI();
  const relicsResult = validateRelicsABI();

  const allErrors = [...mawResult.errors, ...relicsResult.errors];
  const allWarnings = [...mawResult.warnings, ...relicsResult.warnings];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Display ABI validation results to console
 */
export function logValidationResults(result: ABIValidationResult, contractName: string) {
  console.group(`[ABI Validation] ${contractName}`);
  
  if (result.isValid) {
    console.log('✅ ABI validation passed');
  } else {
    console.error('❌ ABI validation failed');
    result.errors.forEach(error => console.error(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  console.groupEnd();
}

/**
 * Startup guard - prevents app from running with invalid ABIs
 */
export function runStartupABIChecks(): boolean {
  console.log('🔍 Running startup ABI validation...');
  
  const result = validateAllABIs();
  
  logValidationResults(result, 'All Contracts');
  
  if (!result.isValid) {
    const errorMessage = `
🚨 ABI VALIDATION FAILED 🚨

The following issues were found:
${result.errors.map(e => `• ${e}`).join('\n')}

This usually means:
1. The ABI files are outdated or corrupted
2. The contract has been upgraded but ABIs weren't updated
3. There's a build or import issue

Please check:
- packages/contracts/artifacts/
- apps/web/src/utils/canonical-abis.json
- Contract deployment addresses

The app cannot start safely with invalid ABIs.
    `;
    
    console.error(errorMessage);
    return false;
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ ABI validation passed with warnings. App will continue but some features may not work as expected.');
  } else {
    console.log('✅ All ABI validations passed! App is safe to start.');
  }

  return true;
}