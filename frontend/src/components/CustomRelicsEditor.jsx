/**
 * Custom Relics Pool Editor
 * Allows adding/removing individual relic IDs from the reward pool
 */
import React from 'react';

export function CustomRelicsEditor({ 
  customPool,
  newRelicId,
  setNewRelicId,
  newRelicProbability,
  setNewRelicProbability,
  addRelicToPool,
  removeRelicFromPool,
  updateRelicProbability,
  formatRelicDisplay,
  getRelicName
}) {
  const customRelics = formatRelicDisplay({
    tokenIds: customPool.tokenIds,
    probabilities: customPool.probabilities,
    totalWeight: customPool.probabilities.reduce((sum, p) => sum + p, 0)
  });

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-purple-900 mb-3">⚙️ Custom Relics Pool Editor</h3>
        <p className="text-purple-700 text-sm mb-4">
          Add or remove individual relics from the reward pool. Each relic needs an ID and probability weight.
        </p>

        {/* Add new relic */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Relic Token ID
            </label>
            <input
              type="number"
              value={newRelicId}
              onChange={(e) => setNewRelicId(e.target.value)}
              placeholder="e.g. 15"
              className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Probability Weight
            </label>
            <input
              type="number"
              value={newRelicProbability}
              onChange={(e) => setNewRelicProbability(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={addRelicToPool}
            disabled={!newRelicId || !newRelicProbability}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        <div className="mt-4 text-xs text-purple-600">
          💡 Tip: Higher probability weights mean higher chance to drop. Common weights: 50-500
        </div>
      </div>

      {/* Current custom pool */}
      {customPool.tokenIds.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Current Custom Pool ({customPool.tokenIds.length} relics)
          </h4>
          <div className="space-y-2">
            {customRelics.map((relic, index) => (
              <div key={relic.tokenId} className="flex items-center gap-3 bg-white p-3 rounded border">
                <div className="flex-1">
                  <div className="relic-display">
                    <span className="font-mono text-sm font-medium relic-number">
                      #{relic.tokenId}
                    </span>
                    <span className="text-sm text-gray-700 relic-name">
                      {getRelicName ? getRelicName(relic.tokenId) : `Relic ${relic.tokenId}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Weight:</label>
                  <input
                    type="number"
                    value={relic.probability}
                    onChange={(e) => updateRelicProbability(relic.tokenId, e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="text-sm text-gray-600 min-w-[60px]">
                  {relic.percentage}%
                </div>
                <button
                  onClick={() => removeRelicFromPool(relic.tokenId)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 hover:bg-red-50 rounded"
                  title="Remove relic"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Total Weight: {customPool.probabilities.reduce((sum, p) => sum + p, 0)}
            </div>
          </div>
        </div>
      )}

      {customPool.tokenIds.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
          No relics in custom pool. Add some above to get started.
        </div>
      )}
    </div>
  );
}