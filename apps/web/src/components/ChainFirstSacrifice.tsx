/**
 * ChainFirstSacrifice - Drop-in replacement component 
 * Uses chain-first hooks and simulation-before-write pattern
 * Refuses to operate when configuration doesn't match chain reality
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useContracts from '../hooks/useContracts.tsx';
import useMawConfig from '../hooks/useMawConfig';
import { useRelicBalances } from '../hooks/useRelicBalances';
import { useSacrifice } from '../hooks/useSacrifice';
import { runStartupABIChecks } from '../utils/abiGuards';
import { runStartupConfigChecks } from '../utils/configGuards';

interface ChainFirstSacrificeProps {
  className?: string;
}

export default function ChainFirstSacrifice({ className }: ChainFirstSacrificeProps) {
  const [amount, setAmount] = useState(1);
  const [shardConvertAmount, setShardConvertAmount] = useState(5);
  const [systemReady, setSystemReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  // Chain-first hooks
  const { loading: contractsLoading, error: contractsError, isChainAligned } = useContracts();
  const { config, loading: configLoading, error: configError, isValid: configValid } = useMawConfig();
  const { caps, keys, fragments, shards, canSacrifice, canConvert } = useRelicBalances();
  const { 
    sacrificeKeys, 
    convertShards, 
    isLoading, 
    isReady,
    capsBalance,
    shardsBalance 
  } = useSacrifice();

  // Startup validation
  useEffect(() => {
    const validateStartup = async () => {
      console.log('🔍 Running chain-first startup validation...');

      // Step 1: ABI Guards
      const abiValid = runStartupABIChecks();
      if (!abiValid) {
        setStartupError('ABI validation failed - see console for details');
        return;
      }

      // Step 2: Config Guards  
      const configValid = runStartupConfigChecks();
      if (!configValid) {
        setStartupError('Configuration validation failed - see console for details');
        return;
      }

      console.log('✅ Startup validation passed!');
      setSystemReady(true);
    };

    validateStartup();
  }, []);

  // System readiness check
  const isSystemReady = systemReady && 
    !contractsLoading && 
    !configLoading && 
    !contractsError && 
    !configError && 
    configValid && 
    isReady;

  // Handle sacrifice
  const handleSacrifice = async () => {
    if (!isSystemReady) {
      toast.error('System not ready - check configuration');
      return;
    }

    if (!canSacrifice) {
      toast.error(`Need ${amount} caps to sacrifice (you have ${capsBalance})`);
      return;
    }

    const result = await sacrificeKeys(amount);
    if (result.success) {
      console.log('✅ Sacrifice successful!', result);
    }
  };

  // Handle conversion
  const handleConvert = async () => {
    if (!isSystemReady) {
      toast.error('System not ready - check configuration');
      return;
    }

    if (!canConvert || shardsBalance < shardConvertAmount) {
      toast.error(`Need ${shardConvertAmount} shards to convert (you have ${shardsBalance})`);
      return;
    }

    const result = await convertShards(shardConvertAmount);
    if (result.success) {
      console.log('✅ Conversion successful!', result);
    }
  };

  // Show startup error
  if (startupError) {
    return (
      <div className={`chain-first-sacrifice error ${className}`}>
        <div className="startup-error">
          <h3>🚨 Startup Validation Failed</h3>
          <p>{startupError}</p>
          <p>Check the console for detailed information.</p>
          <button onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isSystemReady) {
    return (
      <div className={`chain-first-sacrifice loading ${className}`}>
        <div className="loading-state">
          <div className="spinner"></div>
          <h3>🔗 Syncing with Chain</h3>
          <div className="loading-checks">
            <div className={`check ${!contractsLoading ? 'complete' : 'loading'}`}>
              {contractsLoading ? '⏳' : '✅'} Contract Addresses
            </div>
            <div className={`check ${!configLoading ? 'complete' : 'loading'}`}>
              {configLoading ? '⏳' : '✅'} Token Configuration
            </div>
            <div className={`check ${isChainAligned ? 'complete' : 'loading'}`}>
              {isChainAligned ? '✅' : '⏳'} Chain Alignment
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chain-first-sacrifice ${className}`}>
      {/* System Status */}
      <div className="system-status">
        <div className="status-indicator ready">
          <span className="indicator-dot">🟢</span>
          <span>Chain Synced</span>
        </div>
        {config && (
          <div className="token-config">
            <small>Cap ID: {config.capId} | Shard ID: {config.shardId}</small>
          </div>
        )}
      </div>

      {/* Balance Display */}
      <div className="balances">
        <div className="balance-item">
          <span className="balance-label">Caps:</span>
          <span className="balance-value">{Number(caps)}</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Keys:</span>
          <span className="balance-value">{Number(keys)}</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Fragments:</span>
          <span className="balance-value">{Number(fragments)}</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Shards:</span>
          <span className="balance-value">{Number(shards)}</span>
        </div>
      </div>

      {/* Sacrifice Section */}
      <div className="action-section">
        <h3>🔥 Sacrifice Caps</h3>
        <div className="input-group">
          <label>Amount (1-10):</label>
          <input
            type="number"
            min={1}
            max={10}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>
        
        <motion.button
          className="sacrifice-button"
          onClick={handleSacrifice}
          disabled={isLoading || !canSacrifice}
          whileHover={canSacrifice ? { scale: 1.02 } : {}}
          whileTap={canSacrifice ? { scale: 0.98 } : {}}
        >
          {isLoading ? 'Processing...' : `Sacrifice ${amount} Caps`}
        </motion.button>
        
        {!canSacrifice && (
          <p className="error-text">
            Need {amount} caps (you have {capsBalance})
          </p>
        )}
      </div>

      {/* Conversion Section */}
      <div className="action-section">
        <h3>✨ Convert Shards to Caps</h3>
        <div className="input-group">
          <label>Shard Amount (multiple of 5):</label>
          <input
            type="number"
            min={5}
            step={5}
            value={shardConvertAmount}
            onChange={(e) => setShardConvertAmount(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>
        
        <motion.button
          className="convert-button"
          onClick={handleConvert}
          disabled={isLoading || !canConvert || shardsBalance < shardConvertAmount}
          whileHover={canConvert && shardsBalance >= shardConvertAmount ? { scale: 1.02 } : {}}
          whileTap={canConvert && shardsBalance >= shardConvertAmount ? { scale: 0.98 } : {}}
        >
          {isLoading ? 'Processing...' : `Convert ${shardConvertAmount} Shards → ${shardConvertAmount / 5} Caps`}
        </motion.button>

        {(!canConvert || shardsBalance < shardConvertAmount) && (
          <p className="error-text">
            Need {shardConvertAmount} shards (you have {shardsBalance})
          </p>
        )}
      </div>

      <style jsx>{`
        .chain-first-sacrifice {
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #4a1f1f;
          border-radius: 12px;
          padding: 20px;
          max-width: 500px;
          margin: 0 auto;
        }

        .chain-first-sacrifice.error {
          border-color: #ff0000;
        }

        .startup-error {
          text-align: center;
          color: #ff6b6b;
        }

        .startup-error h3 {
          color: #ff0000;
          margin-bottom: 16px;
        }

        .startup-error button {
          background: #8b0000;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 40px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #ff6b6b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-checks {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
        }

        .check {
          padding: 8px;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .check.loading {
          background: rgba(255, 255, 255, 0.05);
        }

        .check.complete {
          background: rgba(0, 255, 0, 0.1);
          color: #00ff00;
        }

        .system-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #4a1f1f;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator.ready {
          color: #00ff00;
        }

        .token-config {
          color: #888;
          font-size: 12px;
        }

        .balances {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .balance-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .balance-label {
          color: #ccc;
          font-size: 14px;
        }

        .balance-value {
          color: #ffd700;
          font-weight: bold;
          font-size: 16px;
        }

        .action-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #4a1f1f;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .action-section h3 {
          color: #ff6b6b;
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-group label {
          display: block;
          color: #ccc;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .input-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid #4a1f1f;
          border-radius: 6px;
          padding: 12px;
          color: white;
          font-size: 16px;
        }

        .input-group input:focus {
          outline: none;
          border-color: #ff6b6b;
        }

        .sacrifice-button, .convert-button {
          width: 100%;
          background: linear-gradient(135deg, #8b0000 0%, #ff0000 100%);
          border: 2px solid #ff0000;
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .convert-button {
          background: linear-gradient(135deg, #0066cc 0%, #0080ff 100%);
          border-color: #0080ff;
        }

        .sacrifice-button:hover:not(:disabled), .convert-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
        }

        .convert-button:hover:not(:disabled) {
          box-shadow: 0 4px 15px rgba(0, 128, 255, 0.3);
        }

        .sacrifice-button:disabled, .convert-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .error-text {
          color: #ff6b6b;
          font-size: 14px;
          margin-top: 8px;
          text-align: center;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}