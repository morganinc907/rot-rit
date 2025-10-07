/**
 * Admin Access Control Hook
 * Implements wallet-gated access with role-based permissions
 */
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';

// Admin wallet allowlist (replace with your admin addresses)
const ADMIN_ALLOWLIST = [
  '0x52257934A41c55F4758b92F4D23b69f920c3652A', // Your admin address
  // Add more admin addresses as needed
  // '0x1234...', // Additional admin
];

export function useAdminAccess() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = ADDRS[chainId];

  // Check if wallet is in allowlist
  const isAllowlisted = address && ADMIN_ALLOWLIST.includes(address);

  // Check if wallet has owner role on MAW contract
  const { data: mawOwner } = useReadContract({
    address: addresses?.MawSacrifice,
    abi: canonicalAbis.MawSacrifice,
    functionName: 'owner',
    query: {
      enabled: !!addresses?.MawSacrifice && isConnected,
      staleTime: 60000, // 1 minute cache
    }
  });

  // Check if wallet is the MAW owner
  const isMawOwner = address && mawOwner && address.toLowerCase() === mawOwner.toLowerCase();

  // Determine access levels
  const canRead = isConnected; // Anyone can view dashboard
  const canWrite = isAllowlisted || isMawOwner; // Only allowlisted or contract owner can write
  const isFullAdmin = isMawOwner; // Contract owner has full admin rights

  // Get access status with reasons
  const getAccessStatus = () => {
    if (!isConnected) {
      return {
        level: 'none',
        reason: 'Wallet not connected',
        canRead: false,
        canWrite: false
      };
    }

    if (isFullAdmin) {
      return {
        level: 'full',
        reason: 'Contract owner - full admin access',
        canRead: true,
        canWrite: true
      };
    }

    if (isAllowlisted) {
      return {
        level: 'write',
        reason: 'Allowlisted wallet - read/write access',
        canRead: true,
        canWrite: true
      };
    }

    return {
      level: 'read',
      reason: 'Connected wallet - read-only access',
      canRead: true,
      canWrite: false
    };
  };

  const accessStatus = getAccessStatus();

  // Permission helpers
  const permissions = {
    // Read permissions (anyone connected)
    viewDashboard: canRead,
    viewMetrics: canRead,
    viewAuditResults: canRead,
    viewPauseStatus: canRead,
    
    // Write permissions (allowlisted + owner)
    emergencyPause: canWrite,
    emergencyUnpause: canWrite,
    pauseOperations: canWrite,
    unpauseOperations: canWrite,
    
    // Admin permissions (owner only)
    updateContracts: isFullAdmin,
    manageRoles: isFullAdmin,
    updateAllowlist: isFullAdmin
  };

  return {
    // Access status
    isConnected,
    address,
    canRead,
    canWrite,
    isFullAdmin,
    isAllowlisted,
    isMawOwner,
    
    // Detailed status
    accessStatus,
    permissions,
    
    // Contract info
    mawOwner,
    
    // Helpers
    getPermissionMessage: (action) => {
      if (!isConnected) return 'Connect wallet to continue';
      if (!canWrite && ['pause', 'unpause', 'emergency'].some(keyword => action.toLowerCase().includes(keyword))) {
        return 'Admin privileges required for this action';
      }
      return null;
    },
    
    // Admin allowlist management (for display only - actual updates need contract interaction)
    getAllowlistInfo: () => ({
      totalAdmins: ADMIN_ALLOWLIST.length,
      isUserInList: isAllowlisted,
      contractOwner: mawOwner
    }),
    
    // Authorization decorator for components
    requiresAuth: (level = 'read') => {
      switch (level) {
        case 'read':
          return canRead;
        case 'write':
          return canWrite;
        case 'admin':
          return isFullAdmin;
        default:
          return false;
      }
    }
  };
}