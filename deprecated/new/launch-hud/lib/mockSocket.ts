interface MockSocketOptions {
  onLog: (log: { time: string; msg: string; level: string }) => void;
  onStage: (data: { stage: number; status: 'pending' | 'running' | 'success' | 'failed' }) => void;
  onMetrics: (metrics: any) => void;
  onLive: (isLive: boolean) => void;
}

export function initMockSocket(options: MockSocketOptions) {
  const { onLog, onStage, onMetrics, onLive } = options;
  
  let stage = 0;
  let isAborted = false;
  let deploymentComplete = false;
  
  const stages = [
    { msg: 'Initializing deployment orchestrator...', duration: 3000 },
    { msg: 'Compiling contracts...', duration: 5000 },
    { msg: 'Running test suite (247 tests)...', duration: 8000 },
    { msg: 'Deploying contracts to Base Mainnet...', duration: 10000 },
    { msg: 'Verifying ABIs on BaseScan...', duration: 6000 },
    { msg: 'Publishing artifacts to GitHub Pages...', duration: 4000 },
    { msg: 'Running smoke tests...', duration: 5000 },
    { msg: '🎉 Deployment successful!', duration: 1000 },
  ];

  // Simulated deployment logs
  const deploymentLogs = [
    { delay: 1000, msg: 'Loading environment variables...', level: 'info' },
    { delay: 2000, msg: 'Connected to Base Mainnet RPC', level: 'success' },
    { delay: 3000, msg: 'Wallet balance: 2.47 ETH', level: 'info' },
    { delay: 4000, msg: 'Starting contract compilation...', level: 'info' },
    { delay: 6000, msg: 'Compiled 12 contracts successfully', level: 'success' },
    { delay: 8000, msg: 'Running unit tests...', level: 'info' },
    { delay: 10000, msg: 'All tests passed (247/247)', level: 'success' },
    { delay: 12000, msg: 'Deploying Relics contract...', level: 'info' },
    { delay: 14000, msg: 'Relics deployed at 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3', level: 'success' },
    { delay: 16000, msg: 'Deploying MawSacrificeV2 contract...', level: 'info' },
    { delay: 18000, msg: 'MawSacrificeV2 deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3', level: 'success' },
    { delay: 20000, msg: 'Deploying CosmeticsV2 contract...', level: 'info' },
    { delay: 22000, msg: 'CosmeticsV2 deployed at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', level: 'success' },
    { delay: 24000, msg: 'Setting contract permissions...', level: 'info' },
    { delay: 26000, msg: 'Permissions configured successfully', level: 'success' },
    { delay: 28000, msg: 'Verifying contracts on BaseScan...', level: 'info' },
    { delay: 30000, msg: 'Warning: Rate limit approaching for API calls', level: 'warning' },
    { delay: 32000, msg: 'All contracts verified', level: 'success' },
    { delay: 34000, msg: 'Publishing ABIs to GitHub Pages...', level: 'info' },
    { delay: 36000, msg: 'Artifacts published successfully', level: 'success' },
    { delay: 38000, msg: 'Running smoke tests...', level: 'info' },
    { delay: 40000, msg: 'Smoke tests passed', level: 'success' },
  ];

  // Start deployment simulation
  const runStage = (stageIndex: number) => {
    if (isAborted || stageIndex >= stages.length) {
      if (!isAborted && stageIndex >= stages.length) {
        deploymentComplete = true;
        onLive(true);
        startMetricsSimulation();
      }
      return;
    }

    stage = stageIndex + 1;
    onStage({ stage, status: 'running' });
    
    const currentStage = stages[stageIndex];
    onLog({
      time: new Date().toLocaleTimeString(),
      msg: currentStage.msg,
      level: stageIndex === stages.length - 1 ? 'success' : 'info'
    });

    // Simulate stage completion
    setTimeout(() => {
      if (!isAborted) {
        onStage({ stage, status: 'success' });
        runStage(stageIndex + 1);
      }
    }, currentStage.duration);
  };

  // Start metrics simulation after deployment
  const startMetricsSimulation = () => {
    let txCount = 0;
    let wallets = 0;
    let cosmetics = 0;
    let gasSpent = 0;

    const metricsInterval = setInterval(() => {
      if (isAborted) {
        clearInterval(metricsInterval);
        return;
      }

      txCount += Math.floor(Math.random() * 10) + 1;
      wallets += Math.floor(Math.random() * 3);
      cosmetics += Math.floor(Math.random() * 5);
      gasSpent += parseFloat((Math.random() * 0.05).toFixed(4));

      onMetrics({
        txCount,
        wallets,
        cosmetics,
        gasSpent,
        successRate: 95 + Math.random() * 5
      });

      // Simulate occasional events
      if (Math.random() > 0.8) {
        onLog({
          time: new Date().toLocaleTimeString(),
          msg: `New sacrifice: Wallet 0x${Math.random().toString(36).substring(7)} minted ${Math.floor(Math.random() * 3) + 1} cosmetics`,
          level: 'info'
        });
      }
    }, 2000);

    return () => clearInterval(metricsInterval);
  };

  // Simulate deployment logs
  deploymentLogs.forEach(log => {
    setTimeout(() => {
      if (!isAborted) {
        onLog({
          time: new Date().toLocaleTimeString(),
          msg: log.msg,
          level: log.level
        });
      }
    }, log.delay);
  });

  // Start deployment after 2 seconds
  setTimeout(() => {
    if (!isAborted) {
      runStage(0);
    }
  }, 2000);

  // Mock socket interface
  const socket = {
    emit: (event: string, data?: any) => {
      if (event === 'abort') {
        isAborted = true;
        onStage({ stage, status: 'failed' });
        onLog({
          time: new Date().toLocaleTimeString(),
          msg: '❌ DEPLOYMENT ABORTED BY OPERATOR',
          level: 'error'
        });
      } else if (event === 'rollback') {
        onLog({
          time: new Date().toLocaleTimeString(),
          msg: '⏪ Rolling back to previous deployment...',
          level: 'warning'
        });
        setTimeout(() => {
          onLog({
            time: new Date().toLocaleTimeString(),
            msg: 'Rollback completed successfully',
            level: 'success'
          });
        }, 3000);
      }
    },
    disconnect: () => {
      isAborted = true;
    }
  };

  const cleanup = () => {
    isAborted = true;
  };

  return { socket, cleanup };
}