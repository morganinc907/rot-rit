import { useContracts } from '../hooks/useContracts';
import { getChainName } from '@rot-ritual/addresses';

interface WrongChainBannerProps {
  className?: string;
}

export function WrongChainBanner({ className = '' }: WrongChainBannerProps) {
  const { isSupported, allowedChains, currentChainName, chainId } = useContracts();
  
  // Don't show banner if chain is supported
  if (isSupported) return null;
  
  const allowedChainNames = allowedChains?.map(id => getChainName(id)).join(' or ') || 'supported networks';
  
  return (
    <div className={`bg-red-900/80 border-l-4 border-red-500 p-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-400">
              Wrong Network
            </h3>
            <div className="mt-1 text-sm text-red-300">
              <p>
                Currently on <span className="font-semibold">{currentChainName}</span>, but this app requires <span className="font-semibold">{allowedChainNames}</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              // This will prompt user to switch networks
              if (typeof window !== 'undefined' && window.ethereum) {
                const primaryChainHex = `0x${allowedChains[0].toString(16)}`;
                window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: primaryChainHex }],
                }).catch((error: any) => {
                  console.error('Failed to switch network:', error);
                });
              }
            }}
            className="bg-red-800 hover:bg-red-700 text-red-100 px-3 py-1 text-sm rounded transition-colors"
          >
            Switch Network
          </button>
        </div>
      </div>
    </div>
  );
}

export default WrongChainBanner;