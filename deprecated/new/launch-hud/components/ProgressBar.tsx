import { useMemo } from 'react';

interface Stage {
  id: number;
  name: string;
  icon: string;
}

const STAGES: Stage[] = [
  { id: 1, name: 'Compile', icon: '🔨' },
  { id: 2, name: 'Test Suite', icon: '🧪' },
  { id: 3, name: 'Deploy', icon: '🚀' },
  { id: 4, name: 'Verify ABIs', icon: '✅' },
  { id: 5, name: 'Publish', icon: '📦' },
  { id: 6, name: 'Smoke Tests', icon: '🔥' },
  { id: 7, name: 'Complete', icon: '🎉' },
];

interface ProgressBarProps {
  stage: number;
  status: 'pending' | 'running' | 'success' | 'failed';
}

export default function ProgressBar({ stage, status }: ProgressBarProps) {
  const progress = useMemo(() => {
    if (stage === 0) return 0;
    return (stage / STAGES.length) * 100;
  }, [stage]);

  const getStageColor = (stageId: number) => {
    if (stageId > stage) return 'bg-gray-600';
    if (stageId === stage) {
      if (status === 'failed') return 'bg-red-500 animate-pulse';
      if (status === 'running') return 'bg-yellow-500 animate-pulse';
      return 'bg-blue-500 animate-pulse';
    }
    return 'bg-green-500';
  };

  const getStageTextColor = (stageId: number) => {
    if (stageId > stage) return 'text-gray-500';
    if (stageId === stage && status === 'failed') return 'text-red-500';
    if (stageId < stage || status === 'success') return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              status === 'failed' ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="absolute -top-7 left-0 text-sm font-mono">
          Progress: {Math.round(progress)}%
        </div>
        
        {/* ETA */}
        {stage > 0 && stage < STAGES.length && status === 'running' && (
          <div className="absolute -top-7 right-0 text-sm text-gray-400">
            ETA: ~{Math.max(1, (STAGES.length - stage) * 2)} min
          </div>
        )}
      </div>

      {/* Stage Icons */}
      <div className="flex justify-between items-center">
        {STAGES.map((s) => (
          <div key={s.id} className="flex flex-col items-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl
              transition-all duration-300
              ${getStageColor(s.id)}
            `}>
              {s.id === stage && status === 'running' ? (
                <span className="animate-spin">⏳</span>
              ) : s.id === stage && status === 'failed' ? (
                <span>❌</span>
              ) : s.id < stage || (s.id === stage && status === 'success') ? (
                <span>✅</span>
              ) : (
                <span className="opacity-50">{s.icon}</span>
              )}
            </div>
            <span className={`text-xs mt-2 ${getStageTextColor(s.id)}`}>
              {s.name}
            </span>
          </div>
        ))}
      </div>

      {/* Current Stage Status */}
      {stage > 0 && stage <= STAGES.length && (
        <div className="mt-6 text-center">
          <div className="text-lg font-semibold">
            {status === 'running' && `Stage ${stage}: ${STAGES[stage - 1].name} in progress...`}
            {status === 'success' && stage === STAGES.length && '🎉 Deployment Complete!'}
            {status === 'failed' && `❌ Stage ${stage}: ${STAGES[stage - 1].name} failed`}
            {status === 'pending' && 'Waiting to start...'}
          </div>
        </div>
      )}
    </div>
  );
}