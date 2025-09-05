/**
 * Standard interface that all MawSacrifice hooks must implement
 * This ensures compatibility with existing UI components
 */
export interface MawSacrificeHook {
  // State
  isLoading: boolean;
  isApproved: boolean;
  isReady: boolean;
  lastTxHash: string | null;
  
  // Actions (must include these exact names)
  approveContract: () => Promise<void>;
  sacrificeKeys: (amount: number) => Promise<void>;
  sacrificeForCosmetic: (daggerIds: number[], vialAmounts: number[]) => Promise<void>;
  sacrificeForDemon: (amount: number, tier: number) => Promise<void>;
  convertAshes: () => Promise<void>;
  
  // Helpers
  refetchApproval: () => void;
  
  // Optional V4+ features
  systemStatus?: {
    sacrificesPaused: boolean;
    conversionsPaused: boolean;
    mythicDemonsMinted: number;
    version: string;
  };
}