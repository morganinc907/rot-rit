/**
 * Test script to verify transaction pending protection works
 * Simulates the logic we added to prevent rapid-fire transactions
 */

// Mock states that would come from wagmi
const mockStates = [
  { isPending: false, isConfirming: false, isLoading: false, name: "Ready state" },
  { isPending: true, isConfirming: false, isLoading: false, name: "Pending signature" },
  { isPending: false, isConfirming: true, isLoading: false, name: "Confirming transaction" },
  { isPending: false, isConfirming: false, isLoading: true, name: "Processing/loading" },
];

// Mock toast function
const toast = {
  error: (message) => console.log(`🚫 TOAST ERROR: ${message}`)
};

// The logic we added to all sacrifice functions
function checkTransactionPending(isPending, isConfirming, isLoading, actionName) {
  if (isPending || isConfirming || isLoading) {
    toast.error('⏳ Previous transaction still processing. Please wait...');
    console.log(`❌ ${actionName} BLOCKED - transaction in progress`);
    return { success: false, error: 'Transaction already pending' };
  }
  
  console.log(`✅ ${actionName} ALLOWED - no pending transactions`);
  return { success: true };
}

console.log('🧪 Testing transaction prevention logic...\n');

mockStates.forEach((state, index) => {
  console.log(`Test ${index + 1}: ${state.name}`);
  console.log(`  isPending: ${state.isPending}, isConfirming: ${state.isConfirming}, isLoading: ${state.isLoading}`);
  
  const result = checkTransactionPending(
    state.isPending, 
    state.isConfirming, 
    state.isLoading, 
    'SACRIFICE KEYS'
  );
  
  console.log(`  Result: ${JSON.stringify(result)}\n`);
});

console.log('🎯 Summary:');
console.log('- Only the first state (all false) should allow transactions');
console.log('- States 2-4 should block transactions and show error toast');
console.log('- This prevents rapid-fire transaction issues');