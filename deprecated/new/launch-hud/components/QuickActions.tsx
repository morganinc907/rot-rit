interface QuickActionsProps {
  onAbort: () => void;
  onRollback: () => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export default function QuickActions({ onAbort, onRollback, disabled, darkMode }: QuickActionsProps) {
  const handleCacheInvalidation = () => {
    // In production, this would call the actual invalidateCache function
    console.log('Cache invalidated');
    alert('Cache invalidated successfully');
  };

  const handleRPCSwitch = () => {
    // In production, this would switch between primary and fallback RPC
    console.log('Switching RPC endpoint...');
    alert('Switched to fallback RPC endpoint');
  };

  const handleWebhook = () => {
    // In production, send deployment status to Discord/Slack
    console.log('Webhook notification sent');
    alert('Deployment status sent to Discord/Slack');
  };

  const cardClass = darkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';

  return (
    <div className={`p-6 rounded-lg shadow-lg border ${cardClass}`}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>⚡</span>
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* ABORT Button - Big and Red */}
        <button
          onClick={onAbort}
          disabled={disabled}
          className={`
            col-span-2 h-20 text-2xl font-bold rounded-lg
            transition-all duration-200 transform
            ${disabled 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 shadow-lg'
            }
            text-white flex items-center justify-center gap-3
          `}
        >
          <span className="text-3xl">🛑</span>
          ABORT DEPLOYMENT
        </button>

        {/* Rollback */}
        <button
          onClick={onRollback}
          disabled={disabled}
          className={`
            h-14 rounded-lg font-semibold
            transition-all duration-200
            ${disabled 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
            }
            text-white flex items-center justify-center gap-2
          `}
        >
          <span>⏪</span>
          Rollback
        </button>

        {/* Invalidate Cache */}
        <button
          onClick={handleCacheInvalidation}
          className="
            h-14 rounded-lg font-semibold
            bg-blue-500 hover:bg-blue-600 active:scale-95
            text-white flex items-center justify-center gap-2
            transition-all duration-200
          "
        >
          <span>🔄</span>
          Clear Cache
        </button>

        {/* Switch RPC */}
        <button
          onClick={handleRPCSwitch}
          className="
            h-14 rounded-lg font-semibold
            bg-yellow-500 hover:bg-yellow-600 active:scale-95
            text-white flex items-center justify-center gap-2
            transition-all duration-200
          "
        >
          <span>🔌</span>
          Switch RPC
        </button>

        {/* Send Webhook */}
        <button
          onClick={handleWebhook}
          className="
            h-14 rounded-lg font-semibold
            bg-purple-500 hover:bg-purple-600 active:scale-95
            text-white flex items-center justify-center gap-2
            transition-all duration-200
          "
        >
          <span>📢</span>
          Send Update
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">Emergency Contacts</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">DevOps Lead:</span>
            <span className="font-mono text-blue-400">@alice_dev</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Smart Contract:</span>
            <span className="font-mono text-blue-400">@bob_solidity</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">War Room:</span>
            <span className="font-mono text-blue-400">#deployment-channel</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-400">Emergency Actions</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${disabled ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`} />
          <span className={disabled ? 'text-gray-500' : 'text-green-500'}>
            {disabled ? 'Locked' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}