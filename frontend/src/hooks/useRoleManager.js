/**
 * Role Manager Hook
 * Handles KEY_SHOP role grants/revokes with simulation
 */
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { keccak256, stringToBytes } from 'viem';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';
import toast from 'react-hot-toast';

// Known addresses for dropdown
const KNOWN_ADDRESSES = {
  'KeyShop Contract': 'keyshop',
  'Your Wallet': 'wallet',
  'Deployer': '0x52257934A41c55F4758b92F4D23b69f920c3652A', // Replace with actual deployer
  'Safe Multisig': '0x1234567890123456789012345678901234567890', // Replace with actual safe
};

const ROLES = {
  KEY_SHOP: keccak256(stringToBytes("KEY_SHOP")),
};

export function useRoleManager() {
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const addresses = ADDRS[chainId];
  
  const [selectedAddress, setSelectedAddress] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'grant' or 'revoke'

  // Get the actual address to use based on selection
  const getTargetAddress = () => {
    if (selectedAddress === 'keyshop') return addresses?.KeyShop;
    if (selectedAddress === 'wallet') return userAddress;
    if (selectedAddress === 'custom') return customAddress;
    return selectedAddress;
  };

  // Check current KEY_SHOP role assignment (custom role system)
  const { data: currentKeyShopRole, refetch: refetchRole } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'role',
    args: [ROLES.KEY_SHOP],
    query: {
      enabled: !!addresses?.MawSacrifice,
      staleTime: 10000,
    }
  });

  // Check if target address has KEY_SHOP role
  const hasKeyShopRole = currentKeyShopRole && getTargetAddress() && 
    currentKeyShopRole.toLowerCase() === getTargetAddress().toLowerCase();

  // Check contract owner (who can manage roles)
  const { data: contractOwner } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'owner',
    query: {
      enabled: !!addresses?.MawSacrifice,
      staleTime: 60000,
    }
  });

  // Check if user can manage roles (owner only)
  const canManageRoles = userAddress && contractOwner && 
    userAddress.toLowerCase() === contractOwner.toLowerCase();

  // Write contract hooks
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Simulate role change
  const simulateRoleChange = async (action) => {
    const targetAddress = getTargetAddress();
    if (!targetAddress || !addresses?.MawSacrifice) return;

    setIsSimulating(true);
    try {
      const currentHasRole = hasKeyShopRole;
      const newWillHaveRole = action === 'grant';
      
      // Check if this is a no-op
      if (currentHasRole === newWillHaveRole) {
        const message = action === 'grant' 
          ? 'Address already has KEY_SHOP role'
          : 'Address does not have KEY_SHOP role';
        
        setSimulationResult({
          isValid: false,
          targetAddress,
          action,
          currentState: currentHasRole,
          newState: newWillHaveRole,
          isNoOp: true,
          message
        });
        setIsSimulating(false);
        return;
      }

      // Validate permissions
      if (!canManageRoles) {
        setSimulationResult({
          isValid: false,
          targetAddress,
          action,
          currentState: currentHasRole,
          newState: newWillHaveRole,
          error: 'Your wallet does not have permission to manage roles. Only contract owner can set roles.'
        });
        setIsSimulating(false);
        return;
      }

      // Create successful simulation
      const roleAddress = action === 'grant' ? targetAddress : '0x0000000000000000000000000000000000000000';
      
      setSimulationResult({
        isValid: true,
        targetAddress,
        action,
        currentState: currentHasRole,
        newState: newWillHaveRole,
        functionName: 'setRole',
        roleHash: ROLES.KEY_SHOP,
        roleAddress: roleAddress,
        currentRoleHolder: currentKeyShopRole,
        message: `Will ${action} KEY_SHOP role ${action === 'grant' ? 'to' : 'from'} ${targetAddress}`
      });

    } catch (error) {
      setSimulationResult({
        isValid: false,
        targetAddress,
        action,
        error: error.message
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Execute role change (using custom setRole function)
  const executeRoleChange = async (action) => {
    if (!simulationResult?.isValid) {
      toast.error('Please run simulation first');
      return;
    }

    const targetAddress = getTargetAddress();
    setPendingAction(action);

    try {
      // Use setRole function: setRole(bytes32 role, address who)
      // For grant: set role to target address
      // For revoke: set role to zero address
      const roleAddress = action === 'grant' ? targetAddress : '0x0000000000000000000000000000000000000000';
      
      await writeContract({
        address: addresses.MawSacrifice,
        abi: canonicalAbis.MawSacrifice,
        functionName: 'setRole',
        args: [ROLES.KEY_SHOP, roleAddress],
      });

      toast.success(`${action === 'grant' ? 'Grant' : 'Revoke'} transaction submitted`);
    } catch (error) {
      toast.error(`Failed to ${action} role: ${error.message}`);
      setPendingAction(null);
    }
  };

  // Reset after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      setSimulationResult(null);
      setPendingAction(null);
      refetchRole();
      toast.success(`KEY_SHOP role ${pendingAction === 'grant' ? 'granted' : 'revoked'} successfully!`);
    }
  }, [isConfirmed, pendingAction, refetchRole]);

  // Auto-simulate when target address changes
  useEffect(() => {
    const targetAddress = getTargetAddress();
    if (targetAddress && hasKeyShopRole !== undefined) {
      // Clear previous simulation when address changes
      setSimulationResult(null);
    }
  }, [selectedAddress, customAddress, hasKeyShopRole]);

  // Helper to get address display name
  const getAddressDisplayName = (address) => {
    if (!address) return 'Unknown';
    
    for (const [name, addr] of Object.entries(KNOWN_ADDRESSES)) {
      if (addr === 'keyshop' && address === addresses?.KeyShop) return name;
      if (addr === 'wallet' && address === userAddress) return name;
      if (addr === address) return name;
    }
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    // State
    selectedAddress,
    setSelectedAddress,
    customAddress,
    setCustomAddress,
    targetAddress: getTargetAddress(),
    
    // Role status
    hasKeyShopRole,
    canManageRoles,
    roleAdmin: contractOwner,
    currentKeyShopRole,
    
    // Simulation
    isSimulating,
    simulationResult,
    simulateRoleChange,
    
    // Execution
    executeRoleChange,
    isWriting,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,
    pendingAction,
    
    // Helpers
    KNOWN_ADDRESSES,
    getAddressDisplayName,
    isPending: isWriting || isConfirming,
    canGrant: simulationResult?.isValid && simulationResult?.action === 'grant',
    canRevoke: simulationResult?.isValid && simulationResult?.action === 'revoke',
    
    // Validation helpers
    isValidAddress: (addr) => addr && addr.match(/^0x[a-fA-F0-9]{40}$/),
    needsSimulation: !!getTargetAddress() && !simulationResult
  };
}